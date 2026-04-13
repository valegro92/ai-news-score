#!/usr/bin/env python3
"""Generate favicon and logo assets from Cassetta logo on Substack CDN"""
import urllib.request
import os
from PIL import Image
from io import BytesIO

# Download original logo
LOGO_URL = "https://substack-post-media.s3.amazonaws.com/public/images/a6adedfd-8fc8-484f-b250-c8f92c41788a_1024x1024.png"
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")
os.makedirs(PUBLIC_DIR, exist_ok=True)

print("Downloading logo from Substack CDN...")
data = urllib.request.urlopen(LOGO_URL).read()
logo = Image.open(BytesIO(data))
print(f"Logo downloaded: {logo.size[0]}x{logo.size[1]}")

# Save original
logo.save(os.path.join(PUBLIC_DIR, "logo-1024.png"))

# favicon.ico (multi-size)
sizes_ico = [16, 32, 48]
imgs_ico = [logo.resize((s, s), Image.LANCZOS) for s in sizes_ico]
imgs_ico[0].save(
    os.path.join(PUBLIC_DIR, "favicon.ico"),
    format="ICO",
    sizes=[(s, s) for s in sizes_ico],
    append_images=imgs_ico[1:]
)
print("favicon.ico created")

# PNG favicons
for size in [16, 32]:
    fname = f"favicon-{size}x{size}.png"
    logo.resize((size, size), Image.LANCZOS).save(os.path.join(PUBLIC_DIR, fname))
    print(f"{fname} created")

# apple-touch-icon
logo.resize((180, 180), Image.LANCZOS).save(os.path.join(PUBLIC_DIR, "apple-touch-icon.png"))
print("apple-touch-icon.png created")

# android-chrome
for size in [192, 512]:
    fname = f"android-chrome-{size}x{size}.png"
    logo.resize((size, size), Image.LANCZOS).save(os.path.join(PUBLIC_DIR, fname))
    print(f"{fname} created")

# OG image (1200x630) - logo centered on dark brand bg
og = Image.new("RGB", (1200, 630), (41, 37, 36))  # #292524
logo_400 = logo.resize((400, 400), Image.LANCZOS)
x = (1200 - 400) // 2
y = (630 - 400) // 2
if logo_400.mode == "RGBA":
    og.paste(logo_400, (x, y), logo_400)
else:
    og.paste(logo_400, (x, y))
og.save(os.path.join(PUBLIC_DIR, "og-image.png"))
print("og-image.png created")

# Logo for site header (120px)
logo.resize((120, 120), Image.LANCZOS).save(os.path.join(PUBLIC_DIR, "logo-120.png"))
print("logo-120.png created")

# Web manifest
import json
manifest = {
    "name": "AI News Score - La Cassetta degli AI-trezzi",
    "short_name": "AI News Score",
    "icons": [
        {"src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png"},
        {"src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png"}
    ],
    "theme_color": "#292524",
    "background_color": "#292524",
    "display": "standalone"
}
with open(os.path.join(PUBLIC_DIR, "site.webmanifest"), "w") as f:
    json.dump(manifest, f, indent=2)
print("site.webmanifest created")

print("\nAll assets generated in public/:")
for fname in sorted(os.listdir(PUBLIC_DIR)):
    fpath = os.path.join(PUBLIC_DIR, fname)
    if os.path.isfile(fpath):
        size = os.path.getsize(fpath)
        print(f"  {fname}: {size:,} bytes")
print("\nDone!")
