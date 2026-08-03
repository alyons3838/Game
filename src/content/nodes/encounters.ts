import type { StoryNode } from '@/engine/types';

/**
 * The encounter pool. Hubs roll one of these via `@encounter`, weighted, with
 * optional location and condition gating. Every encounter returns to `@hub`, so
 * they compose freely with the plot spine.
 *
 * Weights are relative within the eligible set. `once: true` marks an encounter
 * that should not repeat in a run.
 */
export const encounters: StoryNode[] = [
  {
    id: 'enc-cache',
    act: 1,
    encounter: { weight: 10 },
    speaker: 'Narrator',
    body: [
      'A house set back from the road with the door still locked, which after ninety days means nobody has been inside it.',
      'The family who lived here left in a hurry and did not come back. Their pantry is a small archaeology of a normal week: cereal, tinned tomatoes, a birthday cake mix.',
    ],
    choices: [
      {
        id: 'enc-cache-take',
        text: 'Take everything that will not spoil.',
        effects: [{ resource: 'supplies', delta: 12 }],
        tags: ['practical'],
        goto: '@hub',
      },
      {
        id: 'enc-cache-thorough',
        text: 'Do the whole house properly — bathroom cabinet, garage, car boot.',
        kind: 'stat',
        requires: { stat: 'scavenge', gte: 58 },
        hideWhenLocked: false,
        lockedHint: 'Scavenge 58',
        effects: [
          { advanceDays: 1 },
          { resource: 'supplies', delta: 16 },
          { resource: 'meds', delta: 2 },
        ],
        tags: ['planned'],
        goto: '@hub',
      },
      {
        id: 'enc-cache-note',
        text: 'Leave half, and leave a note saying you were here.',
        effects: [{ resource: 'supplies', delta: 6 }, { morale: 6 }],
        tags: ['generous', 'sentimental'],
        goto: '@hub',
      },
    ],
  },

  {
    id: 'enc-horde',
    act: 1,
    encounter: { weight: 12 },
    speaker: 'Narrator',
    body: [
      'You come around a bend and there are perhaps forty of them on the road, packed close, all facing the same way like a crowd waiting for a train.',
      'They have not noticed you. The wind is in your favour, for the next minute or so.',
    ],
    choices: [
      {
        id: 'enc-horde-back',
        text: 'Back away slowly and take the long route.',
        effects: [{ advanceDays: 1 }, { resource: 'supplies', delta: -3 }],
        tags: ['practical'],
        goto: '@hub',
      },
      {
        id: 'enc-horde-through',
        text: 'Go through them. Slow, quiet, straight down the middle.',
        kind: 'risk',
        roll: { stat: 'cunning', dc: 70, success: 'enc-horde-clean', failure: 'enc-horde-bad' },
        tags: ['reckless', 'clever'],
      },
      {
        id: 'enc-horde-listen',
        text: 'Wait, and work out what they are all looking at.',
        kind: 'perk',
        requires: { hasPerk: 'listener' },
        hideWhenLocked: false,
        lockedHint: 'Requires Listener',
        effects: [
          { stat: 'empathy', delta: 2 },
          { journal: 'They were facing a radio mast. All forty of them. It was not transmitting.' },
        ],
        tags: ['curious'],
        goto: '@hub',
      },
    ],
  },

  {
    id: 'enc-horde-clean',
    act: 1,
    speaker: 'Narrator',
    body: [
      'It takes eleven minutes to cover ninety yards and you do not breathe for most of it.',
      'Close up they smell of river water. One of them turns its head as you pass, tracks you for a second, and then loses interest, and you keep walking at exactly the same speed because stopping is how people die.',
    ],
    onEnter: [{ stat: 'cunning', delta: 2 }, { morale: -4 }],
    choices: [{ id: 'enc-horde-clean-on', text: 'Keep going.', goto: '@hub' }],
  },

  {
    id: 'enc-horde-bad',
    act: 1,
    speaker: 'Narrator',
    body: [
      'Something under your boot — glass, or a can — and forty heads come round at once.',
      'You run. You are still running four minutes later with your lungs full of broken glass, and you lose a pack strap, a water bottle, and a strip of your forearm on a fence.',
    ],
    onEnter: [
      { health: -18 },
      { resource: 'supplies', delta: -8 },
      { morale: -6 },
    ],
    choices: [{ id: 'enc-horde-bad-on', text: 'Keep moving until you cannot.', goto: '@hub' }],
  },

  {
    id: 'enc-survivor',
    act: 1,
    encounter: { weight: 9 },
    speaker: 'Narrator',
    body: [
      'A man sitting on a guardrail with his boots off, looking at his feet with the expression of somebody doing arithmetic he does not like.',
      'He does not get up when he sees you. "I have got about four days in me," he says, conversationally. "I have been trying to decide what to do with them."',
    ],
    choices: [
      {
        id: 'enc-surv-give',
        text: 'Give him three days of food and your spare socks.',
        effects: [{ resource: 'supplies', delta: -6 }, { morale: 10 }],
        tags: ['generous', 'merciful'],
        goto: '@hub',
      },
      {
        id: 'enc-surv-med',
        text: 'Look at his feet. You have seen worse and fixed it.',
        kind: 'perk',
        requires: { any: [{ hasPerk: 'first-response' }, { hasPerk: 'clinical-eye' }] },
        hideWhenLocked: false,
        lockedHint: 'Requires a medical perk',
        effects: [
          { resource: 'meds', delta: -1 },
          { morale: 12 },
          { stat: 'empathy', delta: 2 },
          { journal: 'Debrided a stranger\'s feet on a guardrail. He will probably make it now.' },
        ],
        tags: ['merciful', 'generous'],
        goto: '@hub',
      },
      {
        id: 'enc-surv-pass',
        text: '"I am sorry." Keep walking.',
        effects: [{ morale: -5 }],
        tags: ['abandon', 'practical'],
        goto: '@hub',
      },
    ],
  },

  {
    id: 'enc-trader',
    act: 2,
    encounter: { weight: 8, location: ['salt-lake-city', 'denver', 'kansas-plains', 'st-louis'] },
    speaker: 'Narrator',
    body: [
      'A woman with a handcart and a shotgun broken open over her forearm, which is the local way of saying she does not intend to use it right now.',
      '"Ammunition, antibiotics, boot soles, salt." She recites it. "I do not want your stories and I am not interested in where you are going."',
    ],
    choices: [
      {
        id: 'enc-trade-supplies',
        text: 'Trade food for ammunition.',
        requires: { resource: 'supplies', gte: 12 },
        hideWhenLocked: false,
        lockedHint: 'Requires 12 supplies',
        effects: [{ resource: 'supplies', delta: -12 }, { resource: 'ammo', delta: 8 }],
        tags: ['practical'],
        goto: '@hub',
      },
      {
        id: 'enc-trade-meds',
        text: 'Trade ammunition for medicine.',
        requires: { resource: 'ammo', gte: 6 },
        hideWhenLocked: false,
        lockedHint: 'Requires 6 ammunition',
        effects: [{ resource: 'ammo', delta: -6 }, { resource: 'meds', delta: 3 }],
        tags: ['practical'],
        goto: '@hub',
      },
      {
        id: 'enc-trade-haggle',
        text: 'Haggle. She has been on the road longer than you and it shows in the cart.',
        kind: 'stat',
        requires: { stat: 'empathy', gte: 58 },
        hideWhenLocked: false,
        lockedHint: 'Empathy 58',
        effects: [
          { resource: 'supplies', delta: 8 },
          { resource: 'meds', delta: 1 },
          { faction: 'traders', delta: 5 },
        ],
        tags: ['clever'],
        goto: '@hub',
      },
      {
        id: 'enc-trade-none',
        text: 'Nothing you need. Move on.',
        goto: '@hub',
      },
    ],
  },

  {
    id: 'enc-storm',
    act: 1,
    encounter: { weight: 7 },
    speaker: 'Narrator',
    body: [
      'The sky goes the colour of an old bruise at two in the afternoon, and the first hail comes through twenty minutes later hard enough to take paint off a car.',
      'There is a barn about a mile back. There is nothing at all ahead for at least six.',
    ],
    choices: [
      {
        id: 'enc-storm-shelter',
        text: 'Go back to the barn and lose the day.',
        effects: [{ advanceDays: 1 }, { morale: -3 }],
        tags: ['practical'],
        goto: '@hub',
      },
      {
        id: 'enc-storm-push',
        text: 'Put your head down and walk through it.',
        kind: 'risk',
        roll: { stat: 'resilience', dc: 66, success: 'enc-storm-through', failure: 'enc-storm-sick' },
        tags: ['reckless', 'decisive'],
      },
    ],
  },

  {
    id: 'enc-storm-through',
    act: 1,
    speaker: 'Narrator',
    body: [
      'Six miles in weather that would have stopped you three months ago. You come out the far side of it soaked, bruised across the shoulders, and oddly pleased with yourself.',
    ],
    onEnter: [{ stat: 'resilience', delta: 3 }, { morale: 5 }],
    choices: [{ id: 'enc-storm-through-on', text: 'On.', goto: '@hub' }],
  },

  {
    id: 'enc-storm-sick',
    act: 1,
    speaker: 'Narrator',
    body: [
      'You make four miles and spend the next two days in a drainage culvert with a fever, shaking hard enough to hear your own teeth.',
      'Whatever it is, it is not Lazarus. That is the only comforting thought available and you use it a great deal.',
    ],
    onEnter: [
      { advanceDays: 2 },
      { health: -22 },
      { morale: -8 },
      { resource: 'meds', delta: -1 },
    ],
    choices: [{ id: 'enc-storm-sick-on', text: 'Get up eventually.', goto: '@hub' }],
  },

  {
    id: 'enc-companion-talk',
    act: 2,
    encounter: {
      weight: 11,
      requires: { any: [{ companion: 'riley', is: 'present' }, { companion: 'ava-chen', is: 'present' }] },
    },
    speaker: 'Narrator',
    body: [
      'A night with no wind and a fire small enough to be defensible, and for once nobody is hurt, hungry or being followed.',
      'Somebody starts talking about before. It is the first time in weeks that anyone has.',
    ],
    choices: [
      {
        id: 'enc-talk-listen',
        text: 'Listen. Do not fill the gaps.',
        effects: [
          { morale: 8 },
          { loyalty: 'riley', delta: 6 },
          { loyalty: 'ava-chen', delta: 6 },
        ],
        tags: ['merciful', 'sentimental'],
        goto: '@hub',
      },
      {
        id: 'enc-talk-share',
        text: 'Tell them about what you lost.',
        effects: [
          { morale: 12 },
          { loyalty: 'riley', delta: 10 },
          { loyalty: 'ava-chen', delta: 10 },
          { loyalty: 'james-park', delta: 8 },
          { stat: 'empathy', delta: 2 },
          { journal: 'Told them about it. First time out loud.' },
        ],
        tags: ['honest', 'sentimental'],
        goto: '@hub',
      },
      {
        id: 'enc-talk-watch',
        text: 'Take the first watch and let them have it without you.',
        effects: [{ morale: 3 }, { stat: 'resolve', delta: 2 }],
        tags: ['guarded', 'protective'],
        goto: '@hub',
      },
    ],
  },

  {
    id: 'enc-checkpoint',
    act: 3,
    encounter: {
      weight: 9,
      location: ['st-louis', 'chicago', 'pittsburgh'],
      requires: { flag: 'has-corridor-card' },
    },
    speaker: 'Narrator',
    body: [
      'A corridor checkpoint: two vehicles across the road, a folding table, and a private who cannot be more than nineteen checking cards against a clipboard.',
      'The queue ahead of you is four people. Two get waved through. One is taken to a truck. One is turned around and starts walking west without arguing, which suggests she expected it.',
    ],
    choices: [
      {
        id: 'enc-check-comply',
        text: 'Show the card. Say nothing.',
        effects: [{ faction: 'government', delta: 3 }],
        tags: ['practical'],
        goto: '@hub',
      },
      {
        id: 'enc-check-ask',
        text: '"Where does the truck go?"',
        effects: [
          { flag: 'asked-about-trucks', value: true },
          { faction: 'government', delta: -3 },
          { journal: 'Asked a nineteen-year-old where the trucks go. He said he was not told.' },
        ],
        tags: ['honest', 'curious'],
        goto: '@hub',
      },
      {
        id: 'enc-check-woman',
        text: 'Catch up with the woman walking west and find out why she was refused.',
        kind: 'standard',
        effects: [
          { advanceDays: 1 },
          { flag: 'knows-refusal-criteria', value: true },
          { faction: 'resistance', delta: 8 },
          {
            journal:
              'She was refused for a partial marker match. They told her she was "not a candidate". She has a brother in custody.',
          },
        ],
        tags: ['curious', 'merciful'],
        goto: '@hub',
      },
    ],
  },

  {
    id: 'enc-quiet-day',
    act: 1,
    encounter: { weight: 6 },
    speaker: 'Narrator',
    body: [
      'Nothing happens.',
      'Eleven miles of empty road, a heron standing in a flooded field, and a stretch in the afternoon where the sun comes out and you walk with your coat open.',
      'You will think about this day later, more than you expect to.',
    ],
    onEnter: [{ morale: 6 }],
    choices: [{ id: 'enc-quiet-on', text: 'Walk.', goto: '@hub' }],
  },

  {
    id: 'enc-radio',
    act: 2,
    encounter: { weight: 7, once: true, requires: { companion: 'riley', is: 'present' } },
    speaker: 'Riley',
    body: [
      '"Okay so — okay. Don\'t get excited." Riley has the scanner out and their hand flat on the casing like it might bolt. "I\'ve had Alpha One on loop for ninety days. Same eleven-second recording. Same tape hiss in the same place."',
      '"Forty minutes ago it changed."',
      'They play it. The voice is different — younger, unrehearsed, reading badly off a page.',
      '"— intake capacity has been reached at the following corridor stations. Non-responder arrivals should proceed to secondary processing. Repeat, capacity reached —"',
      '"That\'s not a recording," Riley says. "That\'s a person. And nobody writes \'capacity reached\' about a rescue."',
    ],
    onEnter: [
      { flag: 'heard-capacity-broadcast', value: true },
      { journal: 'Alpha One changed its broadcast. "Intake capacity reached." A live voice, not the loop.' },
    ],
    choices: [
      {
        id: 'enc-radio-record',
        text: '"Record everything from now on. All of it."',
        effects: [{ loyalty: 'riley', delta: 10 }, { stat: 'cunning', delta: 2 }],
        tags: ['clever', 'planned'],
        goto: '@hub',
      },
      {
        id: 'enc-radio-nothing',
        text: '"It means the safe zone is full. That is good news, if you turn it over."',
        effects: [{ morale: 4 }],
        tags: ['practical'],
        goto: '@hub',
      },
    ],
  },
];
