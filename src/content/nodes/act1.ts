import type { StoryNode } from '@/engine/types';

/**
 * Act 1 is shared by all four starting cities — `{location}` interpolates. The
 * job here is to teach the choice grammar (stat gates, rolls, tags) and to put
 * one companion within reach before the player commits to the road.
 */
export const act1: StoryNode[] = [
  {
    id: 'a1-open',
    act: 1,
    speaker: 'Narrator',
    title: 'Ninety-One Days After',
    body: [
      'The broadcast came through at 3:40 in the morning, four words at a time, the same loop until the batteries in your radio gave out.',
      '"—United States Emergency Station Alpha One. Safe zone established, Washington District of Columbia. Government operational. All immune individuals proceed east. Repeat—"',
      'You are {name}. Ninety-one days ago you were {article} {profession}. Then Lazarus got out of whatever building it was being kept in, and two thirds of everyone stopped being people.',
      'You are not one of them. You do not know why. Nobody does.',
      'It is three thousand miles to Washington. You have enough food for ninety days if you are careful, and you have never once been careful enough.',
    ],
    choices: [
      {
        id: 'a1-open-go',
        text: 'Pack. Go.',
        goto: 'a1-first-night',
      },
    ],
  },

  {
    id: 'a1-first-night',
    act: 1,
    speaker: 'Narrator',
    body: [
      'You get four miles out of {location} before the light goes, and you spend the first night in the upstairs office of a tyre shop with the stairs pulled up behind you.',
      'Somewhere south of you, something is screaming. It has been screaming for about an hour. It does not sound like it is going to stop.',
    ],
    onEnter: [{ journal: 'Left {location}. First night on the road.' }],
    choices: [
      {
        id: 'a1-night-listen',
        text: 'Lie still and let it scream.',
        kind: 'standard',
        effects: [{ morale: -6 }],
        tags: ['practical'],
        goto: 'a1-morning',
      },
      {
        id: 'a1-night-go',
        text: 'Go and look. Someone might still be alive down there.',
        kind: 'standard',
        effects: [{ morale: 3 }],
        tags: ['merciful', 'reckless'],
        goto: 'a1-scream',
      },
      {
        id: 'a1-night-scout',
        text: 'Work out where it is coming from before you decide anything.',
        kind: 'stat',
        requires: { stat: 'cunning', gte: 50 },
        hideWhenLocked: false,
        lockedHint: 'Cunning 50',
        effects: [{ stat: 'cunning', delta: 1 }],
        tags: ['planned', 'curious'],
        goto: 'a1-scream',
      },
    ],
  },

  {
    id: 'a1-scream',
    act: 1,
    speaker: 'Narrator',
    body: [
      'It is a car alarm. A hatchback with its nose in a shopfront, the horn locked on, and nine or ten infected standing around it in the dark with their hands over their ears.',
      'Not attacking. Just standing there, swaying, the way a crowd stands at a funeral.',
      'On the roof of the shop opposite, someone is watching them through a pair of binoculars and taking notes.',
    ],
    choices: [
      {
        id: 'a1-scream-hail',
        text: 'Get their attention. Quietly.',
        kind: 'standard',
        tags: ['curious'],
        goto: 'a1-riley',
      },
      {
        id: 'a1-scream-watch',
        text: 'Watch the infected instead. They are doing something you have not seen.',
        kind: 'trait',
        requires: { any: [{ hasTrait: 'observant' }, { hasTrait: 'methodical' }] },
        hideWhenLocked: false,
        lockedHint: 'Requires Observant or Methodical',
        effects: [
          { stat: 'cunning', delta: 3 },
          { flag: 'saw-the-swaying', value: true },
          { journal: 'The infected around the alarm were not attacking. They were listening.' },
        ],
        tags: ['curious'],
        goto: 'a1-riley',
      },
      {
        id: 'a1-scream-leave',
        text: 'Nine of them and one of you. Go back to the tyre shop.',
        kind: 'standard',
        tags: ['practical'],
        goto: 'a1-morning',
      },
    ],
  },

  {
    id: 'a1-riley',
    act: 1,
    speaker: 'Riley',
    body: [
      'The kid on the roof nearly falls off it. Seventeen, maybe, in a coat four sizes too big, with a car battery and a length of aerial wired to something that used to be a scanner.',
      '"Don\'t — okay. Okay. You\'re not one of them, obviously, they don\'t climb." A beat. "Riley. I set the alarm off. On purpose. I\'m counting how long it takes them to lose interest."',
      'They say it like it is completely normal. Behind them, the notebook is full — dates, times, tally marks, four months of them.',
    ],
    choices: [
      {
        id: 'a1-riley-ask',
        text: '"How long does it take them?"',
        kind: 'standard',
        effects: [
          { loyalty: 'riley', delta: 5 },
          { flag: 'riley-talked-shop', value: true },
        ],
        tags: ['curious'],
        goto: 'a1-riley-offer',
      },
      {
        id: 'a1-riley-warn',
        text: '"You are going to get yourself killed doing this."',
        kind: 'standard',
        tags: ['protective'],
        goto: 'a1-riley-offer',
      },
      {
        id: 'a1-riley-leave',
        text: 'You have three thousand miles to walk. Leave them to it.',
        kind: 'standard',
        effects: [{ morale: -4 }],
        tags: ['abandon'],
        goto: 'a1-morning',
      },
    ],
  },

  {
    id: 'a1-riley-offer',
    act: 1,
    speaker: 'Riley',
    body: [
      '"Twenty-two minutes, average. Longer if it\'s a rhythm. They like rhythms." Riley closes the notebook. "Nobody\'s asked me that in four months."',
      'They look east, then at you, then east again, and something in their face gives up on being casual.',
      '"You heard Alpha One too. Obviously you did, that\'s why you\'re walking. I have a scanner and eleven kilos of gear and no idea how to not get eaten between here and Colorado." A breath. "You look like you know how to not get eaten."',
    ],
    choices: [
      {
        id: 'a1-riley-yes',
        text: '"Then keep up."',
        kind: 'standard',
        effects: [
          { recruit: 'riley' },
          { loyalty: 'riley', delta: 10 },
          { journal: 'Riley is walking east with me. They talk a great deal.' },
        ],
        tags: ['generous', 'protective'],
        goto: 'a1-morning',
      },
      {
        id: 'a1-riley-terms',
        text: '"You carry your own weight and you do what I say when it matters."',
        kind: 'standard',
        effects: [{ recruit: 'riley' }, { journal: 'Riley is with me, on terms.' }],
        tags: ['decisive', 'honest'],
        goto: 'a1-morning',
      },
      {
        id: 'a1-riley-no',
        text: '"No. I am sorry."',
        kind: 'standard',
        effects: [
          { morale: -8 },
          { flag: 'refused-riley', value: true },
          { journal: 'I left a seventeen-year-old on a roof in {location}.' },
        ],
        tags: ['abandon', 'practical'],
        goto: 'a1-morning',
      },
    ],
  },

  {
    id: 'a1-morning',
    act: 1,
    speaker: 'Narrator',
    body: [
      'Morning comes grey and takes its time about it.',
      'The road east out of {location} is a museum of the first week — cars nose to tail for two miles, doors open, luggage still strapped to the roofs. Everyone tried to leave at once and nobody got anywhere.',
      'You walk down the middle of it, because the middle is where you can see.',
    ],
    onEnter: [{ advanceDays: 1 }],
    choices: [
      {
        id: 'a1-morning-on',
        text: 'Keep walking.',
        goto: '@hub',
      },
    ],
  },
];
