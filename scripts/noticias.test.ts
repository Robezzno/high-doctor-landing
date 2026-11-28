import { describe, expect, it } from 'vitest';

import { camposSinComillas, comprobarConjunto, comprobarNoticia, leerNoticia, parecido, queToca } from './noticias-lib.mjs';

const CUERPO = `Entrada de la noticia con el dato principal y quién lo firma.

## Qué se hizo

${'Explicación del método con palabras sencillas. '.repeat(14)}

## Qué descubrió

${'Resultado contado con su cifra y su unidad. '.repeat(14)}

## Cómo leerlo

${'Límites del estudio dichos con honestidad. '.repeat(10)}

> Una frase destacada que resume la idea.

## Por qué nos parece relevante

${'Motivo por el que le importa al lector. '.repeat(8)}

Esta noticia es divulgación, no consejo médico. Fuente: Autor A. y cols., *Revista*, 2026 ([doi:10.1000/ejemplo](https://doi.org/10.1000/ejemplo)).
`;

const FRONT = `title: 'El CBD alivia el dolor en un ensayo con placebo'
summary: 'Un ensayo con 120 pacientes ve menos dolor con CBD que con placebo a las ocho semanas.'
date: 2026-11-28
lang: es
translationKey: cbd-pain-trial
category: salud
tema: dolor-neuropatico
angulo: ensayo-clinico
source:
  name: 'Revista de Ejemplo'
  url: 'https://doi.org/10.1000/ejemplo'
cover: '../../../assets/news/cbd-pain-trial.jpg'
coverAlt: 'Investigadora en un laboratorio'
coverCredit:
  autor: 'Ana Autora'
  licencia: 'CC BY 4.0'
  url: 'https://commons.wikimedia.org/wiki/File:Ejemplo.jpg'
author: bot
instagram: 'off'
instagramHook: 'CBD y dolor: lo que vio un ensayo con placebo'
grafico:
  cifra: '120'
  etiqueta: 'pacientes en un ensayo de CBD frente a placebo'
  datos:
    - texto: 'Menos dolor con CBD que con placebo'`;

function noticia(cambios: (front: string) => string = (f) => f, cuerpo = CUERPO, lang = 'es', slug = 'cbd-alivia-dolor-ensayo') {
  const leida = leerNoticia(`---\n${cambios(FRONT)}\n---\n\n${cuerpo}`);
  return { lang, slug, nueva: true, ...leida };
}

const errores = (n: ReturnType<typeof noticia>) => comprobarNoticia(n, { nueva: true, hoy: '2026-11-28' }).errores;

describe('comprobar una noticia', () => {
  it('acepta una noticia bien hecha', () => {
    expect(errores(noticia())).toEqual([]);
  });

  it('detecta el YAML roto por dos puntos sin comillas (rompió el despliegue)', () => {
    const rota = leerNoticia('---\ntitle: CBD y sueño: qué dice un ensayo\n---\n\nTexto');
    expect(rota.error).toMatch(/YAML inválido/);
  });

  it('exige comillas en los textos del frontmatter aunque el YAML sea válido', () => {
    expect(camposSinComillas("title: Hola\nsummary: 'bien'\ninstagram: off\ndate: 2026-11-28")).toEqual(['title', 'instagram']);
    expect(errores(noticia((f) => f.replace("instagram: 'off'", 'instagram: off'))).join()).toMatch(/sin comillas/);
  });

  it('rechaza una noticia sin foto o con la ruta de la foto mal', () => {
    expect(errores(noticia((f) => f.replace(/^cover: .*\n/m, ''))).join()).toMatch(/falta `cover`/);
    expect(errores(noticia((f) => f.replace('cbd-pain-trial.jpg', 'otra.jpg'))).join()).toMatch(/`cover` debe ser exactamente/);
  });

  it('rechaza licencias no libres y créditos que no son de Wikimedia Commons', () => {
    expect(errores(noticia((f) => f.replace('CC BY 4.0', 'CC BY-NC 4.0'))).join()).toMatch(/licencia de la foto no admitida/);
    expect(errores(noticia((f) => f.replace('https://commons.wikimedia.org/wiki/File:Ejemplo.jpg', 'https://unsplash.com/x'))).join()).toMatch(/Wikimedia Commons/);
  });

  it('rechaza fechas futuras', () => {
    expect(errores(noticia((f) => f.replace('2026-11-28', '2026-11-29'))).join()).toMatch(/futuro/);
  });

  it('rechaza promesas y consejos médicos', () => {
    expect(errores(noticia(undefined, CUERPO.replace('Entrada de la noticia', 'Deberías probar el CBD. Entrada'))).join()).toMatch(/frase prohibida/);
    expect(errores(noticia(undefined, CUERPO.replace('Entrada de la noticia', 'Un remedio milagroso. Entrada'))).join()).toMatch(/milagros/);
  });

  it('rechaza titulares «en negativo» (línea editorial)', () => {
    expect(errores(noticia((f) => f.replace('El CBD alivia el dolor', 'El CBD no mejora el dolor'))).join()).toMatch(/en negativo/);
  });

  it('rechaza enlaces de afiliado o con seguimiento', () => {
    const conAfiliado = CUERPO.replace('Entrada de la noticia', '[Un libro](https://www.amazon.es/dp/123?tag=hd-21) y la entrada');
    expect(errores(noticia(undefined, conAfiliado)).join()).toMatch(/afiliado/);
  });

  it('exige la estructura fija, la cautela final y el enlace a la fuente', () => {
    expect(errores(noticia(undefined, CUERPO.replace('## Cómo leerlo', '## Contexto'))).join()).toMatch(/apartados fijos/);
    expect(errores(noticia(undefined, CUERPO.replace('no consejo médico', 'nada más'))).join()).toMatch(/cautela/);
    expect(errores(noticia(undefined, CUERPO.replace('https://doi.org/10.1000/ejemplo', 'https://doi.org/10.1000/otro'))).join()).toMatch(/no enlaza la fuente/);
  });

  it('exige tema y ángulo', () => {
    expect(errores(noticia((f) => f.replace(/^tema: .*\n/m, '').replace(/^angulo: .*\n/m, ''))).join()).toMatch(/falta `tema`.*falta `angulo`/s);
  });

  it('a un borrador sólo le pide que no rompa el build', () => {
    expect(errores(noticia((f) => `${f.replace(/^cover: .*\n/m, '')}\ndraft: true`, 'Corto.'))).toEqual([]);
  });
});

describe('comprobar el conjunto', () => {
  const vieja = (slug: string, tema: string, angulo: string, fecha: string, extra = '') => ({
    ...noticia((f) => f.replace('dolor-neuropatico', tema).replace('ensayo-clinico', angulo).replace('2026-11-28', fecha)
      .replace('cbd-pain-trial', slug).replace('cbd-pain-trial', slug).replace('10.1000/ejemplo', `10.1000/${slug}`)
      .replace('El CBD alivia el dolor en un ensayo con placebo', `Titular distinto sobre ${slug.replace(/-/g, ' ')}`) + extra, CUERPO, 'es', slug),
    nueva: false,
  });
  const par = (n: ReturnType<typeof noticia>) => ({ ...n, lang: 'en', slug: `${n.slug}-en`, datos: { ...n.datos, lang: 'en' } });
  const conPares = (lista: ReturnType<typeof noticia>[]) => lista.flatMap((n) => [n, par(n)]);

  it('pide la versión en el otro idioma', () => {
    const r = comprobarConjunto([noticia()]);
    expect(r.get('es/cbd-alivia-dolor-ensayo')?.join()).toMatch(/falta la versión en `en\/`/);
  });

  it('no deja repetir un tema reciente sin otra perspectiva declarada', () => {
    const anteriores = [vieja('otra-uno', 'dolor-neuropatico', 'revision', '2026-11-20'), vieja('otra-dos', 'sueno', 'guia', '2026-11-10')];
    const repetida = comprobarConjunto(conPares([noticia(), ...anteriores]));
    expect(repetida.get('es/cbd-alivia-dolor-ensayo')?.join()).toMatch(/tema repetido/);
    const conPerspectiva = noticia((f) => `${f}\nperspectiva: 'Primer ensayo con placebo: antes sólo había una revisión general'`);
    expect(comprobarConjunto(conPares([conPerspectiva, ...anteriores])).get('es/cbd-alivia-dolor-ensayo')).toBeUndefined();
  });

  it('no deja publicar tres veces seguidas el mismo ángulo', () => {
    const anteriores = [vieja('otra-uno', 'ansiedad', 'ensayo-clinico', '2026-11-20'), vieja('otra-dos', 'sueno', 'ensayo-clinico', '2026-11-10')];
    expect(comprobarConjunto(conPares([noticia(), ...anteriores])).get('es/cbd-alivia-dolor-ensayo')?.join()).toMatch(/ángulo repetido/);
  });

  it('detecta duplicados por fuente y por titular', () => {
    const mismaFuente = { ...vieja('otra-uno', 'ansiedad', 'guia', '2026-11-20'), datos: { ...vieja('otra-uno', 'ansiedad', 'guia', '2026-11-20').datos, source: { name: 'x', url: 'https://doi.org/10.1000/ejemplo/' } } };
    expect(comprobarConjunto(conPares([noticia(), mismaFuente])).get('es/cbd-alivia-dolor-ensayo')?.join()).toMatch(/duplicada: la misma fuente/);
    expect(parecido('El CBD alivia el dolor en un ensayo con placebo', 'Un ensayo con placebo: el CBD alivia el dolor')).toBeGreaterThanOrEqual(0.6);
  });

  it('dice qué toca: temas vetados y ángulo recomendado', () => {
    const q = queToca([vieja('a-uno', 'sueno', 'guia', '2026-11-20'), vieja('a-dos', 'ansiedad', 'guia', '2026-11-10')]);
    expect(q.temasVetados).toEqual(['sueno', 'ansiedad']);
    expect(q.anguloVetado).toBe('guia');
    expect(q.anguloSugerido).not.toBe('guia');
  });
});
