#!/usr/bin/env python3
"""Render the MNJ favicon and app icons from the logo geometry.

Run from the project root:  python3 tools/make-icons.py

The shapes are drawn directly rather than rasterised from favicon.svg so this
has no dependency beyond Pillow. Keep the coordinates below in sync with
favicon.svg and with .brand__mark in assets/css/styles.css.
"""
from PIL import Image, ImageDraw

AMBER = (255, 176, 32, 255)
INK   = (11, 12, 14, 255)
SS    = 8  # supersample factor, for clean edges at 16px

TILE = [(0, 0), (51, 0), (64, 13), (64, 64), (13, 64), (0, 51)]
PEAK = [(11.52, 44.8), (24.32, 19.2), (32.0, 34.56), (39.68, 19.2), (52.48, 44.8)]


def render(size, full_bleed=False, peak_scale=1.0, lift=0.0):
    """full_bleed drops the corner cuts (iOS masks its own corners).
    lift nudges the glyph up; it is bottom-heavy and reads low on a big tile."""
    n = size * SS
    k = n / 64.0
    img = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if full_bleed:
        d.rectangle([0, 0, n, n], fill=AMBER)
    else:
        d.polygon([(x * k, y * k) for x, y in TILE], fill=AMBER)

    pts = [((x - 32) * peak_scale + 32, (y - 32) * peak_scale + 32 - lift) for x, y in PEAK]
    d.polygon([(x * k, y * k) for x, y in pts], fill=INK)

    return img.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    render(64).save('assets/img/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    render(32).save('assets/img/favicon-32.png')
    render(180, full_bleed=True, peak_scale=0.84, lift=2.0).save('assets/img/apple-touch-icon.png')
    render(512, full_bleed=True, peak_scale=0.84, lift=2.0).save('assets/img/icon-512.png')

    # some tools probe /favicon.ico directly
    import shutil
    shutil.copy('assets/img/favicon.ico', 'favicon.ico')
    print('icons written')
