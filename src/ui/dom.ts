/** Minimal DOM helpers — no framework, no virtual DOM, no build-time templates. */

type Attrs = Record<string, string | number | boolean | undefined>;
type Child = Node | string | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'text') node.textContent = String(value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }

  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }

  return node;
}

export function clear(node: HTMLElement): void {
  node.replaceChildren();
}

/** A focusable, activatable button that the FocusManager can navigate to. */
export function button(
  label: string | Node,
  onClick: () => void,
  options: { class?: string; disabled?: boolean; hint?: string } = {},
): HTMLButtonElement {
  const node = el('button', {
    class: options.class ?? 'btn',
    type: 'button',
    'data-focusable': !options.disabled,
    disabled: options.disabled,
  });

  if (typeof label === 'string') node.append(document.createTextNode(label));
  else node.append(label);

  if (options.hint) {
    node.append(el('span', { class: 'btn-hint', text: options.hint }));
  }

  if (!options.disabled) node.addEventListener('click', onClick);
  return node;
}

/** Fades new screen content in and returns the reader to the top of it. */
export function mount(container: HTMLElement, ...children: Node[]): void {
  clear(container);
  const frag = document.createDocumentFragment();
  frag.append(...children);
  container.append(frag);

  // The document is the scroller, not `container` — resetting only the
  // element's scrollTop leaves the player looking at the middle of a new beat.
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

  container.classList.remove('enter');
  // Force a reflow so the animation restarts on every mount.
  void container.offsetWidth;
  container.classList.add('enter');
}
