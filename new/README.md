# the lens portfolio

One content model, four lenses. A project exists once; each lens changes the
framing, the ordering, the depth and which numbers surface. Nothing is ever
locked away from a lens: switching reorders and reframes, it never gates.

Lives at `new/`. The existing site in `portfolio/` is untouched and is the one
Firebase publishes (`firebase.json` → `"public": "portfolio"`), so nothing
here deploys until we move it deliberately.

## phase 0 · two decisions

`lab.html` is the decision lab. It renders real content in three themes and
two chooser modes, with a control bar at the bottom.

```bash
python3 -m http.server 8765
```

then open `http://127.0.0.1:8765/new/lab.html`

- **theme** · blueprint (drafting table), risograph (two-ink overprint),
  signal (instrument panel). All three are complete: palette, typefaces, rule
  weight, radius, texture, motion.
- **chooser** · `strip` is a nav element under the masthead. `wall` asks the
  question full screen on a first visit only, then behaves as a strip forever
  after. "reset first visit" clears the stored lens so the wall returns.

Pick one of each. `lab.html`, `assets/css/lab.css` and `assets/js/lab.js` are
then deleted and the winners become the defaults in `index.html`.

## the files

```
data/content.js          the whole content model. the only file with copy in it
assets/css/tokens.css    layer 1 · theme. three complete skins
assets/css/lens.css      layer 2 · lens. six variables, and that is the allowance
assets/css/base.css      reset, page chrome, print
assets/css/components.css shared components. lens differences are props, not forks
assets/js/lens.js        which lens is active, url, storage, keeping the reader's place
assets/js/render.js      content model to dom
assets/js/chooser.js     the chooser, both modes, radiogroup semantics
build.mjs                the validator. node build.mjs
```

No framework, no build step, no npm. Classic scripts, so the files open over
`file://` as well as over a server.

## adding things

**A project.** One object in `PROJECTS`: shared fields once, then a `lenses`
key per lens with `headline`, `summary`, `metrics`, `depth`, `rank`,
`visible`. A lens key you leave out falls back to the `facts` variant, so a
half-written project degrades instead of breaking.

**A lens.** One entry in `LENSES` plus one key per project. No shared field
moves, and the chooser picks it up automatically. Five lenses is the ceiling.

**A number.** `METRICS`, once, with an id. Reference the id from a lens, or
write `{{metric.id}}` inside shared copy. Never type a number into prose.

## the validator

`node build.mjs` fails the build on:

1. a metric id that does not exist
2. two metrics sharing a label
3. **a number written into prose.** a lens variant's copy may only carry
   numbers from the metrics that variant references, so a real number
   attached to the wrong claim is caught too
4. a visible project with no headline, or depth ≥ 1 with no summary
5. two projects sharing a rank inside one lens
6. a project invisible in every lens

3 is the important one. If one view ever says 30% where another says 40%, the
whole device becomes a liability, and discipline does not survive a year of
edits. Run it before every commit.

## accessibility

The chooser is a `radiogroup`: arrows move, home and end jump, enter and space
select, focus survives the reframe, and a polite live region announces the new
view and how many projects it holds. Skip link first in the DOM. Reduced
motion honoured. The facts lens prints cleanly, which is the résumé, since no
PDF is published.

## what is not built yet

Case pages under `new/case/` (the lab links to the existing ones in
`portfolio/`), the pre-rendered `index.html`, images, per-lens OG cards, and
analytics with a lens parameter.
