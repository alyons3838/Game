/**
 * Deterministic, resumable random number generation.
 *
 * This is a counter-based PRNG rather than a stateful stream: every draw is a
 * pure hash of `(seed, cursor)`. That means the entire RNG state is two
 * serialisable values, so a save file reloaded mid-run continues the exact same
 * sequence it would have produced had the player never quit. A stateful
 * generator would need its internal words persisted and kept in sync; this
 * cannot drift.
 */

/** FNV-1a, used to turn an arbitrary seed string into a 32-bit integer. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** splitmix32 finaliser — strong avalanche, so adjacent cursors look unrelated. */
function mix(x: number): number {
  let z = x >>> 0;
  z = (z + 0x9e3779b9) >>> 0;
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
  return (z ^ (z >>> 15)) >>> 0;
}

export class Rng {
  readonly seed: string;
  private readonly base: number;
  private cursor: number;

  constructor(seed: string, cursor = 0) {
    this.seed = seed;
    this.base = hashSeed(seed);
    this.cursor = cursor;
  }

  /** Draws consumed so far. Persist this alongside the seed. */
  get position(): number {
    return this.cursor;
  }

  /** Float in [0, 1). */
  next(): number {
    const value = mix(this.base + this.cursor);
    this.cursor += 1;
    return value / 0x100000000;
  }

  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number {
    if (max < min) throw new Error(`Rng.int: max ${max} < min ${min}`);
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Simulates a d20 as a 1-100 roll, for stat checks. */
  d100(): number {
    return this.int(1, 100);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty list');
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Weighted pick. Items with weight <= 0 are never selected. */
  pickWeighted<T>(items: readonly T[], weightOf: (item: T) => number): T | undefined {
    const weights = items.map(weightOf);
    const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
    if (total <= 0) return undefined;

    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      const w = Math.max(0, weights[i] as number);
      if (w <= 0) continue;
      roll -= w;
      if (roll < 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Returns a new shuffled array; does not mutate the input. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  }
}

/** Generates a fresh, human-readable seed for a new run. */
export function makeSeed(): string {
  const bytes = new Uint8Array(8);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
