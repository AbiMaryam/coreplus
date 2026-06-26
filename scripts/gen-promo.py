"""Generate CorePlus promotional tile (440x280) for Chrome Web Store."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "assets")

NAVY = (33, 44, 95, 255)
NAVY_DEEP = (22, 29, 63, 255)
GOLD = (255, 201, 27, 255)
AMBER = (255, 213, 74, 255)
WHITE = (255, 255, 255, 255)

W, H = 440, 280

img = Image.new("RGBA", (W, H), NAVY)
d = ImageDraw.Draw(img)

# Subtle gradient band at bottom
for y in range(H - 80, H):
    alpha = int(40 * (y - (H - 80)) / 80)
    d.line([(0, y), (W, y)], fill=(NAVY_DEEP[0], NAVY_DEEP[1], NAVY_DEEP[2], alpha))

# Lightning bolt icon (centered, left area)
BOLT = [
    (56, 8), (30, 52), (48, 52), (40, 92), (72, 44), (52, 44), (60, 8),
]
scale = 1.6
bolt_w = int(100 * scale)
bolt_x = 40
bolt_y = 70
bolt_pts = [(bolt_x + (x - 30) * scale, bolt_y + (y - 8) * scale) for x, y in BOLT]
d.polygon(bolt_pts, fill=GOLD)

# "CorePlus" wordmark
try:
    font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
except OSError:
    font_large = ImageFont.load_default()
    font_small = ImageFont.load_default()

d.text((180, 90), "CorePlus", fill=WHITE, font=font_large)
d.text((182, 135), "Toolkit untuk Coretax", fill=AMBER, font=font_small)

# Feature pills
features = ["Multi-Period", "Bulk Credit", "Bulk PDF"]
fy = 175
for feat in features:
    # pill background
    tw = d.textlength(feat, font=font_small) + 20
    d.rounded_rectangle([180, fy, 180 + tw, fy + 24], radius=12, fill=(255, 255, 255, 30))
    d.text((190, fy + 5), feat, fill=WHITE, font=font_small)
    fy += 30

img.save(os.path.join(OUT, "promo-440x280.png"))
print(f"wrote promo-440x280.png ({W}x{H})")
