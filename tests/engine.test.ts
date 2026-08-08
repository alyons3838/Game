import { describe, expect, it } from 'vitest';
import { Rng, hashSeed, makeSeed } from '../src/engine/rng';
import { evaluate } from '../src/engine/conditions';
import { advanceDays, applyCompanionReactions, applyEffects, dailyBurn } from '../src/engine/effects';
import { Engine, SAVE_VERSION, createInitialState } from '../src/engine/engine';
import { migrate } from '../src/engine/save';
import { interpolate } from '../src/engine/text';
import { content } from '../src/content';
import type { CharacterState, GameState, Outcome } from '../src/engine/types';

function makeCharacter(overrides: Partial<CharacterState> = {}): CharacterState {
  return {
    name: 'Tess',
    age: 34,
    pronouns: 'they',
    profession: 'paramedic',
    definingMoment: 'I stayed.',
    whatLost: 'my brother Sam',
    immunityTheory: 'luck',
    stats: { resilience: 50, cunning: 50, empathy: 50, resolve: 50, scavenge: 50 },
    health: 100,
    maxHealth: 100,
    morale: 70,
    perks: [],
    traits: [],
    echoes: [],
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState({
      seed: 'test-seed',
      character: makeCharacter(),
      startLocation: 'seattle',
      startNode: 'a1-open',
    }),
    ...overrides,
  };
}

describe('Rng', () => {
  it('is deterministic for a given seed', () => {
    const a = new Rng('abc');
    const b = new Rng('abc');
    const drawsA = Array.from({ length: 20 }, () => a.next());
    const drawsB = Array.from({ length: 20 }, () => b.next());
    expect(drawsA).toEqual(drawsB);
  });

  it('produces different streams for different seeds', () => {
    const a = Array.from({ length: 10 }, (_, i) => new Rng('one', i).next());
    const b = Array.from({ length: 10 }, (_, i) => new Rng('two', i).next());
    expect(a).not.toEqual(b);
  });

  it('resumes exactly from a persisted cursor', () => {
    const original = new Rng('resume');
    for (let i = 0; i < 7; i++) original.next();
    const expected = Array.from({ length: 5 }, () => original.next());

    // Simulate a save/load: only seed and cursor survive.
    const restored = new Rng('resume', 7);
    const actual = Array.from({ length: 5 }, () => restored.next());
    expect(actual).toEqual(expected);
  });

  it('keeps draws in range', () => {
    const rng = new Rng('range');
    for (let i = 0; i < 500; i++) {
      const value = rng.int(3, 9);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(9);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('never picks a zero-weight item', () => {
    const rng = new Rng('weights');
    const items = [
      { id: 'never', w: 0 },
      { id: 'always', w: 5 },
    ];
    for (let i = 0; i < 200; i++) {
      expect(rng.pickWeighted(items, (it) => it.w)?.id).toBe('always');
    }
  });

  it('returns undefined when every weight is zero', () => {
    const rng = new Rng('zero');
    expect(rng.pickWeighted([{ w: 0 }], (it) => it.w)).toBeUndefined();
  });

  it('shuffle preserves the multiset and does not mutate', () => {
    const rng = new Rng('shuffle');
    const source = [1, 2, 3, 4, 5, 6];
    const shuffled = rng.shuffle(source);
    expect(source).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...shuffled].sort()).toEqual(source);
  });

  it('generates distinct seeds', () => {
    const seeds = new Set(Array.from({ length: 50 }, () => makeSeed()));
    expect(seeds.size).toBe(50);
  });

  it('hashes seeds to unsigned 32-bit integers', () => {
    const hash = hashSeed('anything');
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(0xffffffff);
  });
});

describe('conditions', () => {
  it('treats a missing condition as satisfied', () => {
    expect(evaluate(undefined, makeState())).toBe(true);
  });

  it('evaluates stat ranges inclusively', () => {
    const state = makeState();
    expect(evaluate({ stat: 'cunning', gte: 50 }, state)).toBe(true);
    expect(evaluate({ stat: 'cunning', gte: 51 }, state)).toBe(false);
    expect(evaluate({ stat: 'cunning', lte: 50 }, state)).toBe(true);
  });

  it('defaults a flag check to "is true"', () => {
    const state = makeState({ flags: { seen: true } });
    expect(evaluate({ flag: 'seen' }, state)).toBe(true);
    expect(evaluate({ flag: 'unseen' }, state)).toBe(false);
    expect(evaluate({ flag: 'unseen', is: false }, state)).toBe(true);
  });

  it('composes all / any / not', () => {
    const state = makeState({ flags: { a: true } });
    expect(evaluate({ all: [{ flag: 'a' }, { stat: 'resolve', gte: 40 }] }, state)).toBe(true);
    expect(evaluate({ all: [{ flag: 'a' }, { stat: 'resolve', gte: 99 }] }, state)).toBe(false);
    expect(evaluate({ any: [{ flag: 'b' }, { stat: 'resolve', gte: 40 }] }, state)).toBe(true);
    expect(evaluate({ not: { flag: 'a' } }, state)).toBe(false);
  });

  it('distinguishes companion states', () => {
    const state = makeState({
      companions: {
        riley: { id: 'riley', loyalty: 60, present: true, alive: true, gone: false },
        'ava-chen': { id: 'ava-chen', loyalty: 0, present: false, alive: false, gone: false },
      },
    });
    expect(evaluate({ companion: 'riley', is: 'present' }, state)).toBe(true);
    expect(evaluate({ companion: 'ava-chen', is: 'present' }, state)).toBe(false);
    expect(evaluate({ companion: 'ava-chen', is: 'dead' }, state)).toBe(true);
    expect(evaluate({ companion: 'marcus-williams', is: 'present' }, state)).toBe(false);
  });
});

describe('effects', () => {
  it('clamps stats to 0..100 and reports the actual delta', () => {
    const state = makeState();
    state.character.stats.cunning = 97;
    const outcomes = applyEffects([{ stat: 'cunning', delta: 10 }], state, content);
    expect(state.character.stats.cunning).toBe(100);
    expect(outcomes[0]?.delta).toBe(3);
  });

  it('never drives a resource negative', () => {
    const state = makeState();
    state.resources.ammo = 2;
    applyEffects([{ resource: 'ammo', delta: -10 }], state, content);
    expect(state.resources.ammo).toBe(0);
  });

  it('grants a perk once and applies its bonuses', () => {
    const state = makeState();
    applyEffects([{ grantPerk: 'hardened' }], state, content);
    const afterFirst = state.character.stats.resolve;
    applyEffects([{ grantPerk: 'hardened' }], state, content);
    expect(state.character.perks.filter((p) => p === 'hardened')).toHaveLength(1);
    expect(state.character.stats.resolve).toBe(afterFirst);
  });

  it('recruits a companion and keeps prior loyalty on re-recruit', () => {
    const state = makeState();
    applyEffects([{ recruit: 'riley' }], state, content);
    state.companions.riley!.loyalty = 80;
    state.companions.riley!.present = false;
    applyEffects([{ recruit: 'riley' }], state, content);
    expect(state.companions.riley!.loyalty).toBe(80);
    expect(state.companions.riley!.present).toBe(true);
  });

  it('scales the daily supply burn with party size', () => {
    const state = makeState();
    expect(dailyBurn(state)).toBe(1);
    applyEffects([{ recruit: 'riley' }, { recruit: 'ava-chen' }], state, content);
    expect(dailyBurn(state)).toBe(2);
  });

  it('costs health when supplies run out rather than ending the run', () => {
    const state = makeState();
    state.resources.supplies = 1;
    const outcomes: Outcome[] = [];
    advanceDays(state, 5, outcomes);
    expect(state.resources.supplies).toBe(0);
    expect(state.character.health).toBeLessThan(100);
    expect(state.character.health).toBeGreaterThan(0);
  });

  it('moves companion loyalty from choice tags', () => {
    const state = makeState();
    applyEffects([{ recruit: 'ava-chen' }], state, content);
    const before = state.companions['ava-chen']!.loyalty;
    applyCompanionReactions(['cruel'], state, content);
    expect(state.companions['ava-chen']!.loyalty).toBeLessThan(before);
    applyCompanionReactions(['curious', 'honest'], state, content);
    expect(state.companions['ava-chen']!.loyalty).toBeGreaterThan(before - 5);
  });

  it('ignores reactions from companions who are not present', () => {
    const state = makeState();
    applyEffects([{ recruit: 'ava-chen' }], state, content);
    state.companions['ava-chen']!.present = false;
    const before = state.companions['ava-chen']!.loyalty;
    applyCompanionReactions(['cruel'], state, content);
    expect(state.companions['ava-chen']!.loyalty).toBe(before);
  });
});

describe('text interpolation', () => {
  it('substitutes name and pronoun tokens', () => {
    const state = makeState();
    expect(interpolate('{name} walk{s} on. {They} {are} tired.', state, content)).toBe(
      'Tess walk on. They are tired.',
    );
  });

  it('inflects for she/her', () => {
    const state = makeState();
    state.character.pronouns = 'she';
    expect(interpolate('{They} walk{s}. {Their} pack {are} heavy.', state, content)).toBe(
      'She walks. Her pack is heavy.',
    );
  });

  it('leaves unknown tokens visible so typos surface during authoring', () => {
    const state = makeState();
    expect(interpolate('{nonsense}', state, content)).toBe('{nonsense}');
  });

  it('picks the right indefinite article for a written-in profession', () => {
    const cases: Array<[string, string]> = [
      ['paramedic', 'a'],
      ['emergency room nurse', 'an'],
      ['engineer', 'an'],
      ['hour-long shift worker', 'an'],
      ['honest broker', 'an'],
      ['university lecturer', 'a'],
      ['used car salesman', 'a'],
      ['one-man band', 'a'],
      ['electrician', 'an'],
      ['long haul driver', 'a'],
    ];
    for (const [profession, expected] of cases) {
      const state = makeState();
      state.character.profession = profession;
      expect(interpolate('{article}', state, content), profession).toBe(expected);
    }
  });

  it('names the current party', () => {
    const state = makeState();
    applyEffects([{ recruit: 'riley' }, { recruit: 'ava-chen' }], state, content);
    expect(interpolate('{party}', state, content)).toBe('Riley and Ava Chen');
  });
});

describe('save migration', () => {
  it('carries a v1 supplies field into the resource map', () => {
    const legacy = {
      version: 1,
      savedAt: new Date().toISOString(),
      state: {
        ...makeState(),
        supplies: 42,
        resources: undefined,
      } as unknown as GameState,
    };
    const migrated = migrate(legacy);
    expect(migrated.resources.supplies).toBe(42);
    expect(migrated.version).toBe(SAVE_VERSION);
  });

  it('backfills fields a newer build expects', () => {
    const partial = {
      version: 1,
      savedAt: new Date().toISOString(),
      state: {
        seed: 'x',
        character: { ...makeCharacter(), perks: undefined, echoes: undefined },
        day: 4,
        location: 'denver',
        currentNode: 'a2-denver',
      } as unknown as GameState,
    };
    const migrated = migrate(partial);
    expect(migrated.character.perks).toEqual([]);
    expect(migrated.character.echoes).toEqual([]);
    expect(migrated.flags).toEqual({});
    expect(migrated.visited).toEqual(['denver']);
    expect(migrated.factions.government).toBe(0);
  });
});

describe('Engine', () => {
  it('walks from the opening node into the hub', () => {
    const engine = new Engine(content, makeState());
    engine.begin();
    expect(engine.node.id).toBe('a1-open');

    engine.choose('a1-open-go');
    expect(engine.node.id).toBe('a1-first-night');

    engine.choose('a1-night-listen');
    expect(engine.node.id).toBe('a1-morning');

    engine.choose('a1-morning-on');
    expect(engine.node.id).toBe('hub:seattle');
  });

  it('hides locked choices only when told to', () => {
    const state = makeState();
    state.character.stats.cunning = 10;
    const engine = new Engine(content, state);
    engine.begin();
    engine.choose('a1-open-go');

    const resolved = engine.choices();
    const scout = resolved.find((r) => r.choice.id === 'a1-night-scout');
    expect(scout).toBeDefined();
    expect(scout?.available).toBe(false);
    expect(scout?.lockedReason).toBe('Cunning 50');
  });

  it('refuses a choice whose requirements are not met', () => {
    const state = makeState();
    state.character.stats.cunning = 10;
    const engine = new Engine(content, state);
    engine.begin();
    engine.choose('a1-open-go');
    expect(() => engine.choose('a1-night-scout')).toThrow(/not available/);
  });

  it('throws on an unknown choice id', () => {
    const engine = new Engine(content, makeState());
    engine.begin();
    expect(() => engine.choose('does-not-exist')).toThrow(/Unknown choice/);
  });

  it('resolves @hub against the current location', () => {
    const state = makeState({ location: 'denver', currentNode: 'a2-denver-ava-2' });
    const engine = new Engine(content, state);
    engine.choose('a2-ava-join');
    expect(engine.node.id).toBe('hub:denver');
  });

  it('resolves @encounter to a real encounter node', () => {
    const state = makeState({ currentNode: 'hub:denver', location: 'denver' });
    const engine = new Engine(content, state);
    engine.choose('denver-explore');
    const node = engine.node;
    expect(Boolean(node.encounter) || node.id.startsWith('hub:')).toBe(true);
  });

  it('produces identical runs from identical seeds', () => {
    const walk = () => {
      const engine = new Engine(content, makeState({ currentNode: 'hub:denver', location: 'denver' }));
      const visited: string[] = [];
      for (let i = 0; i < 6; i++) {
        const available = engine.choices().filter((r) => r.available);
        const pick = available.find((r) => r.choice.id.endsWith('-explore')) ?? available[0];
        if (!pick) break;
        engine.choose(pick.choice.id);
        visited.push(engine.node.id);
      }
      return visited;
    };
    expect(walk()).toEqual(walk());
  });

  it('fires a backstory echo when its trigger node is reached', () => {
    const character = makeCharacter({
      echoes: [
        { id: 'e1', trigger: 'a1-first-night', text: 'You think about the hospital.', used: false },
      ],
    });
    const engine = new Engine(content, makeState({ character }));
    engine.begin();
    const step = engine.choose('a1-open-go');
    expect(step.echo?.id).toBe('e1');
    expect(engine.getState().character.echoes[0]!.used).toBe(true);
  });

  it('fires each echo only once', () => {
    const character = makeCharacter({
      echoes: [{ id: 'e1', trigger: 'a1-first-night', text: 'Once.', used: false }],
    });
    const engine = new Engine(content, makeState({ character }));
    engine.begin();
    expect(engine.choose('a1-open-go').echo).toBeDefined();
    engine.choose('a1-night-listen');
    const back = new Engine(content, {
      ...engine.getState(),
      currentNode: 'a1-open',
    });
    expect(back.choose('a1-open-go').echo).toBeUndefined();
  });

  it('drops a companion whose loyalty reaches zero', () => {
    const state = makeState({ currentNode: 'hub:denver', location: 'denver' });
    const engine = new Engine(content, state);
    applyEffects([{ recruit: 'ava-chen' }], state, content);
    state.companions['ava-chen']!.loyalty = 0;

    // `denver-rest` carries no tags, so nothing can lift her back above zero
    // before the departure check runs.
    const step = engine.choose('denver-rest');
    expect(state.companions['ava-chen']!.gone).toBe(true);
    expect(state.companions['ava-chen']!.present).toBe(false);
    expect(step.outcomes.some((o) => o.kind === 'companion')).toBe(true);
  });

  it('lets an approving choice pull a companion back from the brink', () => {
    const state = makeState({ currentNode: 'hub:denver', location: 'denver' });
    const engine = new Engine(content, state);
    applyEffects([{ recruit: 'ava-chen' }], state, content);
    state.companions['ava-chen']!.loyalty = 0;

    // `denver-explore` is tagged `curious`, which Ava likes — the reaction is
    // applied before the departure check, so she stays.
    engine.choose('denver-explore');
    expect(state.companions['ava-chen']!.gone).toBe(false);
    expect(state.companions['ava-chen']!.loyalty).toBeGreaterThan(0);
  });

  it('records an ending and marks the run finished', () => {
    const state = makeState({ currentNode: 'a4-decision', location: 'washington-dc' });
    const engine = new Engine(content, state);
    const step = engine.choose('a4-end-alliance');
    expect(step.ended).toBe(true);
    expect(engine.getState().ending).toBe('alliance');
    expect(engine.node.choices).toHaveLength(0);
  });

  it('reports progress by furthest distance reached', () => {
    const engine = new Engine(
      content,
      makeState({ location: 'denver', visited: ['seattle', 'salt-lake-city', 'denver'] }),
    );
    expect(engine.progress()).toBeCloseTo(40, 0);
  });

  it('keeps the persisted rng cursor in step with the generator', () => {
    const state = makeState({ currentNode: 'hub:denver', location: 'denver' });
    const engine = new Engine(content, state);
    engine.choose('denver-explore');
    const saved = engine.getState();
    expect(saved.rngCursor).toBeGreaterThan(0);

    // A reloaded engine must continue the same stream, not restart it.
    const reloaded = new Engine(content, JSON.parse(JSON.stringify(saved)) as GameState);
    const a = reloaded.getState().rngCursor;
    expect(a).toBe(saved.rngCursor);
  });
});
