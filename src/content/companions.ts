import type { CompanionDef } from '@/engine/types';

/**
 * Six recruitable companions, spread so that no single route collects them all.
 * `likes` / `dislikes` match the `tags` on choices — see `applyCompanionReactions`.
 * Loyalty at zero means they leave at the next decision point, permanently.
 */
const list: CompanionDef[] = [
  {
    id: 'riley',
    name: 'Riley',
    age: 17,
    pronouns: 'they',
    role: 'Kept the networks alive after everyone stopped listening',
    blurb:
      'Seventeen, wire-thin, and has not been more than a room away from a working radio since the collapse. Riley talks constantly and says almost nothing about themselves.',
    location: 'seattle',
    perk: 'cold-boot',
    likes: ['clever', 'protective', 'curious'],
    dislikes: ['cruel', 'abandon', 'reckless'],
  },
  {
    id: 'dmitri-volkov',
    name: 'Dmitri Volkov',
    age: 38,
    pronouns: 'he',
    role: 'Did work he will not name, for people he will not name',
    blurb:
      'Speaks maybe forty words a day and half of them are corrections. Whatever he did before, he is very good at the part of this that involves staying alive.',
    location: 'salt-lake-city',
    perk: 'under-fire',
    likes: ['planned', 'decisive', 'honest'],
    dislikes: ['reckless', 'sentimental', 'deceptive'],
  },
  {
    id: 'ava-chen',
    name: 'Ava Chen',
    age: 34,
    pronouns: 'she',
    role: 'Studied Lazarus before it had a name',
    blurb:
      'She was three floors down when the containment order came through, and she has been walking east ever since. She knows more than she has said and it is eating her.',
    location: 'denver',
    perk: 'method',
    likes: ['curious', 'honest', 'merciful'],
    dislikes: ['deceptive', 'cruel', 'zealot'],
  },
  {
    id: 'james-park',
    name: 'James Park',
    age: 45,
    pronouns: 'he',
    role: 'Ran a caravan until it stopped being his',
    blurb:
      'Warm, quick, and impossible to dislike, which is precisely what worries the people who have travelled with him longest.',
    location: 'kansas-plains',
    perk: 'reads-a-room',
    likes: ['merciful', 'generous', 'sentimental'],
    dislikes: ['cruel', 'abandon', 'zealot'],
  },
  {
    id: 'marcus-williams',
    name: 'Marcus "Doc" Williams',
    age: 42,
    pronouns: 'he',
    role: 'Battlefield medic, twice over',
    blurb:
      'Steady hands, flat voice, and a habit of counting people under his breath. He treats everyone, which has cost him more than once.',
    location: 'st-louis',
    perk: 'first-response',
    likes: ['merciful', 'protective', 'honest'],
    dislikes: ['cruel', 'abandon', 'reckless'],
  },
  {
    id: 'sarah-cross',
    name: 'Sarah Cross',
    age: 29,
    pronouns: 'she',
    role: 'Infected on day nine. Still here.',
    blurb:
      'Her eyes went white four months ago and she never stopped being herself. She does not know why. Neither does anyone else, and most people do not stay long enough to ask.',
    location: 'chicago',
    perk: 'listener',
    likes: ['curious', 'merciful', 'honest'],
    dislikes: ['cruel', 'zealot', 'abandon'],
  },
];

export const companions: Record<string, CompanionDef> = Object.fromEntries(
  list.map((c) => [c.id, c]),
);
