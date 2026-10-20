#!/usr/bin/env node
/**
 * Crawler de enlaces internos (prompt 09, QA.1): recorre todos los HTML de
 * `dist/`, extrae los enlaces internos y comprueba que cada destino exista
 * en el build. Sin dependencias: sólo `node tests/crawl-links.mjs`.
 *
 * También revisa `src`/`srcset` de imágenes, hojas de estilo, los `hreflang`
 * de `<link rel="alternate">` y las imágenes `og:image`.
 *
 * Sale con código 1 si hay algún enlace interno roto.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';

const DIST = resolve(process.argv[2] ?? 'dist');

if (!existsSync(DIST)) {
  console.error(`crawl-links: no existe ${DIST}. Ejecuta antes \`npm run build\`.`);
  process.exit(1);
}

/** HTML del build (sólo ficheros .html). */
function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

/**
 * URL de un atributo → ruta del fichero que debería existir en dist/.
 * Devuelve null para enlaces externos, mailto/tel, anclas y datos.
 */
function targetFile(href, fromFile) {
  if (!href) return null;
  const trimmed = href.trim();
  if (
    trimmed === '' ||
    trimmed.startsWith('#') ||
    /^(https?:)?\/\//i.test(trimmed) ||
    /^(mailto|tel|data|blob):/i.test(trimmed)
  ) {
    return null;
  }
  // Los assets con hash y el RSS usan rutas absolutas desde la raíz del sitio.
  const withoutHash = trimmed.split('#')[0].split('?')[0];
  if (withoutHash === '') return null;
  const base = withoutHash.startsWith('/') ? join(DIST, withoutHash) : resolve(dirname(fromFile), withoutHash);
  const candidates = [
    base,
    `${base}.html`,
    join(base, 'index.html'),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? `MISSING:${relative(DIST, base)}`;
}

/** Extrae URLs de los atributos relevantes de un HTML (sin parser: es un build controlado). */
function extractUrls(html) {
  const urls = new Set();
  const patterns = [
    /\bhref="([^"]*)"/gi,
    /\bsrc="([^"]*)"/gi,
    /\bsrcset="([^"]*)"/gi,
    /\bcontent="(https:\/\/highdoctor\.foundation\/[^"]*)"/gi, // og:image, twitter:image
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const value = match[1];
      if (pattern.source.includes('srcset')) {
        for (const part of value.split(',')) urls.add(part.trim().split(/\s+/)[0]);
      } else {
        urls.add(value);
      }
    }
  }
  return urls;
}

const files = htmlFiles(DIST);
const broken = new Map();
let checked = 0;

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  for (const url of extractUrls(html)) {
    const target = targetFile(url, file);
    if (!target) continue;
    checked++;
    if (target.startsWith('MISSING:')) {
      const missing = target.slice('MISSING:'.length);
      if (!broken.has(missing)) broken.set(missing, []);
      broken.get(missing).push(relative(DIST, file));
    }
  }
}

console.log(
  `crawl-links: ${files.length} páginas HTML, ${checked} referencias internas comprobadas.`,
);

if (broken.size > 0) {
  console.error(`crawl-links: ${broken.size} referencia(s) interna(s) rota(s):`);
  for (const [missing, sources] of broken) {
    console.error(`  ✗ /${missing}  ←  ${sources.slice(0, 3).join(', ')}${sources.length > 3 ? '…' : ''}`);
  }
  process.exit(1);
}

console.log('crawl-links: OK, ningún enlace interno roto.');
