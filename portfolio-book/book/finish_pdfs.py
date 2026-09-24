"""Post-process the PDFs written by build.mjs.

- print-bleed:     216 × 303 mm media · BleedBox = media · TrimBox = 210 × 297 mm centred
- print-cropmarks: 236 × 323 mm media · BleedBox 216 × 303 (10 mm in) · TrimBox 210 × 297 (13 mm in)
- screen:          210 × 297 mm, metadata only
- print-bleed-CMYK: Ghostscript conversion of print-bleed with its generic CMYK
  profile (default_cmyk.icc). For press, prefer letting the printer convert the RGB
  file with their own profile (e.g. FOGRA39 / FOGRA51 / GRACoL) — see README.
"""
import shutil, subprocess
from pathlib import Path
import pymupdf

OUT = Path(__file__).parent.parent / 'output'
NAME = 'Alaa-Masri-Portfolio-2026-2027'
MM = 72 / 25.4
META = {'title': 'Alaa Masri — Portfolio 2026–2027', 'author': 'Alaa Masri', 'creator': 'Alaa Masri portfolio book source',
        'subject': 'Interior Designer · Interior Architect — portfolio', 'keywords': 'interior design, interior architecture, Riyadh'}


def boxes(src, dst, bleed_offset_mm=None, trim_offset_mm=None):
    doc = pymupdf.open(src)
    for p in doc:
        W, H = p.mediabox.width, p.mediabox.height
        if bleed_offset_mm is not None:
            b, t = bleed_offset_mm * MM, trim_offset_mm * MM
            p.set_bleedbox(pymupdf.Rect(b, b, W - b, H - b))
            p.set_trimbox(pymupdf.Rect(t, t, W - t, H - t))
    doc.set_metadata(META)
    doc.save(dst, garbage=3, deflate=True)


for kind, bo, to in (('print-bleed', 0, 3), ('print-cropmarks', 10, 13)):
    f = OUT / f'{NAME}-{kind}.pdf'
    tmp = f.with_suffix('.tmp.pdf')
    boxes(f, tmp, bo, to)
    tmp.replace(f)

s = OUT / f'{NAME}-screen.pdf'
tmp = s.with_suffix('.tmp.pdf'); boxes(s, tmp); tmp.replace(s)

if shutil.which('gs'):
    src = OUT / f'{NAME}-print-bleed.pdf'
    raw = OUT / 'cmyk.tmp.pdf'
    subprocess.run(['gs', '-q', '-dNOPAUSE', '-dBATCH', '-dSAFER', '-sDEVICE=pdfwrite',
                    '-sColorConversionStrategy=CMYK', '-sProcessColorModel=DeviceCMYK',
                    '-dAutoFilterColorImages=false', '-sColorImageFilter=DCTEncode', '-dJPEGQ=95',
                    '-dDownsampleColorImages=false', '-dEmbedAllFonts=true', '-dSubsetFonts=true',
                    f'-sOutputFile={raw}', str(src)], check=True)
    boxes(raw, OUT / f'{NAME}-print-bleed-CMYK.pdf', 0, 3)
    raw.unlink()
print('done')
