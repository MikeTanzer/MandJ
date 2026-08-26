Generated brand icons — do not hand-edit the rasters:

  favicon.svg           the logo mark, vector. Primary tab icon.
  favicon.ico           same mark at 16/32/48 px, for older browsers.
  favicon-32.png        single-size PNG fallback.
  apple-touch-icon.png  180px, full-bleed (iOS masks its own corners).
  icon-512.png          512px, for a web app manifest if one is added.

The geometry mirrors .brand__mark in ../css/styles.css. If the logo changes,
update favicon.svg and re-render the rasters — see "The favicon" in the
project README for the script.

Photography you still need to supply:

  work-1.jpg .. work-4.jpg   the four project tiles

Missing project photos fall back to styled gradients — nothing breaks.
Filenames are wired up in the "Project photos" rules in ../css/styles.css.
