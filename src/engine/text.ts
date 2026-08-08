/**
 * Token interpolation for story text.
 *
 * Content is written with `{name}`, `{they}`, `{their}` and similar so that a
 * single line reads correctly for any character. Pronouns are chosen by the
 * player at creation and default to they/them.
 */

import type { GameState, Pronouns, StoryContent } from './types';

interface PronounSet {
  subject: string;
  object: string;
  possessive: string;
  possessivePronoun: string;
  reflexive: string;
  /** 's' for she/he, '' for they — lets content write `{they} know{s}`. */
  verbS: string;
  /** 'is' vs 'are'. */
  isAre: string;
  /** 'was' vs 'were'. */
  wasWere: string;
}

const PRONOUNS: Record<Pronouns, PronounSet> = {
  she: {
    subject: 'she',
    object: 'her',
    possessive: 'her',
    possessivePronoun: 'hers',
    reflexive: 'herself',
    verbS: 's',
    isAre: 'is',
    wasWere: 'was',
  },
  he: {
    subject: 'he',
    object: 'him',
    possessive: 'his',
    possessivePronoun: 'his',
    reflexive: 'himself',
    verbS: 's',
    isAre: 'is',
    wasWere: 'was',
  },
  they: {
    subject: 'they',
    object: 'them',
    possessive: 'their',
    possessivePronoun: 'theirs',
    reflexive: 'themselves',
    verbS: '',
    isAre: 'are',
    wasWere: 'were',
  },
};

export function pronounSet(pronouns: Pronouns): PronounSet {
  return PRONOUNS[pronouns];
}

const capitalise = (s: string) => (s.length ? s[0]!.toUpperCase() + s.slice(1) : s);

/**
 * Replaces `{token}` occurrences. Unknown tokens are left verbatim so that
 * typos in content are visible during authoring rather than silently blanked.
 *
 * A capitalised token yields a capitalised value: `{They}` -> "They".
 */
export function interpolate(text: string, state: GameState, content: StoryContent): string {
  const c = state.character;
  const p = PRONOUNS[c.pronouns];

  const tokens: Record<string, string> = {
    name: c.name,
    age: String(c.age),
    profession: c.profession,
    // The player writes their own profession, so content cannot hard-code the
    // article: "a paramedic" but "an emergency room nurse".
    article: indefiniteArticle(c.profession),
    day: String(state.day),
    location: content.locations[state.location]?.name ?? state.location,
    they: p.subject,
    them: p.object,
    their: p.possessive,
    theirs: p.possessivePronoun,
    themselves: p.reflexive,
    s: p.verbS,
    are: p.isAre,
    were: p.wasWere,
  };

  // Companions currently travelling with the player, for lines like
  // "{party} keeps pace behind you".
  const party = Object.values(state.companions)
    .filter((comp) => comp.present && comp.alive && !comp.gone)
    .map((comp) => content.companions[comp.id]?.name)
    .filter((n): n is string => Boolean(n));
  tokens.party = formatList(party);
  tokens.partyOrAlone = party.length ? formatList(party) : 'no one';

  return text.replace(/\{(\w+)\}/g, (match, rawKey: string) => {
    const lower = rawKey.toLowerCase();
    const value = tokens[lower];
    if (value === undefined) return match;
    const shouldCapitalise = rawKey[0] === rawKey[0]?.toUpperCase() && rawKey[0] !== rawKey[0]?.toLowerCase();
    return shouldCapitalise ? capitalise(value) : value;
  });
}

/**
 * Picks "a" or "an" for an arbitrary player-supplied phrase.
 *
 * Sound, not spelling, decides this, so the vowel-letter rule needs two
 * exceptions: silent-h words take "an" ("an hour"), and u-words that open on a
 * /juː/ glide take "a" ("a university", "a used car salesman"). Both show up in
 * plausible professions, which is why they are worth handling.
 */
export function indefiniteArticle(phrase: string): string {
  const word = phrase.trim().toLowerCase().split(/[\s-]+/)[0] ?? '';
  if (!word) return 'a';

  if (/^(hour|honest|honou?r|heir)/.test(word)) return 'an';
  if (/^(un[iy]|use|usu|user|utili|euro|eule|one|once)/.test(word)) return 'a';
  // A leading letter read aloud, e.g. "MRI technician" or "RN".
  if (/^[bcdfgjkpqtvwyz]{2,}/i.test(word) && !/[aeiou]/.test(word.slice(0, 3))) {
    return /^[fhlmnrsx]/.test(word) ? 'an' : 'a';
  }
  return /^[aeiou]/.test(word) ? 'an' : 'a';
}

/** "A", "A and B", "A, B, and C". */
export function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0] as string;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
