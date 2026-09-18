/*
  WMSParser: codifica e decodifica delle password Missioni Speciali C (Wonder Mail S)
  di Pokémon Mystery Dungeon: Esploratori del Cielo.

  Basato sul generatore storico di pubblico dominio ("This file is placed in the public domain and
  may be freely used, reproduced, modified, sold or whatever you want"). Le tabelle per regione
  coincidono con quelle del gioco (WONDER_MAIL_BITS_SWAP e WONDER_MAIL_ENCRYPTION_TABLE in pret/pmd-sky).

  Formato: 170 bit = 34 caratteri da 5 bit.
    - 2 bit a zero non cifrati
    - 136 bit di dati (vedi WMSStruct) cifrati con una tabella additiva
    - 32 bit di checksum (CRC32 dei dati) non cifrati
  I caratteri vengono poi rimescolati con una permutazione che dipende dalla regione (EU/NA/JP).

  Funziona sia nel browser (window.WMSParser) sia in Node (globalThis.WMSParser) per i test.
*/
(function (root) {
  'use strict';

  // Campi della password, nell'ordine in cui compaiono nel flusso di bit.
  var WMSStruct = [
    { name: 'nullBits', note: 'Bit a zero', size: 8 },
    { name: 'specialFloor', note: 'Stanza speciale (fixed room)', size: 8 },
    { name: 'floor', note: 'Piano', size: 8 },
    { name: 'dungeon', note: 'Dungeon', size: 8 },
    { name: 'flavorText', note: 'Seme del testo della missione', size: 24 },
    { name: 'restriction', note: 'Valore della restrizione', size: 11 },
    { name: 'restrictionType', note: 'Tipo di restrizione', size: 1 },
    { name: 'reward', note: 'Ricompensa', size: 11 },
    { name: 'rewardType', note: 'Tipo di ricompensa', size: 4 },
    { name: 'targetItem', note: 'Strumento obiettivo', size: 10 },
    { name: 'target2', note: 'Secondo bersaglio', size: 11 },
    { name: 'target', note: 'Bersaglio', size: 11 },
    { name: 'client', note: 'Committente', size: 11 },
    { name: 'missionSpecial', note: 'Sottotipo della missione', size: 4 },
    { name: 'missionType', note: 'Tipo di missione', size: 4 },
    { name: 'mailType', note: 'Stato della missione (sempre 4)', size: 4 },
    { name: 'checksum', note: 'CRC32', size: 32, noinclude: true }
  ];

  var CODE_LENGTH = 34;
  var BIT_LENGTH = CODE_LENGTH * 5; // 170
  var DATA_BITS = 136;

  // Permutazioni dei 34 caratteri per regione.
  var SWAP_TABLES = {
    na: [
      0x07, 0x1B, 0x0D, 0x1F, 0x15, 0x1A, 0x06, 0x01, 0x17, 0x1C, 0x09, 0x1E, 0x0A, 0x20, 0x10, 0x21,
      0x0F, 0x08, 0x1D, 0x11, 0x14, 0x00, 0x13, 0x16, 0x05, 0x12, 0x0E, 0x04, 0x03, 0x18, 0x02, 0x0B,
      0x0C, 0x19
    ],
    eu: [
      0x0E, 0x04, 0x03, 0x18, 0x09, 0x1E, 0x0A, 0x20, 0x10, 0x21, 0x14, 0x00, 0x13, 0x16, 0x05, 0x12,
      0x06, 0x01, 0x17, 0x1C, 0x07, 0x1B, 0x0D, 0x1F, 0x15, 0x1A, 0x02, 0x0B, 0x0C, 0x19, 0x0F, 0x08,
      0x1D, 0x11
    ],
    jp: [
      0x14, 0x00, 0x13, 0x16, 0x05, 0x12, 0x02, 0x0B, 0x0C, 0x19, 0x21, 0x0F, 0x08, 0x1D, 0x11, 0x1A,
      0x06, 0x01, 0x17, 0x1C, 0x07, 0x1B, 0x0D, 0x1F, 0x15, 0x09, 0x1E, 0x0A, 0x20, 0x10, 0x0E, 0x04,
      0x03, 0x18
    ]
  };
  var REGIONS = ['eu', 'na', 'jp'];

  // Ogni carattere della password vale 5 bit: l'indice in questa stringa.
  var BIT_VALUES = '&67NPR89F0+#STXY45MCHJ-K12=%3Q@W';

  // Tabella di cifratura (256 byte).
  var ENCRYPTION_DATA = [
    0x2E, 0x75, 0x3F, 0x99, 0x09, 0x6C, 0xBC, 0x61, 0x7C, 0x2A, 0x96, 0x4A, 0xF4, 0x6D, 0x29, 0xFA,
    0x90, 0x14, 0x9D, 0x33, 0x6F, 0xCB, 0x49, 0x3C, 0x48, 0x80, 0x7B, 0x46, 0x67, 0x01, 0x17, 0x59,
    0xB8, 0xFA, 0x70, 0xC0, 0x44, 0x78, 0x48, 0xFB, 0x26, 0x80, 0x81, 0xFC, 0xFD, 0x61, 0x70, 0xC7,
    0xFE, 0xA8, 0x70, 0x28, 0x6C, 0x9C, 0x07, 0xA4, 0xCB, 0x3F, 0x70, 0xA3, 0x8C, 0xD6, 0xFF, 0xB0,
    0x7A, 0x3A, 0x35, 0x54, 0xE9, 0x9A, 0x3B, 0x61, 0x16, 0x41, 0xE9, 0xA3, 0x90, 0xA3, 0xE9, 0xEE,
    0x0E, 0xFA, 0xDC, 0x9B, 0xD6, 0xFB, 0x24, 0xB5, 0x41, 0x9A, 0x20, 0xBA, 0xB3, 0x51, 0x7A, 0x36,
    0x3E, 0x60, 0x0E, 0x3D, 0x02, 0xB0, 0x34, 0x57, 0x69, 0x81, 0xEB, 0x67, 0xF3, 0xEB, 0x8C, 0x47,
    0x93, 0xCE, 0x2A, 0xAF, 0x35, 0xF4, 0x74, 0x87, 0x50, 0x2C, 0x39, 0x68, 0xBB, 0x47, 0x1A, 0x02,
    0xA3, 0x93, 0x64, 0x2E, 0x8C, 0xAD, 0xB1, 0xC4, 0x61, 0x04, 0x5F, 0xBD, 0x59, 0x21, 0x1C, 0xE7,
    0x0E, 0x29, 0x26, 0x97, 0x70, 0xA9, 0xCD, 0x18, 0xA3, 0x7B, 0x74, 0x70, 0x96, 0xDE, 0xA6, 0x72,
    0xDD, 0x13, 0x93, 0xAA, 0x90, 0x6C, 0xA7, 0xB5, 0x76, 0x2F, 0xA8, 0x7A, 0xC8, 0x81, 0x06, 0xBB,
    0x85, 0x75, 0x11, 0x0C, 0xD2, 0xD1, 0xC9, 0xF8, 0x81, 0x70, 0xEE, 0xC8, 0x71, 0x53, 0x3D, 0xAF,
    0x76, 0xCB, 0x0D, 0xC1, 0x56, 0x28, 0xE8, 0x3C, 0x61, 0x64, 0x4B, 0xB8, 0xEF, 0x3B, 0x41, 0x09,
    0x72, 0x07, 0x50, 0xAD, 0xF3, 0x2E, 0x5C, 0x43, 0xFF, 0xC3, 0xB3, 0x32, 0x7A, 0x3E, 0x9C, 0xA3,
    0xC2, 0xAB, 0x10, 0x60, 0x99, 0xFB, 0x08, 0x8A, 0x90, 0x57, 0x8A, 0x7F, 0x61, 0x90, 0x21, 0x88,
    0x55, 0xE8, 0xFC, 0x4B, 0x0D, 0x4A, 0x7A, 0x48, 0xC9, 0xB0, 0xC7, 0xA6, 0xD0, 0x04, 0x7E, 0x05
  ];

  // Tabella CRC32 (polinomio 0xEDB88320, lo stesso di zlib).
  var CRC_TABLE = (function () {
    var table = [];
    for (var i = 0; i < 256; i++) {
      var entry = i;
      for (var j = 0; j < 8; j++) {
        entry = (entry & 1) ? (0xEDB88320 ^ (entry >>> 1)) : (entry >>> 1);
      }
      table[i] = entry >>> 0;
    }
    return table;
  })();

  function bitsToNum(bits) {
    return parseInt(bits, 2);
  }

  function numToBits(num, outputSize) {
    var bits = num.toString(2);
    while (bits.length < outputSize) {
      bits = '0' + bits;
    }
    return bits;
  }

  function numToHex(num, minSize) {
    var hex = num.toString(16).toUpperCase();
    while (hex.length < minSize) {
      hex = '0' + hex;
    }
    return hex;
  }

  function FieldError(errors) {
    this.name = 'WMSFieldError';
    this.errors = errors;
    this.message = errors.map(function (e) {
      return e.field + '=' + e.value + ' (massimo ' + e.max + ')';
    }).join(', ');
  }
  FieldError.prototype = Object.create(Error.prototype);
  FieldError.prototype.constructor = FieldError;

  var WMSParser = {
    debug: false,
    regions: REGIONS.slice(),
    swapTables: SWAP_TABLES,
    // Nomi storici, mantenuti per compatibilità.
    byteSwap: SWAP_TABLES.na,
    byteSwapEU: SWAP_TABLES.eu,
    byteSwapJP: SWAP_TABLES.jp,
    bitValues: BIT_VALUES,
    encryptionData: ENCRYPTION_DATA,
    FieldError: FieldError,

    log: function () {
      if (this.debug && typeof console !== 'undefined') {
        console.info.apply(console, arguments);
      }
    },

    getSwapTable: function (region) {
      return SWAP_TABLES[String(region || '').toLowerCase()] || SWAP_TABLES.eu;
    },

    /**
     * Pulisce una password: maiuscole, caratteri a larghezza piena convertiti, 'O' letta come zero,
     * tutto ciò che non appartiene all'alfabeto della password viene scartato.
     */
    sanitize: function (wmString) {
      var text = String(wmString || '');
      if (text.normalize) {
        text = text.normalize('NFKC');
      }
      text = text.toUpperCase().replace(/O/g, '0');
      var out = '';
      for (var i = 0; i < text.length; i++) {
        if (BIT_VALUES.indexOf(text.charAt(i)) !== -1) {
          out += text.charAt(i);
        }
      }
      return out;
    },

    unscrambleString: function (wmString, swapArray) {
      swapArray = swapArray || SWAP_TABLES.na;
      var out = '';
      for (var i = 0; i < swapArray.length; i++) {
        out += wmString.charAt(swapArray[i]);
      }
      return out;
    },

    scrambleString: function (wmString, swapArray) {
      swapArray = swapArray || SWAP_TABLES.na;
      var out = [];
      for (var i = 0; i < swapArray.length; i++) {
        out[swapArray[i]] = wmString.charAt(i);
      }
      return out.join('');
    },

    getEncryptionEntries: function (checksumByte) {
      var entries = [];
      var pointer = checksumByte;
      var backwards = !(checksumByte & 0x01);
      for (var i = 0; i < 17; i++) {
        entries.push(ENCRYPTION_DATA[pointer]);
        pointer = backwards ? (pointer + 255) % 256 : (pointer + 1) % 256;
      }
      return entries;
    },

    // Nel formato Sky i caratteri sono letti dall'ultimo al primo.
    bytesToBits: function (wmIntString) {
      var out = '';
      for (var i = wmIntString.length - 1; i >= 0; i--) {
        var index = BIT_VALUES.indexOf(wmIntString.charAt(i));
        if (index === -1) {
          throw new Error('Carattere non valido nella password: ' + wmIntString.charAt(i));
        }
        out += numToBits(index, 5);
      }
      return out;
    },

    bitsToBytes: function (bitStream) {
      var blocks = bitStream.length / 5;
      var out = '';
      for (var i = 0; i < blocks; i++) {
        out += BIT_VALUES.charAt(bitsToNum(bitStream.substr((blocks - i - 1) * 5, 5)));
      }
      return out;
    },

    /**
     * Posizione in cui la sequenza di cifratura ricomincia da capo, o -1 se non ricomincia.
     */
    getResetByte: function (checksum) {
      var checksumByte = checksum % 256;
      var resetByte = Math.floor(checksumByte / 16 + 8 + (checksumByte % 16));
      return resetByte < 17 ? resetByte : -1;
    },

    /**
     * Cifra (encrypt = true) o decifra i 17 byte di dati. Il checksum resta in chiaro.
     */
    decryptBitStream: function (bitStream, encrypt) {
      var checksumBits = bitStream.substr(bitStream.length - 32, 32);
      var checksum = bitsToNum(checksumBits);
      var checksumByte = checksum & 0xFF;
      var dataBits = bitStream.substr(2, DATA_BITS);

      // Si lavora dall'ultimo byte al primo.
      var blocks = [];
      for (var pos = DATA_BITS - 8; pos >= 0; pos -= 8) {
        blocks.push(bitsToNum(dataBits.substr(pos, 8)));
      }

      var entries = this.getEncryptionEntries(checksumByte);
      var resetByte = this.getResetByte(checksum);
      var encPtr = 0;
      for (var i = 0; i < blocks.length; i++) {
        if (encPtr === resetByte) {
          encPtr = 0;
        }
        blocks[i] = encrypt
          ? (blocks[i] + entries[encPtr]) & 0xFF
          : (blocks[i] - entries[encPtr]) & 0xFF;
        encPtr++;
      }

      var out = bitStream.substr(0, 2);
      for (var b = blocks.length - 1; b >= 0; b--) {
        out += numToBits(blocks[b], 8);
      }
      return out + checksumBits;
    },

    encryptBitStream: function (bitStream) {
      return this.decryptBitStream(bitStream, true);
    },

    bitsToStructure: function (bitString) {
      var out = {};
      var pointer = 0;
      for (var i = 0; i < WMSStruct.length; i++) {
        var field = WMSStruct[i];
        out[field.name] = bitsToNum(bitString.substr(pointer, field.size));
        pointer += field.size;
      }
      return out;
    },

    /**
     * CRC32 dei 17 byte di dati, presi dall'ultimo al primo (come fa il gioco).
     * Accetta il flusso di dati da 136 bit o quello completo da 170.
     */
    calculateChecksum: function (bitStream) {
      if (bitStream.length === BIT_LENGTH) {
        bitStream = bitStream.substr(2, DATA_BITS);
      }
      var crc = 0xFFFFFFFF;
      for (var i = 16; i >= 0; i--) {
        var num = bitsToNum(bitStream.substr(i * 8, 8));
        crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ num) & 0xFF];
      }
      return (crc ^ 0xFFFFFFFF) >>> 0;
    },

    /**
     * Controlla che ogni campo sia un intero che entra nel numero di bit disponibili.
     * Restituisce un elenco di errori {field, value, max}; vuoto se va tutto bene.
     */
    validateStruct: function (struct) {
      var errors = [];
      for (var i = 0; i < WMSStruct.length; i++) {
        var field = WMSStruct[i];
        if (field.noinclude) continue;
        var value = struct[field.name];
        var max = Math.pow(2, field.size) - 1;
        if (typeof value !== 'number' || !isFinite(value) || Math.floor(value) !== value || value < 0 || value > max) {
          errors.push({ field: field.name, value: value, max: max });
        }
      }
      return errors;
    },

    structureToBits: function (struct) {
      var errors = this.validateStruct(struct);
      if (errors.length) {
        throw new FieldError(errors);
      }
      var bitStream = '';
      for (var i = 0; i < WMSStruct.length; i++) {
        var field = WMSStruct[i];
        if (field.noinclude) continue;
        bitStream += numToBits(struct[field.name], field.size);
      }
      // I primi 2 bit (a zero) non fanno parte dei dati cifrati.
      bitStream = bitStream.substr(2);
      var checksum = this.calculateChecksum(bitStream);
      return '00' + bitStream + numToBits(checksum, 32);
    },

    /**
     * Da missione a password (34 caratteri, senza spazi) per la regione indicata.
     * Lancia WMSParser.FieldError se un campo è fuori dai limiti.
     */
    encode: function (struct, region) {
      var plainBits = this.structureToBits(struct);
      var encrypted = this.encryptBitStream(plainBits);
      var packed = this.bitsToBytes(encrypted);
      var code = this.scrambleString(packed, this.getSwapTable(region));
      this.log('WMS encode', region, struct, code);
      return code;
    },

    /**
     * Legge una password con la tabella di una regione precisa.
     * Restituisce {clean, region, struct, crcOk} oppure null se la lunghezza è sbagliata.
     */
    decodeWithRegion: function (code, region) {
      var clean = this.sanitize(code);
      if (clean.length !== CODE_LENGTH) {
        return null;
      }
      var unscrambled = this.unscrambleString(clean, this.getSwapTable(region));
      var decrypted = this.decryptBitStream(this.bytesToBits(unscrambled), false);
      var struct = this.bitsToStructure(decrypted);
      var crcOk = decrypted.substr(0, 2) === '00'
        && this.calculateChecksum(decrypted) === struct.checksum;
      return { clean: clean, region: region, struct: struct, crcOk: crcOk };
    },

    /**
     * Legge una password provando tutte le regioni: vale quella il cui CRC32 torna.
     * preferredRegion viene provata per prima. Restituisce null se nessuna regione è valida.
     */
    decode: function (code, preferredRegion) {
      var order = REGIONS.slice();
      if (preferredRegion && order.indexOf(preferredRegion) > 0) {
        order.splice(order.indexOf(preferredRegion), 1);
        order.unshift(preferredRegion);
      }
      for (var i = 0; i < order.length; i++) {
        var result = this.decodeWithRegion(code, order[i]);
        if (result && result.crcOk) {
          return result;
        }
      }
      return null;
    },

    /**
     * Converte una password da una regione all'altra: cambia solo l'ordine dei caratteri.
     */
    convertRegion: function (code, fromRegion, toRegion) {
      var clean = this.sanitize(code);
      if (clean.length !== CODE_LENGTH) {
        return null;
      }
      var unscrambled = this.unscrambleString(clean, this.getSwapTable(fromRegion));
      return this.scrambleString(unscrambled, this.getSwapTable(toRegion));
    }
  };

  root.WMSParser = WMSParser;
  root.WMSStruct = WMSStruct;
  root.bitsToNum = bitsToNum;
  root.numToBits = numToBits;
  root.numToHex = numToHex;
})(typeof window !== 'undefined' ? window : globalThis);
