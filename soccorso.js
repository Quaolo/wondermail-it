/*
  WMSkyRescue: password dei soccorsi (SOS, E-mail di OK, Ringraziamento) di Esploratori del Cielo.

  Porting delle funzioni del gioco (decompilazione pret/pmd-sky):
    - sub_0204DBA0 / sub_0204DCA0: 54 caratteri <-> 34 byte (permutazione ARM9_UNKNOWN_TABLE__NA_209E12C,
      uguale in tutte le regioni, caratteri come le Wonder Mail S, 5 bit ciascuno a partire dal bit basso);
      il primo byte è il controllo, i 32 successivi sono cifrati con la tabella delle Wonder Mail S
      (sub_0204E0A0 / sub_0204E02C, chiave = controllo).
    - Controllo: somma a 8 bit di (byte[i] + i) per i = 1..32, sui dati in chiaro.
    - sub_0205C2A4 / sub_0205C548: campi della posta, letti a partire dal bit basso.

  Funziona nel browser (window.WMSkyRescue) e in Node (globalThis.WMSkyRescue) per i test.
*/
(function (root) {
  'use strict';

  var CODE_LENGTH = 54;
  var DATA_BYTES = 32;
  var ALPHABET = '&67NPR89F0+#STXY45MCHJ-K12=%3Q@W';
  // Posizione nella password di ogni carattere del flusso (ARM9_UNKNOWN_TABLE__NA_209E12C).
  var PERMUTATION = [
    0x0D, 0x07, 0x19, 0x0F, 0x04, 0x1D, 0x2A, 0x31, 0x08, 0x13, 0x2D, 0x18, 0x0E, 0x1A, 0x1B, 0x29,
    0x01, 0x20, 0x21, 0x22, 0x11, 0x33, 0x26, 0x00, 0x35, 0x0A, 0x2B, 0x1F, 0x12, 0x23, 0x2C, 0x17,
    0x27, 0x10, 0x1C, 0x30, 0x0B, 0x02, 0x24, 0x09, 0x32, 0x05, 0x28, 0x34, 0x2E, 0x03, 0x1E, 0x0C,
    0x25, 0x14, 0x2F, 0x16, 0x06, 0x15
  ];

  // Tipi di posta (primo campo): 1 SOS, 4 E-mail di OK, 5 Ringraziamento. Nella partita il gioco usa anche
  // 2 (SOS ricevuto), 3 e 6, che non viaggiano come password.
  var TYPES = { sos: 1, ok: 4, thanks: 5 };

  // Lingua del gioco che ha scritto la posta (GetLanguageType): 0 giapponese, poi inglese, francese,
  // tedesco, italiano e spagnolo nella versione europea.
  var LANGUAGES = { 0: 'ja', 1: 'en', 2: 'fr', 3: 'de', 4: 'it', 5: 'es' };

  function encryptionTable() {
    var parser = root.WMSParser;
    if (!parser || !parser.encryptionData) throw new Error('Serve lm.js (tabella di cifratura)');
    return parser.encryptionData;
  }

  // sub_0204E0A0 (decifra, sign = -1) e sub_0204E02C (cifra, sign = +1).
  function cipher(key, bytes, sign) {
    var table = encryptionTable();
    var period = ((key & 0x0F) + (key >> 4) + 8) & 0xFF;
    var step = key & 1 ? 1 : -1;
    var counter = 0;
    for (var i = 0; i < bytes.length; i++) {
      var entry = table[(key + counter * step) & 0xFF];
      bytes[i] = (bytes[i] + sign * entry) & 0xFF;
      counter = (counter + 1) % period;
    }
    return bytes;
  }

  function checksumOf(data) {
    var sum = 0;
    for (var i = 1; i <= DATA_BYTES; i++) sum = (sum + data[i - 1] + i) & 0xFF;
    return sum;
  }

  function sanitize(text) {
    var value = String(text || '');
    if (value.normalize) value = value.normalize('NFKC');
    value = value.toUpperCase().replace(/O/g, '0');
    var out = '';
    for (var i = 0; i < value.length; i++) {
      if (ALPHABET.indexOf(value.charAt(i)) !== -1) out += value.charAt(i);
    }
    return out;
  }

  // Flusso di bit a partire dal bit basso di ogni byte, come CopyBitsFrom / CopyBitsTo del gioco.
  function BitReader(bytes) {
    this.bytes = bytes;
    this.pos = 0;
  }
  BitReader.prototype.read = function (count) {
    var value = 0;
    for (var i = 0; i < count; i++) {
      var byte = this.bytes[this.pos >> 3] || 0;
      if (byte >> (this.pos & 7) & 1) value += Math.pow(2, i);
      this.pos++;
    }
    return value;
  };
  function BitWriter(size) {
    this.bytes = new Array(size).fill(0);
    this.pos = 0;
  }
  BitWriter.prototype.write = function (value, count) {
    for (var i = 0; i < count; i++) {
      if (Math.floor(value / Math.pow(2, i)) % 2) this.bytes[this.pos >> 3] |= 1 << (this.pos & 7);
      this.pos++;
    }
  };

  // 54 caratteri -> 34 byte (controllo, 32 byte di dati, un byte di scarto).
  // (sub_0204DA2C, che il gioco usa anche per le Wonder Mail S con 34 caratteri e un'altra permutazione)
  function codeToBytes(code, length, permutation) {
    length = length || CODE_LENGTH;
    permutation = permutation || PERMUTATION;
    var clean = sanitize(code);
    if (clean.length !== length) return null;
    var writer = new BitWriter(Math.ceil(length * 5 / 8));
    for (var i = 0; i < length; i++) {
      writer.write(ALPHABET.indexOf(clean.charAt(permutation[i])), 5);
    }
    return writer.bytes;
  }

  function bytesToCode(bytes) {
    var reader = new BitReader(bytes);
    var chars = [];
    for (var i = 0; i < CODE_LENGTH; i++) chars[PERMUTATION[i]] = ALPHABET.charAt(reader.read(5));
    return chars.join('');
  }

  // Nome della squadra: 10 byte nel set di caratteri del gioco (Windows-1252, 0xBD = ♂, 0xBE = ♀).
  var CP1252_HIGH = {
    0x80: '€', 0x82: '‚', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡', 0x89: '‰', 0x8A: 'Š', 0x8B: '‹',
    0x8C: 'Œ', 0x8E: 'Ž', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—',
    0x99: '™', 0x9A: 'š', 0x9B: '›', 0x9C: 'œ', 0x9E: 'ž', 0x9F: 'Ÿ', 0xBD: '♂', 0xBE: '♀'
  };
  var CP1252_REVERSE = {};
  Object.keys(CP1252_HIGH).forEach(function (key) { CP1252_REVERSE[CP1252_HIGH[key]] = Number(key); });

  function nameFromBytes(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length && bytes[i]; i++) {
      var b = bytes[i];
      if (CP1252_HIGH[b]) out += CP1252_HIGH[b];
      else if (b >= 0x20 && b < 0x7F) out += String.fromCharCode(b);
      else if (b >= 0xA0) out += String.fromCharCode(b);
      else out += '?';
    }
    return out;
  }

  // Restituisce i byte del nome, o null se c'è un carattere che il gioco non ha.
  function nameToBytes(name) {
    var bytes = [];
    var text = String(name || '');
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var code = ch.charCodeAt(0);
      var b;
      if (CP1252_REVERSE[ch] !== undefined) b = CP1252_REVERSE[ch];
      else if ((code >= 0x20 && code < 0x7F) || (code >= 0xA0 && code <= 0xFF && code !== 0xBD && code !== 0xBE)) b = code;
      else return null;
      bytes.push(b);
    }
    if (bytes.length > 10) return null;
    while (bytes.length < 10) bytes.push(0);
    return bytes;
  }

  function readMail(data) {
    var r = new BitReader(data);
    var mail = {};
    mail.type = r.read(4);
    mail.dungeon = r.read(7);
    mail.floor = r.read(7);
    mail.seed = mail.type === TYPES.sos ? r.read(24) : 0;
    mail.idLow = r.read(32);
    mail.idHigh = r.read(32);
    mail.language = r.read(4);
    mail.teamName = [];
    for (var i = 0; i < 10; i++) mail.teamName.push(r.read(8));
    mail.item1 = 0;
    mail.item2 = 0;
    if (mail.type !== TYPES.sos) {
      mail.item1 = r.read(10);
      mail.item2 = r.read(10);
    }
    mail.otherLow = r.read(32);
    mail.otherHigh = r.read(32);
    mail.flag = r.read(1);
    mail.sky = r.read(1);
    // Strumenti oltre il 1023 (solo nel Cielo): un bit in più per ciascuno, alla fine.
    if (mail.type !== TYPES.sos && mail.sky) {
      mail.item1 += r.read(1) * 1024;
      mail.item2 += r.read(1) * 1024;
    }
    mail.bits = r.pos;
    return mail;
  }

  function writeMail(mail) {
    var w = new BitWriter(DATA_BYTES);
    w.write(mail.type, 4);
    w.write(mail.dungeon, 7);
    w.write(mail.floor, 7);
    if (mail.type === TYPES.sos) w.write(mail.seed, 24);
    w.write(mail.idLow >>> 0, 32);
    w.write(mail.idHigh >>> 0, 32);
    w.write(mail.language, 4);
    for (var i = 0; i < 10; i++) w.write(mail.teamName[i] || 0, 8);
    if (mail.type !== TYPES.sos) {
      w.write((mail.item1 || 0) % 1024, 10);
      w.write((mail.item2 || 0) % 1024, 10);
    }
    w.write(mail.otherLow >>> 0, 32);
    w.write(mail.otherHigh >>> 0, 32);
    w.write(mail.flag ? 1 : 0, 1);
    w.write(mail.sky ? 1 : 0, 1);
    if (mail.type !== TYPES.sos && mail.sky) {
      w.write(Math.floor((mail.item1 || 0) / 1024) & 1, 1);
      w.write(Math.floor((mail.item2 || 0) / 1024) & 1, 1);
    }
    return w.bytes;
  }

  var WMSkyRescue = {
    CODE_LENGTH: CODE_LENGTH,
    TYPES: TYPES,
    LANGUAGES: LANGUAGES,
    permutation: PERMUTATION,
    // Esposti per i test (tests/soccorso.test.mjs li prova anche sulle Wonder Mail S).
    internal: { codeToBytes: codeToBytes, bytesToCode: bytesToCode, cipher: cipher, checksumOf: checksumOf,
      readMail: readMail, writeMail: writeMail },
    sanitize: sanitize,
    nameFromBytes: nameFromBytes,
    nameToBytes: nameToBytes,

    // true se il testo ha la lunghezza di una password di soccorso (per riconoscerla tra le altre).
    looksLikeRescue: function (text) {
      return sanitize(text).length === CODE_LENGTH;
    },

    /**
     * Legge una password. Restituisce { ok: false, reason } oppure { ok: true, mail, code }.
     * reason: 'length' (non sono 54 caratteri) o 'checksum' (il controllo non torna).
     */
    decode: function (code) {
      var bytes = codeToBytes(code);
      if (!bytes) return { ok: false, reason: 'length' };
      var data = cipher(bytes[0], bytes.slice(1, 1 + DATA_BYTES), -1);
      if (checksumOf(data) !== bytes[0]) return { ok: false, reason: 'checksum' };
      var mail = readMail(data);
      return { ok: true, mail: mail, code: sanitize(code) };
    },

    encode: function (mail) {
      var data = writeMail(mail);
      var check = checksumOf(data);
      var bytes = [check].concat(cipher(check, data.slice(), 1), [0]);
      return bytesToCode(bytes);
    },

    // Versione del gioco che ha scritto la posta (sub_0205BD40): 'sky', 'time' o 'darkness'.
    gameVersion: function (mail) {
      if (mail.sky) return 'sky';
      return mail.flag ? 'darkness' : 'time';
    },

    /**
     * E-mail di OK per un SOS: stesso dungeon, piano, codice e squadra, tipo 4, niente strumenti allegati.
     * Il gioco che l'ha mandato controlla solo il tipo e che il codice sia quello di un suo SOS
     * (sub_0205B918), più la validità degli strumenti se ce ne sono.
     */
    okFromSos: function (sos, rescuer) {
      var mail = Object.assign({}, sos, { type: TYPES.ok, seed: 0, item1: 0, item2: 0 });
      mail.teamName = sos.teamName.slice();
      // In un'E-mail di OK vera (provata da Paolo il 29/09) nome e 64 bit dopo il nome sono quelli di chi ha
      // soccorso: il gioco che riceve l'OK non li controlla.
      if (rescuer) {
        if (rescuer.teamName) mail.teamName = rescuer.teamName.slice();
        if (rescuer.otherLow !== undefined) mail.otherLow = rescuer.otherLow >>> 0;
        if (rescuer.otherHigh !== undefined) mail.otherHigh = rescuer.otherHigh >>> 0;
      }
      return mail;
    },

    /**
     * Un SOS nuovo, come quello che scrive il gioco quando la squadra viene sconfitta (sub_0205BAB0):
     * codice a 64 bit (nel gioco metà viene dall'indirizzo della console e metà è casuale), lingua, nome,
     * seme del piano a 24 bit e la versione (options.version: 'sky', 'time' o 'darkness'; il Cielo accetta anche
     * gli SOS di Tempo e Oscurità). random() restituisce un numero tra 0 e 1.
     */
    makeSos: function (options) {
      var random = options.random || Math.random;
      var word = function () { return Math.floor(random() * 0x100000000) >>> 0; };
      return {
        type: TYPES.sos,
        dungeon: options.dungeon,
        floor: options.floor,
        seed: options.seed !== undefined ? options.seed : Math.floor(random() * 0x1000000),
        idLow: options.idLow !== undefined ? options.idLow : word(),
        idHigh: options.idHigh !== undefined ? options.idHigh : word(),
        language: options.language,
        teamName: options.teamName,
        item1: 0,
        item2: 0,
        otherLow: 0,
        otherHigh: 0,
        // Cielo: bit 1 acceso, bit 0 a caso (sub_0205BD78). Tempo e Oscurità: solo il bit 0 (0 Tempo,
        // 1 Oscurità), come legge sub_0205BD40.
        flag: options.version === 'darkness' ? 1 : (options.version === 'time' ? 0 : (random() < 0.5 ? 1 : 0)),
        sky: options.version === 'time' || options.version === 'darkness' ? 0 : 1
      };
    }
  };

  root.WMSkyRescue = WMSkyRescue;
})(typeof window !== 'undefined' ? window : globalThis);
