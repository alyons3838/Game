/**
 * The concept lexicon that turns free-text backstory into structured tags.
 *
 * This is what lets the offline generator feel responsive to what the player
 * actually wrote without any model call. Each concept lists surface forms; a
 * backstory is scanned for them and the matching concepts become the character's
 * affinities, which then drive perk selection, stat weighting and traits.
 *
 * Matching is stem-based and deliberately generous — "nursing", "nurse" and
 * "nurses" all hit `care`. False positives are cheap here; a missed concept is
 * the expensive failure because it makes the game feel like it ignored you.
 */

export interface Concept {
  id: string;
  /** Lowercase stems. A stem matches if it appears as a word prefix. */
  stems: string[];
  /** Stat pressure applied per match, before normalisation. */
  stats?: Partial<Record<'resilience' | 'cunning' | 'empathy' | 'resolve' | 'scavenge', number>>;
}

export const CONCEPTS: Concept[] = [
  {
    id: 'medicine',
    stems: ['doctor', 'medic', 'nurse', 'surgeon', 'physician', 'emt', 'paramedic', 'hospital', 'triage', 'clinic', 'pharmac'],
    stats: { empathy: 6, resilience: 4, cunning: 3 },
  },
  {
    id: 'science',
    stems: ['scientist', 'research', 'biolog', 'chemist', 'lab', 'epidemiolog', 'virolog', 'physic', 'academic', 'professor', 'phd', 'geneti'],
    stats: { cunning: 8, resolve: 3 },
  },
  {
    id: 'engineering',
    stems: ['engineer', 'mechanic', 'technician', 'electric', 'plumb', 'weld', 'machinist', 'contractor', 'construct', 'carpent', 'repair'],
    stats: { cunning: 6, scavenge: 7 },
  },
  {
    id: 'software',
    stems: ['program', 'developer', 'software', 'coder', 'hacker', 'sysadmin', 'network', 'data', 'comput'],
    stats: { cunning: 9, scavenge: 2 },
  },
  {
    id: 'military',
    stems: ['soldier', 'marine', 'army', 'navy', 'airman', 'veteran', 'infantry', 'sergeant', 'lieutenant', 'special forces', 'combat', 'deploy', 'ranger'],
    stats: { resolve: 7, resilience: 6, cunning: 2 },
  },
  {
    id: 'law',
    stems: ['police', 'cop', 'officer', 'detective', 'sheriff', 'trooper', 'investigat', 'security', 'guard', 'marshal'],
    stats: { resolve: 5, cunning: 5, resilience: 3 },
  },
  {
    id: 'teaching',
    stems: ['teacher', 'teach', 'educat', 'tutor', 'instructor', 'school', 'classroom', 'student', 'coach', 'mentor'],
    stats: { empathy: 8, resolve: 4 },
  },
  {
    id: 'care',
    stems: ['parent', 'mother', 'mom', 'father', 'dad', 'caregiver', 'guardian', 'foster', 'social work', 'counsel', 'therapist', 'chaplain', 'hospice'],
    stats: { empathy: 9, resolve: 4 },
  },
  {
    id: 'craft',
    stems: ['artist', 'writer', 'musician', 'painter', 'designer', 'photograph', 'actor', 'director', 'sculpt', 'poet', 'novel'],
    stats: { empathy: 5, cunning: 5 },
  },
  {
    id: 'trade',
    stems: ['sales', 'retail', 'merchant', 'business', 'manager', 'account', 'realtor', 'broker', 'market', 'negotiat', 'lawyer', 'attorney'],
    stats: { empathy: 6, cunning: 5 },
  },
  {
    id: 'service',
    stems: ['server', 'waiter', 'waitress', 'bartend', 'barista', 'cook', 'chef', 'kitchen', 'restaurant', 'hospitality', 'janitor', 'custodian'],
    stats: { empathy: 6, resilience: 4, scavenge: 4 },
  },
  {
    id: 'outdoors',
    stems: ['farm', 'ranch', 'hunt', 'fish', 'forest', 'ranger', 'guide', 'survival', 'camp', 'hik', 'climb', 'sail', 'trail', 'wilderness'],
    stats: { scavenge: 9, resilience: 5 },
  },
  {
    id: 'athletic',
    stems: ['athlete', 'runner', 'marathon', 'swim', 'boxer', 'wrestl', 'gymnast', 'trainer', 'fitness', 'football', 'basketball', 'soccer'],
    stats: { resilience: 9, resolve: 4 },
  },
  {
    id: 'transport',
    stems: ['driver', 'trucker', 'pilot', 'courier', 'delivery', 'logistics', 'dispatch', 'freight', 'rail', 'transit'],
    stats: { scavenge: 6, resilience: 4, cunning: 2 },
  },
  {
    id: 'faith',
    stems: ['pastor', 'priest', 'rabbi', 'imam', 'minister', 'monk', 'church', 'congregation', 'faith', 'prayer', 'missionar'],
    stats: { resolve: 8, empathy: 6 },
  },
  {
    id: 'hardship',
    stems: ['homeless', 'addict', 'prison', 'jail', 'foster care', 'poverty', 'evict', 'debt', 'bankrupt', 'abuse', 'refugee', 'orphan'],
    stats: { resilience: 7, scavenge: 6, resolve: 3 },
  },
  {
    id: 'loss',
    stems: ['died', 'death', 'buried', 'funeral', 'grave', 'lost my', 'killed', 'gone', 'never came back', 'widow'],
    stats: { resolve: 5, empathy: 3 },
  },
  {
    id: 'guilt',
    stems: ['fault', 'blame', 'guilt', 'should have', 'could have', 'failed', 'left them', 'abandoned', 'regret', 'coward'],
    stats: { resolve: 4, empathy: 4 },
  },
  {
    id: 'violence',
    stems: ['fought', 'fight', 'shot', 'gun', 'knife', 'blood', 'war', 'killed', 'defend', 'attack'],
    stats: { resolve: 5, resilience: 5 },
  },
  {
    id: 'isolation',
    stems: ['alone', 'lonely', 'isolat', 'hermit', 'off-grid', 'solitude', 'no one', 'by myself', 'kept to myself'],
    stats: { scavenge: 5, resolve: 5, empathy: -3 },
  },
  {
    id: 'leadership',
    stems: ['led', 'leader', 'command', 'captain', 'chief', 'foreman', 'supervis', 'organiz', 'union', 'mayor', 'principal'],
    stats: { resolve: 7, empathy: 4 },
  },
];

/**
 * Words that make a phrase useless as a story callback ("something", "stuff").
 * Echo generation rejects extracted phrases built only from these.
 */
const HOLLOW = new Set([
  'thing', 'things', 'something', 'stuff', 'everything', 'nothing', 'anything',
  'it', 'them', 'that', 'this', 'lot', 'much', 'many', 'some', 'all',
]);

/** Leading possessives stripped so extracted phrases read in third person. */
const LEADING_POSSESSIVE = /^(my|our|his|her|their|the|a|an)\s+/i;

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'it',
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'to', 'in', 'on', 'at',
  'for', 'with', 'was', 'were', 'is', 'are', 'be', 'been', 'had', 'has',
  'have', 'did', 'do', 'does', 'that', 'this', 'there', 'then', 'when',
  'what', 'who', 'how', 'so', 'as', 'from', 'by', 'not', 'no', 'up', 'out',
]);

/** Detects the concepts present in a block of player-written text. */
export function detectConcepts(text: string): Map<string, number> {
  const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ')} `;
  const hits = new Map<string, number>();

  for (const concept of CONCEPTS) {
    let count = 0;
    for (const stem of concept.stems) {
      // Word-prefix match: " nurs" matches " nurse" and " nursing".
      let index = haystack.indexOf(` ${stem}`);
      while (index !== -1) {
        count += 1;
        index = haystack.indexOf(` ${stem}`, index + 1);
      }
    }
    if (count > 0) hits.set(concept.id, count);
  }

  return hits;
}

/**
 * Pulls a short, quotable phrase out of player text for use in echoes.
 * Returns undefined when nothing usable is found, and callers must handle that
 * rather than emitting an awkward empty callback.
 */
export function extractPhrase(text: string, maxWords = 6): string | undefined {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (!cleaned) return undefined;

  // Prefer the clause after a strong signal verb, which is usually the subject
  // of the sentence rather than the framing ("I lost *my sister Nadia*").
  const signal = cleaned.match(
    /\b(?:lost|left behind|left|buried|couldn't save|could not save|gave up|abandoned|miss|missed)\s+(.{3,60})/i,
  );
  const candidate = signal?.[1] ?? cleaned;

  const words = candidate
    .replace(LEADING_POSSESSIVE, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, maxWords);

  while (words.length && STOP_WORDS.has((words[words.length - 1] as string).toLowerCase().replace(/\W/g, ''))) {
    words.pop();
  }

  const phrase = words.join(' ').replace(/[.,;:!?]+$/, '').trim();
  if (phrase.length < 3) return undefined;

  const meaningful = phrase
    .split(' ')
    .some((w) => !STOP_WORDS.has(w.toLowerCase().replace(/\W/g, '')) && !HOLLOW.has(w.toLowerCase().replace(/\W/g, '')));
  return meaningful ? phrase : undefined;
}

/** Keyword extraction used for naming a generated companion's connection. */
export function keywords(text: string, limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const word of text.toLowerCase().replace(/[^a-z\s'-]/g, ' ').split(/\s+/)) {
    const w = word.replace(/^['-]+|['-]+$/g, '');
    if (w.length < 4 || STOP_WORDS.has(w) || HOLLOW.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}
