# The Long Road Home

A post-apocalyptic branching narrative RPG. You write your own backstory, the
game builds a character out of it, and then quotes you back to yourself three
thousand miles later.

Runs in any modern browser — phone, tablet, desktop, or a television — with no
install, no backend, and no network connection required after first load.

```bash
npm install
npm run dev        # http://localhost:5173
```

---

## What actually ships

Numbers here are asserted by the test suite, not estimated.

| | |
|---|---|
| Story nodes | 68 |
| Choices | 160 |
| Companions | 6, all recruitable |
| Perks | 20 |
| Endings | 5, all reachable |
| Acts | 4, connected end to end |
| Bundle | 117 KB (39 KB gzipped), story included |
| Tests | 67 |

A run takes roughly 80–90 in-game days and 30–60 minutes of real time.

**Not implemented:** combat as a distinct system (conflict resolves through
choices and stat checks), inventory management beyond four tracked resources,
audio, and illustrations. Companion loyalty affects dialogue availability and
whether they stay, but there are no per-companion side quests yet.

---

## The backstory system

This is the part the game is built around.

You answer four open questions at creation — what you did before, a defining
moment, what you lost, and why you think you are immune. Everything downstream
comes from those answers:

- **Concept detection.** Your text is scanned against a lexicon of 21 concepts
  (`medicine`, `hardship`, `isolation`, `leadership`…). Matching is stem-based
  and generous — "nursing", "nurse" and "nursed" all register.
- **Stats.** Concepts apply pressure across five attributes, which is then
  normalised against a fixed budget. Every character is differently *shaped*
  but comparably *strong*, so a backstory that happens to hit many concepts
  isn't simply better.
- **Perks.** Chosen by affinity overlap, ranked by how central each concept was.
  A nurse reliably gets *Clinical Eye* or *First Response*.
- **Traits.** Two, which gate a handful of dialogue lines that stats never touch.
- **Echoes.** The interesting one. Short passages, placed at five points across
  the journey, built by extracting a quotable phrase from *your own writing*.
  Write "I lost my sister Nadia, who was three hours away" and Denver hands you:

  > Someone in the crowd laughs the wrong way and for a second you are certain it
  > is my sister Nadia. It is not. It never is.

Generation is deterministic: the same backstory and seed always produce the same
character. It runs entirely offline.

---

## AI: what it does and does not do

The offline generator above is the **shipping default**, not a fallback. The game
is complete without any model call. AI is an optional layer on top.

**How it works when enabled.** Your backstory is sent to a proxy you deploy
(`server/generate-character.ts`), which calls Claude and returns a JSON object
constrained by a schema. The client validates every field and merges what
survives onto the local result — perk ids must exist, stat nudges are clamped to
±8, echoes must be 20–400 characters. A malformed, partial, refused, or
unreachable response leaves you with the offline character and a note.

**Why it is scoped this way.**

- *The key never reaches the browser.* The previous version of this project asked
  players to paste an API key into a settings box and called the API directly from
  the page, which hands any XSS on the site a live credential.
- *Licensing stays simple.* Model output is used only at character creation and
  lives in that player's save file. Nothing in this repository is generated —
  every story node, perk and companion is hand-written, so the shipped content
  has one clear provenance.
- *Availability is not a dependency.* No key, no network, offline on a plane: the
  game plays identically.

```bash
cd server && npm i @anthropic-ai/sdk
export ANTHROPIC_API_KEY=...      # deploy to Vercel / Netlify / Workers
# then point the client at it:
echo 'VITE_AI_ENDPOINT=https://your-proxy.example/api/generate' > .env.local
```

---

## Playing on a television

Cross-platform was a requirement, so input is unified rather than
mouse-first-plus-hope.

- **Touch** — tap. All targets are at least 44 px.
- **Mouse** — click, or use the keyboard.
- **Keyboard** — arrows move, Enter selects, number keys 1–9 jump straight to a
  choice.
- **TV remote** — D-pad and OK arrive as arrow keys and Enter, so they work for
  free. Focus is always visible when navigating directionally, because on a TV
  "where am I" is the whole navigation model.
- **Gamepad** — polled, since gamepads fire no key events. D-pad, left stick, and
  A/cross.

Layout scales from a 375 px phone to a 4K television off two `clamp()` values and
a fixed reading measure. `env(safe-area-inset-*)` handles notches and TV overscan.

The end-to-end test (`npm run smoke`) plays a full run at three form factors and
drives the middle stretch with the keyboard alone, which is how the two real
input bugs in this build were found.

---

## Architecture

DOM and CSS, not canvas. This game is text, and canvas text has no reflow, no
native scrolling, no text selection, no screen reader, and no OS font scaling.

```
src/
  engine/      Deterministic core, no DOM imports
    types.ts       Conditions and effects as data, never expressions
    rng.ts         Counter-based PRNG — state is (seed, cursor)
    conditions.ts  Evaluation + player-facing failure explanations
    effects.ts     Every mutation, each returning a visible outcome
    engine.ts      Graph walk, skill checks, echoes, companion departures
    save.ts        Versioned saves with forward migration
    text.ts        Token interpolation, pronouns, indefinite articles
  content/     The story. Data only.
    nodes/         act1–act4, encounters, generated hubs
    validate.ts    Graph integrity checks
  game/        Backstory → character
  ui/          Screens, DOM helpers, unified input
```

Two decisions worth calling out:

**Conditions and effects are data, never code.** No `eval`, no `new Function`.
Content is fully serialisable and statically checkable, and loading it can never
execute anything.

**The RNG is counter-based.** Each draw is a pure hash of `(seed, cursor)`, so the
entire random state is two serialisable values. A save reloaded mid-run continues
the exact sequence it would have produced had you never quit — a stateful
generator would need its internal words persisted and kept in sync, and can drift.

---

## Content integrity

The previous version of this project shipped choices pointing at nodes that were
never written; the story dead-ended about three clicks in. That class of bug is
now impossible to ship.

```bash
npm run lint:content
# 68 nodes, 160 choices, 6 companions, 20 perks, 5 endings
# 0 error(s), 0 warning(s)
```

The validator fails on dangling `goto` targets, missing roll branches, unreachable
nodes, non-terminal nodes with no choices, terminal nodes *with* choices, unknown
perk/companion/location references in any effect or condition, endings nothing
awards, and locations with no hub. The test suite additionally asserts that every
non-terminal node has at least one *unconditional* choice — so a character with
poor stats can never be stranded — and plays four full runs to an ending.

---

## Adding to the story

Content is plain data. A node:

```ts
{
  id: 'a2-example',
  act: 2,
  location: 'denver',
  speaker: 'Ava Chen',
  body: ['Paragraph one.', 'Paragraph two, addressed to {name}.'],
  choices: [
    {
      id: 'a2-example-push',
      text: 'Press her on it.',
      kind: 'stat',
      requires: { stat: 'cunning', gte: 58 },
      hideWhenLocked: false,          // show it greyed out instead of hiding it
      lockedHint: 'Cunning 58',
      effects: [{ loyalty: 'ava-chen', delta: 10 }],
      tags: ['honest', 'curious'],    // companions react to these
      goto: 'a2-example-2',
    },
  ],
}
```

Add it to the relevant `src/content/nodes/*.ts` array and run
`npm run lint:content`. Two dynamic jump targets exist so hubs don't have to
hard-code every destination: `@hub` (this location's hub) and `@encounter` (a
weighted random encounter valid here).

Showing locked choices rather than hiding them is deliberate — knowing a
different character could have reached that line is most of the appeal.

---

## Commands

```bash
npm run dev            # dev server
npm run build          # typecheck + test + production build
npm run test           # unit and integration tests
npm run lint:content   # story graph integrity
npm run smoke          # full browser playthrough (needs a preview server)
```

`npm run smoke` needs Playwright's Chromium: `npx playwright install chromium`.

---

## Saves

Autosaved after every choice and when the tab is hidden — mobile browsers kill
backgrounded tabs without warning and `beforeunload` is not reliable there. Saves
are versioned and migrated forward on load, so a run started on an older build
keeps working. Storage is `localStorage` with an in-memory fallback, because
`localStorage` throws in some private-browsing modes and the game should still
run there.

Saves are local to the browser. Nothing is uploaded.

---

## Licence

MIT.
