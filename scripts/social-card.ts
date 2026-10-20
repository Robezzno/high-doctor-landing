/**
 * Generador de tarjetas sociales del blog.
 *
 * Produce, a partir de los datos de un post, dos piezas con la misma plantilla:
 * - `renderSocialCard()` → JPEG 1080×1350 (vertical de Instagram, calidad 88, < 1 MB).
 * - `renderOgImage()`    → PNG 1200×630 (Open Graph / X).
 *
 * Se usa desde los endpoints estáticos de Astro
 * (`src/pages/social/[lang]/[slug].jpg.ts` y `src/pages/og/[lang]/[slug].png.ts`),
 * así que las imágenes acaban en `dist/` y se publican con la web.
 *
 * Dibujo: Satori (HTML+CSS → SVG) → resvg (SVG → PNG) → sharp (PNG → JPEG sRGB).
 * Sin imágenes de terceros. Toda la identidad visual está en `SOCIAL_THEME`,
 * `CATEGORY_PALETTES` y `FONTS`: el prompt 02 (identidad visual) sólo tiene que
 * cambiar esos valores.
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import sharp from 'sharp';

/* ------------------------------------------------------------------ */
/* Identidad visual (parametrizada)                                    */
/* ------------------------------------------------------------------ */

/**
 * Paleta de la tarjeta. Valores aproximados tomados del logo actual; el prompt
 * 02 los sustituirá por los definitivos. Cambiar aquí cambia todas las tarjetas.
 */
export const SOCIAL_THEME = {
  paper: '#F4EFE4',
  ink: '#0B1640',
  green: '#1DB954',
  deepGreen: '#0A2E1F',
  gold: '#D4AF37',
  mutedOnLight: 'rgba(11, 22, 64, 0.55)',
  mutedOnDark: 'rgba(244, 239, 228, 0.6)',
  ruleOnLight: 'rgba(11, 22, 64, 0.18)',
  ruleOnDark: 'rgba(244, 239, 228, 0.22)',
  site: 'highdoctor.foundation',
} as const;

/** Una paleta concreta: fondo, tinta, acento y colores auxiliares. */
export interface CardPalette {
  bg: string;
  ink: string;
  accent: string;
  muted: string;
  rule: string;
}

const LIGHT_PALETTE = (accent: string = SOCIAL_THEME.green): CardPalette => ({
  bg: SOCIAL_THEME.paper,
  ink: SOCIAL_THEME.ink,
  accent,
  muted: SOCIAL_THEME.mutedOnLight,
  rule: SOCIAL_THEME.ruleOnLight,
});

const DARK_PALETTE = (bg: string = SOCIAL_THEME.ink): CardPalette => ({
  bg,
  ink: SOCIAL_THEME.paper,
  accent: SOCIAL_THEME.green,
  muted: SOCIAL_THEME.mutedOnDark,
  rule: SOCIAL_THEME.ruleOnDark,
});

/**
 * Fondo según la categoría del post: papel crema para las categorías
 * editoriales, verde oscuro para salud e investigación, azul marino para
 * cultura y eventos.
 */
export const CATEGORY_PALETTES: Record<string, CardPalette> = {
  investigacion: DARK_PALETTE(SOCIAL_THEME.ink),
  salud: DARK_PALETTE(SOCIAL_THEME.deepGreen),
  legislacion: LIGHT_PALETTE(SOCIAL_THEME.ink),
  cultura: DARK_PALETTE(SOCIAL_THEME.ink),
  fundacion: LIGHT_PALETTE(SOCIAL_THEME.green),
  eventos: { ...DARK_PALETTE(SOCIAL_THEME.deepGreen), accent: SOCIAL_THEME.gold },
};

/** Paleta de reserva: papel crema con acento verde. */
export const DEFAULT_PALETTE: CardPalette = LIGHT_PALETTE();

/**
 * Tipografías: se cargan como buffer desde `@fontsource` (nada de red en el build).
 * El prompt 02 confirmará la pareja definitiva; basta con cambiar estos archivos.
 */
export const FONTS = {
  serif: {
    family: 'Fraunces',
    files: [
      { weight: 500, file: 'fraunces/files/fraunces-latin-500-normal.woff' },
      { weight: 700, file: 'fraunces/files/fraunces-latin-700-normal.woff' },
    ],
  },
  mono: {
    family: 'JetBrains Mono',
    files: [
      { weight: 400, file: 'jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff' },
      { weight: 500, file: 'jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff' },
    ],
  },
} as const;

/**
 * Personaje de marca en la esquina. El logo actual (`logo-character.png`) es una
 * captura con fondo de cuadros, así que se deja desactivado a propósito hasta que
 * el prompt 02 entregue el SVG limpio: se pasa como data URI y Satori lo pinta.
 */
export const CHARACTER_DATA_URI: string | undefined = undefined;

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

/** Datos mínimos que necesita la plantilla. */
export interface CardContent {
  lang: 'es' | 'en';
  slug: string;
  title: string;
  /** Frase gancho (`instagramHook`). Si falta se usa el título. */
  hook?: string;
  category: string;
  date: Date;
}

export const SOCIAL_CARD_SIZE = { width: 1080, height: 1350 } as const;
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Calidad del JPEG de Instagram. */
export const JPEG_QUALITY = 88;

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

type Node = { type: string; props: Record<string, unknown> };

/** Azúcar para escribir el árbol que consume Satori sin JSX. */
function h(
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extraProps: Record<string, unknown> = {},
): Node {
  return { type, props: { style, children, ...extraProps } };
}

function paletteFor(category: string): CardPalette {
  return CATEGORY_PALETTES[category] ?? DEFAULT_PALETTE;
}

function hookFor(content: CardContent): string {
  const text = (content.hook ?? content.title).trim();
  return text;
}

/** Tamaño del gancho según su longitud, para que quepa siempre. */
function hookFontSize(text: string, variant: 'social' | 'og'): number {
  const length = text.length;
  if (variant === 'og') {
    if (length <= 34) return 62;
    if (length <= 52) return 54;
    if (length <= 70) return 46;
    return 40;
  }
  if (length <= 30) return 104;
  if (length <= 44) return 92;
  if (length <= 60) return 80;
  if (length <= 76) return 70;
  return 62;
}

const CATEGORY_LABELS: Record<string, { es: string; en: string }> = {
  investigacion: { es: 'Investigación', en: 'Research' },
  salud: { es: 'Salud', en: 'Health' },
  legislacion: { es: 'Legislación', en: 'Legislation' },
  cultura: { es: 'Cultura', en: 'Culture' },
  fundacion: { es: 'Fundación', en: 'Foundation' },
  eventos: { es: 'Eventos', en: 'Events' },
};

/** Etiqueta de espécimen: la categoría en mayúsculas, en el idioma del post. */
export function categoryLabelFor(category: string, lang: 'es' | 'en'): string {
  return CATEGORY_LABELS[category]?.[lang] ?? category.replace(/-/g, ' ');
}

/** Fecha corta y neutra (2026·10·01), independiente del idioma. */
function formatCardDate(date: Date): string {
  const iso = date.toISOString().slice(0, 10);
  return iso.replace(/-/g, '·');
}

/* ------------------------------------------------------------------ */
/* Fuentes                                                             */
/* ------------------------------------------------------------------ */

type LoadedFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 700;
  style: 'normal';
};

let fontsPromise: Promise<LoadedFont[]> | undefined;

/** Localiza un fichero de `@fontsource` sin depender de cómo se empaquete el script. */
function resolveFontPath(file: string): string {
  const request = `@fontsource/${file}`;
  try {
    const require = createRequire(import.meta.url);
    return require.resolve(request);
  } catch {
    return join(process.cwd(), 'node_modules', request);
  }
}

/** Carga (una sola vez por proceso) las fuentes como buffer. */
export function loadFonts(): Promise<LoadedFont[]> {
  fontsPromise ??= (async () => {
    const fonts: LoadedFont[] = [];
    for (const group of [FONTS.serif, FONTS.mono]) {
      for (const { weight, file } of group.files) {
        const buffer = await readFile(resolveFontPath(file));
        fonts.push({
          name: group.family,
          data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
          weight,
          style: 'normal',
        });
      }
    }
    return fonts;
  })();

  return fontsPromise;
}

/* ------------------------------------------------------------------ */
/* Piezas decorativas                                                  */
/* ------------------------------------------------------------------ */

/**
 * Molécula de línea decorativa: un anillo aromático con dos cadenas laterales.
 * Se construye como SVG en data URI porque Satori no dibuja SVG en línea, pero
 * sí incrusta imágenes `data:` (y resvg las rasteriza sin fuentes externas).
 */
function moleculeSvg(palette: CardPalette): string {
  const center = [150, 150] as const;
  const radius = 70;
  const ring = Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (-90 + index * 60);
    return [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)] as const;
  });

  const bond = (from: readonly [number, number], to: readonly [number, number]) =>
    `<line x1="${from[0].toFixed(1)}" y1="${from[1].toFixed(1)}" x2="${to[0].toFixed(1)}" y2="${to[1].toFixed(1)}" />`;

  /** Segundo trazo interior del doble enlace: mismo segmento desplazado al centro. */
  const innerBond = (from: readonly [number, number], to: readonly [number, number], shift = 0.16) => {
    const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2] as const;
    const towards = [
      center[0] + (mid[0] - center[0]) * (1 - shift),
      center[1] + (mid[1] - center[1]) * (1 - shift),
    ] as const;
    const delta = [to[0] - from[0], to[1] - from[1]] as const;
    const scale = 0.72;
    return bond(
      [towards[0] - (delta[0] * scale) / 2, towards[1] - (delta[1] * scale) / 2],
      [towards[0] + (delta[0] * scale) / 2, towards[1] + (delta[1] * scale) / 2],
    );
  };

  const chains = [
    bond(ring[1], [262, 96]),
    bond([262, 96], [300, 62]),
    bond(ring[3], [150, 272]),
    bond(ring[4], [44, 208]),
  ];

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 300" width="330" height="300">',
    `<g fill="none" stroke="${palette.accent}" stroke-width="2.6" stroke-linecap="round" opacity="0.85">`,
    ...ring.map((point, index) => bond(point, ring[(index + 1) % ring.length])),
    innerBond(ring[1], ring[2]),
    innerBond(ring[3], ring[4]),
    innerBond(ring[5], ring[0]),
    ...chains,
    '</g>',
    `<circle cx="300" cy="62" r="9" fill="${palette.accent}" opacity="0.85" />`,
    `<circle cx="150" cy="272" r="10" fill="none" stroke="${palette.accent}" stroke-width="2.6" opacity="0.85" />`,
    `<circle cx="44" cy="208" r="14" fill="none" stroke="${palette.accent}" stroke-width="2.6" opacity="0.85" />`,
    '</svg>',
  ].join('');
}

/** Nodo `<img>` con la molécula, ya escalada al ancho pedido. */
function molecule(palette: CardPalette, width: number): Node {
  const height = Math.round((width * 300) / 330);
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(moleculeSvg(palette)).toString('base64')}`;
  return h('img', { width, height, flexShrink: 0 }, undefined, { src: dataUri });
}

/** Fila superior: etiqueta de espécimen + idioma. */
function specimenRow(
  content: CardContent,
  palette: CardPalette,
  variant: 'social' | 'og',
  sideMargin: number,
): Node {
  const labelSize = variant === 'og' ? 15 : 22;
  const label = categoryLabelFor(content.category, content.lang).toUpperCase();

  return h(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginLeft: sideMargin,
      marginRight: sideMargin,
    },
    [
      h(
        'div',
        { display: 'flex', alignItems: 'center', gap: variant === 'og' ? 10 : 14 },
        [
          h('div', {
            width: variant === 'og' ? 8 : 11,
            height: variant === 'og' ? 8 : 11,
            borderRadius: '50%',
            backgroundColor: palette.accent,
          }),
          h(
            'div',
            {
              fontFamily: FONTS.mono.family,
              fontWeight: 500,
              fontSize: labelSize,
              letterSpacing: variant === 'og' ? 2.4 : 3.6,
              color: palette.accent,
              textTransform: 'uppercase',
            },
            label,
          ),
        ],
      ),
      h(
        'div',
        {
          fontFamily: FONTS.mono.family,
          fontWeight: 400,
          fontSize: variant === 'og' ? 13 : 17,
          letterSpacing: variant === 'og' ? 1.6 : 2.2,
          color: palette.muted,
          textTransform: 'uppercase',
        },
        `High Doctor Foundation · ${content.lang.toUpperCase()}`,
      ),
    ],
  );
}

/** Pie inferior: dominio en mono + fecha. */
function footerRow(
  content: CardContent,
  palette: CardPalette,
  variant: 'social' | 'og',
  sideMargin: number,
): Node {
  return h(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginLeft: sideMargin,
      marginRight: sideMargin,
      borderTop: `1px solid ${palette.rule}`,
      paddingTop: variant === 'og' ? 14 : 24,
      marginBottom: variant === 'og' ? 56 : 84,
    },
    [
      h(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        },
        [
          CHARACTER_DATA_URI
            ? h('img', { width: variant === 'og' ? 34 : 44, height: variant === 'og' ? 34 : 44 }, undefined, {
                src: CHARACTER_DATA_URI,
              })
            : null,
          h(
            'div',
            {
              fontFamily: FONTS.mono.family,
              fontWeight: 500,
              fontSize: variant === 'og' ? 16 : 24,
              letterSpacing: variant === 'og' ? 1 : 1.4,
              color: palette.ink,
            },
            SOCIAL_THEME.site,
          ),
        ],
      ),
      h(
        'div',
        {
          fontFamily: FONTS.mono.family,
          fontWeight: 400,
          fontSize: variant === 'og' ? 16 : 24,
          letterSpacing: variant === 'og' ? 1 : 1.4,
          color: palette.muted,
        },
        formatCardDate(content.date),
      ),
    ],
  );
}

/* ------------------------------------------------------------------ */
/* Plantilla                                                           */
/* ------------------------------------------------------------------ */

function buildMarkup(content: CardContent, variant: 'social' | 'og'): Node {
  const palette = paletteFor(content.category);
  const hook = hookFor(content);
  const fontSize = hookFontSize(hook, variant);
  const width = variant === 'og' ? OG_SIZE.width : SOCIAL_CARD_SIZE.width;
  const height = variant === 'og' ? OG_SIZE.height : SOCIAL_CARD_SIZE.height;
  const padding = variant === 'og' ? 56 : 84;
  const gap = variant === 'og' ? 28 : 40;

  // Satori no aplica `box-sizing: border-box` ni reparte bien el `padding`
  // horizontal entre los hijos, así que el margen de la plantilla (el aire de los
  // bordes) se resuelve con márgenes explícitos en cada fila.
  return h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      width,
      height,
      backgroundColor: palette.bg,
    },
    [
      h('div', { marginTop: variant === 'og' ? 48 : 84 }, specimenRow(content, palette, variant, padding)),
      h(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flex: 1,
          gap,
          marginLeft: padding,
          marginRight: padding,
        },
        [
          h(
            'div',
            {
              fontFamily: FONTS.serif.family,
              fontWeight: 700,
              fontSize,
              lineHeight: variant === 'og' ? 1.12 : 1.06,
              letterSpacing: -0.02 * fontSize,
              color: palette.ink,
            },
            hook,
          ),
          h(
            'div',
            {
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 24,
            },
            [
              h(
                'div',
                {
                  fontFamily: FONTS.mono.family,
                  fontWeight: 400,
                  fontSize: variant === 'og' ? 14 : 20,
                  letterSpacing: variant === 'og' ? 1.4 : 2,
                  lineHeight: 1.4,
                  color: palette.muted,
                },
                content.lang === 'es'
                  ? 'Investigación · Educación · Cultura'
                  : 'Research · Education · Culture',
              ),
              molecule(palette, variant === 'og' ? 190 : 300),
            ],
          ),
        ],
      ),
      footerRow(content, palette, variant, padding),
    ],
  );
}

async function renderSvg(content: CardContent, variant: 'social' | 'og'): Promise<string> {
  const fonts = await loadFonts();
  const size = variant === 'og' ? OG_SIZE : SOCIAL_CARD_SIZE;
  return satori(buildMarkup(content, variant) as never, {
    width: size.width,
    height: size.height,
    fonts: fonts as never,
  });
}

function svgToPng(svg: string, width: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: 'transparent',
  });
  return Buffer.from(resvg.render().asPng());
}

/** Tarjeta vertical de Instagram: JPEG 1080×1350 sRGB, calidad 88. */
export async function renderSocialCard(content: CardContent): Promise<Buffer> {
  const svg = await renderSvg(content, 'social');
  const png = svgToPng(svg, SOCIAL_CARD_SIZE.width);

  return sharp(png)
    .toColourspace('srgb')
    .jpeg({
      quality: JPEG_QUALITY,
      chromaSubsampling: '4:4:4',
      mozjpeg: true,
    })
    .toBuffer();
}

/** Imagen Open Graph: PNG 1200×630. */
export async function renderOgImage(content: CardContent): Promise<Buffer> {
  const svg = await renderSvg(content, 'og');
  return svgToPng(svg, OG_SIZE.width);
}
