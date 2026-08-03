/**
 * Character creation.
 *
 * A single scrolling form rather than a step-by-step wizard: on a phone the
 * whole thing is one thumb-scroll, and on a TV the D-pad walks straight down it.
 * The previous version paginated this across six screens and injected raw
 * `<input>` elements at absolute pixel coordinates over a scaled canvas, which
 * put them off-screen on every device that was not exactly 1920x1080.
 */

import { content } from '@/content';
import type { Pronouns } from '@/engine/types';
import { generateCharacter } from '@/game/generator';
import type { BackstoryInput, GenerationResult } from '@/game/generator';
import { DEFAULT_AI_CONFIG, aiAvailable, enhanceWithAi } from '@/game/ai';
import { makeSeed } from '@/engine/rng';
import { button, el } from './dom';

interface CreationHandlers {
  onComplete: (result: GenerationResult, seed: string) => void;
  onCancel: () => void;
}

const PROMPTS = {
  profession: {
    label: 'What did you do before?',
    help: 'Write it however you like — "ER nurse", "drove long haul", "taught year fours". This is the strongest signal for what you start good at.',
    placeholder: 'e.g. emergency room nurse',
  },
  definingMoment: {
    label: 'A moment that made you who you are',
    help: 'Two or three sentences. It does not have to be dramatic. It has to be yours — the game will quote it back to you on the road.',
    placeholder: 'e.g. I stayed late to cover a shift for someone who never thanked me, and a man lived because of it. I never told anyone.',
  },
  whatLost: {
    label: 'What did you lose when it happened?',
    help: 'People, places, a version of yourself. Be specific if you can; specifics are what echo later.',
    placeholder: 'e.g. my sister Nadia, who was three hours away and told me to stay put',
  },
  immunityTheory: {
    label: 'Why do you think you are immune?',
    help: 'Your theory. It does not have to be right, and the story has an opinion about it.',
    placeholder: 'e.g. I had every vaccine going. It is the only thing that makes sense.',
  },
} as const;

export function creationScreen(handlers: CreationHandlers): Node[] {
  let pronouns: Pronouns = 'they';

  const nameInput = el('input', {
    type: 'text',
    id: 'f-name',
    'data-focusable': true,
    maxlength: 40,
    autocomplete: 'off',
    placeholder: 'Your name',
  });

  const ageInput = el('input', {
    type: 'number',
    id: 'f-age',
    'data-focusable': true,
    min: 14,
    max: 90,
    value: 34,
  });

  const fields: Record<keyof typeof PROMPTS, HTMLTextAreaElement | HTMLInputElement> = {
    profession: el('input', {
      type: 'text',
      id: 'f-profession',
      'data-focusable': true,
      maxlength: 120,
      placeholder: PROMPTS.profession.placeholder,
    }),
    definingMoment: el('textarea', {
      id: 'f-definingMoment',
      'data-focusable': true,
      maxlength: 600,
      rows: 4,
      placeholder: PROMPTS.definingMoment.placeholder,
    }),
    whatLost: el('textarea', {
      id: 'f-whatLost',
      'data-focusable': true,
      maxlength: 400,
      rows: 3,
      placeholder: PROMPTS.whatLost.placeholder,
    }),
    immunityTheory: el('textarea', {
      id: 'f-immunityTheory',
      'data-focusable': true,
      maxlength: 400,
      rows: 3,
      placeholder: PROMPTS.immunityTheory.placeholder,
    }),
  };

  const errorBox = el('p', { class: 'field-error' });
  const statusBox = el('p', { class: 'tiny' });

  const pronounRow = el('div', { class: 'pronoun-row' });
  const pronounOptions: Array<{ value: Pronouns; label: string }> = [
    { value: 'they', label: 'they / them' },
    { value: 'she', label: 'she / her' },
    { value: 'he', label: 'he / him' },
  ];
  const pronounButtons = pronounOptions.map((option) => {
    const btn = button(
      option.label,
      () => {
        pronouns = option.value;
        for (const [index, b] of pronounButtons.entries()) {
          b.setAttribute('aria-pressed', String(pronounOptions[index]!.value === pronouns));
        }
      },
      { class: 'btn' },
    );
    btn.setAttribute('aria-pressed', String(option.value === 'they'));
    pronounRow.append(btn);
    return btn;
  });

  const submit = button('Begin', () => void run(), { class: 'btn btn-primary' });

  async function run(): Promise<void> {
    const input: BackstoryInput = {
      name: nameInput.value.trim(),
      age: Number(ageInput.value) || 34,
      pronouns,
      profession: fields.profession.value.trim(),
      definingMoment: fields.definingMoment.value.trim(),
      whatLost: fields.whatLost.value.trim(),
      immunityTheory: fields.immunityTheory.value.trim(),
    };

    const missing: string[] = [];
    if (!input.name) missing.push('a name');
    if (!input.profession) missing.push('what you did before');
    if (input.definingMoment.length < 12) missing.push('a defining moment');

    if (missing.length > 0) {
      errorBox.textContent = `Still need ${missing.join(', ')}.`;
      (missing.includes('a name') ? nameInput : fields.profession).focus();
      return;
    }

    errorBox.textContent = '';
    submit.disabled = true;
    submit.textContent = 'Working…';

    const seed = makeSeed();
    let result = generateCharacter(input, content, seed);

    if (aiAvailable()) {
      result = await enhanceWithAi(result, input, content, DEFAULT_AI_CONFIG, (message) => {
        statusBox.textContent = message;
      });
    }

    handlers.onComplete(result, seed);
  }

  const nodes: Node[] = [
    el('h2', { text: 'Who were you?' }),
    el('p', {
      class: 'subtitle',
      text: 'Everything below shapes your stats, your perks, and moments that come back to find you three thousand miles from here.',
    }),
  ];

  if (!aiAvailable()) {
    nodes.push(
      el(
        'p',
        { class: 'notice' },
        'Running without the optional AI service. Your character is built locally from what you write — nothing leaves this device.',
      ),
    );
  }

  nodes.push(
    field('Name', nameInput),
    field('Age', ageInput),
    field('Pronouns', pronounRow, 'Used throughout the story when it refers to you.'),
  );

  for (const key of Object.keys(PROMPTS) as Array<keyof typeof PROMPTS>) {
    nodes.push(field(PROMPTS[key].label, fields[key], PROMPTS[key].help));
  }

  nodes.push(errorBox, statusBox);

  const row = el('div', { class: 'btn-row' });
  row.append(submit, button('Back', handlers.onCancel, { class: 'btn' }));
  nodes.push(row);

  return nodes;
}

function field(label: string, control: HTMLElement, help?: string): HTMLElement {
  const wrapper = el('div', { class: 'field' });
  const labelEl = el('label', { text: label });
  if (control.id) labelEl.setAttribute('for', control.id);
  wrapper.append(labelEl);
  if (help) wrapper.append(el('span', { class: 'help', text: help }));
  wrapper.append(control);
  return wrapper;
}
