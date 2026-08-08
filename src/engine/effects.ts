/**
 * Effect application.
 *
 * Every mutation to game state flows through here, so consequences are always
 * reported back to the player rather than silently applied. `applyEffects`
 * mutates the passed state and returns the list of visible outcomes.
 */

import type {
  CompanionDef,
  Effect,
  GameState,
  Outcome,
  StatId,
  StoryContent,
} from './types';
import { STAT_IDS } from './types';

const STAT_LABELS: Record<StatId, string> = {
  resilience: 'Resilience',
  cunning: 'Cunning',
  empathy: 'Empathy',
  resolve: 'Resolve',
  scavenge: 'Scavenge',
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/** Daily supply burn: the player plus half a ration per travelling companion. */
export function dailyBurn(state: GameState): number {
  const party = Object.values(state.companions).filter((c) => c.present && c.alive && !c.gone).length;
  return 1 + party * 0.5;
}

export function applyEffects(
  effects: Effect[] | undefined,
  state: GameState,
  content: StoryContent,
): Outcome[] {
  if (!effects?.length) return [];
  const outcomes: Outcome[] = [];

  for (const effect of effects) {
    if ('stat' in effect) {
      const before = state.character.stats[effect.stat];
      state.character.stats[effect.stat] = clamp(before + effect.delta, 0, 100);
      const actual = state.character.stats[effect.stat] - before;
      if (actual !== 0) {
        outcomes.push({
          kind: 'stat',
          delta: actual,
          text: `${STAT_LABELS[effect.stat]} ${sign(actual)}`,
        });
      }
    } else if ('resource' in effect) {
      const before = state.resources[effect.resource];
      state.resources[effect.resource] = Math.max(0, before + effect.delta);
      const actual = state.resources[effect.resource] - before;
      if (actual !== 0) {
        outcomes.push({
          kind: 'resource',
          delta: actual,
          text: `${effect.resource} ${sign(actual)}`,
        });
      }
    } else if ('faction' in effect) {
      const before = state.factions[effect.faction];
      state.factions[effect.faction] = clamp(before + effect.delta, -100, 100);
      const actual = state.factions[effect.faction] - before;
      if (actual !== 0) {
        outcomes.push({
          kind: 'faction',
          delta: actual,
          text: `${effect.faction} standing ${sign(actual)}`,
        });
      }
    } else if ('counter' in effect) {
      state.counters[effect.counter] = (state.counters[effect.counter] ?? 0) + effect.delta;
    } else if ('flag' in effect) {
      state.flags[effect.flag] = effect.value;
    } else if ('health' in effect) {
      const before = state.character.health;
      state.character.health = clamp(before + effect.health, 0, state.character.maxHealth);
      const actual = state.character.health - before;
      if (actual !== 0) {
        outcomes.push({ kind: 'health', delta: actual, text: `Health ${sign(actual)}` });
      }
    } else if ('morale' in effect) {
      const before = state.character.morale;
      state.character.morale = clamp(before + effect.morale, 0, 100);
      const actual = state.character.morale - before;
      if (actual !== 0) {
        outcomes.push({ kind: 'morale', delta: actual, text: `Morale ${sign(actual)}` });
      }
    } else if ('loyalty' in effect) {
      const companion = state.companions[effect.loyalty];
      const def = content.companions[effect.loyalty];
      if (companion && def && companion.alive && !companion.gone) {
        const before = companion.loyalty;
        companion.loyalty = clamp(before + effect.delta, 0, 100);
        const actual = companion.loyalty - before;
        if (actual !== 0) {
          outcomes.push({
            kind: 'loyalty',
            delta: actual,
            text: `${def.name} ${sign(actual)} loyalty`,
          });
        }
      }
    } else if ('grantPerk' in effect) {
      const perk = content.perks[effect.grantPerk];
      if (perk && !state.character.perks.includes(effect.grantPerk)) {
        state.character.perks.push(effect.grantPerk);
        for (const stat of STAT_IDS) {
          const bonus = perk.bonuses?.[stat];
          if (bonus) {
            state.character.stats[stat] = clamp(state.character.stats[stat] + bonus, 0, 100);
          }
        }
        outcomes.push({ kind: 'perk', text: `New perk: ${perk.name}` });
      }
    } else if ('recruit' in effect) {
      const def = content.companions[effect.recruit];
      if (def) outcomes.push(...recruit(state, def));
    } else if ('dismiss' in effect) {
      const companion = state.companions[effect.dismiss];
      const def = content.companions[effect.dismiss];
      if (companion && def) {
        companion.present = false;
        companion.gone = true;
        outcomes.push({ kind: 'companion', text: `${def.name} leaves the group` });
      }
    } else if ('kill' in effect) {
      const companion = state.companions[effect.kill];
      const def = content.companions[effect.kill];
      if (companion && def && companion.alive) {
        companion.alive = false;
        companion.present = false;
        outcomes.push({ kind: 'companion', text: `${def.name} is gone` });
      }
    } else if ('advanceDays' in effect) {
      advanceDays(state, effect.advanceDays, outcomes);
    } else if ('travelTo' in effect) {
      state.location = effect.travelTo;
      if (!state.visited.includes(effect.travelTo)) state.visited.push(effect.travelTo);
    } else if ('journal' in effect) {
      state.journal.push({ day: state.day, text: effect.journal });
      outcomes.push({ kind: 'note', text: effect.journal });
    }
  }

  return outcomes;
}

function recruit(state: GameState, def: CompanionDef): Outcome[] {
  const existing = state.companions[def.id];
  if (existing?.present) return [];
  state.companions[def.id] = {
    id: def.id,
    loyalty: existing?.loyalty ?? 50,
    present: true,
    alive: true,
    gone: false,
  };
  return [{ kind: 'companion', text: `${def.name} joins you` }];
}

/**
 * Moves the clock forward, burning supplies. Running out of supplies costs
 * health and morale rather than ending the run outright — starvation is a
 * pressure, not an instant fail state.
 */
export function advanceDays(state: GameState, days: number, outcomes: Outcome[]): void {
  if (days <= 0) return;
  state.day += days;

  const needed = dailyBurn(state) * days;
  const available = state.resources.supplies;
  state.resources.supplies = Math.max(0, available - needed);

  outcomes.push({
    kind: 'time',
    delta: days,
    text: days === 1 ? 'A day passes' : `${days} days pass`,
  });

  const shortfall = needed - available;
  if (shortfall > 0) {
    const damage = Math.ceil(shortfall * 4);
    state.character.health = clamp(state.character.health - damage, 0, state.character.maxHealth);
    state.character.morale = clamp(state.character.morale - Math.ceil(shortfall * 3), 0, 100);
    outcomes.push({ kind: 'health', delta: -damage, text: `Going hungry. Health -${damage}` });

    // Hunger strains the group before it strains the individual.
    for (const companion of Object.values(state.companions)) {
      if (companion.present && companion.alive && !companion.gone) {
        companion.loyalty = clamp(companion.loyalty - 3, 0, 100);
      }
    }
  }
}

/** Applies companion loyalty drift from the tags on a chosen option. */
export function applyCompanionReactions(
  tags: string[] | undefined,
  state: GameState,
  content: StoryContent,
): Outcome[] {
  if (!tags?.length) return [];
  const outcomes: Outcome[] = [];

  for (const companion of Object.values(state.companions)) {
    if (!companion.present || !companion.alive || companion.gone) continue;
    const def = content.companions[companion.id];
    if (!def) continue;

    let delta = 0;
    for (const tag of tags) {
      if (def.likes.includes(tag)) delta += 4;
      if (def.dislikes.includes(tag)) delta -= 5;
    }
    if (delta === 0) continue;

    const before = companion.loyalty;
    companion.loyalty = clamp(before + delta, 0, 100);
    const actual = companion.loyalty - before;
    if (actual !== 0) {
      outcomes.push({
        kind: 'loyalty',
        delta: actual,
        text: `${def.name} ${actual > 0 ? 'approves' : 'disapproves'} (${sign(actual)})`,
      });
    }
  }

  return outcomes;
}
