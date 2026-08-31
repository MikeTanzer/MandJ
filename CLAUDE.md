Static one-page marketing site for **M & J Construction Inc.**, a Phoenix, Arizona
**demolition and excavating contractor** (not a general building contractor). It is a
remake of their live GoDaddy one-pager at <https://mandjconst.com>. Started 2026-08-26.

**The real company:** founded 1986 by Matt Meade (owner/operator), 3520 E Illini St,
Phoenix AZ 85040, (602) 470-8111, matt@mandjconst.com, Mon-Fri 6am-3pm. Four ROC
licences. Slogans: "Professional, Experienced and Trusted", "We Have The Right Stuff",
"We Get The Job Done Right". Sections are Services / Equipment / Coverage / Contact.

**I initially built it as "MNJ Construction", a commercial GC with invented details** —
the name, trade and nearly all copy were wrong until the real site was pulled on
2026-08-27. If anything still reads as commercial-GC language, it is a leftover. Lives at `mnj-construction/` in the Desktop workspace —
its own git repo (`MikeTanzer/MandJ`), not tracked by the parent, matching how
`big-canna`, `michaeltanzer-site` and the other siblings are set up.

Live at **https://miketanzer.github.io/MandJ/** (GitHub Pages, `main` / root).

- Palette is charcoal + hi-vis amber (`#ffb020`); display face is Anton, body is Inter.
- Hero runs a **three-clip reel** (aerial jobsite / concrete pour / steel erection) that
  dissolves between clips and loops the set, over a **procedural CSS desert background**
  (sun glow, parallax ridge, light beam, grain). Two non-obvious bits of that code: the
  hand-off fires ~1s *before* a clip ends so both are still moving through the dissolve,
  and the incoming clip is parked *underneath* at full opacity while the outgoing one
  fades on top — fading both at once dips through to the dark background. The fallback
  is deliberate too. Don't "simplify" any of it away.
- **Services / Process / Work / Contact each have their own dimmed background clip**
  (`bg-*.mp4`), lazily built by IntersectionObserver as the section approaches and paused
  when it leaves. Skipped under `prefers-reduced-motion` and Save-Data.
  **Deliberately not gated on `effectiveType === '3g'`** — that value is inferred from
  latency and reports 3g on ordinary connections, including this machine's own localhost
  dev server. Gating on it silently killed all four films during testing.
- Contact form is backend-free: validates client-side, then hands off to the visitor's
  mail app via `mailto:`. README documents the Formspree/Netlify swap.
- Contact details, licences and place names are now the **real** ones. Caveat: the source
  site's copyright reads 2019, so hours, fleet list and licence numbers are worth
  confirming with Matt before launch.
- **The generated video footage still depicts commercial construction** (steel erection,
  concrete pour, blue-hour office building) rather than demolition/excavation. Only the
  equipment-yard and sparks clips really fit the trade. Regenerating costs Higgsfield
  credits, so it was flagged rather than done.
- Hero clips generated with Higgsfield `seedance_2_5` (5s, 16:9, ~33 credits each), same
  workflow as `skate-sauce-game`.

**Gotcha:** `url()` inside a CSS custom property resolves against the *stylesheet*, not
the page — declaring `--img` inline in HTML produced `assets/css/assets/img/...` 404s.
The project-tile image paths therefore live in `styles.css` as `../img/work-N.jpg`.

- Favicon is the logo mark itself. **No SVG rasteriser is installed** (no rsvg-convert,
  ImageMagick, Inkscape or cairosvg), so `tools/make-icons.py` draws the shapes directly
  with Pillow instead of converting `favicon.svg` — keep the two in sync by hand.

**No ffmpeg on this Mac**, so hero clips can't be trimmed, re-encoded, or had their
audio stripped locally without installing it first. The reel sidesteps this — clips
dissolve into each other rather than hard-cutting, so none of them has to be
individually loop-safe.
