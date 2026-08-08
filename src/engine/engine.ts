/**
 * The narrative engine: walks the story graph, resolves choices, applies
 * consequences.
 *
 * Two dynamic jump targets are supported in content so that hub nodes do not
 * have to hard-code every possible destination:
 *   `@encounter` — a weighted random encounter valid for the current location
 *   `@hub`       — the current location's hub node (`hub:<locationId>`)
 */

import { evaluate, explainFailure } from './conditions';
import { applyCompanionReactions, applyEffects } from './effects';
import { Rng } from './rng';
import { interpolate } from './text';
import type {
  Choice,
  Echo,
  GameState,
  Outcome,
  ResolvedChoice,
  RollResult,
  StatId,
  StoryContent,
  StoryNode,
} from './types';
import { FACTION_IDS, RESOURCE_IDS, STAT_IDS } from './types';

export const SAVE_VERSION = 2;

export const hubNodeId = (locationId: string) => `hub:${locationId}`;

const STAT_LABELS: Record<StatId, string> = {
  resilience: 'Resilience',
  cunning: 'Cunning',
  empathy: 'Empathy',
  resolve: 'Resolve',
  scavenge: 'Scavenge',
};

export interface StepResult {
  outcomes: Outcome[];
  roll?: RollResult;
  /** Backstory callback fired on arriving at the new node, if any. */
  echo?: Echo;
  node: StoryNode;
  ended: boolean;
}

export interface NewGameOptions {
  seed: string;
  character: GameState['character'];
  startLocation: string;
  startNode: string;
  supplies?: number;
}

export function createInitialState(options: NewGameOptions): GameState {
  const resources = Object.fromEntries(RESOURCE_IDS.map((id) => [id, 0])) as GameState['resources'];
  resources.supplies = options.supplies ?? 90;
  resources.meds = 3;
  resources.fuel = 0;
  resources.ammo = 6;

  return {
    version: SAVE_VERSION,
    seed: options.seed,
    rngCursor: 0,
    character: options.character,
    day: 1,
    location: options.startLocation,
    visited: [options.startLocation],
    resources,
    factions: Object.fromEntries(FACTION_IDS.map((id) => [id, 0])) as GameState['factions'],
    flags: {},
    counters: {},
    companions: {},
    choiceHistory: [],
    seenNodes: [],
    journal: [],
    currentNode: options.startNode,
  };
}

export class Engine {
  readonly content: StoryContent;
  private state: GameState;
  private rng: Rng;

  constructor(content: StoryContent, state: GameState) {
    this.content = content;
    this.state = state;
    this.rng = new Rng(state.seed, state.rngCursor);
  }

  getState(): GameState {
    // Keep the persisted cursor in step with the live generator.
    this.state.rngCursor = this.rng.position;
    return this.state;
  }

  get node(): StoryNode {
    const node = this.content.nodes[this.state.currentNode];
    if (!node) throw new Error(`Unknown node: ${this.state.currentNode}`);
    return node;
  }

  /** Runs `onEnter` for the starting node. Call once after creating a new game. */
  begin(): StepResult {
    return this.enter(this.state.currentNode, []);
  }

  text(raw: string): string {
    return interpolate(raw, this.state, this.content);
  }

  /** Body paragraphs of the current node, interpolated. */
  body(): string[] {
    return this.node.body.map((line) => this.text(line));
  }

  /**
   * Resolves every choice on the current node against world state. Choices that
   * fail their requirement are either dropped or returned marked unavailable,
   * depending on `hideWhenLocked` — showing a locked option tells the player a
   * different build could have reached it, which is most of the appeal.
   */
  choices(): ResolvedChoice[] {
    const labels = {
      stat: STAT_LABELS as Record<string, string>,
      perk: Object.fromEntries(Object.values(this.content.perks).map((p) => [p.id, p.name])),
      companion: Object.fromEntries(Object.values(this.content.companions).map((c) => [c.id, c.name])),
    };

    const resolved: ResolvedChoice[] = [];
    for (const choice of this.node.choices) {
      const available = evaluate(choice.requires, this.state);
      if (!available && choice.hideWhenLocked !== false) continue;
      resolved.push({
        choice,
        available,
        lockedReason: available
          ? undefined
          : choice.lockedHint ?? explainFailure(choice.requires, this.state, labels),
      });
    }
    return resolved;
  }

  /** Applies a choice and advances to the next node. */
  choose(choiceId: string): StepResult {
    const choice = this.node.choices.find((c) => c.id === choiceId);
    if (!choice) throw new Error(`Unknown choice "${choiceId}" on node "${this.state.currentNode}"`);
    if (!evaluate(choice.requires, this.state)) {
      throw new Error(`Choice "${choiceId}" is not available`);
    }

    this.state.choiceHistory.push(choice.id);

    const outcomes: Outcome[] = [
      ...applyEffects(choice.effects, this.state, this.content),
      ...applyCompanionReactions(choice.tags, this.state, this.content),
    ];

    let roll: RollResult | undefined;
    let target: string;

    if (choice.roll) {
      roll = this.performRoll(choice.roll.stat, choice.roll.dc);
      target = roll.success ? choice.roll.success : choice.roll.failure;
      outcomes.unshift({
        kind: 'note',
        text: `${STAT_LABELS[roll.stat]} check — rolled ${roll.die} + ${
          this.state.character.stats[roll.stat]
        } = ${roll.total} vs ${roll.dc}: ${roll.success ? 'success' : 'failure'}`,
      });
    } else {
      target = choice.goto ?? this.state.currentNode;
    }

    outcomes.push(...this.checkCompanionDepartures());

    const result = this.enter(this.resolveTarget(target), outcomes);
    return roll ? { ...result, roll } : result;
  }

  /** Weighted-random encounter appropriate to the current location. */
  private pickEncounter(): string {
    const candidates = Object.values(this.content.nodes).filter((node) => {
      const enc = node.encounter;
      if (!enc) return false;
      if (enc.once && this.state.seenNodes.includes(node.id)) return false;
      if (enc.location && !enc.location.includes(this.state.location)) return false;
      if (!evaluate(enc.requires, this.state)) return false;
      return true;
    });

    const chosen = this.rng.pickWeighted(candidates, (node) => node.encounter?.weight ?? 0);
    // Falling back to the hub keeps the run alive if content ever runs dry.
    return chosen?.id ?? hubNodeId(this.state.location);
  }

  private resolveTarget(target: string): string {
    if (target === '@encounter') return this.pickEncounter();
    if (target === '@hub') return hubNodeId(this.state.location);
    return target;
  }

  private enter(nodeId: string, outcomes: Outcome[]): StepResult {
    const node = this.content.nodes[nodeId];
    if (!node) throw new Error(`Unknown node: ${nodeId}`);

    this.state.currentNode = nodeId;
    if (!this.state.seenNodes.includes(nodeId)) this.state.seenNodes.push(nodeId);

    outcomes.push(...applyEffects(node.onEnter, this.state, this.content));

    if (node.ending) this.state.ending = node.ending;

    const echo = this.consumeEcho(nodeId);

    return {
      outcomes,
      node,
      ended: Boolean(node.ending),
      ...(echo ? { echo } : {}),
    };
  }

  /**
   * Backstory echoes fire the first time the player reaches their trigger, which
   * is either a node id or `loc:<locationId>`.
   */
  private consumeEcho(nodeId: string): Echo | undefined {
    const echo = this.state.character.echoes.find(
      (e) => !e.used && (e.trigger === nodeId || e.trigger === `loc:${this.state.location}`),
    );
    if (!echo) return undefined;
    echo.used = true;
    return echo;
  }

  private performRoll(stat: StatId, dc: number): RollResult {
    const die = this.rng.d100();
    // Stat contributes at half weight so a maxed stat improves the odds
    // substantially without making checks a formality.
    const total = die + Math.round(this.state.character.stats[stat] / 2);
    return { stat, dc, die, total, success: total >= dc };
  }

  /** Companions at zero loyalty walk away at the next decision point. */
  private checkCompanionDepartures(): Outcome[] {
    const outcomes: Outcome[] = [];
    for (const companion of Object.values(this.state.companions)) {
      if (!companion.present || !companion.alive || companion.gone) continue;
      if (companion.loyalty > 0) continue;
      const def = this.content.companions[companion.id];
      companion.present = false;
      companion.gone = true;
      outcomes.push({
        kind: 'companion',
        text: `${def?.name ?? companion.id} has had enough. They leave without a word.`,
      });
    }
    return outcomes;
  }

  /** Fraction of the journey completed, by distance rather than day count. */
  progress(): number {
    const here = this.content.locations[this.state.location];
    const furthest = Math.max(
      ...this.state.visited.map((id) => this.content.locations[id]?.mile ?? 0),
      here?.mile ?? 0,
    );
    const end = Math.max(...Object.values(this.content.locations).map((l) => l.mile));
    return end > 0 ? Math.min(100, (furthest / end) * 100) : 0;
  }

  party() {
    return Object.values(this.state.companions)
      .filter((c) => c.present && c.alive && !c.gone)
      .map((c) => ({ state: c, def: this.content.companions[c.id]! }))
      .filter((entry) => Boolean(entry.def));
  }
}

export { STAT_IDS };
