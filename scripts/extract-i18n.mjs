#!/usr/bin/env node
/**
 * Extrae el objeto `translations` de `legacy/script.js` (la web antigua) a
 * un JSON por idioma en `src/i18n/`. No se edita nada a mano.
 *
 * Uso: npm run i18n:extract
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE = fileURLToPath(new URL('../legacy/script.js', import.meta.url));
const OUT_DIR = fileURLToPath(new URL('../src/i18n/', import.meta.url));

const source = await readFile(SOURCE, 'utf8');

const declarationIndex = source.indexOf('const translations =');
if (declarationIndex === -1) {
  throw new Error('No se encuentra "const translations =" en legacy/script.js');
}

const objectStart = source.indexOf('{', declarationIndex);
const objectEnd = source.indexOf('\n};', objectStart);
if (objectStart === -1 || objectEnd === -1) {
  throw new Error('No se encuentra el objeto `translations` completo en legacy/script.js');
}

const literal = source.slice(objectStart, objectEnd + 2);
// El objeto es un literal de JS del propio repo: se evalúa en un ámbito aislado.
const translations = new Function(`return (${literal});`)();

const langs = Object.keys(translations);
const baseKeys = Object.keys(translations[langs[0]]);

for (const lang of langs) {
  const keys = Object.keys(translations[lang]);
  const missing = baseKeys.filter((key) => !(key in translations[lang]));
  const extra = keys.filter((key) => !(key in translations[langs[0]]));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `${lang}: faltan ${missing.join(', ') || 'ninguna'} | sobran ${extra.join(', ') || 'ninguna'}`,
    );
  }
}

await mkdir(OUT_DIR, { recursive: true });

for (const lang of langs) {
  const ordered = Object.fromEntries(baseKeys.map((key) => [key, translations[lang][key]]));
  await writeFile(`${OUT_DIR}${lang}.json`, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
  console.log(`src/i18n/${lang}.json — ${baseKeys.length} claves`);
}

console.log(`Extraídos ${langs.length} idiomas × ${baseKeys.length} claves de legacy/script.js`);
