/**
 * The play screens: the story beat itself, plus the character sheet, map and
 * journal overlays reachable from the status bar.
 */

import { content } from '@/content';
import { ROUTE, START_LOCATIONS } from '@/content';
import type { Engine, StepResult } from '@/engine/engine';
import { dailyBurn } from '@/engine/effects';
import type { Outcome, RollResult, StatId } from '@/engine/types';
import { STAT_IDS } from '@/engine/types';
import { button, el } from './dom';

const STAT_LABELS: Record<StatId, string> = {
  resilience: 'Resilience',
  cunning: 'Cunning',
  empathy: 'Empathy',
  resolve: 'Resolve',
  scavenge: 'Scavenge',
};

const KIND_LABELS: Record<string, string> = {
  stat: 'skill',
  perk: 'perk',
  trait: 'trait',
  companion: 'companion',
  backstory: 'personal',
  faction: 'standing',
  memory: 'memory',
  risk: 'risk',
};

export function storyScreen(
  engine: Engine,
  last: StepResult | undefined,
  onChoose: (choiceId: string) => void,
): Node[] {
  const node = engine.node;
  const nodes: Node[] = [];

  if (node.title) nodes.push(el('h2', { text: node.title }));
  if (node.speaker && node.speaker !== 'Narrator') {
    nodes.push(el('p', { class: 'speaker', text: node.speaker }));
  }

  // Consequences of the choice that got us here, before the new text.
  if (last?.outcomes.length) {
    nodes.push(outcomePanel(last.outcomes, last.roll));
  }

  const prose = el('div', { class: 'prose' });
  for (const paragraph of engine.body()) {
    prose.append(el('p', { text: paragraph }));
  }
  nodes.push(prose);

  // Backstory callback, if this node triggered one.
  if (last?.echo) {
    const echo = el('blockquote', { class: 'echo' });
    echo.append(el('span', { class: 'echo-label', text: 'You remember' }));
    echo.append(el('p', { text: last.echo.text }));
    nodes.push(echo);
  }

  const choices = el('div', { class: 'choices' });
  for (const resolved of engine.choices()) {
    const { choice, available, lockedReason } = resolved;

    const label = el('span');
    if (choice.kind && choice.kind !== 'standard') {
      label.append(
        el('span', {
          class: 'choice-kind',
          text: KIND_LABELS[choice.kind] ?? choice.kind,
        }),
      );
    }
    label.append(document.createTextNode(engine.text(choice.text)));

    const btn = button(label, () => onChoose(choice.id), {
      class: 'choice',
      disabled: !available,
      ...(available ? {} : { hint: lockedReason }),
    });
    btn.dataset.kind = choice.kind ?? 'standard';
    choices.append(btn);
  }
  nodes.push(choices);

  return nodes;
}

function outcomePanel(outcomes: Outcome[], roll?: RollResult): HTMLElement {
  const panel = el('div', { class: 'outcomes' });

  if (roll) {
    panel.append(
      el('span', {
        class: 'roll-line',
        text: `${STAT_LABELS[roll.stat]} check — ${roll.total} against ${roll.dc} · ${
          roll.success ? 'success' : 'failure'
        }`,
      }),
    );
  }

  for (const outcome of outcomes) {
    // The roll line already says this, more legibly.
    if (outcome.kind === 'note' && outcome.text.includes(' check — ')) continue;
    const dir = outcome.delta === undefined ? 'flat' : outcome.delta > 0 ? 'up' : 'down';
    panel.append(el('span', { class: 'outcome', 'data-dir': dir, text: outcome.text }));
  }

  return panel;
}

export function endingScreen(engine: Engine, onRestart: () => void): Node[] {
  const state = engine.getState();
  const node = engine.node;
  const ending = state.ending ? content.endings[state.ending] : undefined;

  const wrapper = el('div', { class: 'ending' });
  wrapper.append(el('h1', { text: node.title ?? ending?.name ?? 'The End' }));

  const prose = el('div', { class: 'prose' });
  for (const paragraph of engine.body()) prose.append(el('p', { text: paragraph }));
  wrapper.append(prose);

  const survivors = engine
    .party()
    .map((entry) => entry.def.name);
  const lost = Object.values(state.companions)
    .filter((c) => !c.alive)
    .map((c) => content.companions[c.id]?.name)
    .filter(Boolean);

  const summary = el('div', { class: 'run-summary' });
  const dl = el('dl');
  const row = (term: string, value: string) => {
    dl.append(el('dt', { text: term }), el('dd', { text: value }));
  };
  row('Days on the road', String(state.day));
  row('Choices made', String(state.choiceHistory.length));
  row('Places reached', String(state.visited.length));
  row('With you at the end', survivors.length ? survivors.join(', ') : 'no one');
  if (lost.length) row('Did not arrive', lost.join(', '));
  row('Seed', state.seed);
  summary.append(dl);
  wrapper.append(summary);

  const row2 = el('div', { class: 'btn-row' });
  row2.append(button('Walk it again', onRestart, { class: 'btn btn-primary' }));
  wrapper.append(row2);

  return [wrapper];
}

export function sheetScreen(engine: Engine, onBack: () => void): Node[] {
  const state = engine.getState();
  const c = state.character;

  const nodes: Node[] = [
    el('h2', { text: c.name }),
    el('p', { class: 'subtitle', text: `${c.age}, ${c.profession}` }),
  ];

  const stats = el('div', { class: 'sheet-section' });
  stats.append(el('h3', { text: 'Condition' }));
  stats.append(bar('Health', c.health, c.maxHealth));
  stats.append(bar('Morale', c.morale, 100));
  nodes.push(stats);

  const attrs = el('div', { class: 'sheet-section' });
  attrs.append(el('h3', { text: 'Attributes' }));
  for (const stat of STAT_IDS) {
    attrs.append(bar(STAT_LABELS[stat], c.stats[stat], 100));
  }
  nodes.push(attrs);

  if (c.perks.length) {
    const perks = el('div', { class: 'sheet-section' });
    perks.append(el('h3', { text: 'Perks' }));
    for (const id of c.perks) {
      const perk = content.perks[id];
      if (!perk) continue;
      const card = el('div', { class: 'card' });
      card.append(el('div', { class: 'card-title', text: `${perk.icon}  ${perk.name}` }));
      card.append(el('div', { class: 'card-body', text: perk.description }));
      perks.append(card);
    }
    nodes.push(perks);
  }

  if (c.traits.length) {
    const traits = el('div', { class: 'sheet-section' });
    traits.append(el('h3', { text: 'Traits' }));
    for (const id of c.traits) {
      const trait = content.traits[id];
      if (!trait) continue;
      const card = el('div', { class: 'card' });
      card.append(el('div', { class: 'card-title', text: trait.name }));
      card.append(el('div', { class: 'card-body', text: trait.description }));
      traits.append(card);
    }
    nodes.push(traits);
  }

  const party = engine.party();
  const partySection = el('div', { class: 'sheet-section' });
  partySection.append(el('h3', { text: 'Travelling with you' }));
  if (party.length === 0) {
    partySection.append(el('p', { class: 'muted', text: 'No one. You are walking this alone.' }));
  } else {
    for (const { state: companion, def } of party) {
      const card = el('div', { class: 'card' });
      card.append(el('div', { class: 'card-title', text: def.name }));
      card.append(el('div', { class: 'card-body', text: def.role }));
      const track = el('div', { class: 'loyalty-track' });
      track.append(
        el('div', {
          class: 'loyalty-fill',
          'data-low': String(companion.loyalty < 30),
          style: `width:${companion.loyalty}%`,
        }),
      );
      card.append(track);
      partySection.append(card);
    }
  }
  nodes.push(partySection);

  const supplies = el('div', { class: 'sheet-section' });
  supplies.append(el('h3', { text: 'Carried' }));
  const burn = dailyBurn(state);
  supplies.append(
    el('p', {
      class: 'muted',
      text:
        `Supplies ${Math.floor(state.resources.supplies)} · medicine ${state.resources.meds} · ` +
        `ammunition ${state.resources.ammo} · fuel ${state.resources.fuel}`,
    }),
    el('p', {
      class: 'tiny',
      text: `Burning ${burn.toFixed(1)} supplies a day — roughly ${Math.floor(
        state.resources.supplies / burn,
      )} days left at this rate.`,
    }),
  );
  nodes.push(supplies);

  nodes.push(el('div', { class: 'btn-row' }, button('Back', onBack, { class: 'btn' })));
  return nodes;
}

export function mapScreen(engine: Engine, onBack: () => void): Node[] {
  const state = engine.getState();
  const start = START_LOCATIONS.find((id) => state.visited.includes(id)) ?? 'seattle';
  const order = [start, ...ROUTE];

  const list = el('ul', { class: 'route' });
  for (const id of order) {
    const location = content.locations[id];
    if (!location) continue;

    const isHere = state.location === id;
    const isPast = !isHere && state.visited.includes(id);
    const stateName = isHere ? 'here' : isPast ? 'past' : 'ahead';

    const item = el('li', { 'data-state': stateName });
    item.append(el('span', { class: 'pip', text: isHere ? '◆' : isPast ? '●' : '○' }));
    item.append(
      el(
        'span',
        { class: 'place' },
        el('strong', { text: location.name }),
        isHere || isPast ? el('div', { class: 'tiny', text: location.blurb }) : null,
      ),
    );
    item.append(el('span', { class: 'miles', text: `${location.mile} mi` }));
    list.append(item);
  }

  return [
    el('h2', { text: 'The road east' }),
    el('p', {
      class: 'subtitle',
      text: `Day ${state.day}. ${engine.progress().toFixed(0)}% of the distance behind you.`,
    }),
    list,
    el('div', { class: 'btn-row' }, button('Back', onBack, { class: 'btn' })),
  ];
}

export function journalScreen(engine: Engine, onBack: () => void): Node[] {
  const state = engine.getState();
  const nodes: Node[] = [el('h2', { text: 'Journal' })];

  if (state.journal.length === 0) {
    nodes.push(el('p', { class: 'muted', text: 'Nothing worth writing down yet.' }));
  } else {
    const list = el('ul', { class: 'journal' });
    for (const entry of [...state.journal].reverse()) {
      const item = el('li');
      item.append(el('span', { class: 'day', text: `Day ${entry.day}` }));
      item.append(document.createTextNode(engine.text(entry.text)));
      list.append(item);
    }
    nodes.push(list);
  }

  nodes.push(el('div', { class: 'btn-row' }, button('Back', onBack, { class: 'btn' })));
  return nodes;
}

function bar(label: string, value: number, max: number): HTMLElement {
  const row = el('div', { class: 'stat-row' });
  row.append(el('span', { text: label }));
  const track = el('div', { class: 'stat-track' });
  track.append(el('div', { class: 'stat-fill', style: `width:${(value / max) * 100}%` }));
  row.append(track);
  row.append(el('span', { class: 'stat-value', text: String(Math.round(value)) }));
  return row;
}
