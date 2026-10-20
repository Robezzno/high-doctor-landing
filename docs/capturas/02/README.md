# Capturas — paso 1 y 2 del prompt 02 (assets de marca)

Estas capturas no son de la web (el rediseño es el paso 3), sino la verificación de
los assets generados en `src/assets/brand/`.

| Fichero | Qué enseña |
|---|---|
| `01-logo-texto-antes-despues.png` | Izquierda: `original/letraslogohigh.jpg` completo, con el fondo blanco y el «CSC». Derecha: `logo-text.png` recortado al logotipo, sin «CSC», con alfa real sobre papel crema. |
| `02-personaje-antes-despues.png` | Izquierda: `original/logo-character.png`, la captura con los cuadros pintados y el marco negro. Derecha: `logo-character.png` limpio sobre papel crema. |
| `03-logo-texto-svg-fidelidad.png` | PNG (referencia) · `logo-text.svg` rasterizado · mapa de diferencia. Sirve para juzgar si la vectorización es fiel. |
| `04-favicon-tamanos.png` | `favicon.svg` a 16, 32, 48, 64 y 180 px sobre crema y sobre azul marino. |
| `05-paleta.png` | Los hex muestreados con su proporción en el logo. |

## Números de la verificación

- Máscara alfa del logotipo frente al máster transparente
  (`~/Imágenes/high/HIGHDOCTOR LOGO LETTERS.png`): **IoU 0,991**.
- `logo-text.svg` rasterizado frente a `logo-text.png`: error medio **6,78/255**,
  mediana **0**, p90 14, p99 174 (el p99 son los bordes: desplazamiento de ~1 px).
  A media resolución (636 px) el error medio es 6,99 y la mediana 0.
- Verde de la estrella en el PNG final: **`(0, 182, 63)` = `#00B63F`**, exacto.
- Personaje: 33,4 % transparente, 65,2 % opaco, 0 huecos interiores, ningún píxel
  claro en el borde de la silueta (sin halo blanco sobre fondo oscuro).
- Regeneración determinista: volver a ejecutar `tools/build_brand_assets.py`
  produce ficheros idénticos (md5 comprobado).
