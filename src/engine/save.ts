/**
 * Save persistence.
 *
 * Saves are versioned and migrated forward on load, so a run started on an
 * older build keeps working after an update rather than silently corrupting.
 * Storage is localStorage with an in-memory fallback, which keeps the game
 * playable in private-browsing modes where localStorage throws.
 */

import { SAVE_VERSION } from './engine';
import type { GameState } from './types';
import { FACTION_IDS, RESOURCE_IDS, STAT_IDS } from './types';

const PREFIX = 'tlrh:save:';
const AUTOSAVE_SLOT = 'auto';
export const MANUAL_SLOTS = [1, 2, 3] as const;

export type SaveSlot = typeof AUTOSAVE_SLOT | (typeof MANUAL_SLOTS)[number];

export interface SaveEnvelope {
  version: number;
  savedAt: string;
  state: GameState;
}

export interface SaveSummary {
  slot: SaveSlot;
  savedAt: string;
  name: string;
  day: number;
  location: string;
  progress: number;
}

/** localStorage throws in some privacy modes; fall back so the game still runs. */
const memoryStore = new Map<string, string>();

function backend(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  try {
    const probe = '__tlrh_probe__';
    globalThis.localStorage.setItem(probe, '1');
    globalThis.localStorage.removeItem(probe);
    return globalThis.localStorage;
  } catch {
    return {
      getItem: (k) => memoryStore.get(k) ?? null,
      setItem: (k, v) => void memoryStore.set(k, v),
      removeItem: (k) => void memoryStore.delete(k),
    };
  }
}

const keyFor = (slot: SaveSlot) => `${PREFIX}${slot}`;

export function save(state: GameState, slot: SaveSlot = AUTOSAVE_SLOT): void {
  const envelope: SaveEnvelope = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state,
  };
  backend().setItem(keyFor(slot), JSON.stringify(envelope));
}

export function load(slot: SaveSlot = AUTOSAVE_SLOT): GameState | undefined {
  const raw = backend().getItem(keyFor(slot));
  if (!raw) return undefined;
  try {
    const envelope = JSON.parse(raw) as SaveEnvelope;
    return migrate(envelope);
  } catch (error) {
    console.warn(`Save in slot ${slot} could not be read`, error);
    return undefined;
  }
}

export function remove(slot: SaveSlot): void {
  backend().removeItem(keyFor(slot));
}

export function summary(slot: SaveSlot, locationNames: Record<string, string>): SaveSummary | undefined {
  const raw = backend().getItem(keyFor(slot));
  if (!raw) return undefined;
  try {
    const envelope = JSON.parse(raw) as SaveEnvelope;
    const state = migrate(envelope);
    return {
      slot,
      savedAt: envelope.savedAt,
      name: state.character.name,
      day: state.day,
      location: locationNames[state.location] ?? state.location,
      progress: state.visited.length,
    };
  } catch {
    return undefined;
  }
}

/**
 * Brings an older save up to the current shape. Each step is additive and
 * defensive — a missing field is filled with a sane default rather than
 * throwing, because a partially-readable save beats a lost run.
 */
export function migrate(envelope: SaveEnvelope): GameState {
  const state = envelope.state;
  const version = envelope.version ?? 1;

  if (version < 2) {
    // v1 tracked a single `supplies` number and no per-resource map.
    const legacy = state as unknown as { supplies?: number };
    state.resources = state.resources ?? ({} as GameState['resources']);
    if (typeof legacy.supplies === 'number') {
      state.resources.supplies = legacy.supplies;
    }
  }

  // Backfill anything a newer build expects but an older save never wrote.
  state.resources = state.resources ?? ({} as GameState['resources']);
  for (const id of RESOURCE_IDS) {
    if (typeof state.resources[id] !== 'number') state.resources[id] = 0;
  }

  state.factions = state.factions ?? ({} as GameState['factions']);
  for (const id of FACTION_IDS) {
    if (typeof state.factions[id] !== 'number') state.factions[id] = 0;
  }

  for (const id of STAT_IDS) {
    if (typeof state.character?.stats?.[id] !== 'number') {
      state.character.stats[id] = 50;
    }
  }

  state.flags ??= {};
  state.counters ??= {};
  state.companions ??= {};
  state.choiceHistory ??= [];
  state.seenNodes ??= [];
  state.journal ??= [];
  state.visited ??= [state.location];
  state.rngCursor ??= 0;
  state.character.echoes ??= [];
  state.character.perks ??= [];
  state.character.traits ??= [];
  state.character.pronouns ??= 'they';

  state.version = SAVE_VERSION;
  return state;
}

export function exportToFile(state: GameState): void {
  const envelope: SaveEnvelope = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `long-road-${state.character.name.replace(/\W+/g, '-').toLowerCase()}-day${state.day}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importFromFile(file: File): Promise<GameState> {
  const text = await file.text();
  const envelope = JSON.parse(text) as SaveEnvelope;
  if (!envelope?.state?.character) throw new Error('That file is not a Long Road save.');
  return migrate(envelope);
}

export { AUTOSAVE_SLOT };
