/**
 * Unified input: pointer, keyboard, TV remote D-pad, and gamepad.
 *
 * TV browsers deliver D-pad presses as arrow keys and OK as Enter, so keyboard
 * handling covers remotes for free. Gamepads do not fire key events at all and
 * have to be polled, which is what the rAF loop below is for.
 *
 * The focus ring is deliberately always visible once a non-pointer input is
 * used — on a television, "where am I" is the entire navigation model, and
 * `:focus-visible` alone is not reliable across TV browser engines.
 */

const FOCUSABLE = '[data-focusable]:not([disabled])';

export class FocusManager {
  private root: HTMLElement;
  /**
   * The region holding the actual decision for this screen. It is ordered ahead
   * of everything else for navigation, and is where focus lands after a render.
   *
   * This matters more than it looks: the status bar is a sticky header and so
   * precedes <main> in DOM order. Navigating in raw document order would put
   * "Sheet / Map / Journal" ahead of the story choices, and a player on a remote
   * would open an overlay every time they pressed OK.
   */
  private primary: HTMLElement;
  private pollHandle: number | null = null;
  private lastGamepadState = new Map<number, boolean>();
  private axisCooldown = 0;

  constructor(root: HTMLElement, primary: HTMLElement) {
    this.root = root;
    this.primary = primary;
    this.attach();
  }

  private visible(scope: HTMLElement): HTMLElement[] {
    return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null,
    );
  }

  /** Primary-region items first, then any secondary controls such as the header. */
  private items(): HTMLElement[] {
    const primary = this.visible(this.primary);
    const rest = this.visible(this.root).filter((el) => !primary.includes(el));
    return [...primary, ...rest];
  }

  /**
   * Focuses the first meaningful control after a render, without scrolling.
   *
   * `preventScroll` is load-bearing: the choices sit below the story text, so a
   * plain focus() would scroll the beat the player has not read yet off the top
   * of the screen. Focus is armed; the view stays where reading starts.
   */
  focusFirst(): void {
    const [first] = this.items();
    first?.focus({ preventScroll: true });
  }

  private move(delta: number): void {
    const items = this.items();
    if (items.length === 0) return;

    const active = document.activeElement as HTMLElement | null;
    const index = active ? items.indexOf(active) : -1;
    // Wrapping is correct for a short vertical list and avoids dead ends on a
    // remote, where there is no pointer to recover with.
    const next = index === -1 ? 0 : (index + delta + items.length) % items.length;
    const target = items[next];
    if (!target) return;

    // Deliberate movement *should* scroll — just no further than necessary.
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  private activate(): void {
    const active = document.activeElement as HTMLElement | null;
    if (active && active.matches(FOCUSABLE)) active.click();
  }

  private attach(): void {
    document.addEventListener('keydown', (event) => {
      // Never hijack typing.
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) {
        if (event.key === 'Escape') target.blur();
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          this.setMode('directional');
          this.move(1);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          this.setMode('directional');
          this.move(-1);
          break;
        case 'Enter':
        case ' ':
          if (target?.matches(FOCUSABLE)) {
            event.preventDefault();
            this.activate();
          }
          break;
        default:
          // Number keys select a choice directly — fast on desktop.
          if (/^[1-9]$/.test(event.key)) {
            const items = this.items();
            const item = items[Number(event.key) - 1];
            if (item) {
              event.preventDefault();
              item.click();
            }
          }
      }
    });

    document.addEventListener('pointerdown', () => this.setMode('pointer'));

    window.addEventListener('gamepadconnected', () => this.startPolling());
    window.addEventListener('gamepaddisconnected', () => {
      if (navigator.getGamepads?.().every((g) => !g)) this.stopPolling();
    });

    if (navigator.getGamepads?.().some(Boolean)) this.startPolling();
  }

  private setMode(mode: 'pointer' | 'directional'): void {
    document.documentElement.dataset.input = mode;
  }

  private startPolling(): void {
    if (this.pollHandle !== null) return;
    const poll = () => {
      this.pollGamepads();
      this.pollHandle = requestAnimationFrame(poll);
    };
    this.pollHandle = requestAnimationFrame(poll);
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) cancelAnimationFrame(this.pollHandle);
    this.pollHandle = null;
  }

  private pollGamepads(): void {
    const pads = navigator.getGamepads?.() ?? [];
    if (this.axisCooldown > 0) this.axisCooldown -= 1;

    for (const pad of pads) {
      if (!pad) continue;

      // Standard mapping: 12 = D-pad up, 13 = D-pad down, 0 = A/cross.
      const pressed = (index: number) => pad.buttons[index]?.pressed ?? false;
      const edge = (index: number) => {
        const key = pad.index * 100 + index;
        const now = pressed(index);
        const was = this.lastGamepadState.get(key) ?? false;
        this.lastGamepadState.set(key, now);
        return now && !was;
      };

      if (edge(13)) {
        this.setMode('directional');
        this.move(1);
      }
      if (edge(12)) {
        this.setMode('directional');
        this.move(-1);
      }
      if (edge(0)) this.activate();

      // Left stick, with a cooldown so a held stick does not scroll wildly.
      const y = pad.axes[1] ?? 0;
      if (Math.abs(y) > 0.6 && this.axisCooldown === 0) {
        this.setMode('directional');
        this.move(y > 0 ? 1 : -1);
        this.axisCooldown = 12;
      }
    }
  }
}
