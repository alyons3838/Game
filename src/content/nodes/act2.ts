import type { StoryNode } from '@/engine/types';

/**
 * Act 2 is the faction act. Salt Lake and Denver each ask the player to declare
 * something, and Kansas collects on it. The Shepherd thread set up here is what
 * Act 3's revelation lands against.
 */
export const act2: StoryNode[] = [
  // --- Salt Lake City ------------------------------------------------------
  {
    id: 'a2-salt-lake',
    act: 2,
    location: 'salt-lake-city',
    speaker: 'Narrator',
    body: [
      'You smell Salt Lake before you see it: woodsmoke and bread and, underneath, bleach.',
      'The gate is a shipping container with a gap in it, and beside the gap is a whiteboard, hand-lettered, headed WHAT WE ASK.',
      'Four items. Work eight hours. Attend evening assembly. Surrender firearms at the gate. Report anyone who shows symptoms, including yourself.',
      'A woman in a clean grey coat is waiting with a clipboard and the patience of someone who has done this several hundred times.',
    ],
    onEnter: [{ journal: 'Reached Salt Lake City. The Sanctuary runs it.' }],
    choices: [
      {
        id: 'a2-slc-sign',
        text: 'Sign. A bed and a wall are worth eight hours.',
        kind: 'standard',
        effects: [
          { faction: 'sanctuary', delta: 25 },
          { resource: 'supplies', delta: 20 },
          { flag: 'slc-signed', value: true },
          { morale: 6 },
        ],
        tags: ['practical'],
        goto: 'a2-slc-assembly',
      },
      {
        id: 'a2-slc-refuse',
        text: '"I will trade at your gate. I am not joining anything."',
        kind: 'standard',
        effects: [
          { faction: 'sanctuary', delta: -10 },
          { resource: 'supplies', delta: 8 },
          { flag: 'slc-refused', value: true },
        ],
        tags: ['honest', 'guarded'],
        goto: 'a2-slc-dmitri',
      },
      {
        id: 'a2-slc-lie',
        text: 'Sign it. Mean none of it.',
        kind: 'stat',
        requires: { stat: 'cunning', gte: 58 },
        hideWhenLocked: false,
        lockedHint: 'Cunning 58',
        effects: [
          { faction: 'sanctuary', delta: 15 },
          { resource: 'supplies', delta: 20 },
          { flag: 'slc-signed', value: true },
          { flag: 'slc-lied', value: true },
        ],
        tags: ['deceptive', 'clever'],
        goto: 'a2-slc-assembly',
      },
      {
        id: 'a2-slc-question',
        text: '"What happens to the ones who get reported?"',
        kind: 'trait',
        requires: { any: [{ hasTrait: 'observant' }, { hasTrait: 'unflinching' }] },
        hideWhenLocked: false,
        lockedHint: 'Requires Observant or Unflinching',
        effects: [
          { flag: 'slc-asked-the-question', value: true },
          { journal: 'Asked the Sanctuary what happens to people who are reported. She did not answer.' },
        ],
        tags: ['honest', 'curious'],
        goto: 'a2-slc-dmitri',
      },
    ],
  },

  {
    id: 'a2-slc-assembly',
    act: 2,
    location: 'salt-lake-city',
    speaker: 'Narrator',
    body: [
      'Evening assembly is four hundred people in what used to be a conference centre, and it is the first time in three months you have been in a warm room with a crowd.',
      'They do not pray, exactly. A man reads out the day — who worked, who was ill, who was born. Then everyone says the names of the people they lost that week, all at once, out loud, and it goes on for a long time.',
      'It is the kindest thing you have seen since the collapse, and you cannot shake the whiteboard at the gate.',
    ],
    choices: [
      {
        id: 'a2-slc-say-name',
        text: 'Say your names with them.',
        kind: 'standard',
        effects: [{ morale: 12 }, { faction: 'sanctuary', delta: 10 }],
        tags: ['sentimental', 'merciful'],
        goto: 'a2-slc-dmitri',
      },
      {
        id: 'a2-slc-stay-silent',
        text: 'Stand there and say nothing.',
        kind: 'standard',
        effects: [{ stat: 'resolve', delta: 2 }],
        tags: ['guarded'],
        goto: 'a2-slc-dmitri',
      },
    ],
  },

  {
    id: 'a2-slc-dmitri',
    act: 2,
    location: 'salt-lake-city',
    speaker: 'Dmitri Volkov',
    body: [
      'There is a man outside the wall building a fire he does not need, in the cold, forty feet from a city with heating.',
      '"You are walking east." Not a question. He does not look up. "So am I. I have been sitting here nine days deciding whether to go around this place or through it."',
      'He turns a piece of wood over in the fire, precisely.',
      '"They are good people. That is the problem. Good people with a list of who to report are still people with a list."',
    ],
    choices: [
      {
        id: 'a2-dmitri-together',
        text: '"Two of us is better odds than one."',
        kind: 'standard',
        effects: [{ recruit: 'dmitri-volkov' }, { journal: 'Dmitri Volkov is travelling with me.' }],
        tags: ['planned', 'decisive'],
        goto: '@hub',
      },
      {
        id: 'a2-dmitri-defend',
        text: '"They took me in and fed me. Do not do that."',
        kind: 'standard',
        requires: { flag: 'slc-signed' },
        effects: [{ faction: 'sanctuary', delta: 5 }],
        tags: ['honest', 'sentimental'],
        goto: 'a2-slc-dmitri-cool',
      },
      {
        id: 'a2-dmitri-agree',
        text: '"I saw the whiteboard too."',
        kind: 'standard',
        effects: [
          { recruit: 'dmitri-volkov' },
          { loyalty: 'dmitri-volkov', delta: 10 },
          { faction: 'sanctuary', delta: -5 },
        ],
        tags: ['honest', 'guarded'],
        goto: '@hub',
      },
      {
        id: 'a2-dmitri-pass',
        text: 'Leave him to his fire.',
        kind: 'standard',
        tags: ['guarded'],
        goto: '@hub',
      },
    ],
  },

  {
    id: 'a2-slc-dmitri-cool',
    act: 2,
    location: 'salt-lake-city',
    speaker: 'Dmitri Volkov',
    body: [
      'He accepts that without argument, which is somehow worse than if he had argued.',
      '"Good. Then you should stay." He puts another piece of wood on. "I am leaving on Thursday. If you are on the road when I am on the road, I will not walk away from you."',
      'It is not quite an offer and it is not quite a refusal.',
    ],
    choices: [
      {
        id: 'a2-dmitri-cool-join',
        text: '"Thursday, then."',
        kind: 'standard',
        effects: [{ recruit: 'dmitri-volkov' }, { journal: 'Dmitri Volkov is travelling with me.' }],
        tags: ['decisive'],
        goto: '@hub',
      },
      {
        id: 'a2-dmitri-cool-leave',
        text: 'Leave it there.',
        kind: 'standard',
        goto: '@hub',
      },
    ],
  },

  // --- Denver --------------------------------------------------------------
  {
    id: 'a2-denver',
    act: 2,
    location: 'denver',
    speaker: 'Narrator',
    body: [
      'Denver charges to come in and it is worth every unit of it.',
      'Inside the scrap wall the old downtown is a market that never closes: fuel, ammunition, antibiotics, boots, seed, a man doing dentistry in a barber\'s chair with a queue.',
      'Nobody asks what you believe. Everybody asks what you have.',
      'Two hours in, a woman in a lab coat that stopped being white a long time ago corners you beside a stall selling batteries.',
    ],
    onEnter: [
      { faction: 'traders', delta: 5 },
      { journal: 'Denver. The wall holds. The market never closes.' },
    ],
    choices: [
      {
        id: 'a2-denver-listen',
        text: 'Let her talk.',
        goto: 'a2-denver-ava',
      },
      {
        id: 'a2-denver-trade',
        text: 'Business first. Work the market while the light lasts.',
        kind: 'standard',
        effects: [
          { advanceDays: 1 },
          { resource: 'supplies', delta: 18 },
          { resource: 'meds', delta: 2 },
          { resource: 'ammo', delta: 4 },
          { faction: 'traders', delta: 8 },
        ],
        tags: ['practical'],
        goto: 'a2-denver-ava',
      },
    ],
  },

  {
    id: 'a2-denver-ava',
    act: 2,
    location: 'denver',
    speaker: 'Ava Chen',
    body: [
      '"You came in from the west. On foot. Ninety-odd days." She says it fast, like she has been waiting to say it to somebody. "Then you are immune, and you are the fourth one I have found who is walking to Washington because of that broadcast."',
      'She puts a hand flat on the stall to steady it, or herself.',
      '"My name is Ava Chen. Before, I was at a CDC facility in Fort Collins, three floors under, and I was on the team that was handed Lazarus to characterise nine days after it got out."',
      '"The broadcast says they want immune individuals to proceed east. I want you to hear how that sentence is built. Not survivors. Not citizens. Immune individuals."',
    ],
    choices: [
      {
        id: 'a2-ava-what',
        text: '"What do you think they want us for?"',
        kind: 'standard',
        effects: [
          { flag: 'ava-warned-me', value: true },
          { journal: 'Ava Chen: the broadcast asks for immune individuals, not survivors.' },
        ],
        tags: ['curious'],
        goto: 'a2-denver-ava-2',
      },
      {
        id: 'a2-ava-clinical',
        text: '"Say it properly. What was the immunity rate in your sample?"',
        kind: 'perk',
        requires: { any: [{ hasPerk: 'method' }, { hasPerk: 'clinical-eye' }] },
        hideWhenLocked: false,
        lockedHint: 'Requires Method or Clinical Eye',
        effects: [
          { flag: 'ava-warned-me', value: true },
          { flag: 'ava-technical', value: true },
          { loyalty: 'ava-chen', delta: 15 },
          { stat: 'cunning', delta: 2 },
          {
            journal:
              'Ava: immunity is not random. It clusters in families. Whatever it is, it is inherited.',
          },
        ],
        tags: ['curious', 'clever'],
        goto: 'a2-denver-ava-2',
      },
      {
        id: 'a2-ava-dismiss',
        text: '"Everybody out here has a theory. I have a schedule."',
        kind: 'standard',
        effects: [{ morale: -3 }],
        tags: ['practical', 'guarded'],
        goto: '@hub',
      },
    ],
  },

  {
    id: 'a2-denver-ava-2',
    act: 2,
    location: 'denver',
    speaker: 'Ava Chen',
    body: [
      '"I do not know. That is the honest answer and it is why I am still here instead of there."',
      '"What I do know is that immunity is not random. It runs in families. We had it in the data inside two weeks and then the data stopped being ours." She looks at the crowd, not at you. "Somebody built a pathogen that sorts people. I would very much like to be wrong about why."',
      'She lets that sit.',
      '"I cannot make that walk alone. I have tried twice."',
    ],
    choices: [
      {
        id: 'a2-ava-join',
        text: '"Then walk with me."',
        kind: 'standard',
        effects: [
          { recruit: 'ava-chen' },
          { journal: 'Ava Chen is travelling east with me. She wants to be wrong.' },
        ],
        tags: ['generous', 'curious'],
        goto: '@hub',
      },
      {
        id: 'a2-ava-conditional',
        text: '"You tell me everything you know, as it becomes relevant. Not on your schedule."',
        kind: 'standard',
        effects: [
          { recruit: 'ava-chen' },
          { loyalty: 'ava-chen', delta: 8 },
          { flag: 'ava-full-disclosure', value: true },
        ],
        tags: ['honest', 'decisive'],
        goto: '@hub',
      },
      {
        id: 'a2-ava-no',
        text: '"No. You are carrying something that gets people killed."',
        kind: 'standard',
        effects: [{ flag: 'refused-ava', value: true }],
        tags: ['practical', 'abandon'],
        goto: '@hub',
      },
    ],
  },

  // --- Kansas --------------------------------------------------------------
  {
    id: 'a2-kansas',
    act: 2,
    location: 'kansas-plains',
    speaker: 'Narrator',
    body: [
      'There is no cover in Kansas. That is the whole of it.',
      'On the fourth day a line of vehicles comes over the rise ahead — six of them, spread wide, moving slowly enough that they have obviously already seen you and are in no hurry about it.',
      'They stop a hundred yards out. A man gets down from the lead truck with his hands open and empty, and walks the whole hundred yards alone.',
    ],
    onEnter: [{ journal: 'Kansas. Six vehicles on the road ahead.' }],
    choices: [
      {
        id: 'a2-kansas-wait',
        text: 'Stand your ground and let him come.',
        kind: 'standard',
        tags: ['decisive'],
        goto: 'a2-kansas-park',
      },
      {
        id: 'a2-kansas-ready',
        text: 'Let him come. Make very sure he can see you are armed.',
        kind: 'stat',
        requires: { stat: 'resolve', gte: 55 },
        hideWhenLocked: false,
        lockedHint: 'Resolve 55',
        effects: [{ flag: 'kansas-showed-teeth', value: true }],
        tags: ['decisive', 'guarded'],
        goto: 'a2-kansas-park',
      },
      {
        id: 'a2-kansas-run',
        text: 'Six vehicles. Get off the road.',
        kind: 'standard',
        roll: { stat: 'cunning', dc: 68, success: 'a2-kansas-evade', failure: 'a2-kansas-caught' },
        tags: ['reckless'],
      },
    ],
  },

  {
    id: 'a2-kansas-evade',
    act: 2,
    location: 'kansas-plains',
    speaker: 'Narrator',
    body: [
      'There is a culvert. There is always a culvert, if you have spent enough time looking at roads instead of along them.',
      'You lie in eight inches of cold water with your hand over Riley\'s mouth — or over your own — while the trucks go past at walking pace, and a voice on a loudhailer says, unhurried, that they only want to talk.',
      'They pass. You lose most of a day and a good deal of dignity.',
    ],
    onEnter: [{ advanceDays: 1 }, { stat: 'cunning', delta: 2 }, { morale: -5 }],
    choices: [
      { id: 'a2-kansas-evade-on', text: 'Move.', goto: '@hub' },
    ],
  },

  {
    id: 'a2-kansas-caught',
    act: 2,
    location: 'kansas-plains',
    speaker: 'Narrator',
    body: [
      'There is nowhere to go. You get four hundred yards into open grass before the outrider swings around ahead of you, and you stand there breathing hard with nothing at all between you and them.',
      'The man from the lead truck catches up on foot, unhurried, hands still open.',
      '"That was rude," he says, and he sounds genuinely hurt about it.',
    ],
    onEnter: [{ health: -10 }, { resource: 'supplies', delta: -10 }],
    choices: [
      { id: 'a2-kansas-caught-on', text: 'Get your breath back.', goto: 'a2-kansas-park' },
    ],
  },

  {
    id: 'a2-kansas-park',
    act: 2,
    location: 'kansas-plains',
    speaker: 'James Park',
    body: [
      '"James Park. This is not a robbery, and I say that knowing exactly how it looks."',
      'He is fifty-ish, warm, with a face built for reassuring people, and he uses it.',
      '"We run this stretch. Two hundred and forty of us in a convoy, going where the food is. And about a month ago we started losing people to something that is not a raider gang and is not a horde."',
      'He looks east, and the warmth goes out of his face for exactly as long as it takes him to say the next part.',
      '"There is a man out here they call the Shepherd. He walks with them. The infected. Twenty, thirty of them, and they do not touch him. He has taken eleven of mine in six weeks. He talks to them first."',
    ],
    choices: [
      {
        id: 'a2-park-help',
        text: '"What do you need?"',
        kind: 'standard',
        effects: [{ loyalty: 'james-park', delta: 10 }],
        tags: ['generous', 'merciful'],
        goto: 'a2-shepherd',
      },
      {
        id: 'a2-park-skeptical',
        text: '"Nobody walks with them. Your people are deserting and you cannot say so."',
        kind: 'standard',
        effects: [{ flag: 'doubted-shepherd', value: true }],
        tags: ['honest', 'guarded'],
        goto: 'a2-shepherd',
      },
      {
        id: 'a2-park-saw-it',
        text: '"I have seen them stand still and listen. It is not impossible."',
        kind: 'standard',
        requires: { flag: 'saw-the-swaying' },
        effects: [
          { loyalty: 'james-park', delta: 8 },
          { flag: 'connected-the-swaying', value: true },
          { stat: 'cunning', delta: 2 },
        ],
        tags: ['curious', 'honest'],
        goto: 'a2-shepherd',
      },
    ],
  },

  {
    id: 'a2-shepherd',
    act: 2,
    location: 'kansas-plains',
    speaker: 'Narrator',
    body: [
      'You see him yourself two nights later, from the top of a grain elevator, and afterwards you will not be able to describe it to anyone in a way that they believe.',
      'A man walking east up the middle of the road at two in the morning. Behind him, loosely, not in formation but not scattered either, perhaps thirty infected — matching his pace, stopping when he stops.',
      'He is talking. Not loudly. The way you talk to a dog you have had a long time.',
      'When he passes below you he stops, and without looking up he says, conversationally: "You are immune. So am I. Ask yourself why they made a disease that lets people like us live."',
      'Then he keeps walking, and they go with him.',
    ],
    onEnter: [
      { flag: 'met-shepherd', value: true },
      { morale: -10 },
      { journal: 'Saw the Shepherd on the road east of Salina. The infected followed him. He spoke to me.' },
    ],
    choices: [
      {
        id: 'a2-shepherd-follow',
        text: 'Come down and go after him. You need to hear the rest.',
        kind: 'standard',
        effects: [
          { flag: 'shepherd-pursued', value: true },
          { health: -15 },
          { stat: 'resolve', delta: 4 },
          { journal: 'Followed the Shepherd. Lost him in the dark. He knew I was there.' },
        ],
        tags: ['reckless', 'curious'],
        goto: 'a2-kansas-after',
      },
      {
        id: 'a2-shepherd-still',
        text: 'Do not move until the sun comes up.',
        kind: 'standard',
        effects: [{ stat: 'resolve', delta: 2 }],
        tags: ['practical'],
        goto: 'a2-kansas-after',
      },
      {
        id: 'a2-shepherd-shoot',
        text: 'You have a clear shot and thirty reasons not to take it. Take it.',
        kind: 'risk',
        requires: { resource: 'ammo', gte: 1 },
        hideWhenLocked: false,
        lockedHint: 'Requires ammunition',
        effects: [{ resource: 'ammo', delta: -1 }],
        roll: { stat: 'resolve', dc: 75, success: 'a2-shepherd-hit', failure: 'a2-shepherd-miss' },
        tags: ['decisive', 'cruel'],
      },
    ],
  },

  {
    id: 'a2-shepherd-hit',
    act: 2,
    location: 'kansas-plains',
    speaker: 'Narrator',
    body: [
      'He goes down in the road and does not get up.',
      'What happens next is the part you will keep. The thirty of them stand over him for perhaps a minute, entirely still. Then they begin to scream — all of them, together, one long note that goes on until you have your hands over your ears.',
      'They are still screaming when you come down off the elevator four hours later. James Park\'s people will thank you. You are not sure you have done a good thing.',
    ],
    onEnter: [
      { flag: 'shepherd-dead', value: true },
      { faction: 'traders', delta: 15 },
      { morale: -14 },
      { grantPerk: 'hardened' },
      { journal: 'I killed the Shepherd. The infected mourned him. I do not know what that means.' },
    ],
    choices: [
      { id: 'a2-shepherd-hit-on', text: 'Come down.', goto: 'a2-kansas-after' },
    ],
  },

  {
    id: 'a2-shepherd-miss',
    act: 2,
    location: 'kansas-plains',
    speaker: 'Narrator',
    body: [
      'The shot goes wide by a foot and the sound of it rolls out across four miles of flat grass.',
      'He does not run. He stops, and he turns, and he looks up at you for a long moment with an expression you can read even at this distance: disappointment.',
      '"That is what they will do to you," he calls up. "I am telling you as a courtesy."',
      'The thirty of them come at the elevator. You spend the rest of the night on the roof.',
    ],
    onEnter: [
      { flag: 'shepherd-knows-me', value: true },
      { advanceDays: 1 },
      { health: -12 },
      { morale: -8 },
      { journal: 'Missed. The Shepherd knows my face now.' },
    ],
    choices: [
      { id: 'a2-shepherd-miss-on', text: 'Wait for the sun.', goto: 'a2-kansas-after' },
    ],
  },

  {
    id: 'a2-kansas-after',
    act: 2,
    location: 'kansas-plains',
    speaker: 'James Park',
    body: [
      'Park finds you on the road the next morning and does not ask what happened, which tells you he already knows some of it.',
      '"I am taking the convoy south," he says. "Away from him. It is the coward\'s route and it will keep two hundred and forty people alive through the winter, so I can live with being called a coward."',
      'He hesitates, which he does not seem to do often.',
      '"I would rather go east. I have wanted to go east since the broadcast. Somebody should find out whether it is true, and I have spent six weeks discovering that I am not brave enough to find out alone."',
    ],
    choices: [
      {
        id: 'a2-park-join',
        text: '"Come with me. Let someone else take them south."',
        kind: 'standard',
        effects: [
          { recruit: 'james-park' },
          { journal: 'James Park handed the convoy to his second and came east with me.' },
        ],
        tags: ['generous', 'decisive'],
        goto: '@hub',
      },
      {
        id: 'a2-park-stay',
        text: '"Two hundred and forty people. Take them south."',
        kind: 'standard',
        effects: [
          { faction: 'traders', delta: 10 },
          { resource: 'supplies', delta: 25 },
          { resource: 'fuel', delta: 10 },
          { journal: 'Told Park to take his people south. He gave me a fortnight of food for it.' },
        ],
        tags: ['protective', 'honest'],
        goto: '@hub',
      },
    ],
  },
];
