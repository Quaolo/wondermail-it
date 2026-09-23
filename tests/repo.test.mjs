// Controlla cosa finisce su GitHub: solo i file del sito, niente file di lavoro, niente percorsi del PC,
// commit firmati solo da chi deve. Guarda l'archivio di git (`git ls-files`, `git grep --cached`), cioè
// esattamente quello che verrà pubblicato, non i file sul disco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
// Questo file parla dei file privati per mestiere: va escluso dalle ricerche nel contenuto.
const SELF = 'tests/repo.test.mjs';

// Elenco di ciò che può stare nel repository. Un file nuovo che non rientra fa fallire il test:
// se deve davvero essere pubblicato, si aggiunge qui la sua regola.
const ALLOWED = [
  /^(\.nojekyll|LICENSE|README(\.[a-z]{2})?\.md|index\.html|style\.css)$/,
  /^[a-z_]+\.js$/,
  /^assets\/(item-icons|item-icons-pmdo)\/[A-Za-z0-9_.()'-]+\.png$/,
  /^assets\/favicon\.svg$/,
  /^assets\/flags\/[a-z]{2}\.svg$/,
  /^assets\/fonts\/[a-z0-9-]+\.woff2$/,
  /^assets\/fonts\/OFL-[A-Za-z]+\.txt$/,
  /^data\/[a-z_]+\.js$/,
  /^lang\/([a-z_]+\.js|README\.md)$/,
  /^tests\/[a-z_]+\.test\.mjs$/,
  /^tests\/ui_smoke\.py$/,
  /^tests\/fixtures\/[a-z_]+\.json$/,
  /^tools\/[a-z_]+\.py$/,
];

// Nomi e frammenti che non devono comparire nei file pubblicati. Spezzati di proposito.
const FORBIDDEN_TEXT = [
  'AGENTS' + '.md', 'CLAUDE' + '.md', 'prossimi' + '-passi', 'sistema' + '-repo',
  'C:\\' + 'Users', 'Desktop\\' + 'Projects', '/mnt/' + 'user-data', '/sessions' + '/',
  'claude.ai/code/' + 'session', 'Co-Authored' + '-By', 'Claude' + '-Session',
];

const MAX_BYTES = 1024 * 1024; // i dati generati più grandi stanno sotto i 500 KB

// Autori e committer ammessi: Paolo e, per la parte di storia presa dall'originale, RedCoal27.
const ALLOWED_PEOPLE = [
  'Paolo <ellepaoloelle@outlook.it>',
  'RedCoal27 <redcoal.pro@gmail.com>',
  'RedCoal27 <40321711+RedCoal27@users.noreply.github.com>',
  'GitHub <noreply@github.com>',
];
const FORBIDDEN_IN_MESSAGES = /co-authored-by|claude|anthropic|generated with|🤖/i;

function git(args, input) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', input, maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    if (error.status === 1 && args[0] === 'grep') return ''; // git grep senza risultati
    return null;
  }
}

function trackedFiles() {
  const out = git(['ls-files', '-z']);
  return out === null ? null : out.split('\0').filter(Boolean);
}

test('in archivio ci sono solo file previsti', (t) => {
  const files = trackedFiles();
  if (!files) return t.skip('git non disponibile');
  const unexpected = files.filter((file) => !ALLOWED.some((pattern) => pattern.test(file)));
  assert.deepEqual(unexpected, [], `file non previsti (se vanno pubblicati, aggiungili ad ALLOWED): ${unexpected.join(', ')}`);
});

test('in archivio non ci sono file troppo grandi', (t) => {
  const out = git(['ls-files', '-s', '-z']);
  if (out === null) return t.skip('git non disponibile');
  const entries = out.split('\0').filter(Boolean).map((line) => {
    const [info, path] = line.split('\t');
    return { hash: info.split(' ')[1], path };
  });
  const sizes = git(['cat-file', '--batch-check=%(objectsize)'], entries.map((e) => e.hash).join('\n') + '\n');
  if (sizes === null) return t.skip('git cat-file non disponibile');
  const big = sizes.trim().split('\n')
    .map((size, i) => ({ path: entries[i].path, size: Number(size) }))
    .filter((e) => e.size > MAX_BYTES)
    .map((e) => `${e.path} (${Math.round(e.size / 1024)} KB)`);
  assert.deepEqual(big, [], `file sopra 1 MB: ${big.join(', ')}`);
});

test('i file pubblicati non nominano file di lavoro né percorsi del PC', (t) => {
  const args = ['grep', '-I', '-n', '-F', '--cached'];
  for (const text of FORBIDDEN_TEXT) args.push('-e', text);
  args.push('--', '.', `:(exclude)${SELF}`);
  const out = git(args);
  if (out === null) return t.skip('git grep non disponibile');
  const found = out.split('\n').filter(Boolean);
  assert.deepEqual(found, [], `riferimenti da togliere:\n${found.join('\n')}`);
});

test('i commit sono firmati da Paolo (o vengono dal progetto originale) e non citano assistenti', (t) => {
  const out = git(['log', '-z', '--format=%h%x01%an <%ae>%x01%cn <%ce>%x01%B']);
  if (out === null) return t.skip('storia di git non disponibile');
  const problems = [];
  for (const record of out.split('\0').filter((r) => r.trim())) {
    const [hash, author, committer, message] = record.replace(/^\n+/, '').split('\x01');
    if (!ALLOWED_PEOPLE.includes(author)) problems.push(`${hash}: autore ${author}`);
    if (!ALLOWED_PEOPLE.includes(committer)) problems.push(`${hash}: committer ${committer}`);
    if (FORBIDDEN_IN_MESSAGES.test(message)) problems.push(`${hash}: messaggio da ripulire`);
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});
