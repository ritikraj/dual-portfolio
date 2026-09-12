# ritik raj — portfolio

Two portfolios behind one door. Static, no build step.

```bash
python3 -m http.server 4321
```

```
index.html                 the door + both portfolios. all copy lives here
assets/css/app.css         portfolio A  · tokens at top, sections 00–13
assets/js/app.js           portfolio A  · jQuery. CONFIG at top, then Viewport / Thread / Timeline / Stage / Hero
assets/css/read.css        portfolio B  · own tokens, sections B0–B8
assets/js/read.js          portfolio B  · plain JS, no jQuery. CFG at top
case/<slug>.html           one file per case study, BOTH voices inside it
assets/css/case-a.css      the case page in ritik's voice
assets/css/case-b.css      the case page in claude's voice
assets/js/case.js          shared plumbing: reveal, progress, generated tabs
```

## the case study pages

One file per case. Both versions live in the same file, as two sibling
`<article>`s, so the prose is plain HTML you edit in place.

`case/email-builder.html?v=a` → your account of it. Dark, serif, your images.
`case/email-builder.html?v=b` → claude's read of the same work, including an
explicit "how impactful it actually was" verdict.

An inline script in `<head>` picks the voice before first paint and loads only
that stylesheet and that set of fonts. Portfolio A's case links point at `?v=a`,
portfolio B's observation cards point at `?v=b`. Esc returns you to whichever
portfolio you came from.

**Images** live in `assets/img/`, pulled from ritikraj.in and re-encoded to
1800px JPEGs (190–330KB each). Currently in place:

| file | where it is used |
|---|---|
| `email-builder.jpg` | email builder, both the portfolio plate and the case page |
| `builder-canvas.jpg` | the HTML Canvas diagram, builder framework |
| `builder-suite.jpg` | four builders on one model |
| `builder-montage.jpg` | states and templates across the builder |
| `system-architecture.jpg` | design system 3.0 |

Nothing exists yet for **property intelligence**, and design system 3.0 has one
real image and one empty plate. Those are the `<figure class="csa__plate">`
blocks with only a `<figcaption>`. Drop an `<img>` in and add `csa__plate--free`
to the figure so it sizes to the image instead of cropping to 16:9.

On the portfolio itself, `.case__plate` crops from the image's **top-left**, not
its centre, because a UI screenshot is recognisable from its toolbar and not
from its middle. It sits under a veil that lifts on hover.

**One thing to fill in:** `case/email-builder.html` has a commented-out `<ol>`
for the four structural themes from the research. I did not invent them. Uncomment
and write them.

The two sides share the hero and nothing else. No class, font, colour, easing
curve or helper crosses between them, on purpose. `app.js` owns the door and
calls `TheRead.start() / .stop()` when the light side is chosen.

---

## portfolio A — the vertical stage

Dark, gold, Bodoni. One 100vh section at a time, 1150ms settle. A drawn thread
down the left tracks progress; case-study dots appear only on case sections.

**Motion** `app.css :root` → `--ease-lux`, `--ease-door`, `--dur-slide`, `--dur-hero`.
If you change `--dur-slide`, change `CONFIG.slideDuration` in `app.js` to match.
That is the only place the two files have to agree.

**Colour** lives entirely in `assets/css/theme.css`. Five palettes — red
(default), orchid, magenta, gold, signal — each with a dark and a light
rendition. One swatch at the top right cycles them. Light/dark follows the
operating system until you press the toggle, and then it sticks.

**The door never inverts.** Each palette also defines seven `--hero-*` tokens
that are deliberately *absent* from every `[data-mode="light"]` block, so side A
stays dark and side B stays light whatever mode you are reading in — "pick a
side" only means something while that is true. The light/dark toggle is hidden
on the door for the same reason.

To add a fifth palette: copy a block in `theme.css`, change the seven colours,
add one line to `PALETTES` in `app.js`. Nothing else knows the names. The token
is still called `--gold` everywhere because that is what the accent was first
called, and renaming it would touch sixty rules for no gain.

Portfolio B is deliberately outside all of this. It keeps its own bone-and-cobalt
world whatever A is wearing, including the curtain that wipes into it — but it
has **one preference of its own**: light or dark, no palettes, on the button in
its own header. Follows the OS until pressed, stored separately as
`rr-pb-mode`, and shared with the `?v=b` case pages.

**Fonts** `--font-hand` (Caveat), `--font-display` (EB Garamond, old-style),
`--font-body` (Inter). Other old-style cuts are listed in the comment beside
them; change the token and the Google Fonts `<link>` in `index.html`.

**The thread's beads** are one stop per section, sitting exactly where the
progress bead comes to rest. The visible pip is 2.2px; the circle that catches
the click is 11px, which is the whole point. The label on hover sits on a scrim that is **measured off the text** with
`getBBox()` rather than sized by hand, so renaming a section can never leave it
half-covered; it is re-measured once `document.fonts.ready` resolves, since the
first pass runs before the webfont lands. Desktop only. Built by `Thread.stops()` from the section labels, rebuilt whenever the
running order changes — including when the plugin section unlocks — so there is
nothing to keep in sync. The SVG is twice `--thread-x` wide so a hit area has
room on both sides of the line without spilling out of it.

**Layout** `--thread-x` moves the thread and the timeline dots together.
`--gutter` is the page margin.

There are five case studies and they must stay matched across both sides.
`case/<slug>.html` files chain to each other through their "next" links, so
inserting one means retargeting the two links on either side of it.

**Adding a case study** — copy a `<section class="panel panel--case">`, bump
`data-case` and `data-label`. The dots, counter, thread progress and section
count all read the DOM at boot. Nothing to register.

Three lines per case, on purpose: `.case__head` (here's how i solved the *X*
problem), `.case__line--how` (the solution), `.case__line--got` (how it landed).
Drop an `<img>` in `.case__plate` for the visual — hidden under 1024px.

**Reveals** `data-reveal="1..6"` on any element; the number is the stagger order.

---

## portfolio B — "the read"

Bone, cobalt, a lime marker. Space Grotesk + IBM Plex Mono. Horizontal, fast,
560ms. Reads as a dossier an outsider wrote about you: subject → the pattern →
five observations → the tell → verdict.

One flick of the wheel moves one card, momentum swallowed. Drag the strip and it
tracks your cursor 1:1, then snaps or takes the throw. Arrow keys, Home/End, and
the bottom rail also move it. The graph paper parallaxes at `CFG.parallax` of the
strip. Metrics roll up the first time a card is seen; the readout top-right types
the card's name.

**The sheet** is one rectangle, `width:min(100%,82rem)` by `height:min(100%,40rem)`,
centred on the grid paper. Every section is that exact size — consistent without
growing to fill a 27-inch display. Those two numbers in `read.css` § B4 are the
knob; the body scrolls inside if a section outgrows it. On phones it takes the
whole card.

**Adding a card** — add an `<article class="pb-card" data-rail="its name">`.
The bottom rail is generated from `data-rail`, so the tick appears on its own.
Anything with `data-in` gets revealed on a stagger set from JS (`CFG.stagger`).

**Metrics** `<b data-count="75.2" data-suffix="%">` — also `data-prefix`,
and `data-format="k"` for thousands separators.

**Fonts for B are lazy.** They are fetched when the hero's light side is hovered
(`TheRead.preload()`), so side A never pays for them.

---

## navigation

A: wheel, swipe, arrows, page up/down, space, home/end, timeline dots.
B: wheel, drag/throw, arrows, home/end, rail ticks.
`index.html#a` or `#b` deep-links straight past the hero.

## console handles

`window.Portfolio` → `{ Stage, Hero, Thread, Timeline, CONFIG }`
`window.TheRead` → `{ start, stop, go, preload, CFG }`

`Portfolio.Stage.goTo(3)` · `TheRead.go(4)` · `Portfolio.Hero.back()` ·
`Portfolio.Hero.back('b')` jumps straight across.

## while you're editing

`python3 -m http.server` sends no cache headers, so the browser will happily
serve you yesterday's `app.js` after you've changed it. If an edit doesn't seem
to land, hard-reload (cmd+shift+R) before you go looking for the bug.

## page transitions

Nothing cuts. Leaving the portfolio for a case study raises the same curtain the
door uses; the case page arrives already covered and lifts the sheet off, so the
motion runs continuously in one direction across the page load. Coming back
reverses it, and the portfolio reopens **on the section you left from** — the
back link carries the slug (`index.html#a:email-builder`) and `Stage.indexOfSlug`
turns it into a section number by looking at which panel links to that page.
Nothing to register when you add a case study.

### the veil

Every page carries `<div id="veil">` as its first element, styled by an **inline
`<style>` in the head**. That is deliberate and worth not undoing: an external
stylesheet, however early in the head, can still lose a frame to the parser, and
one frame of unstyled HTML (a 300px SVG arrow, serif fallbacks) is exactly what
a designer's eye catches. Inline CSS means the first thing ever painted is the
veil. Fonts swap, stylesheets land and the app mounts behind it.

It lifts on `document.fonts.ready` (capped at 2.2s), sliding upward — the same
direction the curtain travels on the way out, so a page change reads as one
continuous move. The thin line inside only starts animating after 220ms, so a
fast load never flashes a spinner at you. A CSS backstop clears the veil at 6s
if the script never runs at all.

The case pages also load **both** `case-a.css` and `case-b.css` as ordinary
parser-inserted `<link>`s. Injecting the right one from script was the original
cause of the flash: a script-appended stylesheet does not block the first paint
the way a parsed one does. Each file's tokens are scoped to `html.v-a` /
`html.v-b`, so they coexist without colliding. Only the fonts are still chosen
at runtime, and that swap now happens behind the veil.

## the saber

The divider on the door is a lit blade: white until you reach for a side, then
red for the dark one and green for the light one, retracting when you choose.

**It rides the seam.** Hovering a side grows that panel to 65%, and the saber
travels with the edge on the same curve and duration as the panel, instead of
being left behind at half-way. On a phone the door splits across, so it lies
down and travels up and down instead.

**The middle strip belongs to neither side.** `.saber__zone` is a 2.4rem-wide
button covering the saber's column — you cannot pick a portfolio by clicking
there, and clicking it retracts the blade into the hilt (or draws it back out).
The choice is remembered as `rr-saber`. It deliberately does *not* reset the
hover: the strip travels with the seam, so resetting on enter would slide the
saber out from under your cursor and hand the hover to the other side.

**It ignites and retracts by length, not by scale.** `.saber__blade` animates
its `height` between `0` and `52vh` (`44vw` on a phone) — scaling it instead
would squash the rounded tip and drag the glow's spread along with it. Out is
440ms on a curve with a few pixels of overshoot at the tip; back in is 300ms,
faster and without the bounce, the way a real one snaps shut. The emitter kicks
once per ignition (`saberFlash`), and the activation stud on the hilt goes dark
when the blade is away.

The door itself opens on an ignition: the saber starts retracted on every load
and lights 540ms after the veil lifts. Above the tip, `.saber__rail` carries
the division on as a hairline.

**To remove the whole thing**, delete `§ 02b` in `app.css`, the
`<div class="saber">` block in `index.html`, and the `#saberZone` handler in
`app.js`. The original gradient seam is still in the markup and comes back on
its own — `§ 02b` is the only thing hiding it.

## the bubble field

Keywords drifting in the empty right half of the intro, in glass pills you can
pop. `§ 07b` in `app.css`, `<div class="bubbles">` in `index.html`, and the
`Bubbles` module in `app.js` — delete those three to remove it.

Nine of fourteen words, picked at random and **packed, not gridded**:
`findSpot()` throws candidates at the field and rejects any that bite too far
into a bubble already placed. The search relaxes as it fails — early passes
lean hard on the centre and keep their distance, later ones spread out and
accept a closer kiss. Without that relaxation the middle fills up and half the
bubbles never get placed at all.

Circle size follows word length (`60 + len × 4.2`, clamped 78–124px), so the
text always fits inside the sphere.

**Motion runs on two clocks.** Centring stays in `transform`, while the movement
rides the individual `translate` and `scale` properties, which compose with it —
that is what lets a drift and a wobble run at different speeds instead of
fighting over one `transform`. The drift is a closed loop through four random
waypoints (so it never snaps back) at 8.5–13.5s; the wobble is surface tension,
±4% on the two axes at 3.6–6.2s. Smaller bubbles are lighter and travel further.
Amplitude lives in `Bubbles.path()`, speed in the `--dur` / `--wob` lines beside
it.

The film is five stacked gradients: specular up and left, bounce light low and
right, a bright rim where the film turns away and doubles in thickness, a very
quiet conic iridescence, and the fill. Plus an `inset 0 0 0 1px` rim so there is
always a hard edge — without it they read as soft discs rather than spheres.

The burst is not a fade. The film stretches for a frame (26% in, scaled 1.16),
gives, then throws seven droplets outward on random headings while a ring
expands past the old circumference.

Rebuilt from scratch every time the section scrolls back into view, with a
different nine — `Stage.render` calls `Bubbles.spawn()` / `.clear()` off the
panel's `data-bubbles` attribute, so adding the attribute to another section is
all it takes to put a field there.

Edit the words in `Bubbles.words` — they are chosen for what a recruiter or a
design manager scans for, and they have to stay short enough to sit in a circle.
The field starts a clear 42rem past the content edge (the reading column is at
most 38rem) so it can never crowd the text, and hides entirely below 1320px
where there is no empty half left. Glass colours are `--glass-*` in `theme.css`
— one pair, flipped by mode, deliberately outside the palettes so the bubbles
borrow whatever is behind them.

## the unlocked section

Pop six bubbles and a seventh section appears in portfolio A, between the last
case study and the about page: it says out loud that the behaviour was noticed,
then offers the Figma plugin to the kind of person who would have been popping
bubbles in the first place. The CTA points at `#` for now.

The panel sits in `index.html` with a plain `hidden` attribute. `Stage.read()`
builds the running order from `.panel:not([hidden])`, so a hidden section is
simply not in it — no separate list to keep in sync. `Stage.unlock()` drops the
attribute, re-reads, and re-renders; the counter goes 06 to 07 and the
case-study dots renumber themselves. Delete the `hidden` attribute to work on
the panel normally.

The count is a plain property on `Bubbles`, so a reload is a clean slate and
the section has to be earned again. The threshold is `CONFIG.popsToOpen`.

## mobile

The top bar carries a scrim so a section passing under it stays legible, the
"both portfolios" label collapses to its arrow, and the section counter moves
beside it. Type and spacing step down on **height**, not width (`§ 12b`,
at 790px and 690px), because what breaks on a smaller handset is vertical room:
a section is locked to 100vh, so when the type outgrows it the top slides under
the bar. Verified with zero overflow at 360×640, 375×667 and 375×812.
The four principles in the about section become a horizontal swipe rail — it is marked `data-scroll-x`, which is how the section scroller
knows to keep its hands off that gesture. Mark anything else that needs to own
a swipe the same way.

## esc

Esc anywhere inside either portfolio, or on any case page, takes you back to
the door. On a case page it returns you to the side you were reading from.

## copy rules applied

Case study **headlines** say "here's how we solved" — the problem was solved by
a team. Everything below the headline is first person, because the decisions
were yours. That split is deliberate; don't let it drift either way.
No em dashes in body copy. Both are easy to break by accident when you edit,
so: `grep "—" index.html` should only ever hit the HTML comments.
