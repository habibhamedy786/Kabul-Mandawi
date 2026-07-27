#!/usr/bin/env python3
"""Build the browser-tab icon from the logo mark: trim the transparent margins
so the logo fills the icon, then write app/icon.png and app/apple-icon.png."""
import os
from PIL import Image

SRC = os.path.expanduser("~/Desktop/kabul-mandawi-mark.png")
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = [os.path.join(HERE, "apps/web/app/icon.png"),
       os.path.join(HERE, "apps/web/app/apple-icon.png")]
MARGIN = 0.08   # small breathing room around the logo
SIZE = 512

im = Image.open(SRC).convert("RGBA")
cropped = im.crop(im.split()[3].getbbox())     # trim to the visible logo
w, h = cropped.size
side = max(w, h)
m = int(side * MARGIN)
c = side + 2 * m
canvas = Image.new("RGBA", (c, c), (0, 0, 0, 0))
canvas.paste(cropped, ((c - w) // 2, (c - h) // 2), cropped)
canvas = canvas.resize((SIZE, SIZE), Image.LANCZOS)
for path in OUT:
    canvas.save(path)
    print("saved", path)
