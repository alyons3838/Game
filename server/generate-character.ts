/**
 * Serverless proxy for AI character generation.
 *
 * Deploy this to Vercel / Netlify / Cloudflare Workers (any handler that takes a
 * `Request` and returns a `Response`) and point `VITE_AI_ENDPOINT` at it. The
 * game calls this endpoint; the Anthropic API key stays here.
 *
 * This is the only place in the project that talks to a model. The game is fully
 * playable without deploying it.
 *
 *   npm i @anthropic-ai/sdk        # in this directory, not the game root
 *   export ANTHROPIC_API_KEY=...
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/** Mirrors the contract the client validates against in `src/game/ai.ts`. */
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    perks: {
      type: 'array',
      description: 'Up to 2 perk ids chosen from availablePerks that best fit the backstory.',
      items: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
        additionalProperties: false,
      },
    },
    statNudges: {
      type: 'object',
      description: 'Small adjustments in the range -8..8. Omit stats you would not change.',
      properties: {
        resilience: { type: 'integer' },
        cunning: { type: 'integer' },
        empathy: { type: 'integer' },
        resolve: { type: 'integer' },
        scavenge: { type: 'integer' },
      },
      additionalProperties: false,
    },
    echoes: {
      type: 'array',
      description: 'Between 2 and 5 short second-person callbacks to the backstory.',
      items: {
        type: 'object',
        properties: {
          trigger: {
            type: 'string',
            enum: [
              'a1-first-night',
              'loc:kansas-plains',
              'loc:denver',
              'a3-lab-truth',
              'a4-gates',
            ],
          },
          text: { type: 'string' },
        },
        required: ['trigger', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['perks', 'echoes'],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You help personalise a character in a post-apocalyptic road-trip RPG called The Long Road Home.

The player has written their own backstory. Your job is to choose which existing perks fit them and to write "echoes" — short moments later in the journey that call back to what they wrote.

Rules for echoes:
- Second person, present tense, addressed to the player character.
- 2 to 4 sentences. No headings, no markdown.
- Draw on the specific details the player wrote. Quote their own nouns back at them where it lands; do not invent new named characters or events.
- Restrained and concrete. No melodrama, no rhetorical questions, no "little did you know".
- Never resolve the player's backstory or state what it means. An echo is a moment of noticing, not a conclusion.
- Do not assume the character's gender; use they/them if you need a pronoun for anyone.

Choose at most 2 perks, only from the provided list, only where the backstory genuinely supports them.`;

interface RequestBody {
  backstory: {
    name: string;
    age: number;
    profession: string;
    definingMoment: string;
    whatLost: string;
    immunityTheory: string;
  };
  affinities: string[];
  availablePerks: Array<{ id: string; name: string; description: string }>;
}

const MAX_FIELD = 1200;

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const b = body?.backstory;
  if (!b || typeof b.profession !== 'string') {
    return json({ error: 'Missing backstory' }, 400);
  }

  // Player text is untrusted input being placed in a prompt. Bounding its length
  // is the meaningful control here — the model is told to treat it as narrative
  // material, and the response schema constrains what can come back regardless
  // of what the text tries to instruct.
  const clip = (value: unknown) => String(value ?? '').slice(0, MAX_FIELD);

  try {
    const message = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
        effort: 'medium',
      },
      messages: [
        {
          role: 'user',
          content: [
            'Backstory written by the player:',
            `- Profession: ${clip(b.profession)}`,
            `- Age: ${Number(b.age) || 30}`,
            `- A defining moment: ${clip(b.definingMoment)}`,
            `- What they lost: ${clip(b.whatLost)}`,
            `- Why they think they are immune: ${clip(b.immunityTheory)}`,
            '',
            `Detected themes: ${(body.affinities ?? []).slice(0, 8).join(', ') || 'none'}`,
            '',
            'Available perks:',
            ...(body.availablePerks ?? [])
              .slice(0, 40)
              .map((p) => `- ${p.id}: ${p.name} — ${p.description}`),
          ].join('\n'),
        },
      ],
    });

    if (message.stop_reason === 'refusal') {
      return json({ error: 'Declined' }, 422);
    }

    const text = message.content.find((block) => block.type === 'text');
    if (!text || text.type !== 'text') {
      return json({ error: 'Empty response' }, 502);
    }

    // Returned verbatim; the client validates every field before using it.
    return json(JSON.parse(text.text), 200);
  } catch (error) {
    console.error('Character generation failed', error);
    return json({ error: 'Generation failed' }, 502);
  }
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
