/**
 * Optional AI-assisted character generation.
 *
 * Design constraints that shaped this file:
 *
 * 1. The API key never reaches the browser. The client posts the backstory to a
 *    proxy endpoint you deploy (see `server/generate-character.ts`), which holds
 *    the key. Shipping a "paste your API key here" box would hand any XSS on the
 *    page a live credential.
 * 2. AI output is *merged onto* a complete local result, never used in its place.
 *    Every field is validated and anything malformed is dropped, so a bad or
 *    partial response degrades to the offline character rather than a broken run.
 * 3. Only perk flavour text, traits and echoes are model-authored, and they live
 *    in the player's save rather than in the repository. The story content that
 *    ships is entirely hand-written, which keeps the licensing question narrow.
 */

import type { GenerationResult } from './generator';
import type { BackstoryInput } from './generator';
import type { Echo, StatId, StoryContent } from '@/engine/types';
import { STAT_IDS } from '@/engine/types';

export interface AiConfig {
  /** Proxy endpoint. When unset, AI generation is disabled entirely. */
  endpoint?: string;
  timeoutMs: number;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  endpoint: import.meta.env?.VITE_AI_ENDPOINT as string | undefined,
  timeoutMs: 15_000,
};

/** The shape the proxy is contracted to return. */
interface AiResponse {
  perks?: Array<{ id: string; name?: string; description?: string }>;
  traits?: Array<{ id: string; name: string; description: string }>;
  statNudges?: Partial<Record<StatId, number>>;
  echoes?: Array<{ trigger: string; text: string }>;
  companionHook?: { name: string; relationship: string; location: string };
}

export function aiAvailable(config: AiConfig = DEFAULT_AI_CONFIG): boolean {
  return Boolean(config.endpoint);
}

/**
 * Enhances an already-complete local result. Returns the input unchanged on any
 * failure — callers do not need error handling, only an optional `onStatus`
 * callback if they want to tell the player what happened.
 */
export async function enhanceWithAi(
  base: GenerationResult,
  input: BackstoryInput,
  content: StoryContent,
  config: AiConfig = DEFAULT_AI_CONFIG,
  onStatus?: (message: string) => void,
): Promise<GenerationResult> {
  if (!config.endpoint) return base;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    onStatus?.('Consulting the archive…');
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        backstory: input,
        affinities: base.affinities,
        // Constrain the model to perks that actually exist, so it cannot
        // invent an id the engine would silently drop.
        availablePerks: Object.values(content.perks).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
        })),
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
    const payload = (await response.json()) as AiResponse;
    return merge(base, payload, content);
  } catch (error) {
    console.warn('AI generation unavailable; using offline character.', error);
    onStatus?.('The archive is silent. Continuing without it.');
    return base;
  } finally {
    clearTimeout(timer);
  }
}

/** Applies only the parts of an AI response that validate. */
function merge(base: GenerationResult, ai: AiResponse, content: StoryContent): GenerationResult {
  const character = structuredClone(base.character);

  // Perks: accept only ids that exist in content, and cap the total.
  if (Array.isArray(ai.perks)) {
    for (const perk of ai.perks) {
      if (typeof perk?.id !== 'string') continue;
      if (!content.perks[perk.id]) continue;
      if (character.perks.includes(perk.id)) continue;
      if (character.perks.length >= 4) break;
      character.perks.push(perk.id);
    }
  }

  // Stat nudges are bounded so the model cannot hand out a superhuman build.
  if (ai.statNudges && typeof ai.statNudges === 'object') {
    for (const stat of STAT_IDS) {
      const nudge = ai.statNudges[stat];
      if (typeof nudge !== 'number' || !Number.isFinite(nudge)) continue;
      const bounded = Math.max(-8, Math.min(8, Math.round(nudge)));
      character.stats[stat] = Math.max(20, Math.min(90, character.stats[stat] + bounded));
    }
  }

  // Echoes replace the procedural ones only when the model returns usable text.
  if (Array.isArray(ai.echoes)) {
    const echoes: Echo[] = [];
    for (const [index, echo] of ai.echoes.entries()) {
      if (typeof echo?.trigger !== 'string' || typeof echo?.text !== 'string') continue;
      const text = echo.text.trim();
      if (text.length < 20 || text.length > 400) continue;
      echoes.push({ id: `ai-echo-${index}`, trigger: echo.trigger, text, used: false });
    }
    if (echoes.length >= 2) character.echoes = echoes.slice(0, 5);
  }

  return { ...base, character, source: 'ai' };
}
