import en from './en.json';
import es from './es.json';
import de from './de.json';
import fr from './fr.json';
import it from './it.json';
import pt from './pt.json';
import nl from './nl.json';
import pl from './pl.json';

/** Idiomas soportados. El primero es el idioma por defecto y vive en `/`. */
export const languages = ['en', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl'] as const;

export type Lang = (typeof languages)[number];

/** Idioma por defecto: sin prefijo en la URL. */
export const defaultLang: Lang = 'en';

/** Claves disponibles, derivadas del diccionario inglés. */
export type TranslationKey = keyof typeof en;

/**
 * Cada diccionario debe tener exactamente las claves del inglés: si a un idioma
 * le falta una clave, TypeScript falla al compilar (`astro check`) y este módulo
 * lanza un error al cargarse durante `astro build`.
 */
const dictionaries: Record<Lang, Record<TranslationKey, string>> = {
  en,
  es,
  de,
  fr,
  it,
  pt,
  nl,
  pl,
};

// Validación en tiempo de build: cualquier diccionario incompleto revienta el build
// con un mensaje claro, aunque no se ejecute `astro check`.
const baseKeys = Object.keys(en) as TranslationKey[];
for (const lang of languages) {
  const keys = Object.keys(dictionaries[lang]);
  const missing = baseKeys.filter((key) => !(key in dictionaries[lang]));
  const extra = keys.filter((key) => !(key in dictionaries[lang]));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `i18n: el diccionario "${lang}" no coincide con "en" — faltan: ${
        missing.join(', ') || 'ninguna'
      } | sobran: ${extra.join(', ') || 'ninguna'}`,
    );
  }
}

/** Devuelve el texto traducido. Si falta la clave, el build falla. */
export function t(lang: Lang, key: TranslationKey): string {
  const dictionary = dictionaries[lang];
  const value = dictionary?.[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`i18n: falta la clave "${key}" en el idioma "${lang}"`);
  }
  return value;
}

/** Textos con marcado (por ejemplo el enlace a la política de privacidad). */
export function tHtml(lang: Lang, key: TranslationKey): string {
  return t(lang, key);
}

/** Ruta de la portada de un idioma: `/` para EN, `/es/` para ES… */
export function langPath(lang: Lang): string {
  return lang === defaultLang ? '/' : `/${lang}/`;
}

/** Todos los diccionarios, para casos que necesitan recorrerlos. */
export function dictionary(lang: Lang): Record<TranslationKey, string> {
  return dictionaries[lang];
}
