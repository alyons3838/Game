import type { StoryNode } from '@/engine/types';

/**
 * Act 4 collapses the run into one decision. Which options appear is entirely a
 * function of what the player learned, who they kept, and what they committed to
 * — a player who dismissed Ava, ran from Sarah and never pushed Adeyemi arrives
 * with exactly two doors, and that is the intended consequence.
 */
export const act4: StoryNode[] = [
  {
    id: 'a4-gates',
    act: 4,
    location: 'washington-dc',
    speaker: 'Narrator',
    body: [
      'You come in from the northwest on the last morning, and the first thing you see is the light.',
      'Floodlights on the Mall. Not one generator — a grid. Streetlamps. A hospital with every window lit, and traffic, actual traffic, moving between checkpoints in an orderly way.',
      'Three thousand miles. Ninety-some days. It is real, and it is exactly as advertised, and that is what frightens you.',
      'At the perimeter, a processing tent. A queue of maybe two hundred people, all of them carrying the same card you are.',
    ],
    onEnter: [{ journal: 'Washington. The lights are on. It was all true.' }],
    choices: [
      {
        id: 'a4-gates-in',
        text: 'Join the queue.',
        goto: 'a4-briefing',
      },
      {
        id: 'a4-gates-count',
        text: 'Count the queue first. Then count the buildings with bars on them.',
        kind: 'trait',
        requires: { any: [{ hasTrait: 'observant' }, { hasTrait: 'guarded' }, { hasTrait: 'methodical' }] },
        hideWhenLocked: false,
        lockedHint: 'Requires Observant, Guarded or Methodical',
        effects: [
          { flag: 'counted-the-buildings', value: true },
          { stat: 'cunning', delta: 2 },
          {
            journal:
              'Two hundred in the intake queue. Four buildings on the south side with sealed windows and a separate gate.',
          },
        ],
        tags: ['curious', 'clever'],
        goto: 'a4-briefing',
      },
    ],
  },

  {
    id: 'a4-briefing',
    act: 4,
    location: 'washington-dc',
    speaker: 'Director Halloran',
    body: [
      'Processing takes six hours and ends in a room with a working projector, which after ninety days is its own kind of shock.',
      '"You are among four thousand one hundred confirmed non-responders to reach the District. On behalf of what is left of the United States government: thank you for walking."',
      'Halloran is sixty, exhausted, and entirely sincere, which makes the next part harder rather than easier.',
      '"Reversal Agent Theta is validated. It works. In eleven days we begin the largest medical operation in human history and we bring back two thirds of the species."',
      'The next slide is a logistics chart. Intake. Culture. Yield.',
      '"Production requires living partial-conversion hosts. We have three thousand eight hundred and sixty in custody. The process is not survivable for them. I am not going to stand here and pretend otherwise, and I am going to ask you to help us do it anyway."',
    ],
    onEnter: [{ flag: 'heard-briefing', value: true }],
    choices: [
      {
        id: 'a4-brief-question',
        text: '"Did any of the three thousand eight hundred agree to it?"',
        kind: 'standard',
        effects: [{ flag: 'asked-consent', value: true }, { faction: 'resistance', delta: 8 }],
        tags: ['honest'],
        goto: 'a4-decision',
      },
      {
        id: 'a4-brief-sarah',
        text: 'Stand up. Say that one of them walked here beside you.',
        kind: 'companion',
        requires: { companion: 'sarah-cross', is: 'present' },
        hideWhenLocked: false,
        lockedHint: 'Requires Sarah Cross with you',
        effects: [
          { flag: 'sarah-spoke', value: true },
          { faction: 'resistance', delta: 15 },
          { loyalty: 'sarah-cross', delta: 10 },
          {
            journal:
              'Sarah stood up in front of four hundred people and told them what she was. The room went completely silent.',
          },
        ],
        tags: ['decisive', 'merciful'],
        goto: 'a4-decision',
      },
      {
        id: 'a4-brief-accept',
        text: 'Say nothing. Eleven days is eleven days.',
        kind: 'standard',
        effects: [{ faction: 'government', delta: 10 }],
        tags: ['practical'],
        goto: 'a4-decision',
      },
    ],
  },

  {
    id: 'a4-decision',
    act: 4,
    location: 'washington-dc',
    speaker: 'Narrator',
    body: [
      'They give you a room with a bed and a lock on the inside of the door, and eleven days.',
      'You have walked three thousand miles to arrive at a question that could have been put to you on the first night, in the upstairs office of a tyre shop, four miles outside {location}.',
      'Three thousand eight hundred and sixty people. Five billion.',
      'Day one of eleven. Decide.',
    ],
    choices: [
      {
        id: 'a4-end-alliance',
        text: 'Sign on. Be the hands. Carry it and do not put it down.',
        kind: 'standard',
        effects: [{ faction: 'government', delta: 20 }],
        tags: ['decisive', 'practical'],
        goto: 'ending-alliance',
      },
      {
        id: 'a4-end-resistance',
        text: 'Find the people who want to publish, and burn the programme down with them.',
        kind: 'faction',
        requires: {
          any: [
            { flag: 'has-resistance-contact' },
            { faction: 'resistance', gte: 20 },
            { flag: 'sarah-spoke' },
          ],
        },
        hideWhenLocked: false,
        lockedHint: 'Requires a contact inside the dissenting faction',
        tags: ['decisive', 'reckless'],
        goto: 'ending-resistance',
      },
      {
        id: 'a4-end-synthesis',
        text: 'Eleven days is enough time to prove there is a third way. Take it to the lab floor.',
        kind: 'stat',
        requires: {
          all: [
            { flag: 'synthesis-seed' },
            { any: [{ companion: 'ava-chen', is: 'present' }, { flag: 'sarah-truth' }] },
            { stat: 'cunning', gte: 60 },
          ],
        },
        hideWhenLocked: false,
        lockedHint: 'Requires the third answer, Ava or Sarah, and Cunning 60',
        tags: ['clever', 'merciful'],
        goto: 'ending-synthesis',
      },
      {
        id: 'a4-end-settlement',
        text: 'Take whoever will come and walk back out. Let them do it without you.',
        kind: 'standard',
        tags: ['abandon', 'protective'],
        goto: 'ending-settlement',
      },
      {
        id: 'a4-end-shepherd',
        text: 'There was a man in Kansas who said they made a disease that lets people like us live. Go and find out what he meant.',
        kind: 'memory',
        requires: {
          all: [
            { flag: 'met-shepherd' },
            { not: { flag: 'shepherd-dead' } },
            { stat: 'resolve', gte: 62 },
          ],
        },
        hideWhenLocked: false,
        lockedHint: 'Requires the Shepherd alive, and Resolve 62',
        tags: ['reckless', 'decisive'],
        goto: 'ending-shepherd',
      },
    ],
  },
];

export const endingNodes: StoryNode[] = [
  {
    id: 'ending-alliance',
    act: 4,
    location: 'washington-dc',
    title: 'The Hands',
    ending: 'alliance',
    speaker: 'Narrator',
    body: [
      'Theta goes into the field on the nineteenth of the month and the first reversal is confirmed six days later in a converted school gymnasium in Baltimore. A man in his forties sits up and asks for his wife by name.',
      'Inside two years the infected population of the eastern seaboard is measured in thousands rather than millions. Inside five, the word "infected" has started to sound archaic, the way "consumptive" does.',
      'Three thousand eight hundred and sixty names are on a wall in the atrium of the facility. You were on the transport detail for four hundred and six of them and you can still do the arithmetic in your sleep.',
      'You have a house. You have a job that people thank you for. Every so often somebody who was brought back finds out what you did and thanks you for that too, and you let them, because refusing would be about you.',
      'It worked. You would do it again. Both of those are true and you have stopped trying to make them sit comfortably together.',
    ],
    choices: [],
  },

  {
    id: 'ending-resistance',
    act: 4,
    location: 'washington-dc',
    title: 'Published',
    ending: 'resistance',
    speaker: 'Narrator',
    body: [
      'It takes nine days, four people inside the programme, and a transmitter Riley would have loved.',
      'Everything goes out at once — the Lazarus origin file, the marker specification, the Theta yield charts with the host column intact — on every band still monitored between the coasts, repeating for eleven hours.',
      'The programme does not survive contact with its own paperwork. Custody is opened. Three thousand two hundred and eleven of the hosts are still alive to walk out; the rest were already past helping.',
      'What follows is not the clean thing you pictured. Theta production stops. The infected stay infected. A great many people who could have been saved are not, and they have names too, and some of them are found by their families who then come looking for the people who published.',
      'But nobody was farmed. Nothing was done in a locked building to people who could not say no.',
      'You did not save the world. You refused to let it be bought at that price, and you have to be able to live in the difference.',
    ],
    choices: [],
  },

  {
    id: 'ending-synthesis',
    act: 4,
    location: 'washington-dc',
    title: 'Eleven Days',
    ending: 'synthesis',
    speaker: 'Narrator',
    body: [
      'The argument that changes it is not yours. You only got the door open.',
      'It comes down to a sampling assumption made in the second week of the programme by people working ninety-hour shifts, and never revisited because revisiting it would have cost time nobody felt they had: that the culture had to be taken terminally, in bulk, from a whole host.',
      'It does not. It has to be taken repeatedly, in small volumes, from a host who stays alive to give it again. It is slower. It takes eleven months instead of eleven days, and thirty thousand more people go feral in the interval who would not have.',
      'You are in the room when Halloran signs the revised protocol, and he looks a decade older doing it than he did giving the briefing.',
      'Three thousand eight hundred and sixty people are alive four years later. So are most of the ones who would have been lost either way. There is a version of this where you arrived a week later, or asked one fewer question in a portacabin in Pittsburgh, and none of it went this way.',
      'You think about that more than you think about the rest of it.',
    ],
    choices: [],
  },

  {
    id: 'ending-settlement',
    act: 4,
    location: 'washington-dc',
    title: 'West Again',
    ending: 'settlement',
    speaker: 'Narrator',
    body: [
      'You leave on the fourth day, through a gate nobody bothers to guard from the inside, and you head west because west is the direction you know.',
      'You do not stop them. You do not help them. Somewhere behind you a decision of enormous consequence is made by people who will never know your name, and it is made without you, which is what you chose.',
      'The settlement is in Pennsylvania and it is not much: eleven people, then thirty, then eighty. A wall. A school, eventually, of a sort.',
      'News reaches you the way news does now, months late and third-hand. Theta works. The infected are coming back. Nobody out here asks what it cost, and you find you do not tell them.',
      'You are not sure whether what you did was decency or cowardice. You have had a long time to decide and you are no closer.',
      'The wall holds. The kids are alright. Most days that is the whole of the ledger.',
    ],
    choices: [],
  },

  {
    id: 'ending-shepherd',
    act: 4,
    location: 'washington-dc',
    title: 'What Comes Next',
    ending: 'shepherd',
    speaker: 'Narrator',
    body: [
      'You go west to find him and it takes most of a year, and by the time you do there are four hundred people walking with him, and perhaps nine thousand of them.',
      'He was never a prophet. That was the mistake everyone made, including you, on a grain elevator in Kansas. He is a man who noticed something first: that the ones who did not turn all the way are still in there, that they can be reached, and that reaching them takes a person the infection recognises and lets alone.',
      'Someone immune. Someone the weapon was built to spare.',
      'What he is building is not a cure and it is not a cult. It is a third population — the immune and the partially-turned, living in the same place, communicating in a way that nobody east of the Mississippi has a vocabulary for yet.',
      'Washington finishes Theta. It works, at the cost they said it would. Out here, seven thousand more come back over four years without anybody dying for it, slowly, badly, and by a method no journal will publish for a decade.',
      'You are one of the ones who can walk between. That was true on the first night, four miles outside {location}, and you spent three thousand miles finding out what it was for.',
    ],
    choices: [],
  },
];
