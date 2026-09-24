"""Prepare the images the book uses, from the website files.

print  → img-print/…  JPEG q95, 4:4:4, native pixel size (never enlarged)
screen → img-screen/… JPEG q80, max 1400 px wide (portrait PNG max 800 px)

Drop high-resolution originals into ../../projects or ../../gallery with the
same file names and rerun this script and build.mjs — the layout is in mm and
does not change.
"""
import re
from pathlib import Path
from PIL import Image

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
html = (HERE / 'book.html').read_text()
srcs = sorted(set(re.findall(r'src="\.\./\.\./([^"]+)"', html)))

for rel in srcs:
    src = ROOT / rel
    im = Image.open(src)
    for mode in ('print', 'screen'):
        out = HERE / f'img-{mode}' / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        if rel.endswith('.png'):
            img = im.copy()
            if mode == 'screen':
                img.thumbnail((800, 800), Image.LANCZOS)
            img.save(out, optimize=True)
            continue
        out = out.with_suffix('.jpg')
        img = im.convert('RGB')
        if mode == 'print':
            img.save(out, 'JPEG', quality=95, subsampling=0, optimize=True)
        else:
            if img.width > 1400:
                img = img.resize((1400, round(img.height * 1400 / img.width)), Image.LANCZOS)
            img.save(out, 'JPEG', quality=80, optimize=True, progressive=True)
    print(f'{rel:45s} {im.width}×{im.height}')
print(f'{len(srcs)} images prepared')
