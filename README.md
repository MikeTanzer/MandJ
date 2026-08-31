# M & J Construction Inc. — Phoenix, AZ

Static marketing site. No build step, no dependencies. Open `index.html` or serve the folder.

```
index.html
assets/
  css/styles.css
  js/main.js
  video/          hero-1..3.mp4 + bg-services/process/work/contact.mp4
  img/            favicon + app icons; work-1..4.jpg go here
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

## Section backgrounds

Services, Process, Work and Contact each sit on their own dimmed, looping video:

| Section | File | Speed | Shot |
|---|---|---|---|
| Services | `bg-services.mp4` | 1× | Grinder sparks off steel, slow motion |
| Process  | `bg-process.mp4`  | 0.67× | Drift across drawings on a jobsite table |
| Work     | `bg-work.mp4`     | 0.67× | Aerial over a finished building at blue hour |
| Contact  | `bg-contact.mp4`  | 0.67× | Equipment yard at dawn |

These are decoration, and they're treated as such:

- Paced per section with `data-film-rate` on the `<section>` — `0.67` is a third slower. Applied with `playbackRate` rather than re-encoded, so changing a
  clip's speed is a one-attribute edit and costs no extra bytes. Browsers reset
  `playbackRate` on some load transitions, so `main.js` re-applies it on
  `loadedmetadata`, `play` and `ratechange`. Omit the attribute for full speed.
- Held at **50–60% opacity** under a two-axis scrim — solid at the edges, thinnest
  through the middle where the copy sits — so body text keeps its contrast whatever the
  footage is doing. Turn the dial in `.film video.is-live` in `styles.css`.
- **Nothing loads until the section is near the viewport.** `main.js` creates each
  `<video>` on an IntersectionObserver with a 60% margin, and a second observer pauses
  the clip once it scrolls away. Landing on the page costs you the hero clip, nothing else.
- **Never created at all** under `prefers-reduced-motion`, nor when the browser reports
  Save-Data or a 2G connection — four clips is ~7.5 MB on top of the hero, and that
  isn't worth it on a metered connection. Those visitors get the scrim alone, which is
  what the sections looked like before the film existed.
- A missing file removes itself and leaves the section exactly as it was — no gap,
  no broken frame.

Because the cards and the contact form would otherwise sit as opaque slabs on top of the
film, `.section--film` gives them translucent backgrounds and a small blur.

To change a section's clip, edit its `data-film` attribute on the `<section>` in
`index.html`. To drop the video from a section entirely, remove `section--film`, its
`data-film` attribute and its `<div class="film">`.

Same encoding specs as the hero clips above.

## The favicon

`assets/img/favicon.svg` is the nav logo mark — the amber tile with its top-right and
bottom-left corners cut, carrying the mountain glyph. Its geometry mirrors `.brand__mark`
in `styles.css`, so the tab icon and the header lockup stay the same shape.

Linked from `index.html` as SVG first, with `favicon.ico` (16/32/48 px) behind it for
older browsers and `apple-touch-icon.png` for iOS home screens. A copy of `favicon.ico`
also sits at the project root for tools that probe `/favicon.ico` directly.

If the logo changes, edit `favicon.svg` and re-render the rasters:

```bash
python3 tools/make-icons.py
```

The app icons are full-bleed — no corner cuts, since iOS applies its own mask — and their
glyph is nudged up two units, because the mountain is bottom-heavy and reads low when it
fills a large tile. The tab icon stays true to the header lockup.

## Region photos

There are **no project photos to pull from mandjconst.com** — its "Photo Gallery" heading
renders zero images, and the only two image assets on the whole site are a diamond-plate
texture and a stylised grader/truck graphic. The Coverage tiles are therefore text-only
and size to their content.

If Matt supplies jobsite photography later, the four region tiles in **Coverage** look for `assets/img/work-1.jpg` … `work-4.jpg`. If a
file is missing, a styled gradient tile shows instead — so the section never looks broken. Swap the filenames in the
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

## Where the content came from

All company details are the real ones, taken from the live site at
<https://mandjconst.com> (a GoDaddy one-pager) on 2026-08-27:

| | |
|---|---|
| Legal name | M & J Construction Inc. |
| Trade | Demolition & excavating contractor, commercial & residential |
| Founded | 1986, by Matt Meade — started with one backhoe and a 10-wheel dump truck |
| Owner / operator | Matt Meade |
| Address | 3520 East Illini Street, Phoenix, AZ 85040 |
| Phone | (602) 470-8111 |
| Email | matt@mandjconst.com |
| Hours | Monday–Friday, 6:00 am – 3:00 pm |
| Licenses | Commercial ROC095859 A-05 · Wrecking ROC152394 L-57 · Residential ROC191499 C-02 and ROC191500 C-22R |
| Slogans | "Professional, Experienced and Trusted" · "We Have The Right Stuff" · "We Get The Job Done Right" |

The services, machinery inventory and the 32 Arizona communities in **Coverage** are all
from that site. Section copy is written fresh rather than lifted, but every fact,
figure, service and place name traces back to it.

**Still to confirm before launch:** the live site's copyright notice reads 2019, so the
hours, fleet list and license numbers are worth a check with Matt before this goes out.
