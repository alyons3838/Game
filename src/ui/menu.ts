import { AUTOSAVE_SLOT, MANUAL_SLOTS, load, remove, summary } from '@/engine/save';
import type { SaveSlot } from '@/engine/save';
import { content } from '@/content';
import type { GameState } from '@/engine/types';
import { button, el } from './dom';

interface MenuHandlers {
  onNewGame: () => void;
  onContinue: (state: GameState) => void;
}

const locationNames = Object.fromEntries(
  Object.values(content.locations).map((l) => [l.id, l.name]),
);

export function menuScreen(handlers: MenuHandlers): Node[] {
  const auto = summary(AUTOSAVE_SLOT, locationNames);

  const nodes: Node[] = [
    el('h1', { text: 'The Long Road Home' }),
    el('p', {
      class: 'subtitle',
      text: 'Three thousand miles east, and a decision waiting at the end of it.',
    }),
  ];

  const actions = el('div', { class: 'choices' });

  if (auto) {
    actions.append(
      button(
        `Continue — day ${auto.day}, ${auto.location}`,
        () => {
          const state = load(AUTOSAVE_SLOT);
          if (state) handlers.onContinue(state);
        },
        { class: 'choice btn-primary', hint: `${auto.name} · saved ${relativeTime(auto.savedAt)}` },
      ),
    );
  }

  actions.append(
    button('New game', handlers.onNewGame, {
      class: 'choice',
      hint: auto ? 'This will overwrite the autosave when you begin' : undefined,
    }),
  );

  const slots = MANUAL_SLOTS.map((slot) => summary(slot, locationNames)).filter(Boolean);
  if (slots.length > 0) {
    actions.append(
      button('Load a save', () => renderSlots(handlers), { class: 'choice' }),
    );
  }

  nodes.push(actions);

  nodes.push(
    el(
      'p',
      { class: 'keyhint' },
      'Arrow keys or D-pad to move · Enter or A to choose · number keys jump straight to an option',
    ),
  );

  return nodes;
}

function renderSlots(handlers: MenuHandlers): void {
  const main = document.querySelector('main');
  if (!main) return;

  const list = el('div', { class: 'choices' });

  for (const slot of MANUAL_SLOTS) {
    const info = summary(slot, locationNames);
    if (!info) {
      list.append(button(`Slot ${slot} — empty`, () => {}, { class: 'choice', disabled: true }));
      continue;
    }
    list.append(
      button(
        `Slot ${slot} — ${info.name}, day ${info.day}`,
        () => {
          const state = load(slot);
          if (state) handlers.onContinue(state);
        },
        { class: 'choice', hint: `${info.location} · ${relativeTime(info.savedAt)}` },
      ),
    );
  }

  list.append(
    button('Back', () => window.location.reload(), { class: 'choice' }),
  );

  main.replaceChildren(el('h2', { text: 'Load a save' }), list);
  (list.querySelector('[data-focusable]') as HTMLElement | null)?.focus();
}

export function deleteSlot(slot: SaveSlot): void {
  remove(slot);
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
