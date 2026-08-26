# MNJ Construction — Phoenix, AZ

Static marketing site. No build step, no dependencies. Open `index.html` or serve the folder.

```
index.html
assets/
  css/styles.css
  js/main.js
  video/          hero-1.mp4, hero-2.mp4, hero-3.mp4
  img/            <- work-1..4.jpg go here
```

## The looping hero background

Three clips play in order, dissolve into one another, and loop back to the first —
indefinitely. They live in `assets/video/`:

| File | Shot |
|---|---|
| `hero-1.mp4` | Aerial push over a jobsite at golden hour |
| `hero-2.mp4` | Tracking shot along a concrete pour |
| `hero-3.mp4` | Low angle on steel erection against the sky |

**Underneath sits a procedural animated desert background** — drifting sun glow, a
parallax ridge line, a sweeping light beam and film grain. It shows whenever the clips
can't: missing files, blocked autoplay, or `prefers-reduced-motion`. The hero never
renders as a black box.

### How the sequence works

`main.js` drives it. Two details worth keeping if you touch that code:

- The hand-off starts **one second before** the outgoing clip ends, so both are still
  moving during the dissolve. Waiting for `ended` would fade out of a frozen last frame.
- The incoming clip is parked **underneath** at full opacity while the outgoing one
  fades away **on top** of it. Fading both at once dips through to the dark background
  mid-transition.

Only the first clip loads eagerly (~2.1 MB); each one pulls the next down as it starts
playing, so the full 7.1 MB is never part of the initial page load.

A clip that fails to load is marked dead and skipped on subsequent passes — one bad file
degrades the rotation, it doesn't break it.

### Changing the clips

Add or remove `<video class="hero__video">` elements inside `#heroReel` in `index.html`.
The count is read from the DOM, so a fourth clip needs no JavaScript change. Keep
`muted` and `playsinline` — without them mobile browsers refuse to autoplay.

Specs: **1920×1080** (these are 1280×720), H.264 `.mp4`, a few seconds each, **under
~3 MB**, no audio track. Slow camera motion reads best under the headline.

```bash
ffmpeg -i source.mov -t 6 -an -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 26 -preset slow -movflags +faststart assets/video/hero-1.mp4
```

Because the clips dissolve into each other rather than hard-cutting, they don't need to
be individually loop-safe.

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
