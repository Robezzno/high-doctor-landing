# Metodología de noticias — High Doctor Foundation

Este documento es la **única norma** para publicar una noticia en
`https://highdoctor.foundation/noticias/` (español) y `/en/news/` (inglés).
Vale igual para una persona que para un agente de IA. Si algo de aquí choca con
otro documento, manda este.

Síguelo **en orden, de arriba abajo, sin saltarte pasos**. Casi todo lo que pide
lo comprueba una orden (`npm run noticias -- comprobar`): si esa orden dice
`ERROR`, la noticia no se publica hasta arreglarlo.

## Las 12 reglas que no se rompen nunca

1. **Nunca `git push` a `main`.** Siempre rama → PR → CI en verde → fusionar.
2. **Una noticia = un estudio o documento oficial que has abierto y leído.** Si no
   puedes abrir la fuente, no hay noticia.
3. **Cada cifra del texto está en la fuente.** No se redondea «a ojo», no se
   deduce, no se rellena de memoria.
4. **Nada de consejos médicos ni promesas.** Contamos lo que dice un estudio; no
   le decimos a nadie qué tomar, cuánto ni para qué.
5. **Sólo avances y descubrimientos prometedores**, contados con sus límites.
   Lo que deja mal al cannabis o perjudica a la fundación no va en este blog.
6. **No repetir tema.** Antes de escribir se mira qué se ha publicado.
7. **Toda noticia lleva foto real con licencia libre** de Wikimedia Commons, con
   su crédito. Nunca una imagen generada por IA. Nunca una foto «de internet».
8. **Todo texto del frontmatter va entre comillas simples.** Sin excepción.
9. **Siempre las dos versiones**, español e inglés, en el mismo PR.
10. **Sin publicidad ni enlaces de afiliado.** Esta web no los lleva.
11. **No se inventa nada**: ni URL, ni DOI, ni autores, ni fechas, ni citas.
12. **Ante la duda, no se publica.** Un día sin noticia no es un problema; una
    noticia falsa sí.

---

## 1. Qué es noticia aquí y qué no

High Doctor Foundation es una fundación independiente que explica el cannabis
con ciencia. **No vende nada.** Su valor es que la gente se fíe de ella. Cada
noticia tiene que dejar al lector pensando: «esta gente sabe de lo que habla y
no me engaña».

### Sí es noticia

| Tipo | Ejemplo |
|---|---|
| Ensayo clínico con resultado favorable | «El aceite de CBD alivia el dolor del síndrome de boca ardiente en un ensayo con placebo» |
| Descubrimiento de laboratorio prometedor | «Descubren un cannabinoide nuevo que potencia un tratamiento del cáncer de mama» |
| Datos de pacientes reales con buen resultado | «Dolor crónico y cannabis medicinal: dos años de seguimiento a 3.744 pacientes» |
| Revisión o informe oficial que aclara una duda | «Cannabinoides y sueño: en qué casos ayudan a dormir, según la evidencia» |
| Avance regulatorio (aprobación, acceso, norma que protege al paciente) | Un país autoriza un medicamento con cannabinoides |
| Explicador que enseña a leer la ciencia | «Cómo leer una noticia de salud sobre cannabis» |

### No es noticia (no se publica)

- **Resultados «en negativo»**: «el CBD no mejora…», «no funciona…», «no reduce…».
- **Temas de riesgo**, aunque el dato sea cierto: daño hepático, psicosis,
  adicción, accidentes, intoxicaciones. Tampoco en versión tranquilizadora
  («no aumenta el riesgo de…»): el tema sigue siendo el riesgo.
- **Prueba floja presentada como hallazgo**: encuestas, pósters de congreso,
  preprints sin revisar, notas de prensa de empresas, estudios de la marca que
  vende el producto.
- **Refritos**: una noticia de otro medio sin estudio detrás; algo que ya
  publicamos; un estudio de hace más de 12 meses presentado como novedad (un
  informe antiguo sólo vale como explicador, con el año en el texto).
- **Productos, marcas, tiendas, clubes, precios, ofertas.** Nunca.
- **Política de partidos, sucesos, famosos, opinión.**

> Caso real (28-nov-2026): se publicaron «El CBD no mejora la conducta grave en
> niños…» y «CBD y elevación de enzimas hepáticas…». Los dos estudios eran
> ciertos y serios, pero los dos van contra esta línea. Se retiraron. Un estudio
> verdadero no es por eso una noticia para este blog.

### Siempre a favor del proyecto

La meta de esta web es que el lector **confíe en la fundación, lea sus fichas de
evidencia y se una a la red**. Cada noticia tiene que empujar hacia ahí:

- **Elige temas que acerquen al lector a la fundación**: que le resuelvan una
  duda real sobre cannabis y salud y le dejen con ganas de saber más.
- **Enlaza hacia dentro**: si el tema tiene ficha de evidencia, pon el campo
  `evidencia` (sale sola una caja con la nota A–E y el enlace). La llamada final
  «Únete a la red» la pone la web sola en todas las noticias: **no la escribas a
  mano** ni añadas otras.
- **Nunca publiques algo que perjudique a la fundación**: hablar mal de ella o
  de su método, recomendar otra web u organización «mejor», desanimar a unirse,
  o dar a entender que el cannabis no merece estudiarse.
- **Veracidad primero.** No se miente ni se exagera para quedar bien. Si la
  única forma honrada de contar algo deja mal al proyecto, **esa noticia no se
  publica aquí**. No se maquilla: se elige otra.

| Bien | Mal |
|---|---|
| Ensayo con placebo que ve menos dolor, contado con su tamaño y sus límites | El mismo ensayo contado como «el CBD cura el dolor» (exagera) |
| «La revisión ve evidencia moderada; faltan ensayos largos» | «No hay pruebas de que sirva para nada» (en negativo) |
| Enlace a nuestra ficha de evidencia del tema | «Más información en [otra web divulgativa]» |

### Sin publicidad ni afiliados

Decisión de Saf: **esta web no lleva enlaces de afiliado, publicidad, contenido
patrocinado ni enlaces a tiendas.** La credibilidad de la fundación depende de
no vender nada. Los enlaces de una noticia van sólo a: la fuente primaria,
organismos oficiales y páginas de la propia web. Las URL van limpias, sin
`?tag=`, `?ref=`, `utm_…` ni acortadores. La orden de comprobación lo rechaza.

---

## 2. Variedad: no repetir tema (obligatorio y comprobable)

**Antes de buscar nada**, ejecuta:

```bash
npm run noticias -- lista
```

Muestra las últimas 10 noticias (fecha, categoría, ángulo, tema, titular), el
recuento por categoría y por ángulo, y un bloque **QUÉ TOCA AHORA** con lo que
está prohibido y lo que se recomienda. También lista todas las fuentes ya usadas.

Cada noticia declara dos campos en el frontmatter:

- `tema`: de qué va, en una o dos palabras en minúsculas con guiones
  (`sueno`, `dolor-cronico`, `epilepsia`, `cancer-mama`). Si el tema ya existe
  en la lista, **usa exactamente la misma palabra**.
- `angulo`: qué tipo de pieza es. Sólo valen estos siete:

| `angulo` | Qué es |
|---|---|
| `ensayo-clinico` | Ensayo en personas con grupo de comparación |
| `ciencia-basica` | Laboratorio, animales o mecanismo (todavía no en personas) |
| `datos-reales` | Registro u observación de pacientes reales, sin placebo |
| `revision` | Revisión, metaanálisis o informe de un organismo oficial |
| `regulacion` | Decisión de un regulador o cambio legal |
| `guia` | Explicador: cómo leer o entender algo |
| `fundacion` | Novedad de la propia fundación (sólo con datos que dé Saf) |

Reglas (las aplica `npm run noticias -- comprobar`; si fallan, es `ERROR`):

1. **Tema:** no puede coincidir con el `tema` de ninguna de las **6 últimas**
   noticias.
2. **Excepción:** se puede volver a un tema reciente sólo si el `angulo` es
   distinto del que tuvo **y** se añade el campo `perspectiva` explicando en una
   frase (30 caracteres o más) qué aporta de nuevo: otro público, otra pregunta,
   un caso práctico, una comparación o una novedad.
   Ejemplo: `perspectiva: 'Primer ensayo con placebo: hasta ahora sólo había una revisión general'`
3. **Ángulo:** no puede haber **tres seguidas** con el mismo `angulo`.
4. **Categoría:** como mucho **6 de las últimas 10** en la misma `category`.
5. **Duplicados:** ni la misma fuente (`source.url`) ni un titular casi igual que
   otro ya publicado.

Reparto que se busca a lo largo de 10 noticias: 3 `ensayo-clinico`,
2 `ciencia-basica`, 2 `datos-reales` o `revision`, 1 `regulacion`, 1 `guia` y 1
libre. Elige siempre el ángulo que la lista marca como **recomendado** si
encuentras una noticia buena de ese tipo.

---

## 3. Fuentes admitidas y cómo citarlas

### Sólo vale la fuente primaria

| Vale | Cómo se enlaza en `source.url` |
|---|---|
| Artículo en revista científica con revisión por pares | **Siempre su DOI**: `https://doi.org/10.xxxx/…` |
| Informe o decisión de un organismo oficial (OMS, EMA, AEMPS, FDA, NASEM, boletines oficiales) | La página exacta del documento, o su DOI si lo tiene |
| Nota de prensa de la universidad u hospital que hizo el estudio | Sólo como apoyo; la fuente sigue siendo el artículo |

**No valen como fuente:** otros medios y blogs (ni NORML, Leafly, medios
generalistas…), Wikipedia, redes sociales, notas de empresas, preprints,
resúmenes de congreso, y cualquier cosa que «recuerdes» sin haberla abierto.
Un medio puede servirte para *enterarte* de un estudio; luego hay que ir al
estudio.

### Dónde buscar

- PubMed: `https://pubmed.ncbi.nlm.nih.gov/?term=cannabidiol&sort=date` (cambia
  el término: `cannabinoids`, `medical cannabis`, `nabiximols`, más la dolencia).
- Organismos: `ema.europa.eu`, `aemps.gob.es`, `who.int`, `fda.gov`.

### Cómo sacar el DOI sin inventarlo

1. Abre la ficha del artículo en PubMed. El DOI está al final del resumen
   (`doi: 10.…`). **Cópialo y pégalo; nunca lo escribas de memoria.**
2. Comprueba que existe:

   ```bash
   curl -s "https://doi.org/api/handles/10.1001/jamainternmed.2025.2366" | head -c 80
   ```

   Tiene que empezar por `{"responseCode":1`. Si sale `100`, ese DOI no existe.
3. `source.url` es `https://doi.org/` + el DOI. `source.name` es el nombre de la
   revista u organismo, sin adornos.

> Caso real: una noticia salió con la URL
> `jamanetwork.com/…/fullarticle/20261122`. No existía: el número era la fecha.
> Con el DOI de PubMed no habría pasado. **Una URL que no has abierto es una URL
> inventada.**

### Cómo se cita en el texto

La última línea del cuerpo es siempre esta, con el enlace **a la misma URL** que
`source.url`:

```markdown
Esta noticia es divulgación, no consejo médico. Fuente: Apellido I. y cols., *Nombre de la revista*, 2026 ([doi:10.xxxx/yyyy](https://doi.org/10.xxxx/yyyy)).
```

En inglés:

```markdown
This article is science communication, not medical advice. Source: Surname I. et al., *Journal Name*, 2026 ([doi:10.xxxx/yyyy](https://doi.org/10.xxxx/yyyy)).
```

---

## 4. Verificar cada cifra

Trabaja con el **resumen (abstract) abierto delante**. Antes de escribir, apunta
estos datos copiándolos literalmente del resumen:

| Dato | De dónde sale |
|---|---|
| Tipo de estudio (ensayo aleatorizado, doble ciego, observacional, en ratas…) | Apartado *Design* / *Methods* |
| Cuántos participantes y quiénes (edad, dolencia) | *Participants* / *Results* |
| Qué se dio, cuánto y durante cuánto tiempo | *Intervention* |
| Qué se midió (resultado principal) | *Main outcome* |
| El resultado con su número | *Results* |
| Quién lo hizo (universidad, país) y en qué revista y año | Cabecera |

Reglas:

- **Si un dato no está en el resumen ni en el artículo, no va en la noticia.**
  Nada de «sin efectos adversos graves», «bien tolerado» o «los autores piden
  más estudios» si la fuente no lo dice.
- **Copia los números tal cual**, con su unidad. En español: coma decimal y
  punto de millar (`5,6 %`, `3.744 pacientes`). En inglés: `5.6%`, `3,744`.
- **No conviertas ni calcules** (mg/kg a mg, porcentajes a «uno de cada…») salvo
  que la fuente lo haga.
- **No confundas** duración del tratamiento con años en que se hizo el estudio,
  ni media con mediana, ni «participantes» con «pacientes del grupo tratado».
- **Dilo siempre:** si es en animales o en laboratorio, si no había placebo, si
  eran pocos participantes, si quien paga tiene interés.
- **Repaso final:** relee la noticia buscando cada número y cada nombre propio,
  y localiza cada uno en la fuente. Los que no encuentres, fuera. Haz lo mismo
  con la versión en inglés: las dos tienen que decir las mismas cifras.

---

## 5. Cautelas sanitarias

Escribimos sobre salud. Un error aquí puede hacer daño a una persona.

**Prohibido siempre:**

- Recomendar tomar, probar, comprar, dejar o cambiar algo. Ni dosis, ni pautas,
  ni marcas, ni «consulta a tu médico para valorar X» (eso también es un consejo).
- Prometer: «cura», «elimina», «garantiza», «sin efectos secundarios»,
  «100 % natural», «milagro», «el fin de…».
- Generalizar: de ratas a personas, de un medicamento concreto a «el cannabis»,
  de 26 pacientes a «los pacientes».
- Hablar de menores, embarazo o enfermedades graves (cáncer, epilepsia) en tono
  de solución. Con esos temas, doble prudencia y siempre el tipo de estudio en
  la primera frase.

**Obligatorio:**

- Verbos prudentes: «un ensayo ve», «apunta a», «sugiere», «se asoció con».
  Nunca «demuestra» ni «confirma» por un solo estudio.
- El apartado **«Cómo leerlo»** cuenta los límites con claridad.
- La frase final «Esta noticia es divulgación, no consejo médico.»
- En `category: salud` la web añade sola el aviso «Contenido informativo, no
  sustituye consejo médico». No lo escribas tú otra vez.

---

## 6. Estructura fija

Entre 300 y 600 palabras. Sin título `#` (sale del frontmatter). Para los
ángulos `ensayo-clinico`, `ciencia-basica`, `datos-reales` y `revision`, estos
cuatro apartados, **con este texto exacto y en este orden** (la comprobación lo
exige):

| Español | Inglés | Qué lleva |
|---|---|---|
| *(entrada, sin título)* | | 2–4 frases: qué problema es, quién ha hecho qué, dónde se publica y por dónde va el resultado. Con **negritas** en la dolencia y en la institución |
| `## Qué se hizo` | `## What was done` | Lista de 3 puntos: **Tipo de estudio:** · **Quién participó:** (o **Qué se revisó:**) · **Qué se midió:** |
| `## Qué descubrió` | `## What it found` | Lista de 2–4 resultados, cada uno con su cifra |
| `## Cómo leerlo` | `## How to read it` | Un párrafo con los límites, y debajo **una** frase destacada en una línea que empieza por `> ` |
| `## Por qué nos parece relevante` | `## Why it matters to us` | Un párrafo: qué cambia para el lector y qué queda por estudiar |
| *(línea final)* | | La frase de cautela y la cita con el enlace (apartado 3) |

Para `regulacion`, `guia` y `fundacion` los apartados son libres, pero hacen
falta al menos tres `## `, y la entrada y la línea final son las mismas.

Formato: Markdown normal. Listas con `- `. Negritas con `**`. Revistas en
`*cursiva*`. Una sola cita `> `. Nada de HTML, tablas, emojis ni imágenes dentro
del cuerpo.

---

## 7. Tono

Hablamos como alguien que sabe y lo explica en la mesa de un bar: claro, cercano,
sin jerga y sin vender nada. Frases cortas. Cada palabra técnica se explica la
primera vez, entre paréntesis o con una coma.

| Mal | Bien |
|---|---|
| «Un estudio revolucionario demuestra que el CBD cura el dolor» | «Un ensayo con placebo ve menos dolor con aceite de CBD» |
| «Se observó una reducción estadísticamente significativa en la escala EVA (p<0,05)» | «El dolor bajó de forma clara con el paso de las semanas; en el grupo placebo se quedó como estaba» |
| «Los pacientes deberían valorar esta alternativa con su médico» | «Un tratamiento bien tolerado que reduce el dolor merece estudiarse a fondo» |
| «El cannabis podría ser la solución al insomnio» | «La revisión ve mejor sueño a corto plazo cuando lo que quita el sueño es el dolor» |
| «Es importante destacar que, en este sentido, cabe señalar…» | *(se borra: no dice nada)* |
| «Un estudio en ratas abre la puerta a curar el estrés postraumático» | «En ratas, el CBD ayudó a "desaprender" el miedo. Falta verlo en personas» |

Además: nada de signos de exclamación, preguntas retóricas en cadena, «en
conclusión», «en resumen», ni frases sobre la propia fundación dentro del texto
(«la fundación no vende productos…»): eso ya lo dice la web.

---

## 8. Titulares, entradilla y SEO

**Titular (`title`, máximo 90 caracteres; mejor entre 50 y 75):**

- Dice **qué pasó y en qué tipo de estudio**: sustancia + efecto + dolencia +
  «en un ensayo con placebo» / «en ratas» / «según una revisión».
- En positivo, con verbo en presente. Sin «podría», sin dos puntos innecesarios,
  sin siglas raras, sin nombre de revista (no le dice nada al lector).
- Las palabras que alguien buscaría en Google van al principio.

| Mal | Bien |
|---|---|
| «CBD y elevación de enzimas hepáticas: un ensayo clínico en JAMA» | *(no se publica: es un tema de riesgo)* |
| «Nuevo estudio sobre cannabinoides» | «Descubren un cannabinoide nuevo que potencia un tratamiento del cáncer de mama» |
| «El cannabis cura el insomnio» | «Cannabinoides y sueño: en qué casos ayudan a dormir, según la evidencia» |

**Entradilla (`summary`, máximo 200; mejor entre 120 y 180):** una frase que
añade lo que no cabe en el titular: quién, cuántos, resultado. Es lo que sale en
Google, en el listado y al compartir. No repite el titular.

**Gancho (`instagramHook`, máximo 80):** el titular en corto, para la tarjeta.

**Nombre del fichero (slug):** 4–7 palabras clave en minúsculas, sin acentos, sin
artículos, con guiones. En español para `es/`, **en inglés para `en/`** (tienen
que ser distintos). Ejemplo: `cbd-sindrome-boca-ardiente-ensayo.md` y
`cbd-burning-mouth-syndrome-trial.md`. **No se cambia nunca después de publicar.**

**`translationKey`:** igual que el nombre del fichero en inglés.

**`tags`:** 3–5, en minúsculas, en el idioma de la versión. La primera, la
sustancia o el tema.

**`coverAlt`:** describe lo que se ve en la foto, no la noticia.

---

## 9. Frontmatter campo a campo

El frontmatter es el bloque entre las dos líneas `---` del principio del
fichero. Es YAML, y **YAML se rompe con facilidad**.

### Las reglas de YAML (aquí se rompió el despliegue dos veces)

1. **Todo valor de texto va entre comillas simples**: `title: 'Texto'`.
   Sin comillas, unos dos puntos dentro del texto (`CBD y sueño: qué dice…`)
   rompen el fichero entero.
2. **Un apóstrofo dentro del texto se escribe dos veces**:
   `title: 'What the evidence says and what it doesn''t'`. Mejor aún: evita el
   apóstrofo (`does not`).
3. **No uses comillas dobles `"` para envolver valores.** Dentro del texto, las
   comillas son las angulares: `«así»`.
4. **Sangría con dos espacios, nunca tabuladores.**
5. `instagram: 'off'` **siempre con comillas** (sin ellas, `off` significa «falso»).
6. **Sin comillas** van sólo: `date`, `lang`, `translationKey`, `category`,
   `tema`, `angulo`, `author`, `draft` y cada elemento de `tags` y `evidencia`.
7. Cada campo en su línea. No dejes campos vacíos: si no hay valor, quita el campo.

### Campos (todos obligatorios salvo los marcados)

| Campo | Valor | Regla |
|---|---|---|
| `title` | `'…'` | Máximo 90 caracteres |
| `summary` | `'…'` | Máximo 200 |
| `date` | `2026-11-28` | **La fecha de hoy.** Nunca futura. Igual en ES y EN |
| `lang` | `es` o `en` | El de la carpeta |
| `translationKey` | `cbd-burning-mouth-syndrome-trial` | En inglés, idéntico en ES y EN |
| `category` | una de 6 | `investigacion` (ciencia básica, registros), `salud` (ensayos en pacientes, guías), `legislacion`, `cultura`, `fundacion`, `eventos`. Igual en ES y EN |
| `tema` | `dolor-cronico` | Ver apartado 2. Igual en ES y EN |
| `angulo` | uno de 7 | Ver apartado 2. Igual en ES y EN |
| `perspectiva` | `'…'` | *Opcional.* Sólo si repites un tema reciente |
| `tags` | lista | 3–5 |
| `source` | `name: '…'` y `url: '…'` | Apartado 3. Misma URL en ES y EN |
| `cover` | `'../../../assets/news/<translationKey>.jpg'` | Exactamente esa ruta. El fichero tiene que existir |
| `coverAlt` | `'…'` | En el idioma de la versión |
| `coverCredit` | `autor`, `licencia`, `url` | Lo que imprime la orden `foto guardar`, sin tocar |
| `evidencia` | lista | *Opcional.* Sólo si el tema es uno de: `pain`, `nausea`, `ms`, `epilepsy`, `sleep`, `anxiety`, `cancer`, `psychosis`, `driving`, `pregnancy` |
| `author` | `bot` | `bot` si la escribe un agente; `equipo` si la escribe una persona |
| `instagram` | `'off'` | Siempre `'off'` salvo orden expresa de Saf |
| `instagramHook` | `'…'` | Máximo 80 |
| `grafico` | objeto | `cifra` (máx. 12: el número clave), `etiqueta` (máx. 70: qué es ese número) y `datos`: 1–3 filas `texto` (máx. 64). Una fila puede llevar `porcentaje: 62` (número sin comillas, de 0 a 100) y entonces se dibuja una barra |

### Plantilla (cópiala entera)

```markdown
---
title: 'El aceite de CBD alivia el dolor del síndrome de boca ardiente en un ensayo con placebo'
summary: 'Un ensayo de la Universidad Federal de Paraná (Brasil) ve menos dolor y mejor calidad de vida con aceite de CBD de espectro completo en una dolencia con pocas opciones de tratamiento.'
date: 2026-11-21
lang: es
translationKey: cbd-burning-mouth-syndrome-trial
category: salud
tema: boca-ardiente
angulo: ensayo-clinico
tags:
  - CBD
  - dolor crónico
  - ensayos clínicos
source:
  name: 'Oral Surgery, Oral Medicine, Oral Pathology and Oral Radiology'
  url: 'https://doi.org/10.1016/j.oooo.2026.07.010'
cover: '../../../assets/news/cbd-burning-mouth-syndrome-trial.jpg'
coverAlt: 'Investigador pipeteando muestras en un laboratorio'
coverCredit:
  autor: 'Aidar Turlanov'
  licencia: 'CC BY 4.0'
  url: 'https://commons.wikimedia.org/wiki/File:Precision_pipetting_in_biology_research.jpg'
evidencia:
  - pain
author: bot
instagram: 'off'
instagramHook: 'CBD contra el dolor de boca ardiente: lo que vio un ensayo con placebo'
grafico:
  cifra: '26'
  etiqueta: 'pacientes en un ensayo de aceite de CBD frente a placebo'
  datos:
    - texto: 'Menos dolor con CBD; el grupo placebo no cambió'
    - texto: 'Mejor calidad de vida oral'
    - texto: 'Ningún efecto adverso grave'
---

Entrada de 2–4 frases.

## Qué se hizo

- **Tipo de estudio:** …
- **Quién participó:** …
- **Qué se midió:** …

## Qué descubrió

- …
- …

## Cómo leerlo

Un párrafo con los límites.

> Una frase destacada.

## Por qué nos parece relevante

Un párrafo.

Esta noticia es divulgación, no consejo médico. Fuente: Parise G. K. y cols., *Oral Surg Oral Med Oral Pathol Oral Radiol*, 2026 ([doi:10.1016/j.oooo.2026.07.010](https://doi.org/10.1016/j.oooo.2026.07.010)).
```

La noticia completa de la que sale esta plantilla es el modelo a imitar:
`src/content/news/es/cbd-sindrome-boca-ardiente-ensayo.md` y su versión
`src/content/news/en/cbd-burning-mouth-syndrome-trial.md`.

---

## 10. Imagen

**Política:** toda noticia lleva **una fotografía real de Wikimedia Commons con
licencia libre**, acreditada bajo la foto. Sin foto no se publica.

**No se admiten imágenes generadas por IA** (tampoco con `~/bin/ia imagen`), ni
capturas, ni fotos de bancos de imágenes, de Google o de otros medios. Motivo:
esta web vive de que se la crea, y una foto «falsa» en una noticia de salud
resta más de lo que suma. Además, el pie de foto de la web está hecho para
créditos de Wikimedia Commons.

**Licencias que valen:** `CC0`, `Public domain`, `CC BY` y `CC BY-SA` (cualquier
versión). **No valen:** las que llevan `NC` (no comercial) o `ND` (sin obra
derivada), «fair use», «todos los derechos reservados» o licencia desconocida.

### Paso a paso

1. **Busca**, con 2–4 palabras **en inglés** que describan una *escena* (no el
   titular):

   ```bash
   npm run noticias -- foto buscar "laboratory pipette"
   ```

   Sólo lista fotos que ya cumplen: JPEG, horizontal, 1600 px o más de ancho y
   licencia admitida. Si no sale nada bueno, prueba palabras más generales.
   Búsquedas que casi siempre funcionan: `laboratory researcher`,
   `microscope laboratory`, `petri dish`, `cannabis plant greenhouse`,
   `hemp field`, `cannabis oil bottle`, `hospital corridor`, `pharmacy shelves`,
   `MRI scanner`, `doctor patient consultation`.

2. **Guarda** la elegida (el nombre `File:…` tal como sale en la lista):

   ```bash
   npm run noticias -- foto guardar "File:Precision pipetting in biology research.jpg" cbd-burning-mouth-syndrome-trial
   ```

   La deja en `src/assets/news/<translationKey>.jpg`, a 1600 px, y **escribe el
   bloque `cover` / `coverAlt` / `coverCredit` listo para pegar**. Pégalo tal
   cual en las dos versiones y cambia sólo `coverAlt` (en su idioma).

3. **Abre la imagen guardada y mírala.** Es obligatorio. Deséchala y busca otra si:
   - no tiene que ver con la noticia o es fea, oscura, borrosa o rara;
   - sale una persona reconocible como si fuera paciente, o un menor;
   - hay desnudos, gente fumando o consumiendo, marcas, envases comerciales,
     logotipos o texto grande;
   - es un cuadro, un dibujo, un mapa, un gráfico o un documento escaneado;
   - ya la usa otra noticia (mira la carpeta `src/assets/news/`).

4. Si Wikimedia responde «429» es que van demasiadas búsquedas seguidas: espera
   un minuto y repite.

Si tras cinco búsquedas no hay una foto digna, usa una de laboratorio o de
planta, que siempre vale. **Nunca** publiques sin foto ni con un `cover` que
apunte a un fichero que no existe: el build falla.

---

## 11. Versión en inglés

- Siempre en el mismo PR. Fichero en `src/content/news/en/`, con nombre **en
  inglés** y distinto del español.
- Idénticos en las dos: `date`, `translationKey`, `category`, `tema`, `angulo`,
  `source`, `cover`, `coverCredit`, `evidencia`, `author`, `instagram` y todas
  las **cifras**.
- Traducidos: `title`, `summary`, `tags`, `coverAlt`, `instagramHook`,
  `grafico` (etiqueta y textos) y el cuerpo, con los apartados en inglés del
  apartado 6.
- Inglés natural, no palabra por palabra. Números a la inglesa (`5.6%`,
  `3,744`). Ortografía británica o americana, pero la misma en todo el texto.
- `lang: en`.

---

## 12. Procedimiento exacto

Todo se hace en el servidor, dentro del repo. Copia y pega las órdenes; cambia
sólo lo que va en `<…>`.

```bash
# 0. Preparar
cd ~/repos/high-doctor-landing
export PATH="$HOME/.local/bin:$PATH"
git status --short            # tiene que salir vacío; si no, PARA y avisa
git checkout main
git pull github main          # GitHub es la referencia
npm ci
npm ci --prefix bot

# 1. Qué toca
npm run noticias -- lista

# 2. Buscar la noticia, abrir la fuente, apuntar las cifras (apartados 1 a 4)

# 3. Rama nueva (nunca se trabaja en main)
git checkout -b noticia/<translationKey>

# 4. Foto
npm run noticias -- foto buscar "<escena en inglés>"
npm run noticias -- foto guardar "File:<nombre>.jpg" <translationKey>
#    …y mirar la imagen guardada

# 5. Escribir los dos ficheros
#    src/content/news/es/<slug-en-español>.md
#    src/content/news/en/<slug-en-inglés>.md

# 6. Comprobar (tiene que acabar en «Todo correcto.»)
npm run noticias -- comprobar

# 7. Las mismas pruebas que pasa el CI (las tres tienen que acabar sin errores)
npm run check
npm test
npm run build

# 8. Subir SÓLO la noticia y su foto
git add src/content/news/es/<slug-es>.md src/content/news/en/<slug-en>.md src/assets/news/<translationKey>.jpg
git status --short            # sólo esos 3 ficheros, con «A»
git commit -m "noticia: <titular en español>"
git push -u github noticia/<translationKey>

# 9. PR y CI
gh pr create --base main --title "noticia: <titular en español>" --body "Fuente: <source.url>"
gh pr checks --watch          # espera a que TODO esté en verde

# 10. Fusionar (sólo con todo en verde)
gh pr merge --squash --delete-branch

# 11. Esperar al despliegue y verificar en producción
gh run watch "$(gh run list --workflow deploy.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
curl -s -o /dev/null -w "%{http_code}\n" https://highdoctor.foundation/noticias/<slug-es>/
curl -s -o /dev/null -w "%{http_code}\n" https://highdoctor.foundation/en/news/<slug-en>/
curl -s https://highdoctor.foundation/noticias/ | grep -c "<slug-es>"

# 12. Dejar el repo limpio
git checkout main
git pull github main
```

Las dos primeras órdenes del paso 11 tienen que dar `200` y la tercera un número
mayor que 0. Si no, la noticia **no está publicada**: dilo tal cual, no digas que
está hecha.

Normas del procedimiento:

- **Un PR por noticia, y sólo con esos tres ficheros.** No toques código, estilos,
  otras noticias ni documentación «de paso».
- **Si el CI sale en rojo:** lee el error (`gh pr checks`, y `gh run view --log-failed`),
  arréglalo en la misma rama, repite los pasos 6 a 8 y vuelve a subir. **Nunca
  fusiones en rojo ni con `--admin`.** A los tres intentos fallidos, cierra el PR
  (`gh pr close --delete-branch`) y avisa.
- **Mensajes de commit y PR:** en español, sin mencionar herramientas ni IA, sin
  líneas `Co-Authored-By`. Autor: el configurado en el repo.
- **Como mucho una noticia al día.**
- Cada fusión a `main` vuelve a publicar la web entera y lanza el flujo de
  Instagram: no hagas fusiones de más.

---

## 13. Checklist final (antes del PR)

Marca cada punto de verdad; si uno falla, no hay PR.

**Fuente y datos**
- [ ] He abierto la fuente primaria y es un artículo revisado o un documento oficial.
- [ ] `source.url` es el DOI (o la página oficial) y lo he comprobado.
- [ ] Cada cifra, nombre, institución y fecha del texto está en la fuente.
- [ ] Digo qué tipo de estudio es y sus límites.

**Línea editorial**
- [ ] Es un avance o descubrimiento prometedor, contado en positivo y sin exagerar.
- [ ] **Ayuda al proyecto:** acerca al lector a la fundación y no la perjudica
      (no la critica, no recomienda otra web, no desanima a unirse).
- [ ] No hay consejos médicos, dosis ni promesas.
- [ ] No hay publicidad, marcas, tiendas ni enlaces de afiliado.

**Variedad**
- [ ] He ejecutado `npm run noticias -- lista` y el tema no está en «PROHIBIDOS»
      (o cambio de ángulo y lo explico en `perspectiva`).
- [ ] Ni la fuente ni el titular repiten una noticia anterior.

**Forma**
- [ ] Estructura fija con los cuatro apartados y la línea final con el enlace.
- [ ] Frontmatter completo, con todos los textos entre comillas simples.
- [ ] Foto de Wikimedia Commons guardada con la orden, **mirada**, y con crédito.
- [ ] Versión en inglés con las mismas cifras y nombre de fichero en inglés.

**Órdenes (todas sin errores)**
- [ ] `npm run noticias -- comprobar` → «Todo correcto.»
- [ ] `npm run check`
- [ ] `npm test`
- [ ] `npm run build`

---

## 14. Cuándo NO publicar

Para, no publiques nada y di por qué, si pasa cualquiera de estas cosas:

- No encuentras una noticia que cumpla el apartado 1 **y** el 2. (Es normal: no
  todos los días hay una.)
- No puedes abrir la fuente primaria o el DOI no existe.
- Hay una cifra clave que no logras localizar en la fuente.
- El único ángulo honrado es negativo o de riesgo.
- El tema toca a menores, embarazo o una enfermedad grave y el estudio es flojo.
- No hay foto digna.
- `npm run noticias -- comprobar`, `check`, `test` o `build` fallan y no sabes
  arreglarlo sin tocar otra cosa que tu noticia.
- `git status` no sale limpio al empezar, o `main` no coincide con GitHub.
- Ya se ha publicado una noticia hoy.

Respuesta correcta en esos casos: «Hoy no publico: <motivo en una frase>».

---

## 15. Para quien mantiene esto

- Las reglas viven en `scripts/noticias-lib.mjs` (con tests en
  `scripts/noticias.test.ts`) y la orden en `scripts/noticias.mjs`. El CI de los
  PR (`.github/workflows/ci.yml`) ejecuta `npm run noticias -- comprobar --sin-red`.
- La comprobación es **estricta con las noticias nuevas** (ficheros que no están
  en `main`) y sólo avisa en las antiguas. `--todas` aplica lo estricto a todo.
- Retirar una noticia publicada: `draft: true` en sus dos versiones y PR. No se
  borra el fichero.
- El contrato técnico (esquema, rutas, tarjetas) sigue en `docs/CONTENIDO.md`.
