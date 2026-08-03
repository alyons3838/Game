/**
 * Application shell: owns the current screen, the engine instance, and autosave.
 */

import './styles.css';

import { content } from '@/content';
import { Engine, createInitialState } from '@/engine/engine';
import { AUTOSAVE_SLOT, save } from '@/engine/save';
import type { StepResult } from '@/engine/engine';
import type { GameState } from '@/engine/types';
import type { GenerationResult } from '@/game/generator';
import { creationScreen } from '@/ui/creation';
import { el, mount } from '@/ui/dom';
import { FocusManager } from '@/ui/focus';
import { menuScreen } from '@/ui/menu';
import { endingScreen, journalScreen, mapScreen, sheetScreen, storyScreen } from '@/ui/play';

type Screen = 'menu' | 'creation' | 'story' | 'ending' | 'sheet' | 'map' | 'journal';

class App {
  private root: HTMLElement;
  private statusbar: HTMLElement;
  private main: HTMLElement;
  private focus: FocusManager;

  private engine?: Engine;
  private lastStep?: StepResult;
  private screen: Screen = 'menu';

  constructor(root: HTMLElement) {
    this.root = root;
    this.statusbar = el('header', { class: 'statusbar', hidden: true });
    this.main = el('main');
    this.root.append(this.statusbar, this.main);
    this.focus = new FocusManager(this.root, this.main);

    // Autosave on tab hide as well as after each choice — mobile browsers kill
    // backgrounded tabs without warning and `beforeunload` is unreliable there.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.autosave();
    });

    this.showMenu();
  }

  private autosave(): void {
    if (!this.engine) return;
    save(this.engine.getState(), AUTOSAVE_SLOT);
  }

  private render(screen: Screen, nodes: Node[]): void {
    this.screen = screen;
    mount(this.main, ...nodes);
    this.renderStatusbar();
    this.focus.focusFirst();
  }

  // --- Screens -------------------------------------------------------------

  showMenu(): void {
    this.engine = undefined;
    this.lastStep = undefined;
    this.render(
      'menu',
      menuScreen({
        onNewGame: () => this.showCreation(),
        onContinue: (state) => this.resume(state),
      }),
    );
  }

  showCreation(): void {
    this.render(
      'creation',
      creationScreen({
        onComplete: (result, seed) => this.startRun(result, seed),
        onCancel: () => this.showMenu(),
      }),
    );
  }

  private startRun(result: GenerationResult, seed: string): void {
    const startLocation = content.locations[result.startLocation]
      ? result.startLocation
      : 'seattle';
    const arrival = content.locations[startLocation]?.arrival ?? 'a1-open';

    const state = createInitialState({
      seed,
      character: result.character,
      startLocation,
      startNode: arrival,
    });

    this.engine = new Engine(content, state);
    this.lastStep = this.engine.begin();
    this.autosave();
    this.showStory();
  }

  private resume(state: GameState): void {
    this.engine = new Engine(content, state);
    this.lastStep = undefined;
    if (state.ending) this.showEnding();
    else this.showStory();
  }

  showStory(): void {
    if (!this.engine) return this.showMenu();
    const engine = this.engine;
    this.render(
      'story',
      storyScreen(engine, this.lastStep, (choiceId) => this.choose(choiceId)),
    );
  }

  private choose(choiceId: string): void {
    if (!this.engine) return;
    try {
      this.lastStep = this.engine.choose(choiceId);
    } catch (error) {
      console.error('Choice failed', error);
      return;
    }
    this.autosave();
    if (this.lastStep.ended) this.showEnding();
    else this.showStory();
  }

  showEnding(): void {
    if (!this.engine) return this.showMenu();
    this.render('ending', endingScreen(this.engine, () => this.showMenu()));
  }

  showOverlay(which: 'sheet' | 'map' | 'journal'): void {
    if (!this.engine) return;
    const back = () => this.showStory();
    const builders = { sheet: sheetScreen, map: mapScreen, journal: journalScreen };
    this.render(which, builders[which](this.engine, back));
  }

  // --- Status bar ----------------------------------------------------------

  private renderStatusbar(): void {
    const inRun = Boolean(this.engine) && this.screen !== 'menu' && this.screen !== 'creation';
    this.statusbar.hidden = !inRun;
    if (!inRun || !this.engine) return;

    const state = this.engine.getState();
    const location = content.locations[state.location];
    const supplies = Math.floor(state.resources.supplies);

    this.statusbar.replaceChildren(
      el('span', {}, el('strong', { text: `Day ${state.day}` })),
      el('span', { class: 'stat-chip', text: location?.name ?? state.location }),
      el('span', {
        class: 'stat-chip',
        'data-level': level(state.character.health, 30, 60),
        text: `hp ${Math.round(state.character.health)}`,
      }),
      el('span', {
        class: 'stat-chip',
        'data-level': level(supplies, 10, 25),
        text: `supplies ${supplies}`,
      }),
      el('span', { class: 'statusbar-spacer' }),
      ...(this.screen === 'ending'
        ? []
        : [
            navButton('Sheet', () => this.showOverlay('sheet'), this.screen === 'sheet'),
            navButton('Map', () => this.showOverlay('map'), this.screen === 'map'),
            navButton('Journal', () => this.showOverlay('journal'), this.screen === 'journal'),
          ]),
    );
  }
}

function level(value: number, low: number, warn: number): string {
  if (value <= low) return 'low';
  if (value <= warn) return 'warn';
  return 'ok';
}

function navButton(label: string, onClick: () => void, active: boolean): HTMLElement {
  const btn = el('button', {
    type: 'button',
    class: 'btn',
    'data-focusable': true,
    style: 'padding:0.2em 0.7em;min-height:auto;font-size:inherit',
    'aria-current': active ? 'page' : undefined,
    text: label,
  });
  btn.addEventListener('click', onClick);
  return btn;
}

const root = document.getElementById('app');
if (!root) throw new Error('#app not found');
new App(root);
