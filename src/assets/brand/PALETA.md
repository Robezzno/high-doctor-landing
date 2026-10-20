# Paleta de marca — valores muestreados

Todos los valores salen de medir los píxeles de los originales de
`src/assets/brand/original/`, no de aproximaciones. Método: conteo de colores
exactos (histograma) + percentiles de luminancia sobre las regiones de relleno,
con Python/PIL y NumPy; comprobación cruzada con ImageMagick (`convert -format %c histogram:info:`).

## Colores del logotipo (`original/letraslogohigh.jpg`, 1920×1080, fondo blanco)

| Hex | Nombre | Muestra | Dónde aparece |
|---|---|---|---|
| `#000C3C` | Azul marino | `(0, 12, 60)` — 53,4 % de los píxeles del logo | Contorno y cuerpo de las letras y del contorno de la estrella |
| `#00B63F` | Verde estrella | `(0, 182, 63)` — 0,8 % | Relleno de la estrella entre HIGH y DOCTOR |
| `#66778F` | Plata oscura | `(102, 119, 143)` | Zona alta del degradado cromado de las letras (L≈117) |
| `#95A0B1` | Plata media | `(149, 160, 177)` | Zona media del degradado (L≈159) |
| `#D9DCE3` | Plata clara | `(217, 220, 227)` | Zona baja del degradado (L≈220) |
| `#FFFFFF` | Blanco | `(255, 255, 255)` — 29,9 % | Base del degradado y huecos interiores de las letras |

El relleno de las letras es un degradado vertical por trazo (efecto cromado), de
`#66778F` a `#FFFFFF`. De ahí salen los tres pasos de plata: son los cortes de
luminancia que mejor reproducen ese degradado con una paleta plana.

## Color de la dirección de arte (no sale del logo)

| Hex | Nombre | Origen |
|---|---|---|
| `#F4EFE4` | Papel crema | `docs/prompts/02-identidad-visual.md`, sección «Dirección de arte» |
| `#0E2A1F` | Verde laboratorio | idem |

## Corrección a `docs/PLAN.md`

El plan daba dos aproximaciones que no coinciden con el original:

| En el plan | Valor real medido | Diferencia |
|---|---|---|
| `#0B1640` (azul marino) | `#000C3C` | el real no tiene rojo ni verde: es azul casi puro |
| `#1DB954` (verde estrella) | `#00B63F` | el real es más oscuro y más saturado (G 182 frente a 185, R 0) |

## Contraste WCAG (calculado, no estimado)

| Combinación | Ratio | Uso |
|---|---|---|
| `#000C3C` sobre `#F4EFE4` | 16,38:1 | Texto principal — AAA |
| `#F4EFE4` sobre `#0E2A1F` | 13,37:1 | Texto sobre sección oscura — AAA |
| `#000C3C` sobre `#FFFFFF` | 18,79:1 | Logo sobre blanco — AAA |
| `#00B63F` sobre `#000C3C` | 6,94:1 | Estrella/acento sobre azul marino — AA |
| `#00B63F` sobre `#0E2A1F` | 5,67:1 | Acento sobre verde laboratorio — AA |
| `#66778F` sobre `#F4EFE4` | 3,98:1 | Solo texto grande o elementos no textuales |
| `#00B63F` sobre `#F4EFE4` | 2,36:1 | **No usar como texto**: falla AA incluso en grande |

Regla práctica: el verde de la estrella es un color de *acento sobre fondo
oscuro*. Sobre papel crema no llega a 3:1, así que ahí va el azul marino y el
verde se reserva para rellenos, subrayados gruesos o el propio logo.

## Estado de los assets

| Fichero | Tamaño | Notas |
|---|---|---|
| `original/letraslogohigh.jpg` | 275.702 B | copia sin modificar del original |
| `original/logo-character.png` | 1.010.401 B | copia sin modificar (captura con cuadros y marco) |
| `original/logo-text.png` | 111.931 B | copia sin modificar (baja calidad, lienzo vacío abajo) |
| `logo-text.png` | 1272×471, 137 KB | alfa real, recortado, sin «CSC» |
| `logo-text.svg` | 73.370 B (20,4 KB gzip) | vectorizado con vtracer, paleta de 6 colores |
| `logo-character.png` | 888×871, 628 KB | alfa real, sin cuadros ni marco |
| `favicon.svg` | 342 B | estrella verde sobre azul marino, legible a 16 px |
| `favicon-32.png` / `apple-touch-icon.png` / `icon-512.png` | 32/180/512 px | `icon-512` con zona segura maskable |

Regeneración: `src/assets/brand/tools/build_brand_assets.py` (requiere
`pillow`, `numpy`, `scipy`, `vtracer`, `cairosvg`; después `optipng -o2` sobre los PNG).

## Origen de mayor calidad (opcional, pendiente de decisión)

En la máquina de Saf existe el máster del logotipo con transparencia real:

`/home/saf/Imágenes/high/HIGHDOCTOR LOGO LETTERS.png` — 2523×1272, RGBA.

Comparado con el recorte del JPG, la silueta coincide con un IoU de 0,99, así que
el resultado de este worktree es fiel. La única diferencia es el relleno: el máster
usa blanco plano y el JPG trae el degradado cromado. Si se prefiere el máster,
basta cambiar `SRC_JPG` en el script y volver a ejecutarlo.
