#!/usr/bin/env node
/**
 * Comprueba que los ficheros de `src/i18n/` son coherentes:
 * mismos idiomas, mismas claves que el idioma base y ningún valor vacío.
 * Se ejecuta antes y después de cada build (`npm run i18n:check`).
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const I18N_DIR = new URL('../src/i18n/', import.meta.url).pathname;
const BASE_LANG = 'en';
const EXPECTED_LANGS = ['en', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl'];

const errors = [];

async function loadDictionaries() {
  let files;
  try {
    files = (await readdir(I18N_DIR)).filter((file) => file.endsWith('.json')).sort();
  } catch {
    errors.push(`No existe el directorio ${I18N_DIR}`);
    return {};
  }

  const dictionaries = {};
  for (const file of files) {
    const lang = file.replace(/\.json$/, '');
    try {
      dictionaries[lang] = JSON.parse(await readFile(join(I18N_DIR, file), 'utf8'));
    } catch (error) {
      errors.push(`${file} no es un JSON válido: ${error.message}`);
    }
  }
  return dictionaries;
}

const dictionaries = await loadDictionaries();
const langs = Object.keys(dictionaries);

for (const lang of EXPECTED_LANGS) {
  if (!langs.includes(lang)) errors.push(`Falta el idioma "${lang}" (src/i18n/${lang}.json)`);
}
for (const lang of langs) {
  if (!EXPECTED_LANGS.includes(lang)) errors.push(`Idioma no esperado: src/i18n/${lang}.json`);
}

const base = dictionaries[BASE_LANG];
if (!base) {
  errors.push(`Falta el idioma base "${BASE_LANG}"`);
} else {
  const baseKeys = Object.keys(base);
  for (const lang of langs) {
    const dictionary = dictionaries[lang];
    const keys = Object.keys(dictionary);

    for (const key of baseKeys) {
      if (!(key in dictionary)) errors.push(`${lang}: falta la clave "${key}"`);
    }
    for (const key of keys) {
      if (!(key in base)) errors.push(`${lang}: clave sobrante "${key}"`);
      if (typeof dictionary[key] !== 'string' || dictionary[key].trim() === '') {
        errors.push(`${lang}: la clave "${key}" está vacía o no es texto`);
      }
    }
    if (keys.length !== baseKeys.length) {
      errors.push(`${lang}: ${keys.length} claves, ${BASE_LANG} tiene ${baseKeys.length}`);
    }
  }
  console.log(
    `i18n OK — ${langs.length} idiomas × ${Object.keys(base).length} claves (${langs.join(', ')})`,
  );
}

if (errors.length > 0) {
  console.error(`i18n con errores (${errors.length}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
