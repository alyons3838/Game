import type { TraitDef } from '@/engine/types';

/**
 * Traits are flavour with teeth: story content gates a handful of lines on
 * `hasTrait`, so two characters with the same stats can still see different
 * dialogue. The generator assigns two based on backstory affinities.
 */
const list: TraitDef[] = [
  {
    id: 'guarded',
    name: 'Guarded',
    description: 'You do not offer information. People have to earn it.',
    affinities: ['isolation', 'hardship', 'military', 'law'],
  },
  {
    id: 'open-handed',
    name: 'Open-Handed',
    description: 'You give first and worry about the cost later.',
    affinities: ['care', 'teaching', 'faith', 'service'],
  },
  {
    id: 'methodical',
    name: 'Methodical',
    description: 'You would rather be slow and right.',
    affinities: ['science', 'engineering', 'medicine', 'software'],
  },
  {
    id: 'unflinching',
    name: 'Unflinching',
    description: 'You have already seen the worst version of this.',
    affinities: ['violence', 'military', 'medicine', 'loss'],
  },
  {
    id: 'haunted',
    name: 'Haunted',
    description: 'Something follows you that no one else can see.',
    affinities: ['guilt', 'loss', 'violence'],
  },
  {
    id: 'practical',
    name: 'Practical',
    description: 'Sentiment is a luxury and you priced it out a long time ago.',
    affinities: ['trade', 'transport', 'outdoors', 'hardship'],
  },
  {
    id: 'observant',
    name: 'Observant',
    description: 'You notice the thing nobody meant you to.',
    affinities: ['craft', 'law', 'science', 'software'],
  },
  {
    id: 'steady',
    name: 'Steady',
    description: 'Panic arrives late with you, if it arrives at all.',
    affinities: ['leadership', 'athletic', 'faith', 'military'],
  },
];

export const traits: Record<string, TraitDef> = Object.fromEntries(list.map((t) => [t.id, t]));
