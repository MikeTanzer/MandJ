# MNJ Construction — Phoenix, AZ

Static marketing site. No build step, no dependencies. Open `index.html` or serve the folder.

```
index.html
assets/
  css/styles.css
  js/main.js
  video/          <- hero.mp4 / hero.webm go here
  img/            <- hero-poster.jpg + work-1..4.jpg go here
```

## The looping hero video

`index.html` points at `assets/video/hero.mp4` (with an optional `hero.webm` first for smaller files).
**Until a file is there, the hero renders a procedural animated desert background** — drifting sun glow,
a parallax ridge line, a sweeping light beam and film grain. It never shows a broken/black box.

Drop a clip in and it fades over the fallback automatically. Guidelines:

- **8–15 seconds**, seamlessly loopable (same first and last frame).
- **1920×1080**, H.264 `.mp4`, target **under 6 MB** — this loads on every page view.
- **No audio track** — it's muted anyway, and stripping it saves bandwidth.
- Slow camera motion reads best under the headline. Avoid hard cuts.

Encode with ffmpeg:

```bash
ffmpeg -i source.mov -t 12 -an -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 26 -preset slow -movflags +faststart assets/video/hero.mp4
```

Optional smaller WebM:

```bash
ffmpeg -i assets/video/hero.mp4 -an -c:v libvpx-vp9 -crf 34 -b:v 0 assets/video/hero.webm
```

Add `assets/img/hero-poster.jpg` (a frame from the clip) so slow connections see something instant.

## Project photos

The four tiles in **Work** look for `assets/img/work-1.jpg` … `work-4.jpg`. If a file is missing, a
styled gradient tile shows instead — so the section never looks broken. Swap the filenames in the
`--img` rules at the bottom of the **work grid** block in `assets/css/styles.css` if you prefer different names.

## The contact form

The form validates in the browser and then opens the visitor's mail app pre-filled, addressed to
`INBOX` at the top of `assets/js/main.js`. **Nothing is sent to a server** — no backend required.

To take real submissions instead, pick one:

**Formspree** — replace the `<form id="bidForm" novalidate>` tag with:

```html
<form id="bidForm" novalidate action="https://formspree.io/f/YOUR_ID" method="POST">
```

…and in `main.js`, delete the `e.preventDefault()` line in the submit handler (keep the validation
check above it, which already `return`s early on problems).

**Netlify Forms** — add `netlify` and `name="bid"` to the form tag, and remove `e.preventDefault()`.

The hidden `company_website` input is a honeypot — leave it in place, it catches most bots.

## Placeholder content to replace

Everything below is invented and needs the real values before this goes live:

| Where | Placeholder |
|---|---|
| Address | 2135 W Buckeye Road, Suite 140, Phoenix, AZ 85009 |
| Phone | (602) 555-0184 |
| Email | build@mnjconstruction.com |
| License | ROC #123456 (nav eyebrow, footer, JSON-LD) |
| Stats | 22 years / 640+ projects / 4.1M sq ft / zero incidents |
| Work tiles | All four project names and figures |

They appear in `index.html`, plus `INBOX` in `assets/js/main.js`.
