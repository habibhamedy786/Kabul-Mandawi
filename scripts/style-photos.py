#!/usr/bin/env python3
"""
Standardise product photos for Kabul Mandawi:
  - place each product on a clean square white background with even padding
  - burn in a faint diagonal "Kabul Mandawi" watermark (matches the website)

Usage:  python3 style-photos.py <input_dir> [output_dir]
Reads every .jpg/.jpeg/.png/.webp in <input_dir>, writes <name>_kabul.jpg to
<output_dir> (default: <input_dir>/edited).
"""
import os
import sys
import numpy as np
from scipy import ndimage
from PIL import Image

CANVAS = 1200          # output size in pixels (square)
PAD_RATIO = 0.12       # padding around the product (each side)
BG = (255, 255, 255)   # white background
LOGO_PATH = os.path.expanduser("~/Desktop/kabul-mandawi-logo.png")
LOGO_WIDTH_RATIO = 0.55  # logo width as a fraction of the canvas
LOGO_OPACITY = 0.32      # 0-1; how visible the watermark is
BG_TOLERANCE = 30        # how close to the backdrop colour counts as background


def whiten_background(img_rgb):
    """Replace the outer backdrop with pure white. Only the background region
    that is connected to the image border is changed, so light-coloured areas
    inside the product (e.g. a pale label) are left untouched."""
    arr = np.asarray(img_rgb).astype(np.int16)
    h, w = arr.shape[:2]
    corners = np.array([arr[0, 0], arr[0, w - 1], arr[h - 1, 0], arr[h - 1, w - 1]])
    bg = np.median(corners, axis=0)
    if bg.min() <= 200:                      # not a plain light backdrop
        return img_rgb
    close = np.abs(arr - bg).max(axis=2) <= BG_TOLERANCE
    labels, _ = ndimage.label(close)
    border = set(labels[0]) | set(labels[-1]) | set(labels[:, 0]) | set(labels[:, -1])
    border.discard(0)
    mask = np.isin(labels, list(border))
    out = np.asarray(img_rgb).copy()
    out[mask] = (255, 255, 255)
    return Image.fromarray(out)


def add_watermark(canvas):
    """Composite the semi-transparent Kabul Mandawi logo across the center."""
    if not os.path.exists(LOGO_PATH):
        return canvas
    logo = Image.open(LOGO_PATH).convert("RGBA")
    target_w = int(canvas.width * LOGO_WIDTH_RATIO)
    target_h = int(logo.height * target_w / logo.width)
    logo = logo.resize((target_w, target_h), Image.LANCZOS)

    # scale the logo's existing alpha down to the desired opacity
    r, g, b, a = logo.split()
    a = a.point(lambda v: int(v * LOGO_OPACITY))
    logo = Image.merge("RGBA", (r, g, b, a))

    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    overlay.alpha_composite(logo, ((canvas.width - target_w) // 2,
                                   (canvas.height - target_h) // 2))
    return Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")


def process(path, out_dir):
    img = Image.open(path).convert("RGBA")
    # flatten any transparency onto white first
    flat = Image.new("RGBA", img.size, (255, 255, 255, 255))
    flat.alpha_composite(img)
    img = whiten_background(flat.convert("RGB"))

    inner = int(CANVAS * (1 - 2 * PAD_RATIO))
    img.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGB", (CANVAS, CANVAS), BG)
    canvas.paste(img, ((CANVAS - img.width) // 2, (CANVAS - img.height) // 2))

    canvas = add_watermark(canvas)
    name = os.path.splitext(os.path.basename(path))[0]
    out = os.path.join(out_dir, f"{name}_kabul.jpg")
    canvas.save(out, "JPEG", quality=90)
    return out


def main():
    in_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Desktop/kabul-photos")
    out_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(in_dir, "edited")
    os.makedirs(out_dir, exist_ok=True)
    exts = (".jpg", ".jpeg", ".png", ".webp")
    files = [f for f in sorted(os.listdir(in_dir))
             if f.lower().endswith(exts) and not f.startswith(".")]
    if not files:
        print(f"No images found in {in_dir}")
        return
    for f in files:
        print("->", process(os.path.join(in_dir, f), out_dir))
    print(f"\nDone. {len(files)} photo(s) saved to {out_dir}")


if __name__ == "__main__":
    main()
