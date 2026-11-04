"""Firmenlogo Ochenbauer: Ebenen trennen, Kontaktzeilen entfernen, Varianten erzeugen."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

DARK = np.array([69, 54, 35], float)      # Dunkelbraun aus dem Logo
GOLD = np.array([151, 110, 46], float)    # Gold aus dem Logo
CREAM = np.array([240, 228, 208], float)  # --on-dark der Website (Negativ-Variante)
HONEY = np.array([232, 201, 155], float)  # --wood-honey
DARK_BG = (26, 13, 6)                     # --bg-darkest
# Gold auf Dunkel etwas aufgehellt, damit auch der kleine Schriftzug lesbar bleibt (Kontrast > 4.5:1)
GOLD_ON_DARK = GOLD * 0.6 + HONEY * 0.4

px = np.asarray(Image.open(SRC).convert('RGB'), float)
r, g, b = px[..., 0], px[..., 1], px[..., 2]
# Deckkraft aus dem Grünkanal, Farbe über das Verhältnis Chroma/Deckung
cover = np.clip(255 - g, 0, None)
ratio = np.where(cover > 4, (r - b) / np.maximum(cover, 1), 0)
is_gold = ratio > 0.45
alpha = np.where(is_gold, cover / (255 - GOLD[1]), cover / (255 - DARK[1]))
alpha = np.clip(alpha, 0, 1)
alpha[cover < 6] = 0

# Zusammenhängende Flächen: große = Bögen, oben = Name, darunter = Kontaktzeilen
labels, n = ndimage.label(alpha > 0.15)
sizes = ndimage.sum(np.ones_like(alpha), labels, range(1, n + 1))
boxes = ndimage.find_objects(labels)
swoosh = np.zeros(alpha.shape, bool)
name = np.zeros(alpha.shape, bool)
for i, (sz, box) in enumerate(zip(sizes, boxes), start=1):
    ys, xs = box
    if sz > 40000:
        swoosh |= labels == i
    elif ys.stop < 640:
        name |= labels == i
# Antialias-Saum (unter der Schwelle) der jeweiligen Ebene zuordnen
grow = lambda m: ndimage.binary_dilation(m, iterations=3)
swoosh_a = np.where(grow(swoosh), alpha, 0)
name_a = np.where(grow(name) & ~grow(swoosh), alpha, 0)

def layer(a, mask_gold, dark_rgb, gold_rgb):
    rgb = np.where(mask_gold[..., None], gold_rgb, dark_rgb)
    return np.dstack([rgb, a * 255]).astype(np.uint8)

def bbox(a):
    ys, xs = np.nonzero(a > 0.02)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def compose(dy, dark_rgb, gold_rgb):
    """Bögen + Name (um dy nach unten in die optische Mitte des Ovals gerückt)."""
    name_shift = np.roll(name_a, dy, axis=0)
    gold_shift = np.roll(is_gold, dy, axis=0)
    base = Image.fromarray(layer(swoosh_a, is_gold, dark_rgb, gold_rgb))
    top = Image.fromarray(layer(name_shift, gold_shift, dark_rgb, gold_rgb))
    base.alpha_composite(top)
    a = np.asarray(base)[..., 3] / 255
    return base.crop(bbox(a))

def fit(im, width):
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)

def on_bg(im, bg, size, pad):
    canvas = Image.new('RGBA', size, bg + (255,))
    scale = min((size[0] - 2 * pad) / im.width, (size[1] - 2 * pad) / im.height)
    sm = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    canvas.alpha_composite(sm, ((size[0] - sm.width) // 2, (size[1] - sm.height) // 2))
    return canvas

DY = int(sys.argv[3]) if len(sys.argv) > 3 else 120
full = compose(DY, DARK, GOLD)
full_neg = compose(DY, CREAM, GOLD_ON_DARK)

# Originalfarben: transparent und auf Weiß (für Verzeichnisse, Google, Druck)
fit(full, 1600).save(OUT / 'logo-ochenbauer.png', optimize=True)
white = Image.new('RGBA', full.size, (255, 255, 255, 255)); white.alpha_composite(full)
fit(white, 1600).convert('RGB').save(OUT / 'logo-ochenbauer-weiss.jpg', quality=92)
on_bg(full, (255, 255, 255), (720, 720), 60).convert('RGB').save(OUT / 'logo-ochenbauer-quadrat.png', optimize=True)
# Negativ für dunkle Flächen der Website (Fußzeile)
fit(full_neg, 640).save(OUT / 'logo-hell-640.webp', quality=90, method=6)
fit(full_neg, 1600).save(OUT / 'logo-ochenbauer-hell.png', optimize=True)

# Kopfzeile: Bildmarke (nur Bögen) + Schriftzug nebeneinander, Negativ
mark_neg = Image.fromarray(layer(swoosh_a, is_gold, CREAM, GOLD_ON_DARK))
mark_neg = mark_neg.crop(bbox(swoosh_a))
words_neg = Image.fromarray(layer(name_a, is_gold, CREAM, GOLD_ON_DARK))
words_neg = words_neg.crop(bbox(name_a))
H = 112                                  # 2x von max. 56 px Anzeigehöhe
mk = mark_neg.resize((round(mark_neg.width * H / mark_neg.height), H), Image.LANCZOS)
wh = round(H * 0.78)
wd = words_neg.resize((round(words_neg.width * wh / words_neg.height), wh), Image.LANCZOS)
gap = round(H * 0.2)
lock = Image.new('RGBA', (mk.width + gap + wd.width, H), (0, 0, 0, 0))
lock.alpha_composite(mk, (0, 0))
lock.alpha_composite(wd, (mk.width + gap, (H - wh) // 2))
lock.save(OUT / 'logo-kopf.webp', quality=92, method=6)

# App-Icons: Bildmarke auf Nussbaum-Dunkel
mark_icon = Image.fromarray(layer(swoosh_a, is_gold, CREAM, GOLD_ON_DARK)).crop(bbox(swoosh_a))
for size, name_ in [(48, 'icon-48.png'), (192, 'icon-192.png'), (512, 'icon-512.png'), (180, 'apple-touch-icon.png')]:
    on_bg(mark_icon, DARK_BG, (size, size), round(size * 0.14)).convert('RGB').save(OUT / name_, optimize=True)

print('Kopf', lock.size, 'Logo', full.size, 'Name-Bbox', bbox(name_a), 'Bögen', bbox(swoosh_a))
