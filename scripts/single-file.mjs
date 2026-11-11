#!/usr/bin/env node
/**
 * Empaqueta una página del build (`dist/`) en un único .html autocontenido:
 * CSS, fuentes, imágenes y JS dentro del propio fichero (sin dependencias). Sirve para mandar la
 * web a la carpeta sincronizada de churflix y abrirla en cualquier dispositivo
 * sin servidor.
 *
 * Uso: node scripts/single-file.mjs <ruta-en-dist> <salida.html>
 *   node scripts/single-file.mjs es/index.html "/tmp/High Doctor - web.html"
 *
 * Los enlaces internos a otras páginas (blog, legales) se reescriben a la web
 * publicada; los anclajes de la propia página siguen funcionando.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://highdoctor.foundation';
const [page = 'es/index.html', out = 'single.html'] = process.argv.slice(2);

const MIME = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

const distPath = (url) => join(DIST, decodeURIComponent(url.split('?')[0].replace(/^\//, '')));

async function dataUri(url) {
  const file = distPath(url);
  if (!existsSync(file)) return url;
  const bytes = await readFile(file);
  return `data:${MIME[extname(file).toLowerCase()] ?? 'application/octet-stream'};base64,${bytes.toString('base64')}`;
}

async function replaceAsync(text, regex, fn) {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(regex)) {
    parts.push(text.slice(last, match.index), await fn(...match));
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts.join('');
}

/** De un srcset elige la variante más cercana a 800 px de ancho. */
function pickFromSrcset(srcset) {
  const candidates = srcset
    .split(',')
    .map((part) => part.trim().split(/\s+/))
    .map(([url, w]) => ({ url, w: Number.parseInt(w ?? '0', 10) || 0 }));
  candidates.sort((a, b) => Math.abs(a.w - 800) - Math.abs(b.w - 800));
  return candidates[0]?.url;
}

let html = await readFile(join(DIST, page), 'utf8');

// 1. CSS: se inlinea y sus url() pasan a data URI.
html = await replaceAsync(html, /<link rel="stylesheet" href="([^"]+)"[^>]*>/g, async (_, href) => {
  let css = await readFile(distPath(href), 'utf8');
  css = await replaceAsync(css, /url\(([^)]+)\)/g, async (m, raw) => {
    const url = raw.replace(/["']/g, '');
    return url.startsWith('/') ? `url(${await dataUri(url)})` : m;
  });
  return `<style>${css}</style>`;
});

// 2. Precargas de fuentes: sobran (las fuentes ya van en el CSS).
html = html.replace(/<link rel="preload"[^>]*>/g, '');

// 3. Imágenes: <source> fuera, cada <img> con una sola variante embebida.
html = html.replace(/<source[^>]*>/g, '');
html = await replaceAsync(html, /<img\b[^>]*>/g, async (tag) => {
  const srcset = tag.match(/srcset="([^"]+)"/)?.[1];
  const src = (srcset && pickFromSrcset(srcset)) || tag.match(/src="([^"]+)"/)?.[1];
  if (!src || !src.startsWith('/')) return tag;
  const uri = await dataUri(src);
  return tag
    .replace(/\s(srcset|sizes)="[^"]*"/g, '')
    .replace(/src="[^"]*"/, `src="${uri}"`)
    .replace(/\sloading="lazy"/, '');
});

// 4. JS: el router de Astro no hace falta; el resto se empaqueta en un IIFE.
html = html.replace(/<script type="module" src="[^"]*ClientRouter[^"]*"><\/script>/g, '');
html = await replaceAsync(html, /<script type="module" src="([^"]+)"><\/script>/g, async (_, src) => {
  // El paquete de Astro no tiene imports estáticos (sólo el import dinámico
  // del scroll suave, que fuera del sitio se ignora): se inlinea tal cual.
  // El scroll suave (Lenis) se sustituye por uno vacío: fuera del sitio no hay
  // de dónde descargarlo y el scroll nativo basta.
  const text = (await readFile(distPath(src), 'utf8')).replace(
    /import\(`?["'`]?\.\/lenis[^)]*\)/g,
    'Promise.resolve({default:class{destroy(){}}})',
  );
  const code = text.replaceAll('</script', '<\\/script');
  // Sin router no se dispara `astro:page-load`: lo lanzamos al cargar.
  return `<script type="module">${code}
document.dispatchEvent(new Event('astro:page-load'));</script>`;
});

// 5. Enlaces internos a otras páginas → web publicada; favicon y manifest fuera.
html = html.replace(/<link rel="(icon|apple-touch-icon|manifest)"[^>]*>/g, '');
html = html.replace(/href="\/(?!\/)([^"#]*)(#[^"]*)?"/g, (m, path, hash = '') => {
  if (path === '' || path === 'es/') return `href="${hash || '#top'}"`;
  return `href="${SITE}/${path}${hash}"`;
});

await writeFile(out, html);
const size = Buffer.byteLength(html);
console.log(`single-file: ${out} (${(size / 1024 / 1024).toFixed(2)} MB)`);
