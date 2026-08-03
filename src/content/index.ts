import type { EndingDef, StoryContent, StoryNode } from '@/engine/types';
import { companions } from './companions';
import { locations } from './locations';
import { perks } from './perks';
import { traits } from './traits';
import { act1 } from './nodes/act1';
import { act2 } from './nodes/act2';
import { act3 } from './nodes/act3';
import { act4, endingNodes } from './nodes/act4';
import { encounters } from './nodes/encounters';
import { hubs } from './nodes/hubs';

const endingList: EndingDef[] = [
  {
    id: 'alliance',
    name: 'The Hands',
    summary: 'You carried it out. It worked. You keep the arithmetic.',
  },
  {
    id: 'resistance',
    name: 'Published',
    summary: 'You put it all in the open and let the world refuse it.',
  },
  {
    id: 'synthesis',
    name: 'Eleven Days',
    summary: 'You found the assumption nobody had time to question.',
  },
  {
    id: 'settlement',
    name: 'West Again',
    summary: 'You walked back out and let it happen without you.',
  },
  {
    id: 'shepherd',
    name: 'What Comes Next',
    summary: 'You went to find out what the weapon was actually for.',
  },
];

const allNodes: StoryNode[] = [
  ...act1,
  ...act2,
  ...act3,
  ...act4,
  ...endingNodes,
  ...encounters,
  ...hubs,
];

/** Fails loudly at import time rather than mid-run if two nodes share an id. */
const nodes: Record<string, StoryNode> = {};
for (const node of allNodes) {
  if (nodes[node.id]) throw new Error(`Duplicate story node id: ${node.id}`);
  nodes[node.id] = node;
}

export const content: StoryContent = {
  nodes,
  perks,
  traits,
  companions,
  locations,
  endings: Object.fromEntries(endingList.map((e) => [e.id, e])),
};

export { locations, companions, perks, traits };
export { START_LOCATIONS, ROUTE, nextLeg } from './locations';
