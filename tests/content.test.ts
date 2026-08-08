import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { validateContent } from '../src/content/validate';
import { Engine, createInitialState, hubNodeId } from '../src/engine/engine';
import { generateCharacter } from '../src/game/generator';
import type { BackstoryInput } from '../src/game/generator';
import { nextLeg } from '../src/content/locations';
import type { GameState } from '../src/engine/types';

describe('content integrity', () => {
  const issues = validateContent(content);

  it('has no dangling references, dead ends, or orphaned nodes', () => {
    const errors = issues.filter((i) => i.severity === 'error');
    expect(errors.map((e) => `${e.node ?? '-'}: ${e.message}`)).toEqual([]);
  });

  it('has no validator warnings', () => {
    const warnings = issues.filter((i) => i.severity === 'warning');
    expect(warnings.map((w) => `${w.node ?? '-'}: ${w.message}`)).toEqual([]);
  });

  it('ships a meaningful amount of story', () => {
    const nodeCount = Object.keys(content.nodes).length;
    const choiceCount = Object.values(content.nodes).reduce(
      (sum, node) => sum + node.choices.length,
      0,
    );
    expect(nodeCount).toBeGreaterThanOrEqual(60);
    expect(choiceCount).toBeGreaterThanOrEqual(140);
  });

  it('covers every act', () => {
    const acts = new Set(Object.values(content.nodes).map((n) => n.act));
    expect([...acts].sort()).toEqual([1, 2, 3, 4]);
  });

  it('gives every location a hub with a way onward', () => {
    for (const location of Object.values(content.locations)) {
      const hub = content.nodes[hubNodeId(location.id)];
      expect(hub, `missing hub for ${location.id}`).toBeDefined();
      expect(hub!.choices.length).toBeGreaterThan(0);
    }
  });

  it('links the route from every starting city to Washington', () => {
    for (const start of ['seattle', 'san-francisco', 'los-angeles', 'phoenix']) {
      let current: string | undefined = start;
      const seen = new Set<string>();
      while (current && !seen.has(current)) {
        seen.add(current);
        current = nextLeg(current)?.to;
      }
      expect(seen.has('washington-dc'), `${start} never reaches Washington`).toBe(true);
    }
  });

  it('offers at least one always-available choice on every non-terminal node', () => {
    // A node whose every option is gated could strand a low-stat character.
    for (const node of Object.values(content.nodes)) {
      if (node.ending) continue;
      const ungated = node.choices.filter((c) => !c.requires);
      expect(ungated.length, `${node.id} has no unconditional choice`).toBeGreaterThan(0);
    }
  });

  it('marks every locked-but-visible choice with a hint', () => {
    for (const node of Object.values(content.nodes)) {
      for (const choice of node.choices) {
        if (choice.requires && choice.hideWhenLocked === false) {
          expect(choice.lockedHint, `${node.id}/${choice.id} needs a lockedHint`).toBeTruthy();
        }
      }
    }
  });

  it('gives every companion a home location and a valid perk', () => {
    for (const companion of Object.values(content.companions)) {
      expect(content.locations[companion.location]).toBeDefined();
      if (companion.perk) expect(content.perks[companion.perk]).toBeDefined();
      expect(companion.likes.length).toBeGreaterThan(0);
      expect(companion.dislikes.length).toBeGreaterThan(0);
    }
  });

  it('makes every companion recruitable somewhere in the graph', () => {
    const recruited = new Set<string>();
    for (const node of Object.values(content.nodes)) {
      for (const effect of [...(node.onEnter ?? []), ...node.choices.flatMap((c) => c.effects ?? [])]) {
        if ('recruit' in effect) recruited.add(effect.recruit);
      }
    }
    for (const id of Object.keys(content.companions)) {
      expect(recruited.has(id), `${id} can never be recruited`).toBe(true);
    }
  });
});

describe('character generation', () => {
  const base: BackstoryInput = {
    name: 'Ines',
    age: 41,
    pronouns: 'she',
    profession: 'emergency room nurse',
    definingMoment:
      'I stayed for a double shift and a man lived who would not have. I never told anyone about it.',
    whatLost: 'I lost my sister Nadia, who was three hours away and told me to stay put.',
    immunityTheory: 'I had every vaccine going. It is the only thing that makes any sense.',
  };

  it('is deterministic for a given seed', () => {
    const a = generateCharacter(base, content, 'seed-1');
    const b = generateCharacter(base, content, 'seed-1');
    expect(a).toEqual(b);
  });

  it('detects the concepts a backstory actually contains', () => {
    const result = generateCharacter(base, content, 'seed-2');
    expect(result.affinities).toContain('medicine');
    expect(result.affinities).toContain('loss');
  });

  it('gives a medical backstory a medical perk', () => {
    const result = generateCharacter(base, content, 'seed-3');
    const perkIds = result.character.perks;
    expect(perkIds.some((id) => ['first-response', 'clinical-eye'].includes(id))).toBe(true);
  });

  it('shapes stats differently for different professions', () => {
    const nurse = generateCharacter(base, content, 'seed-4');
    const engineer = generateCharacter(
      { ...base, profession: 'structural engineer', definingMoment: 'I built things that held.' },
      content,
      'seed-4',
    );
    expect(nurse.character.stats).not.toEqual(engineer.character.stats);
    expect(engineer.character.stats.cunning).toBeGreaterThan(engineer.character.stats.empathy);
  });

  it('keeps every character within a comparable power budget', () => {
    const inputs: BackstoryInput[] = [
      base,
      { ...base, profession: 'soldier', definingMoment: 'Two tours. I came back.' },
      { ...base, profession: 'poet', definingMoment: 'I wrote about my mother and she read it.' },
      { ...base, profession: 'zzzz', definingMoment: 'zzzz', whatLost: 'zzzz', immunityTheory: 'zzzz' },
    ];
    for (const input of inputs) {
      const result = generateCharacter(input, content, 'budget');
      const total = Object.values(result.character.stats).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThan(230);
      expect(total).toBeLessThan(330);
    }
  });

  it('always produces at least two perks and one echo', () => {
    const sparse = generateCharacter(
      { ...base, profession: 'x', definingMoment: 'abc', whatLost: '', immunityTheory: '' },
      content,
      'sparse',
    );
    expect(sparse.character.perks.length).toBeGreaterThanOrEqual(2);
    expect(sparse.character.echoes.length).toBeGreaterThanOrEqual(1);
  });

  it('quotes the player back to them in echoes', () => {
    const result = generateCharacter(base, content, 'echo');
    const joined = result.character.echoes.map((e) => e.text).join(' ');
    expect(joined.toLowerCase()).toContain('nadia');
  });

  it('only grants perks that exist in content', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const result = generateCharacter(base, content, seed);
      for (const id of result.character.perks) {
        expect(content.perks[id], `unknown perk ${id}`).toBeDefined();
      }
      for (const id of result.character.traits) {
        expect(content.traits[id], `unknown trait ${id}`).toBeDefined();
      }
    }
  });

  it('picks a start location that exists and has an arrival node', () => {
    const result = generateCharacter(base, content, 'start');
    const location = content.locations[result.startLocation];
    expect(location).toBeDefined();
    expect(content.nodes[location!.arrival!]).toBeDefined();
  });
});

describe('playthrough', () => {
  /** Walks the graph greedily and asserts the run terminates in an ending. */
  function playToEnd(seed: string, strategy: 'first' | 'last'): GameState {
    const generated = generateCharacter(
      {
        name: 'Walker',
        age: 34,
        pronouns: 'they',
        profession: 'long haul driver',
        definingMoment: 'I drove through the night and did not stop when I should have.',
        whatLost: 'my dog, and the house',
        immunityTheory: 'nothing, I have no idea',
      },
      content,
      seed,
    );

    const state = createInitialState({
      seed,
      character: generated.character,
      startLocation: generated.startLocation,
      startNode: content.locations[generated.startLocation]!.arrival!,
    });

    const engine = new Engine(content, state);
    engine.begin();

    for (let step = 0; step < 400; step++) {
      if (engine.getState().ending) break;
      const available = engine.choices().filter((r) => r.available);
      expect(available.length, `stranded at ${engine.node.id}`).toBeGreaterThan(0);

      // Prefer moving east so the walk terminates instead of looping in a hub.
      const depart = available.find((r) => r.choice.id.endsWith('-depart'));
      const pick =
        depart ??
        (strategy === 'first' ? available[0]! : available[available.length - 1]!);
      engine.choose(pick.choice.id);
    }

    return engine.getState();
  }

  it('reaches an ending taking the first available option', () => {
    const state = playToEnd('walk-first', 'first');
    expect(state.ending).toBeDefined();
    expect(content.endings[state.ending!]).toBeDefined();
  });

  it('reaches an ending taking the last available option', () => {
    const state = playToEnd('walk-last', 'last');
    expect(state.ending).toBeDefined();
  });

  it('never strands the player without a choice', () => {
    // Covered by the assertion inside playToEnd; run several seeds for coverage.
    for (const seed of ['s1', 's2', 's3', 's4']) {
      expect(playToEnd(seed, 'first').ending).toBeDefined();
    }
  });

  it('takes a plausible number of days to cross the country', () => {
    const state = playToEnd('days', 'first');
    expect(state.day).toBeGreaterThan(40);
    expect(state.day).toBeLessThan(400);
  });

  it('writes journal entries along the way', () => {
    const state = playToEnd('journal', 'last');
    expect(state.journal.length).toBeGreaterThan(2);
  });
});
