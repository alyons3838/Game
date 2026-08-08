import { hubNodeId } from '@/engine/engine';
import type { StoryNode } from '@/engine/types';
import { locations, nextLeg } from '../locations';

/**
 * Every location gets a hub: the node the player returns to between beats. Hubs
 * are generated rather than hand-written because their choice set is uniform —
 * the flavour lives in the location blurb and in the encounters the hub rolls.
 */
function makeHub(locationId: string): StoryNode {
  const location = locations[locationId]!;
  const leg = nextLeg(locationId);

  const node: StoryNode = {
    id: hubNodeId(locationId),
    act: location.act,
    location: locationId,
    title: location.name,
    body: [
      location.blurb,
      'Day {day}. You take stock and decide what this place is worth to you.',
    ],
    choices: [
      {
        id: `${locationId}-explore`,
        text: 'Go looking. There is always something left.',
        kind: 'standard',
        effects: [{ advanceDays: 1 }],
        tags: ['curious'],
        goto: '@encounter',
      },
      {
        id: `${locationId}-scavenge`,
        text: 'Work the buildings properly. Slower, but thorough.',
        kind: 'stat',
        requires: { stat: 'scavenge', gte: 55 },
        hideWhenLocked: false,
        lockedHint: 'Scavenge 55',
        effects: [
          { advanceDays: 2 },
          { resource: 'supplies', delta: 14 },
          { resource: 'meds', delta: 1 },
        ],
        tags: ['planned'],
        goto: '@hub',
      },
      {
        id: `${locationId}-rest`,
        text: 'Hole up. Sleep somewhere with a door.',
        kind: 'standard',
        effects: [{ advanceDays: 2 }, { health: 25 }, { morale: 8 }],
        goto: '@hub',
      },
    ],
  };

  if (leg) {
    const destination = locations[leg.to]!;
    node.choices.push({
      id: `${locationId}-depart`,
      text: `Move on. ${destination.name} is roughly ${leg.days} days east.`,
      kind: 'standard',
      effects: [{ advanceDays: leg.days }, { travelTo: leg.to }],
      tags: ['decisive'],
      goto: destination.arrival!,
    });
  }

  return node;
}

export const hubs: StoryNode[] = Object.keys(locations).map(makeHub);
