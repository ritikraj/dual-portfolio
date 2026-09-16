/* ==========================================================================
   BUILD · validate the content model
   Node, stdlib only, zero packages.  node build.mjs

   Hard rule 4 says the same facts appear in every lens, with different
   emphasis only. If one view ever says 30% where another says 40%, the whole
   device becomes a liability. So a number is never typed into prose: it
   lives once in METRICS and is referenced by id. This script enforces that
   mechanically, because discipline does not survive a year of edits.

   Checks
     1  every metric id referenced by a lens exists
     2  no two metrics share a label
     3  every numeral written into lens prose exists in the registry
     4  every visible project has a headline, and a summary if depth >= 1
     5  no two projects share a rank inside one lens
     6  every project is reachable from at least one lens
   ========================================================================== */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('./data/content.js', import.meta.url), 'utf8');
const w = {};
new Function('window', src)(w);
const C = w.LENS_CONTENT;

const errors = [];
const warns  = [];
const fail = (m) => errors.push(m);
const warn = (m) => warns.push(m);

/* numerals that are not claims: a wcag version, a product version, a year */
const ALLOW = new Set(['2.1', '3.0']);
const NUMERAL = /(\$?\d[\d,.]*\s?%)|(\$?\d[\d,.]*\s?[MKk]\+)|(\$?\d+\.\d+[MKk])|(\d[\d,.]*\+)|(\d+[.,]\d+)|(\d{3,})/g;

/* every numeral a string contains, minus years and version numbers */
function tokensIn(text) {
  const out = [];
  for (const hit of String(text).match(NUMERAL) || []) {
    const t = hit.trim();
    if (/^(19|20)\d\d$/.test(t)) continue;
    if (ALLOW.has(t)) continue;
    out.push(t);
  }
  return out;
}
/* {{metric.id}} placeholders resolve before any prose is checked */
const usedPlaceholders = new Set();
function resolve(text) {
  return String(text).replace(/\{\{([a-z0-9.]+)\}\}/gi, (all, id) => {
    if (!C.METRICS[id]) { fail(`shared copy references unknown metric "${id}"`); return all; }
    usedPlaceholders.add(id);
    return C.METRICS[id].value;
  });
}

/* 2 · label collisions */
const seen = new Map();
for (const [id, m] of Object.entries(C.METRICS)) {
  if (seen.has(m.label)) fail(`two metrics share the label "${m.label}": ${seen.get(m.label)} and ${id}`);
  else seen.set(m.label, id);
}

/* per lens */
for (const lensId of C.ORDER) {
  if (!C.LENSES[lensId]) { fail(`ORDER names a lens that does not exist: ${lensId}`); continue; }
  const ranks = new Map();

  for (const p of C.PROJECTS) {
    const v = p.lenses[lensId];
    if (!v || v.visible === false) continue;

    /* 4 */
    if (!v.headline) { fail(`${p.id} · ${lensId}: visible with no headline`); continue; }
    if ((v.depth == null || v.depth >= 1) && !v.summary) fail(`${p.id} · ${lensId}: depth >= 1 with no summary`);

    /* 5 */
    if (v.rank != null) {
      if (ranks.has(v.rank)) fail(`${lensId}: rank ${v.rank} used by both ${ranks.get(v.rank)} and ${p.id}`);
      else ranks.set(v.rank, p.id);
    }

    /* 1 */
    for (const id of (v.metrics || [])) {
      if (!C.METRICS[id]) fail(`${p.id} · ${lensId}: references unknown metric "${id}"`);
    }

    /* 3 · the drift guard, strict.
       a lens variant's prose may only carry numbers from the metrics that
       same variant references. a number that is real but attached to the
       wrong claim is exactly the failure this is here to catch. */
    const allowed = new Set();
    for (const id of (v.metrics || [])) {
      const m = C.METRICS[id];
      if (m) tokensIn(String(m.value)).forEach(t => allowed.add(t));
    }
    for (const field of ['headline', 'summary']) {
      for (const token of tokensIn(v[field] || '')) {
        if (!allowed.has(token)) {
          fail(`${p.id} · ${lensId} · ${field}: "${token}" is written into prose. `
             + `This variant references ${(v.metrics || []).join(', ') || 'no metrics'}. `
             + `Numbers live in METRICS, once, and are referenced by id.`);
        }
      }
    }
  }
}

/* 3b · shared prose is checked against the whole registry */
const sharedProse = [
  ...C.SPEC.flat(),
  ...C.PROFILE.facts.map(f => f[1]),
  ...C.PROFILE.timeline.flat(),
  C.DIAGNOSIS.intro,
  ...Object.values(C.LENSES).flatMap(l => [l.label, l.sub, l.question, l.cta?.note || ''])
];
const allTokens = new Set();
for (const m of Object.values(C.METRICS)) tokensIn(String(m.value)).forEach(t => allTokens.add(t));
for (const line of sharedProse) {
  for (const token of tokensIn(resolve(line))) {
    if (!allTokens.has(token)) fail(`shared copy: "${token}" in "${line.slice(0, 60)}..." is not in METRICS`);
  }
}

/* 6 */
for (const p of C.PROJECTS) {
  const anywhere = C.ORDER.some(l => p.lenses[l] && p.lenses[l].visible !== false);
  if (!anywhere) fail(`${p.id} is invisible in every lens. Never gate: it has to be reachable somewhere.`);
}

/* unused metrics are not an error, but they rot */
const used = new Set();
for (const p of C.PROJECTS) for (const l of C.ORDER) (p.lenses[l]?.metrics || []).forEach(m => used.add(m));
C.WALL.forEach(m => used.add(m));
usedPlaceholders.forEach(m => used.add(m));
for (const id of Object.keys(C.METRICS)) if (!used.has(id)) warn(`metric "${id}" is declared and never used`);
for (const id of C.WALL) if (!C.METRICS[id]) fail(`WALL references unknown metric "${id}"`);

/* ── report ──────────────────────────────────────────────────────────────── */
const pad = (s, n) => String(s).padEnd(n);
console.log('\n  content model\n  ' + '─'.repeat(64));
console.log(`  ${C.PROJECTS.length} projects · ${Object.keys(C.METRICS).length} metrics · ${C.ORDER.length} lenses\n`);
for (const lensId of C.ORDER) {
  const rows = C.PROJECTS
    .filter(p => p.lenses[lensId] && p.lenses[lensId].visible !== false && p.lenses[lensId].headline)
    .sort((a, b) => (a.lenses[lensId].rank || 99) - (b.lenses[lensId].rank || 99));
  console.log(`  ${pad(lensId, 14)} ${rows.length} visible   ${rows.map(p => p.id).join(' · ')}`);
}
console.log('');
warns.forEach(m => console.log(`  warn   ${m}`));
if (errors.length) {
  console.log('');
  errors.forEach(m => console.log(`  ERROR  ${m}`));
  console.log(`\n  ${errors.length} error(s). Nothing is published until these are zero.\n`);
  process.exit(1);
}
console.log(`  ok. no numeric drift, no orphans, no rank collisions.\n`);
