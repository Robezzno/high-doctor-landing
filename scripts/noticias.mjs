#!/usr/bin/env node
/**
 * Herramienta de noticias (docs/METODOLOGIA-NOTICIAS.md).
 *
 *   npm run noticias -- lista                          qué hay publicado y qué toca
 *   npm run noticias -- foto buscar "sleep laboratory" fotos libres en Wikimedia Commons
 *   npm run noticias -- foto guardar "File:X.jpg" <translationKey>
 *   npm run noticias -- comprobar [--sin-red] [--base <rama>] [--todas]
 *
 * `comprobar` aplica las reglas estrictas a las noticias NUEVAS (las que no
 * están en la rama base, por defecto github/main u origin/main) y las básicas
 * al resto. Sale con código 1 si hay algún error.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ANGULOS, LICENCIA_OK, comprobarConjunto, comprobarNoticia, leerNoticia, queToca } from './noticias-lib.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const NEWS = join(RAIZ, 'src/content/news');
const FOTOS = join(RAIZ, 'src/assets/news');
const UA = 'noticias-check/1.0 (static site build tool)';

const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());

function cargar() {
  const todas = [];
  for (const lang of ['es', 'en']) {
    for (const f of readdirSync(join(NEWS, lang)).filter((x) => x.endsWith('.md')).sort()) {
      const ruta = `src/content/news/${lang}/${f}`;
      const leida = leerNoticia(readFileSync(join(RAIZ, ruta), 'utf8'));
      todas.push({ lang, slug: f.replace(/\.md$/, ''), ruta, ...leida, datos: leida.datos ?? {} });
    }
  }
  return todas;
}

/** Ficheros de noticia que no existen en la rama base (= noticias nuevas). */
function nuevas(base) {
  const candidatas = base ? [base] : [process.env.GITHUB_BASE_REF && `origin/${process.env.GITHUB_BASE_REF}`, 'github/main', 'origin/main'].filter(Boolean);
  for (const ref of candidatas) {
    try {
      const fusion = execFileSync('git', ['merge-base', ref, 'HEAD'], { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      const enBase = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', fusion, 'src/content/news'], { cwd: RAIZ, encoding: 'utf8' }).split('\n'));
      return { ref, es: (ruta) => !enBase.has(ruta) };
    } catch {
      /* se prueba la siguiente */
    }
  }
  return { ref: null, es: () => false };
}

async function comprobarFuente(url) {
  const doi = /^https:\/\/(?:dx\.)?doi\.org\/(10\..+)$/.exec(url);
  try {
    if (doi) {
      const r = await fetch(`https://doi.org/api/handles/${doi[1]}`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
      const j = await r.json();
      return j.responseCode === 1 ? null : `el DOI ${doi[1]} no existe en doi.org: no publiques un estudio que no puedes localizar`;
    }
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) noticias-check' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (r.status >= 400) return `\`source.url\` responde ${r.status}. Si es un estudio, usa su enlace DOI (https://doi.org/10.…); si es un organismo, la página exacta`;
    return null;
  } catch (e) {
    return `no se pudo abrir \`source.url\` (${e.message})`;
  }
}

async function comprobar(args) {
  const sinRed = args.includes('--sin-red');
  const todasEstrictas = args.includes('--todas');
  const iBase = args.indexOf('--base');
  const base = nuevas(iBase >= 0 ? args[iBase + 1] : undefined);
  const todas = cargar();
  const sharp = (await import('sharp')).default;
  let nErrores = 0;
  const informe = [];

  for (const n of todas) n.nueva = todasEstrictas || base.es(n.ruta);
  const deConjunto = comprobarConjunto(todas.filter((n) => !n.error));

  for (const n of todas) {
    const errores = [];
    const avisos = [];
    if (n.error) errores.push(n.error);
    else {
      const r = comprobarNoticia(n, { nueva: n.nueva, hoy: hoy() });
      errores.push(...r.errores, ...(deConjunto.get(`${n.lang}/${n.slug}`) ?? []));
      avisos.push(...r.avisos);
      const d = n.datos;
      if (d.draft !== true && typeof d.cover === 'string') {
        const foto = join(NEWS, n.lang, d.cover);
        if (!existsSync(foto)) errores.push(`la foto no existe: ${d.cover} (el build fallará)`);
        else {
          const meta = await sharp(foto).metadata();
          const kb = Math.round(statSync(foto).size / 1024);
          if (meta.width < 1200) errores.push(`la foto mide ${meta.width} px de ancho (mínimo 1200)`);
          if (meta.width < meta.height) errores.push('la foto es vertical: tiene que ser horizontal');
          if (kb > 700) errores.push(`la foto pesa ${kb} KB (máximo 700): guárdala con \`npm run noticias -- foto guardar\``);
        }
      }
      if (n.nueva && !sinRed && d.draft !== true && d.source?.url) {
        const fallo = await comprobarFuente(d.source.url);
        if (fallo) errores.push(fallo);
      }
    }
    nErrores += errores.length;
    if (errores.length || avisos.length || n.nueva) informe.push({ n, errores, avisos });
  }

  console.log(`Noticias: ${todas.length} ficheros · base: ${base.ref ?? 'no encontrada (ninguna se trata como nueva)'} · nuevas: ${todas.filter((n) => n.nueva).length}\n`);
  for (const { n, errores, avisos } of informe) {
    console.log(`${errores.length ? 'MAL ' : 'BIEN'} ${n.ruta}${n.nueva ? '  (nueva)' : ''}`);
    for (const e of errores) console.log(`     ERROR  ${e}`);
    for (const a of avisos) console.log(`     aviso  ${a}`);
  }
  console.log(nErrores ? `\n${nErrores} error(es). Corrígelos TODOS antes de abrir el PR.` : '\nTodo correcto.');
  process.exit(nErrores ? 1 : 0);
}

function lista() {
  const todas = cargar().filter((n) => !n.error);
  const q = queToca(todas);
  const f = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));
  console.log(`Últimas ${q.ultimas.length} noticias publicadas (español):\n`);
  console.log('FECHA       CATEGORÍA      ÁNGULO          TEMA                 TITULAR');
  for (const n of q.ultimas) {
    const d = n.datos;
    console.log(`${f(d.date)}  ${String(d.category).padEnd(13)}  ${String(d.angulo ?? '—').padEnd(14)}  ${String(d.tema ?? '—').padEnd(19)}  ${d.title}`);
  }
  const linea = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ');
  console.log(`\nPor categoría: ${linea(q.porCategoria)}`);
  console.log(`Por ángulo:    ${linea(q.porAngulo)}`);
  console.log('\nQUÉ TOCA AHORA');
  console.log(`- Temas PROHIBIDOS (ya salieron hace poco): ${q.temasVetados.join(', ') || 'ninguno'}`);
  console.log(`- Ángulo PROHIBIDO (dos seguidas): ${q.anguloVetado ?? 'ninguno'}`);
  console.log(`- Categorías PROHIBIDAS (cupo lleno): ${q.categoriasVetadas.join(', ') || 'ninguna'}`);
  console.log(`- Ángulo recomendado (el menos usado): ${q.anguloSugerido} — ${ANGULOS[q.anguloSugerido]}`);
  console.log('\nTodas las fuentes ya usadas (no repetir):');
  for (const n of todas.filter((x) => x.lang === 'es')) console.log(`- ${n.datos.source?.url ?? '(sin fuente)'}  ←  ${n.slug}${n.datos.draft ? '  [borrador]' : ''}`);
}

const limpia = (html) => String(html ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

async function commons(params) {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`;
  for (let intento = 1; ; intento += 1) {
    const r = await fetch(url, { headers: { 'user-agent': UA } });
    if (r.ok) return r.json();
    // 429 = demasiadas peticiones seguidas: se espera y se reintenta.
    if (r.status !== 429 || intento === 4) throw new Error(`Wikimedia Commons responde ${r.status}. Espera un minuto y repite la orden`);
    await new Promise((ok) => setTimeout(ok, 8000 * intento));
  }
}

function ficha(p) {
  const ii = p.imageinfo?.[0];
  const m = ii?.extmetadata ?? {};
  const licencia = limpia(m.LicenseShortName?.value).replace(/^CC-/, 'CC ').replace(/^CC (BY(-SA)?)-/, 'CC $1 ');
  return {
    titulo: p.title,
    ancho: ii?.width,
    alto: ii?.height,
    mime: ii?.mime,
    licencia,
    autor: limpia(m.Artist?.value).slice(0, 80) || 'Autor desconocido',
    descripcion: limpia(m.ImageDescription?.value).slice(0, 110),
    pagina: ii?.descriptionurl,
    miniatura: ii?.thumburl,
    valida: LICENCIA_OK.test(licencia) && ii?.mime === 'image/jpeg' && ii?.width >= 1600 && ii?.width > ii?.height,
  };
}

async function foto(args) {
  const [accion, a, b] = args;
  if (accion === 'buscar' && a) {
    const j = await commons({
      action: 'query', generator: 'search', gsrsearch: `${a} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '40',
      prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600',
    });
    const validas = Object.values(j.query?.pages ?? {}).map(ficha).filter((x) => x.valida);
    if (!validas.length) {
      console.log('Ninguna foto válida (JPEG horizontal, 1600 px o más, licencia libre). Prueba otras palabras en inglés, más generales.');
      return;
    }
    for (const x of validas.slice(0, 12)) console.log(`${x.titulo}\n   ${x.ancho}×${x.alto} · ${x.licencia} · ${x.autor}\n   ${x.descripcion}\n   ${x.pagina}\n`);
    console.log('Elige UNA, ábrela para comprobar que se ve lo que dice, y guárdala con:\n  npm run noticias -- foto guardar "File:NOMBRE.jpg" <translationKey>');
    return;
  }
  if (accion === 'guardar' && a && b) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b)) throw new Error('el translationKey va en minúsculas, sin acentos y con guiones');
    const j = await commons({ action: 'query', titles: a, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600' });
    const x = ficha(Object.values(j.query?.pages ?? {})[0] ?? {});
    if (!x.pagina) throw new Error(`no existe ${a} en Wikimedia Commons`);
    if (!x.valida) throw new Error(`foto no admitida (${x.ancho}×${x.alto}, ${x.mime}, licencia «${x.licencia}»). Hace falta JPEG horizontal de 1600 px o más con CC0, Public domain, CC BY o CC BY-SA`);
    const r = await fetch(x.miniatura, { headers: { 'user-agent': UA } });
    if (!r.ok) throw new Error(`no se pudo descargar (${r.status})`);
    const sharp = (await import('sharp')).default;
    const salida = join(FOTOS, `${b}.jpg`);
    mkdirSync(FOTOS, { recursive: true });
    writeFileSync(salida, await sharp(Buffer.from(await r.arrayBuffer())).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer());
    const q = (t) => `'${t.replace(/'/g, "''")}'`;
    console.log(`Guardada en src/assets/news/${b}.jpg (${Math.round(statSync(salida).size / 1024)} KB). Ábrela y mírala antes de seguir.\n`);
    console.log('Pega esto TAL CUAL en el frontmatter de las dos versiones (cambia sólo coverAlt, en su idioma):\n');
    console.log(`cover: '../../../assets/news/${b}.jpg'\ncoverAlt: 'DESCRIBE AQUÍ LO QUE SE VE EN LA FOTO'\ncoverCredit:\n  autor: ${q(x.autor)}\n  licencia: ${q(x.licencia)}\n  url: ${q(x.pagina)}`);
    return;
  }
  console.log('Uso:\n  npm run noticias -- foto buscar "palabras en inglés"\n  npm run noticias -- foto guardar "File:NOMBRE.jpg" <translationKey>');
  process.exit(1);
}

const [orden, ...resto] = process.argv.slice(2);
try {
  if (orden === 'lista') lista();
  else if (orden === 'comprobar') await comprobar(resto);
  else if (orden === 'foto') await foto(resto);
  else {
    console.log('Uso: npm run noticias -- lista | comprobar [--sin-red] [--todas] [--base <rama>] | foto buscar "…" | foto guardar "File:…" <translationKey>');
    process.exit(1);
  }
} catch (e) {
  console.error(`ERROR: ${e.message}`);
  process.exit(1);
}
