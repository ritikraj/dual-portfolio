/* ==========================================================================
   THE CONTENT MODEL
   One object per project. Shared fields are written once. Only headline,
   summary, metrics, depth, rank and visible are written per lens.

   Numbers never appear as prose. They live in METRICS, once, and are
   referenced by id, so a correction is a one place edit and two lenses can
   never disagree. build.mjs enforces that.

   Adding a lens: add one entry to LENSES and one key under each project's
   `lenses`. Nothing shared moves. A project missing a lens key falls back to
   its `facts` variant rather than disappearing.
   ========================================================================== */
(function (root) {

  /* ── every number on the site, exactly once ───────────────────────────── */
  var METRICS = {
    'years'            : { value: '8',        label: 'years' },
    'team.fello'       : { value: '7',        label: 'designers led at fello' },
    'team.fashinza'    : { value: '2',        label: 'designers led at fashinza' },

    'ds.comp.code'     : { value: '120+',     label: 'coded components' },
    'ds.comp.figma'    : { value: '1,000+',   label: 'figma components behind them' },
    'ds.detach'        : { value: 'under 1%', label: 'detach rate' },
    'ds.insertions'    : { value: '3.6M',     label: 'insertions in six months' },
    'ds.speed'         : { value: '~30%',     label: 'faster to delivery' },
    'ds.pods'          : { value: 'five',     label: 'product pods on it' },
    'ds.onboard'       : { value: 'one week', label: 'to onboard a designer into it' },

    'eb.adoption'      : { value: '75.2%',    label: 'adoption', note: 'across ~3,000 accounts' },
    'eb.arr'           : { value: '$2M+',     label: 'attributable arr' },
    'eb.sent'          : { value: '6,215',    label: 'emails sent in beta' },
    'eb.churn'         : { value: '5.4%',     label: 'churn save', note: 'five scaling accounts that had started looking elsewhere' },
    'eb.signals'       : { value: '530+',     label: 'signals over twelve months' },
    'eb.weeks'         : { value: '10 weeks', label: 'proposal to launch' },
    'eb.retention'     : { value: '79 to 85%',label: 'step retention, create to save' },
    'eb.complete.auto' : { value: '29%',      label: 'completion, automated' },
    'eb.complete.one'  : { value: '19%',      label: 'completion, one-time' },

    'bf.products'      : { value: 'four',     label: 'products on one interaction model' },
    'bf.tiers'         : { value: 'three',    label: 'tiers in the architecture' },

    'pi.roster'        : { value: '~30%',     label: 'agent database growth', note: 'small sample, and i say so' },
    'pi.time'          : { value: '2 to 3 weeks', label: 'solo, discovery to handoff' },

    'fi.fail'          : { value: 'over 20% to about 7%', label: 'shipment failure rate', note: 'the 10 to 20 orders that shipped in the two to three months after launch' },
    'qa.defects'       : { value: '30 to 40%',label: 'fewer workmanship defects', note: 'a range i remember from the dashboards, not a figure i can source' },
    'qa.factories'     : { value: '100+',     label: 'factories' },
    'qa.langs'         : { value: 'five',     label: 'languages' },
    'bom.speed'        : { value: '64%',      label: 'faster fabric order creation' },
    'seg.engagement'   : { value: '+23%',     label: 'contact engagement' },
    'lead.conv'        : { value: '+50%',     label: 'lead conversion' },

    'pl.vars'          : { value: '756',      label: 'variables in one build' },
    'pl.variants'      : { value: '2,991',    label: 'component variants' },
    'pl.checks'        : { value: '171',      label: 'automated checks' }
  };

  /* ── who i am. the facts lens is this, as a page ──────────────────────── */
  var PROFILE = {
    name    : 'ritik raj',
    title   : 'staff product designer',
    line    : 'b2b saas · enterprise platforms · supply chain',
    facts   : [
      ['experience',   '{{years}} years, product design end to end'],
      ['leadership',   'led {{team.fello}} designers at fello, {{team.fashinza}} at fashinza'],
      ['depth',        'design systems, ux architecture, platform builders'],
      ['background',   'frontend engineer by training, b.tech cse'],
      ['availability', 'immediately, zero days notice'],
      ['location',     'pan-india, or remote with ist to est overlap'],
      ['travel',       'us b1/b2 visa, valid ten more years']
    ],
    timeline: [
      ['dec 2023 – jun 2026', 'fello',    'staff product designer, design lead, led 7'],
      ['may 2021 – dec 2023', 'fashinza', 'lead product designer, led 2'],
      ['jan – apr 2021',      'vrest',    'product designer, freelance'],
      ['aug 2018 – dec 2020', 'devslane', 'interaction designer']
    ]
  };

  /* ── the four lenses ──────────────────────────────────────────────────── */
  var LENSES = {
    facts: {
      id: 'facts',
      label: 'role, level, availability',
      sub: 'the short version',
      question: 'right level, right title, can i forward this?',
      preview: '8 years · led 7 designers · available immediately',
      modules: ['profile', 'projects', 'timeline'],
      listVariant: 'row',
      maxDepth: 0,
      cta: { text: 'email me', href: 'mailto:ritikraj559@gmail.com', second: { text: 'linkedin', href: 'https://linkedin.com/in/ritik-raj' }, note: 'no résumé pdf. this page is the résumé, and it prints cleanly.' }
    },
    decisions: {
      id: 'decisions',
      label: 'decisions, tradeoffs, failures',
      sub: 'how i think, and what i got wrong',
      question: 'how does this person think, and can they lead?',
      preview: 'the blocker was not the data. it was our own pricing model.',
      modules: ['diagnosis', 'projects', 'failures'],
      listVariant: 'read',
      maxDepth: 3,
      cta: { text: 'read the design system, in full', href: '../portfolio/case/design-system-3.html', second: { text: 'email me', href: 'mailto:ritikraj559@gmail.com' } }
    },
    architecture: {
      id: 'architecture',
      label: 'architecture, tokens, handoff',
      sub: 'what engineering inherits',
      question: 'will this person create work for my team or remove it?',
      preview: '120+ coded components · under 1% detach · three token layers',
      modules: ['spec', 'projects'],
      listVariant: 'card',
      maxDepth: 2,
      cta: { text: 'the figma plugin', href: '../portfolio/plugin.html', second: { text: 'email me', href: 'mailto:ritikraj559@gmail.com' }, note: 'the one artifact here that is actually code.' }
    },
    outcomes: {
      id: 'outcomes',
      label: 'outcomes, numbers, impact',
      sub: 'what moved',
      question: 'does this work move numbers?',
      preview: '$2M+ · 75.2% adoption · 3.6M insertions',
      modules: ['wall', 'projects'],
      listVariant: 'brief',
      maxDepth: 1,
      cta: { text: 'email me', href: 'mailto:ritikraj559@gmail.com' }
    }
  };

  /* the numbers the outcomes lens opens with, biggest first */
  var WALL = ['eb.arr', 'eb.adoption', 'ds.insertions', 'ds.detach', 'ds.speed', 'seg.engagement', 'lead.conv', 'bom.speed'];

  /* ── projects ─────────────────────────────────────────────────────────── */
  var PROJECTS = [
  {
    id: 'design-system-3', title: 'design system 3.0', org: 'fello', date: '2024-12',
    status: 'shipped', role: 'design lead', duration: '8 months, 10 to 12 weeks of design',
    tags: ['design system', 'tokens', 'governance', 'accessibility'],
    body: '../portfolio/case/design-system-3.html',
    lenses: {
      facts: { visible: true, rank: 1, depth: 0,
        headline: 'design system 3.0, fello, 2024. i led it.',
        summary : 'the system every fello surface is built on.',
        metrics : ['ds.comp.code', 'ds.detach'] },
      decisions: { visible: true, rank: 1, depth: 3,
        headline: 'the company was changing identity mid-build, so the first decision was not a design decision.',
        summary : 'fello was moving from a marketing tool to an ai-first operating system. a system built for the outgoing identity would be torn out inside a year. so i built every component to hold ai before engineering had written a line of it, and tested headers with the ai elements present and absent, so neither state was the special case.',
        metrics : ['ds.detach', 'ds.pods'] },
      architecture: { visible: true, rank: 1, depth: 3,
        headline: 'three token layers, 120+ coded components, and almost nothing detaches.',
        summary : 'primitives defined and locked, global tokens tested against real screens, component tokens only where a global failed. skeletons before components, so the architecture was settled before anyone opened a component file. accessibility solved at the variable layer, wcag 2.1 aa audited rather than asserted.',
        metrics : ['ds.comp.code', 'ds.comp.figma', 'ds.detach', 'ds.insertions'] },
      outcomes: { visible: true, rank: 2, depth: 1,
        headline: '3.6M insertions in six months, and almost nothing detached.',
        summary : 'every new surface shipped on it, a designer is productive inside it in a week, and delivery got about 30% faster.',
        metrics : ['ds.insertions', 'ds.detach', 'ds.speed', 'ds.onboard'] }
    }
  },
  {
    id: 'email-builder', title: 'email builder', org: 'fello', date: '2025-11',
    status: 'shipped', role: 'end to end, 0 to 1', duration: '10 weeks, proposal to launch',
    tags: ['0 to 1', 'research', 'funnels', 'builder'],
    body: '../portfolio/case/email-builder.html',
    lenses: {
      facts: { visible: true, rank: 2, depth: 0,
        headline: 'email builder, fello, 2025. mine end to end, 0 to 1.',
        summary : 'discovery through shipped, then measured.',
        metrics : ['eb.signals', 'eb.adoption', 'eb.arr'] },
      decisions: { visible: true, rank: 2, depth: 3,
        headline: 'the builder worked. the last step did not, and the funnel could not tell me why.',
        summary : 'retention held between 79 and 85% from create to save, then collapsed at publish. two different failures wear that same shape: someone who started and could not finish, and someone who never had a reason to be in there at all. the first is mine to fix, the second no interface can touch. telling them apart was the most useful thing i did after launch.',
        metrics : ['eb.retention', 'eb.complete.auto', 'eb.complete.one'] },
      architecture: { visible: true, rank: 3, depth: 2,
        headline: 'ten weeks from proposal to launch, because it was an instance of the framework, not an invention.',
        summary : 'no new canvas, no new block model, no new state rules. it inherited base blocks and shared widgets and added only what email genuinely needed. i worked with engineering directly on this, with no pm in the loop, which is why the spec and the build never drifted apart.',
        metrics : ['eb.weeks', 'bf.tiers'] },
      outcomes: { visible: true, rank: 1, depth: 1,
        headline: '75.2% adoption, $2M+ attributable arr.',
        summary : 'and a churn save from five scaling accounts that had already started evaluating alternatives.',
        metrics : ['eb.adoption', 'eb.arr', 'eb.sent', 'eb.churn'] }
    }
  },
  {
    id: 'builder-framework', title: 'builder framework', org: 'fello', date: '2025-05',
    status: 'shipped', role: 'architect, reviewer, scope owner',
    tags: ['architecture', 'platform', 'governance'],
    body: '../portfolio/case/builder-framework.html',
    lenses: {
      facts: { visible: true, rank: 3, depth: 0,
        headline: 'builder framework, fello, 2025. four products on one interaction model.',
        summary : 'the architecture under email, landing pages, forms and the contact dashboard.',
        metrics : ['bf.products'] },
      decisions: { visible: true, rank: 3, depth: 3,
        headline: 'i was asked to fix the email builder. i said the problem was that we had four builders.',
        summary : 'email, landing pages and forms all failed the same way, and to anyone moving across the product that is four products wearing one logo. i also waited to say so: i proposed it the week after design system 3.0 shipped, when trust in system-led design was at its highest. the same document six months earlier would have read as architecture for its own sake.',
        metrics : ['bf.products'] },
      architecture: { visible: true, rank: 2, depth: 3,
        headline: 'three tiers: base blocks, shared widgets, product-specific widgets.',
        summary : 'the third tier is what makes it survive. without a sanctioned place for the genuinely product-specific thing, it ends up in tier one and the shared layer rots. editing was designed at landing-page level and then limited for email, because emails do not need nesting and landing pages cannot work without it.',
        metrics : ['bf.tiers', 'bf.products'] },
      outcomes: { visible: true, rank: 5, depth: 1,
        headline: 'one model instead of four, and the next builder took ten weeks.',
        summary : 'email, landing pages, forms and the contact dashboard all run on it.',
        metrics : ['bf.products', 'eb.weeks'] }
    }
  },
  {
    id: 'property-intelligence', title: 'property intelligence', org: 'fello', date: '2025-09',
    status: 'shipped', role: 'solo', duration: '2 to 3 weeks',
    tags: ['permissions', 'pricing', 'data'],
    body: '../portfolio/case/property-intelligence.html',
    lenses: {
      facts: { visible: true, rank: 5, depth: 0,
        headline: 'property intelligence, fello, 2025. solo, two to three weeks.',
        summary : 'a revenue report owners could not run, because our own pricing was deleting the data.',
        metrics : ['pi.roster'] },
      decisions: { visible: true, rank: 4, depth: 3,
        headline: 'the blocker was not the data. it was our own pricing model.',
        summary : 'owners removed departed agents the moment they left, because per-seat billing meant keeping them cost money, so the people the feature was about were guaranteed to be missing. i designed a user class called suspended: no seat cost, no permissions, no access, a row that exists so the roster can be complete. i did not call it inactive, because in slack and google chat inactive means away from keyboard.',
        metrics : ['pi.roster', 'pi.time'] },
      architecture: { visible: false },
      outcomes: { visible: true, rank: 3, depth: 1,
        headline: 'rosters grew about 30%.',
        summary : 'one owner had 27 people waiting in the mls suggestions the first time it ran.',
        metrics : ['pi.roster'] }
    }
  },
  {
    id: 'final-inspection', title: 'final inspection', org: 'fashinza', date: '2023-01',
    status: 'shipped', role: 'lead product designer',
    tags: ['native app', 'field research', 'quality'],
    body: '../portfolio/case/final-inspection.html',
    lenses: {
      facts: { visible: true, rank: 4, depth: 0,
        headline: 'final inspection, fashinza, 2023. the audit that gates a shipment.',
        summary : 'a native app used on factory floors in india and bangladesh.',
        metrics : ['qa.factories'] },
      decisions: { visible: true, rank: 5, depth: 3,
        headline: 'i had already shipped a report merchandisers hated, so this one writes itself.',
        summary : 'the ppm report asked for fifteen minutes of form filling and it failed. so final inspection has no report to fill in: the audit is the report, and finishing it closes the workflow step. i also could not rely on trusting the person holding the device, because every factory defined its own users. the design makes the record hard to argue with instead.',
        metrics : ['fi.fail'] },
      architecture: { visible: true, rank: 5, depth: 2,
        headline: 'offline first, because the network inside a factory is not a given.',
        summary : 'everything stored on the device and synced when the connection returns, aql sample sizes applied by the app rather than by the inspector, five languages, and a generated pdf that closes the workflow step in the web tool. the mobile app became the source of truth, not a companion to it.',
        metrics : ['qa.langs'] },
      outcomes: { visible: true, rank: 4, depth: 1,
        headline: 'shipment failure rate went from over 20% to about 7%.',
        summary : 'production takes 30 to 45 days, so that is the earliest honest read, and q-app was cutting defects upstream at the same time.',
        metrics : ['fi.fail'] }
    }
  },
  {
    id: 'qapp', title: 'q-app', org: 'fashinza', date: '2023-05',
    status: 'shipped', role: 'lead product designer',
    tags: ['native app', 'low literacy', 'offline'],
    body: '../portfolio/case/qapp.html',
    lenses: {
      facts: { visible: true, rank: 6, depth: 0,
        headline: 'q-app, fashinza, 2023. quality checks at the stitching line.',
        summary : 'tablets on the floor, five languages, offline.',
        metrics : ['qa.factories', 'qa.langs'] },
      decisions: { visible: true, rank: 6, depth: 3,
        headline: 'the stitching master checks each piece with both hands, so the device could not be a phone.',
        summary : 'four decisions came out of that one fact. a tablet on a stand at the station. pass is one very large button, hit without looking. reject and alter ask for the piece number first, because friction belongs where the data is worth having. and alter is a third state, because most stitching defects can be repaired, and a pass-or-fail control would force people to lie.',
        metrics : ['qa.defects'] },
      architecture: { visible: true, rank: 6, depth: 2,
        headline: 'offline first, five languages, and a tv on the floor.',
        summary : 'local storage with sync on reconnect, defect type and area captured with a photo against a piece and a line, and in factories that had a tv, a rotation every 15 to 20 seconds showing dhu and efficiency by the hour, plan against output, and the day’s defects labelled in english and hindi.',
        metrics : ['qa.langs', 'qa.factories'] },
      outcomes: { visible: true, rank: 6, depth: 1,
        headline: 'roughly 30 to 40% fewer workmanship defects.',
        summary : 'a range i remember from the dashboards, not a figure i can source. i would rather show the range than round it into something that sounds measured.',
        metrics : ['qa.defects'] }
    }
  },
  {
    id: 'figma-plugin', title: 'design system plugin', org: 'personal', date: '2026-08',
    status: 'shipped', role: 'solo', tags: ['figma plugin', 'tokens', 'code'],
    body: '../portfolio/plugin.html',
    lenses: {
      facts: { visible: false },
      decisions: { visible: false },
      architecture: { visible: true, rank: 4, depth: 2,
        headline: 'a figma plugin that builds a whole design system, and the only artifact here that is actually code.',
        summary : 'three token layers, primitives to brand roles to themed semantic tokens. built solo. one run produces 756 variables and 2,991 component variants, and 171 automated checks build whole systems inside a simulated figma before anything ships.',
        metrics : ['pl.vars', 'pl.variants', 'pl.checks'] },
      outcomes: { visible: false }
    }
  },
  {
    id: 'awesome-graphs', title: 'awesome graphs', org: 'open source', date: '2020-01',
    status: 'shipped', role: 'solo', tags: ['canvas', 'library', 'mit'],
    body: 'https://ritikraj.github.io/awesome-graphs/',
    lenses: {
      facts: { visible: false }, decisions: { visible: false }, outcomes: { visible: false },
      architecture: { visible: true, rank: 7, depth: 1,
        headline: 'a canvas charting library i wrote in 2020 and rebuilt this year.',
        summary : 'seven chart types, no dependencies, mit. v1 chained calls, v2 takes one options object with update, replay and destroy. responsive, hidpi, light and dark.',
        metrics : [] }
    }
  },
  {
    id: 'notifications-framework', title: 'notifications framework', org: 'fello', date: '2024-10',
    status: 'did-not-land', role: 'design lead', tags: ['failure'],
    lenses: {
      facts: { visible: false }, architecture: { visible: false }, outcomes: { visible: false },
      decisions: { visible: true, rank: 7, depth: 1,
        headline: 'a notifications framework that changed nothing.',
        summary : 'zero revenue impact, and it was never implemented. it stays on the timeline because a portfolio with no failures in it is a sales deck.',
        metrics : [] }
    }
  },
  {
    id: 'automation-budget', title: 'automation budget', org: 'fello', date: '2024-02',
    status: 'did-not-land', role: 'design lead', tags: ['failure'],
    lenses: {
      facts: { visible: false }, architecture: { visible: false }, outcomes: { visible: false },
      decisions: { visible: true, rank: 8, depth: 1,
        headline: 'an automation budget nobody used.',
        summary : 'zero effect on automation usage, and it was removed within two months.',
        metrics : [] }
    }
  },
  {
    id: 'ppm-report', title: 'ppm report', org: 'fashinza', date: '2022-03',
    status: 'did-not-land', role: 'lead product designer', tags: ['failure'],
    lenses: {
      facts: { visible: false }, architecture: { visible: false }, outcomes: { visible: false },
      decisions: { visible: true, rank: 9, depth: 1,
        headline: 'fifteen minutes of form filling, and merchandisers refused.',
        summary : 'it failed for a reason i could act on. every quality tool i built afterwards generates its own record instead of asking somebody to write one.',
        metrics : [] }
    }
  },
  {
    id: 'bill-of-material', title: 'bill of material', org: 'fashinza', date: '2022-08',
    status: 'shipped', role: 'lead product designer', tags: ['workflow'],
    lenses: {
      facts: { visible: false }, decisions: { visible: false }, architecture: { visible: false },
      outcomes: { visible: true, rank: 7, depth: 1,
        headline: 'fabric order creation, 64% faster.',
        summary : 'progressive disclosure and batch operations in an ordering flow that used to produce duplicate fabric orders.',
        metrics : ['bom.speed'] }
    }
  },
  {
    id: 'segments', title: 'segments', org: 'fello', date: '2024-05',
    status: 'shipped', role: 'design lead', tags: ['permissions'],
    lenses: {
      facts: { visible: false }, decisions: { visible: false }, architecture: { visible: false },
      outcomes: { visible: true, rank: 8, depth: 1,
        headline: '+23% contact engagement.',
        summary : 'a three-tier, permission-aware segmentation model.',
        metrics : ['seg.engagement'] }
    }
  },
  {
    id: 'lead-conversion', title: 'lead conversion', org: 'fello', date: '2024-08',
    status: 'shipped', role: 'design lead', tags: ['b2b2c', 'trust'],
    lenses: {
      facts: { visible: false }, decisions: { visible: false }, architecture: { visible: false },
      outcomes: { visible: true, rank: 9, depth: 1,
        headline: '+50% lead conversion.',
        summary : 'a consumer-facing dashboard where the design problem was trust, not flow.',
        metrics : ['lead.conv'] }
    }
  }
  ];

  /* the diagnosis line the decisions lens opens with */
  var DIAGNOSIS = {
    intro: 'i solve one level below the brief. four times out of five the stated problem is not the one that needs solving, and saying so early is most of the job.',
    lines: ['builder-framework', 'property-intelligence', 'email-builder']
  };

  /* spec sheet the architecture lens opens with */
  var SPEC = [
    ['token architecture', 'three layers: primitives locked, global tokens tested on real screens, component tokens only where a global failed'],
    ['component surface',  '120+ coded components against 1,000+ in figma, multi-theme and multi-context from day one'],
    ['governance',         'a variation of an existing component beats a new component. design review, naming agreed with engineering, detach tracked as the health metric'],
    ['accessibility',      'wcag 2.1 aa, solved at the variable layer and audited, not asserted'],
    ['handoff',            'specs carry states, edge cases and acceptance criteria. i write html, css and javascript, so what i hand over is buildable'],
    ['working model',      'on the builder work, engineering directly, no pm in the loop. elsewhere, pms daily']
  ];

  root.LENS_CONTENT = {
    METRICS: METRICS, PROFILE: PROFILE, LENSES: LENSES,
    PROJECTS: PROJECTS, WALL: WALL, DIAGNOSIS: DIAGNOSIS, SPEC: SPEC,
    DEFAULT_LENS: 'facts',
    ORDER: ['facts', 'decisions', 'architecture', 'outcomes']
  };

})(typeof window !== 'undefined' ? window : this);
