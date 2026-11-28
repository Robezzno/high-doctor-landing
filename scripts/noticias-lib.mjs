/**
 * Reglas de la metodología de noticias (docs/METODOLOGIA-NOTICIAS.md) en código.
 *
 * Funciones puras: reciben el texto de los ficheros y devuelven problemas. No
 * tocan disco ni red; eso lo hace `scripts/noticias.mjs`. Se prueban en
 * `scripts/noticias.test.ts`.
 */
import { parse as parseYaml } from 'yaml';

export const CATEGORIAS = ['investigacion', 'salud', 'legislacion', 'cultura', 'fundacion', 'eventos'];

/** Ángulos: qué tipo de pieza es. Sirve para no publicar siempre lo mismo. */
export const ANGULOS = {
  'ensayo-clinico': 'Ensayo clínico en personas (con grupo de comparación)',
  'ciencia-basica': 'Laboratorio, animales o mecanismo (todavía no en personas)',
  'datos-reales': 'Registro u observación de pacientes reales (sin placebo)',
  revision: 'Revisión, metaanálisis o informe de un organismo oficial',
  regulacion: 'Decisión de un regulador o cambio legal',
  guia: 'Explicador: cómo leer o entender algo',
  fundacion: 'Novedad de la propia fundación',
};

export const EVIDENCIA = ['pain', 'nausea', 'ms', 'epilepsy', 'sleep', 'anxiety', 'cancer', 'psychosis', 'driving', 'pregnancy'];

/** Ángulos que cuentan un estudio o informe: llevan la estructura fija completa. */
export const ANGULOS_DE_ESTUDIO = ['ensayo-clinico', 'ciencia-basica', 'datos-reales', 'revision'];

/** Apartados fijos de una noticia sobre un estudio, por idioma. */
export const APARTADOS = {
  es: ['Qué se hizo', 'Qué descubrió', 'Cómo leerlo', 'Por qué nos parece relevante'],
  en: ['What was done', 'What it found', 'How to read it', 'Why it matters to us'],
};

/** Cuántas noticias atrás se mira para no repetir tema. */
export const VENTANA_TEMA = 6;
/** Cuántas noticias atrás se mira para el reparto de categorías. */
export const VENTANA_CATEGORIA = 10;
/** Máximo de noticias de una misma categoría dentro de esa ventana (contando la nueva). */
export const MAX_MISMA_CATEGORIA = 6;

/** Licencias admitidas para la foto de portada. */
export const LICENCIA_OK = /^(CC0( 1\.0)?|CC BY(-SA)? [1-4]\.\d( [a-z]{2,})?|Public domain|Dominio público)$/i;

/** Campos de texto que SIEMPRE van entre comillas en el frontmatter. */
const CAMPOS_CON_COMILLAS = [
  'title', 'summary', 'instagramHook', 'coverAlt', 'cover', 'name', 'url', 'autor',
  'licencia', 'cifra', 'etiqueta', 'texto', 'instagram', 'perspectiva',
];

/** Promesas y consejos médicos: prohibidos en cualquier noticia. */
const FRASES_PROHIBIDAS = [
  [/\bmilagr/i, 'habla de milagros'],
  [/\b(cura|curan|curar[áa]?) (el|la|los|las)\b/i, 'promete una cura'],
  [/\bgarantiza(n|do)?\b/i, 'garantiza un resultado'],
  [/\b100 ?% (eficaz|seguro|natural)/i, 'promesa absoluta'],
  [/\b(deber[ií]as?|debes|tienes que) (tomar|probar|usar|dejar)/i, 'da una orden de salud al lector'],
  [/\b(te )?recomendamos (tomar|probar|usar|comprar)/i, 'recomienda consumir o comprar'],
  [/\bdosis recomendada/i, 'recomienda una dosis'],
  [/\bsin efectos secundarios\b/i, 'promete ausencia de efectos secundarios'],
  [/\bmiracle/i, 'habla de milagros'],
  [/\b(cures?|will cure)\b/i, 'promete una cura'],
  [/\bguarantee[sd]?\b/i, 'garantiza un resultado'],
  [/\byou should (take|try|use|stop)/i, 'da una orden de salud al lector'],
  [/\bwe recommend (taking|trying|using|buying)/i, 'recomienda consumir o comprar'],
  [/\brecommended dose/i, 'recomienda una dosis'],
  [/\b(no|without) side effects\b/i, 'promete ausencia de efectos secundarios'],
];

/** Titulares «en negativo»: esta web no los publica (línea editorial). */
const TITULAR_NEGATIVO = [
  /\bno (mejora|funciona|sirve|reduce|alivia|ayuda)/i, /\b(riesgo|peligro|da[ñn]o|t[óo]xic|ineficaz|fracas|empeora|adicci|psicosis|alerta)/i,
  /\b(does not|doesn'?t|fails? to) (improve|work|help|reduce)/i, /\b(risk|danger|harm|toxic|ineffective|worsen|addict|psychosis|warning)/i,
];

/** Publicidad y afiliados: esta web no lleva. */
const URL_PUBLICITARIA = /(amzn\.to|[?&](tag|ref|aff|affid|aff_id|utm_[a-z]+|partner|awc)=|\/ref=|awin1\.com|tradedoubler|shareasale)/i;

/**
 * Separa frontmatter y cuerpo. Devuelve `{ crudo, datos, cuerpo, error }`.
 */
export function leerNoticia(texto) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(texto);
  if (!m) return { error: 'no empieza por un bloque de frontmatter entre líneas `---`' };
  try {
    const datos = parseYaml(m[1]);
    if (!datos || typeof datos !== 'object') return { error: 'el frontmatter está vacío' };
    return { crudo: m[1], datos, cuerpo: m[2] };
  } catch (e) {
    return { error: `YAML inválido: ${String(e.message).split('\n')[0]}` };
  }
}

/** Líneas del frontmatter cuyo valor de texto no va entre comillas. */
export function camposSinComillas(crudo) {
  const malos = [];
  for (const linea of crudo.split(/\r?\n/)) {
    const m = /^\s*(?:-\s+)?([A-Za-z]+):\s*(.+?)\s*$/.exec(linea);
    if (!m) continue;
    const [, campo, valor] = m;
    if (!CAMPOS_CON_COMILLAS.includes(campo)) continue;
    const ok = (valor.startsWith("'") && valor.endsWith("'")) || (valor.startsWith('"') && valor.endsWith('"'));
    if (!ok) malos.push(campo);
  }
  return malos;
}

const palabras = (t) => t.trim().split(/\s+/).filter(Boolean).length;

const sinAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Palabras con significado de un titular (para detectar duplicados). */
function clave(titulo) {
  return new Set(sinAcentos(titulo).split(/[^a-z0-9]+/).filter((p) => p.length > 3));
}

/** Parecido entre dos titulares, de 0 a 1 (Jaccard). */
export function parecido(a, b) {
  const A = clave(a);
  const B = clave(b);
  if (!A.size || !B.size) return 0;
  let comunes = 0;
  for (const p of A) if (B.has(p)) comunes += 1;
  return comunes / (A.size + B.size - comunes);
}

const normalizaUrl = (u) => String(u || '').toLowerCase().replace(/^https?:\/\/(www\.|dx\.)?/, '').replace(/[/#?]+$/, '');

const fechaIso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

/**
 * Comprueba UNA noticia aislada (sin mirar las demás).
 * @param n `{ lang, slug, crudo, datos, cuerpo }`
 * @param o `{ nueva, hoy }` — `nueva` activa las reglas estrictas; `hoy` es AAAA-MM-DD.
 * @returns `{ errores: string[], avisos: string[] }`
 */
export function comprobarNoticia(n, o = {}) {
  const errores = [];
  const avisos = [];
  const d = n.datos;
  const estricto = (msg) => (o.nueva ? errores : avisos).push(msg);
  const texto = (v) => typeof v === 'string' && v.trim().length > 0;

  // --- Frontmatter: contrato (lo mismo que exige el build) ---
  for (const campo of ['title', 'summary', 'translationKey', 'author']) {
    if (!texto(d[campo])) errores.push(`falta \`${campo}\``);
  }
  if (texto(d.title) && d.title.length > 90) errores.push(`\`title\` tiene ${d.title.length} caracteres (máximo 90)`);
  if (texto(d.summary) && d.summary.length > 200) errores.push(`\`summary\` tiene ${d.summary.length} caracteres (máximo 200)`);
  if (texto(d.instagramHook) && d.instagramHook.length > 80) errores.push(`\`instagramHook\` tiene ${d.instagramHook.length} caracteres (máximo 80)`);
  if (d.lang !== n.lang) errores.push(`\`lang: ${d.lang}\` no coincide con la carpeta \`${n.lang}/\``);
  if (!CATEGORIAS.includes(d.category)) errores.push(`\`category: ${d.category}\` no existe (valen: ${CATEGORIAS.join(', ')})`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(n.slug)) errores.push(`el nombre del fichero \`${n.slug}\` debe ir en minúsculas, sin acentos y con guiones`);
  if (texto(d.translationKey) && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.translationKey)) errores.push('`translationKey` debe ir en minúsculas, sin acentos y con guiones');
  const fecha = fechaIso(d.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) errores.push('`date` debe ser AAAA-MM-DD');
  else if (o.hoy && fecha > o.hoy) errores.push(`\`date: ${fecha}\` está en el futuro (hoy es ${o.hoy})`);
  else if (o.nueva && o.hoy && (Date.parse(o.hoy) - Date.parse(fecha)) / 864e5 > 2) errores.push(`\`date: ${fecha}\` es antigua para una noticia nueva: pon la fecha de hoy (${o.hoy})`);
  if (d.instagram !== undefined && !['off', 'pending', 'published'].includes(d.instagram)) errores.push("`instagram` sólo admite 'off', 'pending' o 'published' (entre comillas)");

  const sinComillas = camposSinComillas(n.crudo);
  if (sinComillas.length) estricto(`valores sin comillas en: ${[...new Set(sinComillas)].join(', ')}. Todo texto del frontmatter va entre comillas simples`);

  if (d.draft === true) return { errores, avisos }; // un borrador no se publica: basta con que no rompa el build

  // --- Fuente ---
  if (!d.source || !texto(d.source.name) || !texto(d.source.url)) estricto('falta `source` con `name` y `url` (toda noticia enlaza su fuente primaria)');
  else if (!/^https:\/\//.test(d.source.url)) errores.push('`source.url` debe empezar por https://');

  // --- Imagen ---
  if (!texto(d.cover)) estricto('falta `cover`: toda noticia lleva foto (npm run noticias -- foto)');
  else {
    if (d.cover !== `../../../assets/news/${d.translationKey}.jpg`) errores.push(`\`cover\` debe ser exactamente '../../../assets/news/${d.translationKey}.jpg'`);
    if (!texto(d.coverAlt)) errores.push('falta `coverAlt` (describe lo que se ve en la foto)');
    const c = d.coverCredit;
    if (!c || !texto(c.autor) || !texto(c.licencia) || !texto(c.url)) errores.push('falta `coverCredit` con `autor`, `licencia` y `url`');
    else {
      if (!LICENCIA_OK.test(c.licencia.trim())) errores.push(`licencia de la foto no admitida: «${c.licencia}» (valen CC0, Public domain, CC BY y CC BY-SA)`);
      if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(c.url)) errores.push('`coverCredit.url` debe ser la página de la foto en Wikimedia Commons (https://commons.wikimedia.org/wiki/File:…)');
    }
  }

  // --- Gráfico ---
  const g = d.grafico;
  if (!g) estricto('falta `grafico` (cifra clave, etiqueta y 1–3 datos)');
  else {
    if (!texto(g.cifra) || g.cifra.length > 12) errores.push('`grafico.cifra` es obligatoria y de 12 caracteres como mucho');
    if (!texto(g.etiqueta) || g.etiqueta.length > 70) errores.push('`grafico.etiqueta` es obligatoria y de 70 caracteres como mucho');
    if (!Array.isArray(g.datos) || g.datos.length < 1 || g.datos.length > 3) errores.push('`grafico.datos` lleva de 1 a 3 filas');
    else for (const f of g.datos) if (!texto(f.texto) || f.texto.length > 64) errores.push(`fila de \`grafico.datos\` vacía o de más de 64 caracteres: «${f.texto}»`);
  }
  for (const e of d.evidencia ?? []) if (!EVIDENCIA.includes(e)) errores.push(`\`evidencia: ${e}\` no existe (valen: ${EVIDENCIA.join(', ')})`);

  // --- Variedad: tema y ángulo declarados ---
  if (!texto(d.tema) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.tema)) estricto('falta `tema` (una o dos palabras en minúsculas con guiones, p. ej. `sueno`)');
  if (!Object.keys(ANGULOS).includes(d.angulo)) estricto(`falta \`angulo\` o no existe (valen: ${Object.keys(ANGULOS).join(', ')})`);

  // --- Cuerpo ---
  const cuerpo = n.cuerpo;
  const total = palabras(cuerpo);
  if (/^# /m.test(cuerpo)) errores.push('el cuerpo no lleva título de primer nivel (`# `): el título sale del frontmatter');
  if (total < 250) estricto(`el cuerpo tiene ${total} palabras (mínimo 250)`);
  if (total > 750) estricto(`el cuerpo tiene ${total} palabras (máximo 750)`);
  if ((cuerpo.match(/^## /gm) ?? []).length < 3) estricto('el cuerpo necesita al menos 3 apartados `## ` (ver estructura fija)');
  if (ANGULOS_DE_ESTUDIO.includes(d.angulo)) {
    const fijos = APARTADOS[n.lang] ?? [];
    const puestos = [...cuerpo.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);
    const enOrden = fijos.every((t) => puestos.includes(t)) && fijos.map((t) => puestos.indexOf(t)).every((p, i, l) => i === 0 || p > l[i - 1]);
    if (!enOrden) estricto(`faltan los apartados fijos, con este texto exacto y en este orden: ${fijos.map((t) => `«## ${t}»`).join(', ')}`);
    if (!/^> \S/m.test(cuerpo)) estricto('falta la frase destacada (una línea que empieza por `> `) dentro de «Cómo leerlo»');
  }
  if (d.category === 'salud' || d.category === 'investigacion') {
    if (!/consejo m[ée]dico|medical advice/i.test(cuerpo)) estricto('falta la frase final de cautela («…no es consejo médico» / «…not medical advice»)');
  }
  const enlaces = [...cuerpo.matchAll(/\]\((https?:\/\/[^)\s]+)/g)].map((m) => m[1]);
  if (d.source && texto(d.source.url) && !enlaces.some((u) => normalizaUrl(u) === normalizaUrl(d.source.url))) {
    estricto('el cuerpo no enlaza la fuente: la última línea debe llevar un enlace a la misma URL que `source.url`');
  }
  if (/^(##\s*)?(Qué ha pasado|What happened)/im.test(cuerpo) && /^## (Contexto|Context)\s*$/im.test(cuerpo)) {
    avisos.push('usa la plantilla antigua del bot (Qué ha pasado / Contexto): la estructura fija es otra');
  }

  // --- Cautelas sanitarias ---
  const todo = `${d.title}\n${d.summary}\n${d.instagramHook ?? ''}\n${cuerpo}`;
  for (const [re, porque] of FRASES_PROHIBIDAS) {
    const m = re.exec(todo);
    if (m) estricto(`frase prohibida («${m[0]}»): ${porque}`);
  }

  // --- A favor del proyecto: en positivo y sin publicidad ---
  const cabecera = `${d.title}\n${d.instagramHook ?? ''}`;
  for (const re of TITULAR_NEGATIVO) {
    const m = re.exec(cabecera);
    if (m) {
      estricto(`titular «en negativo» («${m[0]}»): esta web sólo publica avances y descubrimientos prometedores`);
      break;
    }
  }
  for (const u of [...enlaces, d.source?.url ?? '']) {
    if (URL_PUBLICITARIA.test(u)) errores.push(`enlace con marca de afiliado o de seguimiento (${u}): esta web no lleva publicidad ni afiliados`);
  }

  return { errores, avisos };
}

/**
 * Comprobaciones que necesitan ver todas las noticias: parejas ES/EN,
 * duplicados y variedad.
 * @param todas  noticias leídas `{ lang, slug, datos, nueva }`
 * @returns `Map<clave lang/slug, string[]>` de errores
 */
export function comprobarConjunto(todas) {
  const errores = new Map();
  const add = (n, msg) => {
    const k = `${n.lang}/${n.slug}`;
    errores.set(k, [...(errores.get(k) ?? []), msg]);
  };
  const publicadas = todas.filter((n) => n.datos.draft !== true);

  // Parejas ES/EN
  for (const n of publicadas) {
    const otra = n.lang === 'es' ? 'en' : 'es';
    const gemelas = publicadas.filter((x) => x.lang === n.lang && x.datos.translationKey === n.datos.translationKey);
    if (gemelas.length > 1) add(n, `\`translationKey: ${n.datos.translationKey}\` está repetido en \`${n.lang}/\``);
    const par = publicadas.find((x) => x.lang === otra && x.datos.translationKey === n.datos.translationKey);
    if (!par) {
      add(n, `falta la versión en \`${otra}/\` con el mismo \`translationKey\``);
      continue;
    }
    for (const campo of ['date', 'category', 'cover', 'tema', 'angulo']) {
      const a = campo === 'date' ? fechaIso(n.datos.date) : n.datos[campo];
      const b = campo === 'date' ? fechaIso(par.datos.date) : par.datos[campo];
      if (a !== b) add(n, `\`${campo}\` no coincide con la versión en \`${otra}/\` (${a} ≠ ${b})`);
    }
    if (normalizaUrl(n.datos.source?.url) !== normalizaUrl(par.datos.source?.url)) add(n, `\`source.url\` no coincide con la versión en \`${otra}/\``);
    if (n.nueva && n.lang === 'en' && n.slug === par.slug) add(n, 'el nombre del fichero en inglés es igual que el español: tradúcelo (palabras en inglés)');
  }

  // Duplicados y variedad: se miran en español, que es la versión de referencia
  const es = publicadas.filter((n) => n.lang === 'es').sort((a, b) => fechaIso(b.datos.date).localeCompare(fechaIso(a.datos.date)));
  for (const n of es.filter((x) => x.nueva)) {
    const anteriores = es.filter((x) => x !== n && !x.nueva);
    for (const x of anteriores) {
      if (n.datos.source?.url && normalizaUrl(x.datos.source?.url) === normalizaUrl(n.datos.source.url)) add(n, `duplicada: la misma fuente ya se publicó en «${x.slug}»`);
      else if (parecido(n.datos.title, x.datos.title) >= 0.6) add(n, `duplicada: el titular es casi igual que «${x.slug}»`);
    }
    const mismoTema = anteriores.slice(0, VENTANA_TEMA).filter((x) => x.datos.tema && x.datos.tema === n.datos.tema);
    if (mismoTema.length) {
      const otroAngulo = mismoTema.every((x) => x.datos.angulo !== n.datos.angulo);
      const declarada = typeof n.datos.perspectiva === 'string' && n.datos.perspectiva.trim().length >= 30;
      if (!otroAngulo || !declarada) {
        add(n, `tema repetido: \`${n.datos.tema}\` ya salió en las últimas ${VENTANA_TEMA} noticias («${mismoTema[0].slug}»). Elige otro tema, o cambia de \`angulo\` y explica en \`perspectiva\` (30 caracteres o más) qué aporta de nuevo`);
      }
    }
    const [u1, u2] = anteriores;
    if (u1 && u2 && u1.datos.angulo && u1.datos.angulo === u2.datos.angulo && n.datos.angulo === u1.datos.angulo) {
      add(n, `ángulo repetido: las dos últimas noticias ya son \`${u1.datos.angulo}\`. Toca otro tipo de pieza`);
    }
    const ventana = anteriores.slice(0, VENTANA_CATEGORIA - 1);
    const mismas = ventana.filter((x) => x.datos.category === n.datos.category).length + 1;
    if (ventana.length >= VENTANA_CATEGORIA - 1 && mismas > MAX_MISMA_CATEGORIA) {
      add(n, `demasiadas noticias de \`${n.datos.category}\`: serían ${mismas} de las últimas ${VENTANA_CATEGORIA} (máximo ${MAX_MISMA_CATEGORIA}). Elige otra categoría`);
    }
  }
  return errores;
}

/**
 * Qué toca publicar: resumen de las últimas noticias en español.
 * @returns `{ ultimas, porCategoria, porAngulo, temasVetados, anguloVetado, categoriasVetadas, anguloSugerido }`
 */
export function queToca(todas) {
  const es = todas
    .filter((n) => n.lang === 'es' && n.datos.draft !== true)
    .sort((a, b) => fechaIso(b.datos.date).localeCompare(fechaIso(a.datos.date)));
  const ultimas = es.slice(0, VENTANA_CATEGORIA);
  const cuenta = (campo, lista) => {
    const r = {};
    for (const n of lista) r[n.datos[campo] ?? '—'] = (r[n.datos[campo] ?? '—'] ?? 0) + 1;
    return r;
  };
  const porCategoria = cuenta('category', ultimas);
  const porAngulo = cuenta('angulo', ultimas);
  const temasVetados = [...new Set(es.slice(0, VENTANA_TEMA).map((n) => n.datos.tema).filter(Boolean))];
  const anguloVetado = es[0] && es[1] && es[0].datos.angulo === es[1].datos.angulo ? es[0].datos.angulo : null;
  const previas = es.slice(0, VENTANA_CATEGORIA - 1);
  const categoriasVetadas = previas.length >= VENTANA_CATEGORIA - 1
    ? CATEGORIAS.filter((c) => previas.filter((n) => n.datos.category === c).length + 1 > MAX_MISMA_CATEGORIA)
    : [];
  const anguloSugerido = Object.keys(ANGULOS)
    .filter((a) => a !== anguloVetado && a !== 'fundacion')
    .sort((a, b) => (porAngulo[a] ?? 0) - (porAngulo[b] ?? 0))[0];
  return { ultimas, porCategoria, porAngulo, temasVetados, anguloVetado, categoriasVetadas, anguloSugerido };
}
