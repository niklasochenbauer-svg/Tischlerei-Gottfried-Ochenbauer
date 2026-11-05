"""Favicons: Bildmarke groß und bei kleinen Größen kräftiger, damit sie im Tab und bei Google erkennbar bleibt."""
import runpy, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

SRC, OUT = sys.argv[1], Path(sys.argv[2])
g = runpy.run_path(str(Path(__file__).with_name('logo_build.py')), run_name='lib') if False else None
sys.argv = ['logo_build.py', SRC, str(OUT / '_tmp')]
g = runpy.run_path(str(Path(__file__).with_name('logo_build.py')))
swoosh_a, is_gold, layer, bbox = g['swoosh_a'], g['is_gold'], g['layer'], g['bbox']
CREAM, GOLD_ON_DARK, DARK_BG = g['CREAM'], g['GOLD_ON_DARK'], g['DARK_BG']

def mark(weight):
    a = swoosh_a
    if weight:
        a = ndimage.grey_dilation(a, size=(weight, weight))
    im = Image.fromarray(layer(a, ndimage.binary_dilation(is_gold, iterations=weight), CREAM, GOLD_ON_DARK))
    return im.crop(bbox(a))

def icon(size, weight, pad, radius=0.0):
    m = mark(weight)
    S = size * 8                               # erst groß zeichnen, dann verkleinern (saubere Kanten)
    canvas = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    bg = Image.new('L', (S, S), 0)
    ImageDraw.Draw(bg).rounded_rectangle([0, 0, S - 1, S - 1], radius=round(S * radius), fill=255)
    canvas.paste(Image.new('RGBA', (S, S), DARK_BG + (255,)), (0, 0), bg)
    w = S - 2 * round(S * pad)
    sm = m.resize((w, round(m.height * w / m.width)), Image.LANCZOS)
    canvas.alpha_composite(sm, ((S - sm.width) // 2, (S - sm.height) // 2))
    return canvas.resize((size, size), Image.LANCZOS)

OUT.mkdir(exist_ok=True)
# Klein: kräftiger, wenig Rand, leicht gerundet (Browser-Tab)
i16, i32, i48 = icon(16, 45, 0.04, 0.18), icon(32, 30, 0.06, 0.18), icon(48, 22, 0.08, 0.18)
i16.save(OUT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=[i32, i48])
i32.save(OUT / 'icon-32.png', optimize=True)
i48.save(OUT / 'icon-48.png', optimize=True)
# Groß: quadratisch, volle Fläche (Google schneidet rund zu, Android maskiert)
for size, name in [(192, 'icon-192.png'), (512, 'icon-512.png'), (180, 'apple-touch-icon.png')]:
    icon(size, 10, 0.12).convert('RGB').save(OUT / name, optimize=True)
print('ok')
