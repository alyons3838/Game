import type { LocationDef } from '@/engine/types';

/**
 * `mile` drives both the map display and journey progress. The four Act 1 cities
 * are alternative starts rather than a sequence, so they all sit near zero.
 */
const list: LocationDef[] = [
  {
    id: 'seattle',
    name: 'Seattle, Washington',
    act: 1,
    mile: 0,
    blurb: 'Rain on ten thousand empty windows. The city is loud with water and nothing else.',
    danger: 3,
    arrival: 'a1-open',
  },
  {
    id: 'san-francisco',
    name: 'San Francisco, California',
    act: 1,
    mile: 0,
    blurb: 'Fog comes off the bay every morning and takes the hills back. You learn to move by sound.',
    danger: 4,
    arrival: 'a1-open',
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles, California',
    act: 1,
    mile: 60,
    blurb: 'A hundred square miles of hiding places, and everything in them is hiding from something.',
    danger: 5,
    arrival: 'a1-open',
  },
  {
    id: 'phoenix',
    name: 'Phoenix, Arizona',
    act: 1,
    mile: 200,
    blurb: 'The heat does most of the killing here. Water is the only currency anyone respects.',
    danger: 4,
    arrival: 'a1-open',
  },
  {
    id: 'salt-lake-city',
    name: 'Salt Lake City, Utah',
    act: 2,
    mile: 800,
    blurb:
      'Lit streets. Swept pavement. A choir practising somewhere at dusk. The Sanctuary keeps this place immaculate and the price is written on a board at the gate.',
    danger: 2,
    faction: 'sanctuary',
    arrival: 'a2-salt-lake',
  },
  {
    id: 'denver',
    name: 'Denver, Colorado',
    act: 2,
    mile: 1200,
    blurb:
      'Forty feet of scrap steel around the old downtown, and inside it the largest market between the coasts. Everything is for sale and nothing is cheap.',
    danger: 3,
    faction: 'traders',
    arrival: 'a2-denver',
  },
  {
    id: 'kansas-plains',
    name: 'The Kansas Plains',
    act: 2,
    mile: 1700,
    blurb:
      'Grass to the horizon in every direction. Nowhere to hide, which cuts both ways, and the people who work this road know it better than you do.',
    danger: 7,
    arrival: 'a2-kansas',
  },
  {
    id: 'st-louis',
    name: 'St. Louis, Missouri',
    act: 3,
    mile: 2100,
    blurb:
      'The Arch still stands over a city split down the river. Two flags, one bridge, and everybody hungry.',
    danger: 6,
    arrival: 'a3-st-louis',
  },
  {
    id: 'chicago',
    name: 'Chicago, Illinois',
    act: 3,
    mile: 2400,
    blurb:
      'The densest infected population on the continent and the best-stocked warehouses left standing. Both facts are related.',
    danger: 8,
    arrival: 'a3-chicago',
  },
  {
    id: 'pittsburgh',
    name: 'Pittsburgh, Pennsylvania',
    act: 3,
    mile: 2700,
    blurb:
      'Government checkpoints on every bridge, and soldiers who have clearly been told exactly what to look for.',
    danger: 4,
    faction: 'government',
    arrival: 'a3-pittsburgh',
  },
  {
    id: 'washington-dc',
    name: 'Washington, D.C.',
    act: 4,
    mile: 3000,
    blurb: 'Floodlights on the Mall. Generators running somewhere. Three thousand miles, and it is real.',
    danger: 9,
    faction: 'government',
    arrival: 'a4-gates',
  },
];

export const locations: Record<string, LocationDef> = Object.fromEntries(
  list.map((l) => [l.id, l]),
);

/** Ordered spine used by hub "push east" choices and by the map. */
export const ROUTE: string[] = [
  'salt-lake-city',
  'denver',
  'kansas-plains',
  'st-louis',
  'chicago',
  'pittsburgh',
  'washington-dc',
];

export const START_LOCATIONS = ['seattle', 'san-francisco', 'los-angeles', 'phoenix'] as const;

/** The next location east, and roughly how many days the leg takes. */
export function nextLeg(from: string): { to: string; days: number } | undefined {
  const index = ROUTE.indexOf(from);
  if (index === -1) {
    // Any Act 1 start feeds into the first leg of the spine.
    return START_LOCATIONS.includes(from as (typeof START_LOCATIONS)[number])
      ? { to: 'salt-lake-city', days: 11 }
      : undefined;
  }
  const to = ROUTE[index + 1];
  if (!to) return undefined;
  const days = Math.max(
    3,
    Math.round(((locations[to]?.mile ?? 0) - (locations[from]?.mile ?? 0)) / 45),
  );
  return { to, days };
}
