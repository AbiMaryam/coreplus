"""Generate CorePlus placeholder icons (navy + gold lightning bolt)."""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "assets")

# CorePlus brand tokens (from DESIGN.md)
NAVY = (33, 44, 95, 255)        # #212C5F
NAVY_DEEP = (22, 29, 63, 255)   # #161D3F
GOLD = (255, 201, 27, 255)      # #FFC91B

# Lightning bolt polygon in a 100x100 virtual box, centered
BOLT = [
    (56, 8), (30, 52), (48, 52), (40, 92), (72, 44), (52, 44), (60, 8),
]


def rounded_square(size, radius, bg, border=None):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=bg)
    if border is not None:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, outline=border, width=max(1, size // 32))
    return img, d


def make_icon(size):
    radius = max(2, size // 6)
    img, d = rounded_square(size, radius, NAVY, NAVY_DEEP)
    # scale bolt polygon to this size
    scale = size / 100.0
    bolt = [(x * scale, y * scale) for x, y in BOLT]
    d.polygon(bolt, fill=GOLD)
    return img


for s in (16, 32, 48, 128):
    icon = make_icon(s)
    icon.save(os.path.join(OUT, f"icon-{s}.png"))
    print(f"wrote icon-{s}.png")

print("done")
