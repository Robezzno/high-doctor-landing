"""
Genera los assets de marca de src/assets/brand/ a partir de los originales
(assets/letraslogohigh.jpg, assets/logo-character.png, assets/logo-text.png).

Requiere: pillow, numpy, scipy, vtracer, cairosvg (mejor en un venv aparte).

  python build_brand_assets.py                 # escribe en src/assets/brand/
  optipng -o2 -quiet src/assets/brand/*.png    # comprime los PNG (opcional)

Es determinista: volver a ejecutarlo produce los mismos ficheros.
"""

import os
import re

import numpy as np
import vtracer
from PIL import Image
from scipy import ndimage

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
SRC_JPG = os.path.join(REPO, 'assets', 'letraslogohigh.jpg')
SRC_CHAR = os.path.join(REPO, 'assets', 'logo-character.png')
OUT = os.path.join(REPO, 'src', 'assets', 'brand')
TMP = os.path.join('/tmp', 'brand-build')

# --- paleta real del logotipo (muestreada del JPG) --------------------------------
NAVY = (0, 12, 60)        # #000C3C
GREEN = (0, 182, 63)      # #00B63F
SILVER_DARK = (102, 119, 143)   # #66778F
SILVER_MID = (149, 160, 177)    # #95A0B1
SILVER_LIGHT = (217, 220, 227)  # #D9DCE3
WHITE = (255, 255, 255)         # #FFFFFF
PALETTE = [NAVY, GREEN, SILVER_DARK, SILVER_MID, SILVER_LIGHT, WHITE]

# --- recortes de origen ----------------------------------------------------------
# letraslogohigh.jpg: 1920x1080, logotipo en x 379-1648 / y 241-709,
# "CSC" en x 881-1146 / y 730-880 (se descarta).
LOGO_CROP = (377, 239, 1651, 712)   # 2 px de margen
# logo-character.png: captura 1024x948 con marco negro (35 px dcha, 9 px abajo) y
# borde difuminado de 3 px: se recorta antes de limpiar el fondo de cuadros.
CHAR_FRAME = (0, 0, 986, 936)

ARITY = {'M': 2, 'L': 2, 'C': 6, 'S': 4, 'Q': 4, 'T': 2, 'H': 1, 'V': 1, 'Z': 0}


def ensure(*paths):
    for p in paths:
        os.makedirs(p, exist_ok=True)


# =============================== LOGOTIPO DE TEXTO ===============================

def logo_layers():
    """Devuelve (color RGB, alpha) del logotipo sin CSC, fondo blanco -> alpha real."""
    A = np.array(Image.open(SRC_JPG).convert('RGB')).astype(float)
    crop = A[LOGO_CROP[1]:LOGO_CROP[3], LOGO_CROP[0]:LOGO_CROP[2]]

    light = crop.min(axis=2) > 246            # blanco puro del fondo
    lbl, _ = ndimage.label(light)
    border = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
    border.discard(0)
    fg = ~np.isin(lbl, list(border))          # todo lo que no sea fondo exterior

    # alpha: rampa subpíxel desde el borde del fondo (el borde del JPG está suavizado)
    d = ndimage.distance_transform_edt(fg)
    alpha = ndimage.gaussian_filter(np.clip((d - 0.45) / 1.1, 0, 1), 0.45)
    alpha[fg & (d > 2)] = 1.0

    # des-premultiplicar: el JPEG original estaba compuesto sobre blanco
    a3 = alpha[..., None]
    safe = np.where(a3 < 0.06, 1.0, a3)
    col = np.clip((crop - (1 - a3) * 255.0) / safe, 0, 255)
    col = np.where(a3 < 0.06, 255.0, col)
    return col, alpha


def quantize(col):
    pal = np.array(PALETTE, dtype=float)
    px = col.reshape(-1, 3)
    idx = ((px[:, None, :] - pal[None, :, :]) ** 2).sum(axis=2).argmin(axis=1)
    return pal[idx].reshape(col.shape)


def tight_box(alpha, thr=0.02):
    ys, xs = np.where(alpha > thr)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def translate_d(d, dx, dy):
    if dx == 0 and dy == 0:
        return d
    tokens = re.findall(r'[A-Za-z]|-?[\d.]+(?:e-?\d+)?', d)
    out, i = [], 0
    while i < len(tokens):
        cmd = tokens[i]
        out.append(cmd)
        i += 1
        n = ARITY[cmd.upper()]
        params = [float(tokens[i + k]) for k in range(n)]
        i += n
        key = cmd.upper()
        if key in ('M', 'L', 'T'):
            params[0] += dx
            params[1] += dy
        elif key in ('C', 'S', 'Q'):
            for k in range(0, len(params), 2):
                params[k] += dx
                params[k + 1] += dy
        elif key == 'H':
            params[0] += dx
        elif key == 'V':
            params[0] += dy
        out.extend('%.1f' % v for v in params)
    return ' '.join(out)


def snap(hexcol):
    h = hexcol.lstrip('#')
    rgb = tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    return '#%02X%02X%02X' % min(PALETTE, key=lambda p: sum((a - b) ** 2 for a, b in zip(p, rgb)))


def tidy_svg(raw_svg, width, height):
    """Colores exactos de la paleta, translate() aplanado y paths del mismo color unidos."""
    tokens = re.findall(r'<path[^>]*/>', raw_svg)
    parts = re.split(r'<path[^>]*/>', raw_svg)
    runs = []
    for tok in tokens:
        fill = snap(re.search(r'fill="([^"]+)"', tok).group(1))
        d = re.search(r'\sd="([^"]+)"', tok).group(1)
        tr = re.search(r'translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)', tok)
        d = translate_d(d, float(tr.group(1)), float(tr.group(2))) if tr else d
        if runs and runs[-1][0] == fill:
            runs[-1][1].append(d)
        else:
            runs.append([fill, [d]])
    body = ''.join('<path fill="%s" d="%s"/>' % (f, ' '.join(ds)) for f, ds in runs)
    head = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" '
            'width="%d" height="%d" role="img" aria-label="HIGH DOCTOR">\n'
            % (width, height, width, height))
    return head + body + '\n</svg>\n'


# ================================ PERSONAJE =====================================

def character_layers(thr=228):
    A = np.array(Image.open(SRC_CHAR).convert('RGB')).astype(float)
    A = A[CHAR_FRAME[1]:CHAR_FRAME[3], CHAR_FRAME[0]:CHAR_FRAME[2]]

    light = A.min(axis=2) > thr              # cuadros pintados (242-255) y blancos
    lbl, _ = ndimage.label(light)
    border = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
    border.discard(0)
    bg = np.isin(lbl, list(border))
    fg = ~bg

    lblf, nf = ndimage.label(fg)
    sizes = ndimage.sum(fg, lblf, range(1, nf + 1))
    fg = np.isin(lblf, [i + 1 for i, s in enumerate(sizes) if s >= 60])

    d = ndimage.distance_transform_edt(fg)
    alpha = ndimage.gaussian_filter(np.clip((d - 0.45) / 1.35, 0, 1), 0.45)
    alpha[fg & (d > 2)] = 1.0

    a3 = alpha[..., None]
    safe = np.where(a3 < 0.06, 1.0, a3)
    col = np.clip((A - (1 - a3) * 255.0) / safe, 0, 255)

    # restos claros de cuadros en el borde -> transparentes
    alpha[(alpha > 0) & (alpha < 1) & (col.mean(axis=2) > 232)] = 0.0
    return col, alpha


# ================================= FAVICON ======================================

def star_path(cx, cy, r_out, r_in, rot=-90):
    pts = []
    for k in range(10):
        r = r_out if k % 2 == 0 else r_in
        a = np.deg2rad(rot + k * 36)
        pts.append((cx + r * np.cos(a), cy + r * np.sin(a)))
    return 'M' + ' L'.join('%.2f %.2f' % p for p in pts) + ' Z'


def favicon_svg(rounded=True, size=64, star_scale=1.0):
    # estrella "gorda" (r_in = 0.5 r_out) para que se lea a 16 px
    r_out = 25.5 * star_scale
    star = star_path(size / 2, size / 2 + 1.5, r_out, r_out * 0.5)
    rx = 12 if rounded else 0
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
        'role="img" aria-label="HIGH DOCTOR">\n'
        '  <rect width="%d" height="%d" rx="%d" fill="#000C3C"/>\n'
        '  <path fill="#00B63F" d="%s"/>\n'
        '</svg>\n' % (size, size, size, size, size, size, rx, star)
    )


# ================================== MAIN ========================================

def main():
    ensure(OUT, TMP)
    report = {}

    # ---- 1. logotipo de texto
    col, alpha = logo_layers()
    box = tight_box(alpha)
    png = np.dstack([col, alpha * 255]).astype('uint8')
    logo_png = Image.fromarray(png, 'RGBA').crop(box)
    logo_png.save(os.path.join(OUT, 'logo-text.png'), optimize=True)
    report['logo-text.png'] = logo_png.size

    quant = np.dstack([quantize(col), alpha * 255]).astype('uint8')
    qim = Image.fromarray(quant, 'RGBA').crop(box)
    qpath = os.path.join(TMP, 'logo-quant.png')
    qim.save(qpath)

    raw_svg = os.path.join(TMP, 'logo-raw.svg')
    vtracer.convert_image_to_svg_py(
        qpath, raw_svg, colormode='color', hierarchical='stacked', mode='spline',
        filter_speckle=20, color_precision=8, layer_difference=12,
        corner_threshold=60, length_threshold=8.0, max_iterations=10,
        splice_threshold=45, path_precision=1)
    svg = tidy_svg(open(raw_svg).read(), *logo_png.size)
    open(os.path.join(OUT, 'logo-text.svg'), 'w').write(svg)
    report['logo-text.svg'] = len(svg)

    # ---- 2. personaje
    ccol, calpha = character_layers()
    cbox = tight_box(calpha)
    cpng = np.dstack([ccol, calpha * 255]).astype('uint8')
    char_png = Image.fromarray(cpng, 'RGBA').crop(cbox)
    char_png.save(os.path.join(OUT, 'logo-character.png'), optimize=True)
    report['logo-character.png'] = char_png.size

    # ---- 3. favicon
    open(os.path.join(OUT, 'favicon.svg'), 'w').write(favicon_svg(rounded=True))
    import cairosvg
    variants = {
        'favicon-32.png': (32, favicon_svg(rounded=True)),
        'apple-touch-icon.png': (180, favicon_svg(rounded=False, star_scale=0.9)),
        'icon-512.png': (512, favicon_svg(rounded=False, star_scale=0.8)),  # maskable safe zone
    }
    for name, (px, svg_src) in variants.items():
        cairosvg.svg2png(bytestring=svg_src.encode(), write_to=os.path.join(OUT, name),
                         output_width=px, output_height=px)
        report[name] = (px, px)

    for k, v in report.items():
        print('  %-22s %s' % (k, v))


if __name__ == '__main__':
    main()
