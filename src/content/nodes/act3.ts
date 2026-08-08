import type { StoryNode } from '@/engine/types';

/**
 * Act 3 pays off the immunity question. St. Louis forces a faction commitment,
 * Chicago puts a thinking infected in front of the player, and Pittsburgh hands
 * them the document that makes Act 4's choice mean something.
 */
export const act3: StoryNode[] = [
  // --- St. Louis -----------------------------------------------------------
  {
    id: 'a3-st-louis',
    act: 3,
    location: 'st-louis',
    speaker: 'Narrator',
    body: [
      'St. Louis is at war with itself and both sides are losing.',
      'East bank: government regulars, actual uniforms, actual supply chain, a checkpoint on the one standing bridge and a list of who may cross.',
      'West bank: everyone the list does not cover. Four thousand people in a tent city that has been there long enough to have street names.',
      'You are on the west bank. The bridge is a hundred yards away. There is a queue on it that has not moved all morning.',
    ],
    onEnter: [{ journal: 'St. Louis. One bridge, one list, four thousand people not on it.' }],
    choices: [
      {
        id: 'a3-stl-queue',
        text: 'Join the queue. You are immune; that is what the list is for.',
        kind: 'standard',
        effects: [{ advanceDays: 1 }],
        tags: ['practical'],
        goto: 'a3-stl-bridge',
      },
      {
        id: 'a3-stl-camp',
        text: 'Walk the camp first. Find out what the queue is actually for.',
        kind: 'standard',
        effects: [{ advanceDays: 1 }],
        tags: ['curious'],
        goto: 'a3-stl-doc',
      },
    ],
  },

  {
    id: 'a3-stl-doc',
    act: 3,
    location: 'st-louis',
    speaker: 'Marcus "Doc" Williams',
    body: [
      'The clinic is a marquee with the sides rolled up, and the man running it has been awake for a length of time you do not want to calculate.',
      '"You want to know about the bridge." He does not stop what he is doing. "They test you at the far end. Blood draw. Immune, you cross. Not immune, you go back down the ramp."',
      'He ties off a dressing and finally looks at you.',
      '"Nine hundred and six people have crossed in five weeks. Not one has come back, and not one has sent word. I have family over there. Nothing." A pause. "Marcus Williams. Everyone calls me Doc, which I have given up correcting."',
    ],
    choices: [
      {
        id: 'a3-doc-ask',
        text: '"You think they are being held."',
        kind: 'standard',
        effects: [
          { flag: 'knows-bridge-testing', value: true },
          { journal: '906 immune have crossed at St. Louis. None have sent word back.' },
        ],
        tags: ['curious'],
        goto: 'a3-stl-doc-2',
      },
      {
        id: 'a3-doc-ava',
        text: 'Get Ava down here. She should hear this from him.',
        kind: 'companion',
        requires: { companion: 'ava-chen', is: 'present' },
        hideWhenLocked: false,
        lockedHint: 'Requires Ava Chen',
        effects: [
          { flag: 'knows-bridge-testing', value: true },
          { flag: 'ava-heard-stl', value: true },
          { loyalty: 'ava-chen', delta: 10 },
          {
            journal:
              'Ava confirmed it: the bridge test is a genotype screen, not an infection test. They are sorting for something specific.',
          },
        ],
        tags: ['curious', 'honest'],
        goto: 'a3-stl-doc-2',
      },
      {
        id: 'a3-doc-help',
        text: 'Say nothing and start handing him things.',
        kind: 'standard',
        effects: [
          { advanceDays: 1 },
          { loyalty: 'marcus-williams', delta: 15 },
          { resource: 'meds', delta: -1 },
          { morale: 8 },
        ],
        tags: ['merciful', 'generous'],
        goto: 'a3-stl-doc-2',
      },
    ],
  },

  {
    id: 'a3-stl-doc-2',
    act: 3,
    location: 'st-louis',
    speaker: 'Marcus "Doc" Williams',
    body: [
      '"I am not telling you not to cross. I would cross. There is nothing on this bank but me and four thousand people I cannot fix."',
      'He wipes his hands on something that has not been clean for a while.',
      '"I am telling you that when you get to Washington, somebody should be counting. That is all. Somebody with a reason to count."',
      'He looks at the bridge for a while.',
      '"I could be that somebody, if I had a reason to walk that far and someone to walk it with."',
    ],
    choices: [
      {
        id: 'a3-doc-join',
        text: '"Then close the clinic and come."',
        kind: 'standard',
        effects: [
          { recruit: 'marcus-williams' },
          { journal: 'Doc closed the clinic and came east. He is counting.' },
        ],
        tags: ['decisive', 'generous'],
        goto: 'a3-stl-bridge',
      },
      {
        id: 'a3-doc-stay',
        text: '"Four thousand people need a doctor more than I need a friend."',
        kind: 'standard',
        effects: [
          { resource: 'meds', delta: 4 },
          { morale: 5 },
          { journal: 'Left Doc his clinic. He gave me most of his antibiotics for the road.' },
        ],
        tags: ['protective', 'honest'],
        goto: 'a3-stl-bridge',
      },
    ],
  },

  {
    id: 'a3-stl-bridge',
    act: 3,
    location: 'st-louis',
    speaker: 'Narrator',
    body: [
      'The far end of the bridge is a folding table, two soldiers, and a woman with a field centrifuge who has clearly done this several thousand times.',
      'She takes four millilitres from your arm, spins it, reads something off a handheld, and her expression does not change at all.',
      '"Confirmed immune. Welcome." She writes on a card and hands it to you. "Keep this on your person for the rest of the corridor. It gets you through every checkpoint between here and the District."',
      'The card has your blood group, a date, and a code: LZ-N/R.',
    ],
    onEnter: [
      { flag: 'has-corridor-card', value: true },
      { faction: 'government', delta: 10 },
      { journal: 'Crossed at St. Louis. My card is marked LZ-N/R.' },
    ],
    choices: [
      {
        id: 'a3-bridge-ask',
        text: '"What does the code mean?"',
        kind: 'standard',
        effects: [{ flag: 'asked-about-code', value: true }],
        tags: ['curious'],
        goto: 'a3-stl-cross',
      },
      {
        id: 'a3-bridge-quiet',
        text: 'Take the card. Do not ask questions at a folding table with soldiers behind it.',
        kind: 'standard',
        effects: [{ stat: 'cunning', delta: 2 }],
        tags: ['guarded', 'clever'],
        goto: 'a3-stl-cross',
      },
    ],
  },

  {
    id: 'a3-stl-cross',
    act: 3,
    location: 'st-louis',
    speaker: 'Narrator',
    body: [
      'Whatever you asked, the answer was "above my level, ma\'am" or "above my level, sir", delivered by someone who had been told to say exactly that.',
      'The east bank is clean. There is power on in some of the buildings. A bus runs.',
      'Behind you the queue on the bridge has still not moved.',
    ],
    choices: [{ id: 'a3-stl-on', text: 'East.', goto: '@hub' }],
  },

  // --- Chicago -------------------------------------------------------------
  {
    id: 'a3-chicago',
    act: 3,
    location: 'chicago',
    speaker: 'Narrator',
    body: [
      'The corridor route runs north of Chicago for good reason. You go into the city anyway, because the corridor rations are thin and the warehouses on the south branch are not.',
      'It takes half a day to reach them and it is the loudest half day of your life. The density here is unlike anywhere west of it — they are in the buildings, in the stairwells, standing in the flooded underpasses in numbers that stop being individuals.',
      'You reach a loading dock, get the shutter down behind you, and in the dark at the back of the warehouse a woman\'s voice says, perfectly clearly:',
      '"There\'s a gap in the fence on the north side. I would use that one on the way out."',
    ],
    onEnter: [{ journal: 'Chicago. Something in the warehouse spoke to me.' }],
    choices: [
      {
        id: 'a3-chi-answer',
        text: '"Who is that?"',
        goto: 'a3-whisper',
      },
      {
        id: 'a3-chi-light',
        text: 'Put your light on her before you say anything.',
        kind: 'standard',
        effects: [{ flag: 'lit-sarah-first', value: true }],
        tags: ['guarded'],
        goto: 'a3-whisper',
      },
    ],
  },

  {
    id: 'a3-whisper',
    act: 3,
    location: 'chicago',
    speaker: 'Sarah Cross',
    body: [
      'She is sitting on a pallet with her hands where you can see them, which she has clearly thought about.',
      'Her eyes are entirely white. Not clouded — white, edge to edge, the way theirs are.',
      '"Sarah Cross. Day nine, in the Loop, from a man on a train." She says it flatly, a fact she has recited before. "That was one hundred and eighteen days ago and I am still here."',
      '"I do not sleep any more. I can hear them the way you hear weather. And every so often I lose about an hour and I do not know where I have been." A small, awful shrug. "That is everything I know. You are the fourth person I have told. The other three ran, which is fair."',
    ],
    choices: [
      {
        id: 'a3-sarah-stay',
        text: 'Sit down on the other pallet.',
        kind: 'standard',
        effects: [
          { flag: 'sat-with-sarah', value: true },
          { stat: 'empathy', delta: 3 },
          { grantPerk: 'listener' },
        ],
        tags: ['merciful', 'curious'],
        goto: 'a3-sarah-2',
      },
      {
        id: 'a3-sarah-clinical',
        text: '"One hundred and eighteen days. Any progression at all? Be precise."',
        kind: 'perk',
        requires: { any: [{ hasPerk: 'clinical-eye' }, { hasPerk: 'method' }, { hasPerk: 'first-response' }] },
        hideWhenLocked: false,
        lockedHint: 'Requires a medical or scientific perk',
        effects: [
          { flag: 'sarah-examined', value: true },
          { grantPerk: 'listener' },
          { stat: 'cunning', delta: 3 },
          {
            journal:
              'Sarah Cross: 118 days infected, no cognitive progression. Whatever Lazarus does, it did not finish with her.',
          },
        ],
        tags: ['curious', 'clever'],
        goto: 'a3-sarah-2',
      },
      {
        id: 'a3-sarah-run',
        text: 'Get the shutter up and get out.',
        kind: 'standard',
        effects: [
          { morale: -6 },
          { flag: 'ran-from-sarah', value: true },
          { journal: 'There was a woman in the warehouse who could still talk. I ran.' },
        ],
        tags: ['abandon'],
        goto: 'a3-chicago-out',
      },
    ],
  },

  {
    id: 'a3-sarah-2',
    act: 3,
    location: 'chicago',
    speaker: 'Sarah Cross',
    body: [
      '"There is a man out west who does this on purpose." She says it without prompting. "I have heard him. Not with my ears."',
      '"He thinks we are what comes next and that the immune are the ones who got left behind. He is wrong, but he is not stupid, and there is a difference between those." She turns her white eyes toward the shutter. "The government has been testing at the bridges. I know what they are testing for, because Lazarus told me, in the hour I lose."',
      '"They are not screening for infection. They are screening for the marker that makes a person immune, because you cannot manufacture a cure out of people who never caught it. You need the ones it went into and did not finish."',
      'She holds out her arm, and the meaning is unmistakable.',
      '"You are not what they want. I am."',
    ],
    onEnter: [
      { flag: 'sarah-truth', value: true },
      {
        journal:
          'Sarah: the government is not screening for infection. It is screening for the marker. And the useful subjects are people like her.',
      },
    ],
    choices: [
      {
        id: 'a3-sarah-bring',
        text: '"Then come to Washington with me and say that to their faces."',
        kind: 'standard',
        effects: [
          { recruit: 'sarah-cross' },
          { flag: 'sarah-travelling', value: true },
          { journal: 'Sarah Cross is walking east with me. This will not go quietly at a checkpoint.' },
        ],
        tags: ['merciful', 'reckless', 'decisive'],
        goto: 'a3-chicago-out',
      },
      {
        id: 'a3-sarah-leave-kind',
        text: '"Then Washington is the last place you should go. Stay here."',
        kind: 'standard',
        effects: [
          { morale: 4 },
          { flag: 'sarah-warned-off', value: true },
          { journal: 'Told Sarah to stay in Chicago. She said she had already worked that out.' },
        ],
        tags: ['protective', 'honest'],
        goto: 'a3-chicago-out',
      },
      {
        id: 'a3-sarah-doubt',
        text: '"You lose an hour a day and you are telling me what you heard in it."',
        kind: 'standard',
        effects: [{ flag: 'doubted-sarah', value: true }, { stat: 'resolve', delta: 2 }],
        tags: ['guarded', 'honest'],
        goto: 'a3-chicago-out',
      },
    ],
  },

  {
    id: 'a3-chicago-out',
    act: 3,
    location: 'chicago',
    speaker: 'Narrator',
    body: [
      'The gap in the fence on the north side is exactly where she said it would be.',
      'You load what you can carry and you are clear of the city by dark, and for two days afterwards you keep replaying a sentence you cannot make fit anywhere: they are screening for the marker.',
    ],
    onEnter: [{ resource: 'supplies', delta: 30 }, { resource: 'ammo', delta: 6 }],
    choices: [{ id: 'a3-chi-on', text: 'East.', goto: '@hub' }],
  },

  // --- Pittsburgh ----------------------------------------------------------
  {
    id: 'a3-pittsburgh',
    act: 3,
    location: 'pittsburgh',
    speaker: 'Narrator',
    body: [
      'Pittsburgh is the last checkpoint and the first place since the collapse that feels like a country.',
      'Traffic control. A working canteen. A noticeboard with actual notices on it. Soldiers who look bored, which is the most reassuring thing you have seen in three months.',
      'A captain takes your card, looks at the code, and gets on the radio without saying anything to you first.',
      'You are escorted — politely, and with no option to decline — to a portacabin with a heater and a table.',
    ],
    onEnter: [{ journal: 'Pittsburgh. They took one look at my card and made a call.' }],
    choices: [
      {
        id: 'a3-pit-comply',
        text: 'Sit down and wait.',
        goto: 'a3-lab-truth',
      },
      {
        id: 'a3-pit-hide-sarah',
        text: 'Before anything else: get Sarah out of sight.',
        kind: 'companion',
        requires: { companion: 'sarah-cross', is: 'present' },
        hideWhenLocked: false,
        lockedHint: 'Requires Sarah Cross',
        roll: { stat: 'cunning', dc: 62, success: 'a3-sarah-hidden', failure: 'a3-sarah-found' },
        tags: ['protective', 'clever'],
      },
    ],
  },

  {
    id: 'a3-sarah-hidden',
    act: 3,
    location: 'pittsburgh',
    speaker: 'Narrator',
    body: [
      'There is a culvert under the approach road and a drainage grille that has not been checked in weeks, and Sarah goes into it without a word of argument.',
      '"Two days," she says. "After that assume I am gone and do not come looking."',
      'You walk into the portacabin with your hands empty and your face arranged.',
    ],
    onEnter: [
      { flag: 'sarah-hidden-pittsburgh', value: true },
      { loyalty: 'sarah-cross', delta: 15 },
    ],
    choices: [{ id: 'a3-hidden-on', text: 'Sit down and wait.', goto: 'a3-lab-truth' }],
  },

  {
    id: 'a3-sarah-found',
    act: 3,
    location: 'pittsburgh',
    speaker: 'Narrator',
    body: [
      'They have thermal on the approach road. Of course they have thermal on the approach road.',
      'It takes ninety seconds and four soldiers, and Sarah does not resist at all, which somehow makes it worse to watch. The captain is not angry. He is apologetic, and he does not stop.',
      '"She goes to the District either way," he says. "Honestly, so do you. The difference is whether you go as a passenger."',
    ],
    onEnter: [
      { flag: 'sarah-taken', value: true },
      { morale: -15 },
      { faction: 'government', delta: -10 },
      { journal: 'They took Sarah at Pittsburgh. He said she was going to Washington either way.' },
    ],
    choices: [{ id: 'a3-found-on', text: 'Sit down.', goto: 'a3-lab-truth' }],
  },

  {
    id: 'a3-lab-truth',
    act: 3,
    location: 'pittsburgh',
    speaker: 'Colonel Adeyemi',
    body: [
      'The woman who comes in is fifty, in fatigues with no unit patch, and she puts a folder on the table and sits down opposite you like this is an interview she has been dreading.',
      '"I am going to tell you the truth, because in about a week you are going to find it out in a room where it will be much harder to hear."',
      '"Lazarus was ours. Not an accident, not a lab leak. A sorting weapon — a pathogen keyed to a genetic marker, designed to leave a specific population functional. The marker is on your card. LZ-N/R. Non-responder."',
      '"It was never supposed to leave the facility. It left the facility."',
      'She opens the folder and turns it around. Charts, columns, and at the bottom a figure with a great many zeros.',
      '"Two thirds of the species is not dead. It is infected, and infection is not always terminal — you may have met someone who proves that. A reversal agent is real and it is close. It has one requirement." She taps the page. "It has to be cultured in living hosts who carry the marker and were exposed. That is a very small group. It is not you. It is the ones who caught it and did not turn all the way."',
    ],
    onEnter: [
      { flag: 'knows-lazarus-truth', value: true },
      {
        journal:
          'Colonel Adeyemi, Pittsburgh: Lazarus was engineered to sort by genetic marker. The cure requires living partially-infected carriers.',
      },
    ],
    choices: [
      {
        id: 'a3-truth-why',
        text: '"Then why do you want the immune at all?"',
        kind: 'standard',
        effects: [{ flag: 'asked-why-immune', value: true }],
        tags: ['curious'],
        goto: 'a3-adeyemi-2',
      },
      {
        id: 'a3-truth-sarah',
        text: '"You want people like Sarah Cross. You want to farm them."',
        kind: 'standard',
        requires: { flag: 'sarah-truth' },
        effects: [
          { flag: 'named-it-aloud', value: true },
          { stat: 'resolve', delta: 4 },
          { faction: 'resistance', delta: 10 },
        ],
        tags: ['honest', 'decisive'],
        goto: 'a3-adeyemi-2',
      },
      {
        id: 'a3-truth-numbers',
        text: '"How many hosts. Say the number out loud."',
        kind: 'stat',
        requires: { stat: 'resolve', gte: 60 },
        hideWhenLocked: false,
        lockedHint: 'Resolve 60',
        effects: [
          { flag: 'knows-the-number', value: true },
          { journal: 'Adeyemi: roughly four thousand hosts. She did not say what happens to them.' },
        ],
        tags: ['honest', 'decisive'],
        goto: 'a3-adeyemi-2',
      },
    ],
  },

  {
    id: 'a3-adeyemi-2',
    act: 3,
    location: 'pittsburgh',
    speaker: 'Colonel Adeyemi',
    body: [
      '"Because we need people who can walk into a city full of them and come out. Handlers. Custody. Transport." She closes the folder. "You are not the medicine. You are the hands."',
      '"There is a faction inside the programme that wants to publish everything and let the world decide. There is another that thinks four thousand is a rounding error against five billion, and honestly, at three in the morning, so do I."',
      'She stands.',
      '"You will be in the District in four days. Nobody there is going to give you this conversation. So have it with yourself on the way."',
    ],
    choices: [
      {
        id: 'a3-adeyemi-side-gov',
        text: '"If it works, it is worth it. Tell them I will do the work."',
        kind: 'standard',
        effects: [
          { faction: 'government', delta: 25 },
          { flag: 'pledged-government', value: true },
        ],
        tags: ['decisive', 'practical'],
        goto: 'a3-pittsburgh-out',
      },
      {
        id: 'a3-adeyemi-side-res',
        text: '"Who is the faction that wants to publish. How do I find them."',
        kind: 'standard',
        effects: [
          { faction: 'resistance', delta: 25 },
          { flag: 'has-resistance-contact', value: true },
          { journal: 'Adeyemi gave me a name to ask for in the District. She did not write it down.' },
        ],
        tags: ['honest', 'curious'],
        goto: 'a3-pittsburgh-out',
      },
      {
        id: 'a3-adeyemi-third',
        text: '"There is a third answer and you have not looked for it because you are tired."',
        kind: 'stat',
        requires: {
          all: [
            { stat: 'cunning', gte: 62 },
            { any: [{ flag: 'sarah-truth' }, { flag: 'ava-technical' }] },
          ],
        },
        hideWhenLocked: false,
        lockedHint: 'Cunning 62, and what Sarah or Ava told you',
        effects: [
          { flag: 'synthesis-seed', value: true },
          { stat: 'cunning', delta: 3 },
          { faction: 'resistance', delta: 10 },
          {
            journal:
              'Told Adeyemi there is a third option: culture the agent without expending the hosts. She did not say it was impossible. She said nobody had been given the time.',
          },
        ],
        tags: ['clever', 'honest'],
        goto: 'a3-pittsburgh-out',
      },
    ],
  },

  {
    id: 'a3-pittsburgh-out',
    act: 3,
    location: 'pittsburgh',
    speaker: 'Narrator',
    body: [
      'They give you a bunk, hot food, and a departure time.',
      'Nobody stops you leaving the base. That is the part that stays with you — the door is not locked, because at this point in the corridor there is nowhere else to go.',
    ],
    choices: [{ id: 'a3-pit-on', text: 'Four days east.', goto: '@hub' }],
  },
];
