/**
 * Condition evaluation.
 *
 * Conditions are plain data trees, never expressions, so there is no `eval`, no
 * `new Function`, and content loaded from anywhere cannot execute code.
 */

import type { Condition, GameState, Range } from './types';

function inRange(value: number, range: Range): boolean {
  if (range.gte !== undefined && value < range.gte) return false;
  if (range.lte !== undefined && value > range.lte) return false;
  return true;
}

export function evaluate(condition: Condition | undefined, state: GameState): boolean {
  if (!condition) return true;

  if ('all' in condition) return condition.all.every((c) => evaluate(c, state));
  if ('any' in condition) return condition.any.some((c) => evaluate(c, state));
  if ('not' in condition) return !evaluate(condition.not, state);

  if ('stat' in condition) return inRange(state.character.stats[condition.stat], condition);
  if ('resource' in condition) return inRange(state.resources[condition.resource], condition);
  if ('faction' in condition) return inRange(state.factions[condition.faction], condition);
  if ('counter' in condition) return inRange(state.counters[condition.counter] ?? 0, condition);
  if ('day' in condition) return inRange(state.day, condition);
  if ('health' in condition) return inRange(state.character.health, condition);
  if ('morale' in condition) return inRange(state.character.morale, condition);

  if ('flag' in condition) {
    const expected = condition.is ?? true;
    return (state.flags[condition.flag] ?? false) === expected;
  }

  if ('hasPerk' in condition) return state.character.perks.includes(condition.hasPerk);
  if ('hasTrait' in condition) return state.character.traits.includes(condition.hasTrait);
  if ('visited' in condition) return state.visited.includes(condition.visited);
  if ('chose' in condition) return state.choiceHistory.includes(condition.chose);

  if ('loyalty' in condition) {
    const companion = state.companions[condition.loyalty];
    if (!companion) return false;
    return inRange(companion.loyalty, condition);
  }

  if ('companion' in condition) {
    const companion = state.companions[condition.companion];
    if (!companion) return false;
    switch (condition.is) {
      case 'present':
        return companion.present && companion.alive && !companion.gone;
      case 'recruited':
        return true; // presence in the map means they were recruited at some point
      case 'alive':
        return companion.alive;
      case 'dead':
        return !companion.alive;
      case 'gone':
        return companion.gone;
    }
  }

  // Exhaustive above; anything reaching here is malformed content.
  return false;
}

/**
 * Produces a short player-facing explanation of why a condition failed, used for
 * greyed-out choices. Returns undefined when the condition passes.
 */
export function explainFailure(
  condition: Condition | undefined,
  state: GameState,
  labels: { stat: Record<string, string>; perk: Record<string, string>; companion: Record<string, string> },
): string | undefined {
  if (!condition || evaluate(condition, state)) return undefined;

  if ('all' in condition) {
    for (const c of condition.all) {
      const reason = explainFailure(c, state, labels);
      if (reason) return reason;
    }
    return 'Requirements not met';
  }
  if ('any' in condition) {
    const reasons = condition.any
      .map((c) => explainFailure(c, state, labels))
      .filter((r): r is string => Boolean(r));
    return reasons[0] ?? 'Requirements not met';
  }
  if ('not' in condition) return 'Not available now';

  if ('stat' in condition && condition.gte !== undefined) {
    return `${labels.stat[condition.stat] ?? condition.stat} ${condition.gte}`;
  }
  if ('hasPerk' in condition) {
    return `Requires ${labels.perk[condition.hasPerk] ?? condition.hasPerk}`;
  }
  if ('companion' in condition) {
    return `Requires ${labels.companion[condition.companion] ?? condition.companion}`;
  }
  if ('loyalty' in condition && condition.gte !== undefined) {
    return `${labels.companion[condition.loyalty] ?? condition.loyalty} must trust you`;
  }
  if ('resource' in condition && condition.gte !== undefined) {
    return `Requires ${condition.gte} ${condition.resource}`;
  }
  if ('faction' in condition && condition.gte !== undefined) {
    return `Requires standing with ${condition.faction}`;
  }
  return 'Requirements not met';
}
