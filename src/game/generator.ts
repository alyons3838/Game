/**
 * Character generation from a written backstory.
 *
 * This runs entirely offline and is the default path. It is not a stand-in for
 * the AI path — it is the shipping behaviour, and the AI path is an optional
 * enhancement layered on top. That ordering matters for two reasons: the game
 * must work with no network and no API key, and the content that ships in the
 * repository stays free of model output, which keeps the licensing story simple.
 *
 * The trick that makes this feel personal without a model is quoting the
 * player's own words back at them. Echoes are built from phrases the player
 * wrote, so the callbacks are literally their story, not a generated imitation.
 */

import { Rng } from '@/engine/rng';
import type { CharacterState, Echo, Pronouns, StatId, StoryContent } from '@/engine/types';
import { STAT_IDS } from '@/engine/types';
import { CONCEPTS, detectConcepts, extractPhrase, keywords } from './lexicon';

export interface BackstoryInput {
  name: string;
  age: number;
  pronouns: Pronouns;
  profession: string;
  definingMoment: string;
  whatLost: string;
  immunityTheory: string;
}

export interface GenerationResult {
  character: CharacterState;
  startLocation: string;
  /** Concepts detected, surfaced in the UI so the player sees they were heard. */
  affinities: string[];
  source: 'local' | 'ai';
}

const BASE_STAT = 42;
const TOTAL_BUDGET = 60;

/** Which starting city a set of affinities points to. First match wins. */
const START_BY_AFFINITY: Array<{ concepts: string[]; location: string }> = [
  { concepts: ['software', 'engineering'], location: 'seattle' },
  { concepts: ['science', 'medicine'], location: 'san-francisco' },
  { concepts: ['craft', 'trade', 'service'], location: 'los-angeles' },
  { concepts: ['military', 'law', 'outdoors'], location: 'phoenix' },
];

export function generateCharacter(
  input: BackstoryInput,
  content: StoryContent,
  seed: string,
): GenerationResult {
  const rng = new Rng(`${seed}:chargen`);

  const corpus = [input.profession, input.definingMoment, input.whatLost, input.immunityTheory].join(' \n ');
  const professionHits = detectConcepts(input.profession);
  const corpusHits = detectConcepts(corpus);

  // Profession counts double — it is the most deliberate signal the player gives.
  const weights = new Map<string, number>();
  for (const [id, count] of corpusHits) weights.set(id, count);
  for (const [id, count] of professionHits) weights.set(id, (weights.get(id) ?? 0) + count * 2);

  const affinities = [...weights.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => id);

  const stats = deriveStats(weights, rng);
  const perks = choosePerks(affinities, content, rng);
  const traits = chooseTraits(affinities, content, rng);
  const echoes = buildEchoes(input, rng);

  const character: CharacterState = {
    name: input.name.trim() || 'Traveller',
    age: input.age,
    pronouns: input.pronouns,
    profession: input.profession.trim() || 'survivor',
    definingMoment: input.definingMoment.trim(),
    whatLost: input.whatLost.trim(),
    immunityTheory: input.immunityTheory.trim(),
    stats,
    health: 100,
    maxHealth: 100,
    morale: 70,
    perks,
    traits,
    echoes,
  };

  // Perk bonuses are applied here rather than through the effect system so the
  // character sheet shown at the end of creation is the real starting sheet.
  for (const perkId of perks) {
    const perk = content.perks[perkId];
    if (!perk?.bonuses) continue;
    for (const stat of STAT_IDS) {
      const bonus = perk.bonuses[stat];
      if (bonus) character.stats[stat] = clamp(character.stats[stat] + bonus, 10, 95);
    }
  }

  return {
    character,
    startLocation: chooseStart(affinities),
    affinities,
    source: 'local',
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Distributes a fixed budget across stats according to concept pressure, so
 * every character is differently shaped but comparably powerful. Without a fixed
 * budget, a backstory that happens to hit many concepts would simply be better.
 */
function deriveStats(weights: Map<string, number>, rng: Rng): Record<StatId, number> {
  const pressure: Record<StatId, number> = {
    resilience: 0,
    cunning: 0,
    empathy: 0,
    resolve: 0,
    scavenge: 0,
  };

  for (const [conceptId, count] of weights) {
    const concept = CONCEPTS.find((c) => c.id === conceptId);
    if (!concept?.stats) continue;
    for (const stat of STAT_IDS) {
      const value = concept.stats[stat];
      if (value) pressure[stat] += value * Math.min(count, 3);
    }
  }

  // A backstory with no recognised concepts still needs a shape, so nudge it
  // randomly rather than handing out a flat, characterless spread.
  const totalPressure = STAT_IDS.reduce((sum, stat) => sum + Math.max(0, pressure[stat]), 0);
  if (totalPressure <= 0) {
    for (const stat of STAT_IDS) pressure[stat] = rng.int(1, 5);
  }

  const positive = STAT_IDS.reduce((sum, stat) => sum + Math.max(0, pressure[stat]), 0);
  const stats = {} as Record<StatId, number>;
  for (const stat of STAT_IDS) {
    const share = Math.max(0, pressure[stat]) / positive;
    const penalty = pressure[stat] < 0 ? pressure[stat] : 0;
    stats[stat] = clamp(Math.round(BASE_STAT + share * TOTAL_BUDGET + penalty), 20, 90);
  }
  return stats;
}

function choosePerks(affinities: string[], content: StoryContent, rng: Rng): string[] {
  const scored = Object.values(content.perks)
    .filter((perk) => perk.affinities?.length)
    .map((perk) => {
      let score = 0;
      for (const affinity of perk.affinities ?? []) {
        const rank = affinities.indexOf(affinity);
        if (rank !== -1) score += Math.max(1, 6 - rank);
      }
      return { perk, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.perk.id.localeCompare(b.perk.id));

  const chosen = scored.slice(0, 3).map((entry) => entry.perk.id);

  // Guarantee at least two perks so no character starts featureless.
  if (chosen.length < 2) {
    const fallbacks = Object.values(content.perks)
      .filter((perk) => perk.affinities?.includes('generalist') && !chosen.includes(perk.id))
      .map((perk) => perk.id);
    for (const id of rng.shuffle(fallbacks)) {
      if (chosen.length >= 2) break;
      chosen.push(id);
    }
  }

  return chosen;
}

function chooseTraits(affinities: string[], content: StoryContent, rng: Rng): string[] {
  const matching = Object.values(content.traits).filter((trait) =>
    trait.affinities?.some((a) => affinities.includes(a)),
  );
  const pool = matching.length ? matching : Object.values(content.traits);
  return rng
    .shuffle(pool.map((t) => t.id))
    .slice(0, Math.min(2, pool.length));
}

/**
 * Echo templates. Each is a function of a phrase drawn from the player's own
 * writing, tied to a trigger point in the story. Triggers are spread across the
 * journey so callbacks land at intervals rather than all at once.
 */
const ECHO_TEMPLATES: Array<{
  id: string;
  trigger: string;
  source: keyof Pick<BackstoryInput, 'definingMoment' | 'whatLost' | 'immunityTheory'>;
  render: (phrase: string) => string;
}> = [
  {
    id: 'echo-first-night',
    trigger: 'a1-first-night',
    source: 'whatLost',
    render: (p) => `You lie awake doing the arithmetic of what is behind you. ${sentence(p)}. The number never gets smaller.`,
  },
  {
    id: 'echo-road',
    trigger: 'loc:kansas-plains',
    source: 'definingMoment',
    render: (p) => `Nothing out here but grass and sky, and too much room to think. ${sentence(p)}. You walk faster.`,
  },
  {
    id: 'echo-denver',
    trigger: 'loc:denver',
    source: 'whatLost',
    render: (p) => `Someone in the crowd laughs the wrong way and for a second you are certain it is ${p}. It is not. It never is.`,
  },
  {
    id: 'echo-lab',
    trigger: 'a3-lab-truth',
    source: 'immunityTheory',
    render: (p) => `You told yourself it was ${p}. Standing here, that explanation sounds like something a frightened person says to sleep.`,
  },
  {
    id: 'echo-dc',
    trigger: 'a4-gates',
    source: 'definingMoment',
    render: (p) => `Three thousand miles, and you are still the person who ${verbish(p)}. You were never going to outrun that. You just needed somewhere to carry it.`,
  },
];

function sentence(phrase: string): string {
  const trimmed = phrase.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Softens an extracted phrase into something that reads after "the person who". */
function verbish(phrase: string): string {
  const lower = phrase.trim().toLowerCase();
  return /^(was|had|did|left|lost|stayed|ran|chose|saved|killed|buried)/.test(lower)
    ? lower
    : `carried ${lower}`;
}

function buildEchoes(input: BackstoryInput, rng: Rng): Echo[] {
  const echoes: Echo[] = [];

  for (const template of ECHO_TEMPLATES) {
    const phrase = extractPhrase(input[template.source]);
    if (!phrase) continue;
    echoes.push({
      id: template.id,
      trigger: template.trigger,
      text: template.render(phrase),
      used: false,
    });
  }

  // If the player wrote too little to quote, fall back to a generic reflection
  // rather than shipping zero callbacks.
  if (echoes.length === 0) {
    const topic = keywords([input.definingMoment, input.whatLost].join(' '))[0];
    echoes.push({
      id: 'echo-generic',
      trigger: 'a1-first-night',
      text: topic
        ? `You keep circling back to the same word. ${sentence(topic)}. You do not say it aloud.`
        : 'You try to remember the last ordinary day you had, and find that you cannot.',
      used: false,
    });
  }

  return rng.shuffle(echoes);
}

function chooseStart(affinities: string[]): string {
  for (const rule of START_BY_AFFINITY) {
    if (rule.concepts.some((c) => affinities.includes(c))) return rule.location;
  }
  return 'seattle';
}
