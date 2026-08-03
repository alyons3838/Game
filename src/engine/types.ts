/**
 * Core type definitions for the narrative engine.
 *
 * Everything the story can ask about the world is a `Condition`, and everything
 * the story can change is an `Effect`. Both are plain data, never code, so
 * content is serialisable, statically validatable, and safe to load.
 */

export const STAT_IDS = ['resilience', 'cunning', 'empathy', 'resolve', 'scavenge'] as const;
export type StatId = (typeof STAT_IDS)[number];

export const RESOURCE_IDS = ['supplies', 'meds', 'fuel', 'ammo'] as const;
export type ResourceId = (typeof RESOURCE_IDS)[number];

export const FACTION_IDS = ['sanctuary', 'traders', 'government', 'resistance', 'reclaimers'] as const;
export type FactionId = (typeof FACTION_IDS)[number];

export type Pronouns = 'she' | 'he' | 'they';

/** How a choice presents itself in the UI. Purely cosmetic — gating is via `requires`. */
export type ChoiceKind =
  | 'standard'
  | 'stat'
  | 'perk'
  | 'trait'
  | 'companion'
  | 'backstory'
  | 'faction'
  | 'memory'
  | 'risk';

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

export type Range = { gte?: number; lte?: number };

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | ({ stat: StatId } & Range)
  | ({ resource: ResourceId } & Range)
  | ({ faction: FactionId } & Range)
  | ({ counter: string } & Range)
  | ({ day: true } & Range)
  | ({ health: true } & Range)
  | ({ morale: true } & Range)
  | { flag: string; is?: boolean }
  | { hasPerk: string }
  | { hasTrait: string }
  | { visited: string }
  | { chose: string }
  | { companion: string; is: 'present' | 'recruited' | 'alive' | 'dead' | 'gone' }
  | ({ loyalty: string } & Range);

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

export type Effect =
  | { stat: StatId; delta: number }
  | { resource: ResourceId; delta: number }
  | { faction: FactionId; delta: number }
  | { counter: string; delta: number }
  | { flag: string; value: boolean }
  | { health: number }
  | { morale: number }
  | { loyalty: string; delta: number }
  | { grantPerk: string }
  | { recruit: string }
  | { dismiss: string }
  | { kill: string }
  | { advanceDays: number }
  | { travelTo: string }
  | { journal: string };

// ---------------------------------------------------------------------------
// Story graph
// ---------------------------------------------------------------------------

/** A dice-less skill check: stat + d20-equivalent roll against a difficulty. */
export interface Roll {
  stat: StatId;
  /** Difficulty class. Roughly: 40 trivial, 55 fair, 70 hard, 85 brutal. */
  dc: number;
  success: string;
  failure: string;
}

export interface Choice {
  id: string;
  text: string;
  kind?: ChoiceKind;
  requires?: Condition;
  /** When requirements fail: `true` removes the choice, `false` shows it greyed out. */
  hideWhenLocked?: boolean;
  /** Explains the requirement in the UI when shown locked. */
  lockedHint?: string;
  effects?: Effect[];
  /** Destination node. Ignored when `roll` is present. */
  goto?: string;
  roll?: Roll;
  /** Tags companions react to. See `companionReactions` in content. */
  tags?: string[];
}

export interface StoryNode {
  id: string;
  act: 1 | 2 | 3 | 4;
  /** Location this node belongs to, for map/context display. */
  location?: string;
  speaker?: string;
  title?: string;
  /** Paragraphs. Supports `{name}`, `{they}`, `{profession}` etc. via `interpolate`. */
  body: string[];
  onEnter?: Effect[];
  choices: Choice[];
  /** Terminal node. `choices` must be empty when set. */
  ending?: string;
  /** Marks this node as an encounter that the hub can roll for, not a plot beat. */
  encounter?: {
    weight: number;
    location?: string[];
    requires?: Condition;
    /** Encounter fires at most once per run. */
    once?: boolean;
  };
}

export interface PerkDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'unique';
  /** Flat stat bonuses applied once on grant. */
  bonuses?: Partial<Record<StatId, number>>;
  /**
   * Concept tags the backstory generator matches against. A perk with no
   * affinities can only be granted explicitly by story content.
   */
  affinities?: string[];
}

export interface TraitDef {
  id: string;
  name: string;
  description: string;
  affinities?: string[];
}

export interface CompanionDef {
  id: string;
  name: string;
  age: number;
  pronouns: Pronouns;
  role: string;
  blurb: string;
  /** Where they can first be recruited. */
  location: string;
  perk?: string;
  /** Choice tags that raise loyalty. */
  likes: string[];
  /** Choice tags that lower loyalty. */
  dislikes: string[];
}

export interface LocationDef {
  id: string;
  name: string;
  act: 1 | 2 | 3 | 4;
  /** Miles from the Pacific coast — drives map position and travel cost. */
  mile: number;
  blurb: string;
  danger: number;
  faction?: FactionId;
  /** Plot node entered on first arrival. */
  arrival?: string;
}

export interface EndingDef {
  id: string;
  name: string;
  summary: string;
}

export interface StoryContent {
  nodes: Record<string, StoryNode>;
  perks: Record<string, PerkDef>;
  traits: Record<string, TraitDef>;
  companions: Record<string, CompanionDef>;
  locations: Record<string, LocationDef>;
  endings: Record<string, EndingDef>;
}

// ---------------------------------------------------------------------------
// Runtime state
// ---------------------------------------------------------------------------

export interface CompanionState {
  id: string;
  loyalty: number;
  present: boolean;
  alive: boolean;
  /** Left the party permanently but did not die. */
  gone: boolean;
}

export interface CharacterState {
  name: string;
  age: number;
  pronouns: Pronouns;
  profession: string;
  definingMoment: string;
  whatLost: string;
  immunityTheory: string;
  stats: Record<StatId, number>;
  health: number;
  maxHealth: number;
  morale: number;
  perks: string[];
  traits: string[];
  /** Backstory callbacks the generator produced, keyed by the node that fires them. */
  echoes: Echo[];
}

export interface Echo {
  id: string;
  /** Node id, or a location id prefixed with `loc:`, that triggers this echo. */
  trigger: string;
  text: string;
  used: boolean;
}

export interface JournalEntry {
  day: number;
  text: string;
}

export interface GameState {
  /** Save format version. Bumped whenever a migration is needed. */
  version: number;
  seed: string;
  /** Number of RNG draws consumed, so a reloaded save continues the same stream. */
  rngCursor: number;
  character: CharacterState;
  day: number;
  location: string;
  visited: string[];
  resources: Record<ResourceId, number>;
  factions: Record<FactionId, number>;
  flags: Record<string, boolean>;
  counters: Record<string, number>;
  companions: Record<string, CompanionState>;
  /** Ids of every choice taken, for `chose` conditions and stat tracking. */
  choiceHistory: string[];
  /** Nodes already entered, for `once` encounters. */
  seenNodes: string[];
  journal: JournalEntry[];
  currentNode: string;
  ending?: string;
}

/** A single visible consequence, surfaced to the player after a choice. */
export interface Outcome {
  kind: 'stat' | 'resource' | 'faction' | 'health' | 'morale' | 'loyalty' | 'perk' | 'companion' | 'time' | 'note';
  text: string;
  delta?: number;
}

export interface ResolvedChoice {
  choice: Choice;
  available: boolean;
  /** Present when unavailable and the choice is shown rather than hidden. */
  lockedReason?: string;
}

export interface RollResult {
  stat: StatId;
  dc: number;
  /** Stat value plus the die. */
  total: number;
  die: number;
  success: boolean;
}
