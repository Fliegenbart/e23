"""Turn a portrait photo into the dot cloud the Weihnachtsfeier network draws.

usage: portrait-points.py photo.jpg cx cy size out.json [preview.png]
cx, cy, size: square crop around the face, in pixels of the photo.
Only the dots are written; the photo itself never ships with the site.
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

GRID = 240
COUNT = 2600
SPACING = 1.0

src, cx, cy, size, out = sys.argv[1], *map(float, sys.argv[2:5]), sys.argv[5]
box = (cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2)
img = Image.open(src).convert("L").crop(box).resize((GRID, GRID), Image.LANCZOS)
img = ImageOps.autocontrast(img, cutoff=1)
def blur(sigma):
    return np.asarray(img.filter(ImageFilter.GaussianBlur(sigma)), dtype=float) / 255


def unit(a):
    return np.clip(a / np.percentile(a, 99.5), 0, 1)


# Chalk on a blackboard: dots go where the photo is darker than its
# surroundings (eyes, brows, beard, hair, frames) and along clear contours.
# A soft oval lets the room behind the person fade out.
fine = blur(1.6)
dark = unit(np.clip(blur(7) - fine, 0, None))
gy, gx = np.gradient(blur(2.2))
edge = unit(np.hypot(gx, gy))
yy, xx = np.mgrid[0:GRID, 0:GRID] / (GRID - 1) - 0.5
oval = np.clip(1.2 - ((xx / 0.46) ** 2 + (yy / 0.52) ** 2), 0, 1)
weight = (dark**1.3 + edge**2.2 * 0.45 + 0.004) * oval

rng = np.random.default_rng(23)
order = rng.choice(GRID * GRID, size=GRID * GRID, replace=False,
                   p=(weight / weight.sum()).ravel() * 0.999999 + 1e-6 / GRID**2)
taken = np.zeros((GRID, GRID), bool)
points = []
for index in order:
    y, x = divmod(int(index), GRID)
    reach = int(SPACING)
    if taken[max(0, y - reach):y + reach + 1, max(0, x - reach):x + reach + 1].any():
        continue
    taken[y, x] = True
    points.append([round((x + rng.random()) / GRID * 1000),
                   round((y + rng.random()) / GRID * 1000)])
    if len(points) == COUNT:
        break

json.dump(points, open(out, "w"), separators=(",", ":"))
print(len(points), "points ->", out)

if len(sys.argv) > 6:
    scale = 3
    canvas = Image.new("RGB", (GRID * scale, GRID * scale), "#22251f")
    draw = ImageDraw.Draw(canvas)
    pts = np.array(points) / 1000 * GRID * scale
    for i, (x, y) in enumerate(pts):
        d = np.hypot(*(pts - (x, y)).T)
        for j in np.argsort(d)[1:3]:
            if d[j] < 9:
                draw.line([x, y, *pts[j]], fill="#55584f", width=1)
    for i, (x, y) in enumerate(pts):
        draw.ellipse([x - 1.3, y - 1.3, x + 1.3, y + 1.3], fill="#ed592f" if i % 9 == 0 else "#f3f0e8")
    canvas.save(sys.argv[6])
