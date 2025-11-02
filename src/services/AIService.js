/**
 * AI Service for backstory generation
 * Handles API calls to generate character content
 */
class AIService {
    constructor() {
        this.enabled = GameConfig.ai.enabled;
        this.provider = GameConfig.ai.provider;
        this.apiKey = null; // To be set by user in settings
        this.fallbackEnabled = GameConfig.ai.fallbackToStatic;
    }

    /**
     * Set API key
     */
    setAPIKey(key) {
        this.apiKey = key;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('ai_api_key', key);
        }
    }

    /**
     * Load API key from storage
     */
    loadAPIKey() {
        if (typeof localStorage !== 'undefined') {
            this.apiKey = localStorage.getItem('ai_api_key');
        }
        return this.apiKey !== null;
    }

    /**
     * Generate character content from backstory
     */
    async generateCharacterContent(backstory) {
        // Check if AI is enabled and API key is set
        if (!this.enabled || !this.apiKey) {
            console.log('AI disabled or no API key, using fallback');
            return this.fallbackGeneration(backstory);
        }

        try {
            const content = await this.callAI(backstory);
            return {
                success: true,
                generated: true,
                ...content
            };
        } catch (error) {
            console.error('AI generation failed:', error);

            if (this.fallbackEnabled) {
                console.log('Falling back to static generation');
                return this.fallbackGeneration(backstory);
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Call AI service (OpenAI/Anthropic/etc)
     */
    async callAI(backstory) {
        const prompt = this.buildPrompt(backstory);

        // This is a placeholder - implement based on chosen provider
        if (this.provider === 'openai') {
            return await this.callOpenAI(prompt);
        } else if (this.provider === 'anthropic') {
            return await this.callAnthropic(prompt);
        }

        throw new Error('Unsupported AI provider');
    }

    /**
     * Build prompt for AI
     */
    buildPrompt(backstory) {
        return `You are a game master creating character content for a post-apocalyptic survival game.

Based on this character backstory, generate the following:

Character Details:
- Name: ${backstory.name}
- Age: ${backstory.age}
- Profession: ${backstory.profession}
- Defining Moment: ${backstory.definingMoment}
- What They Lost: ${backstory.whatLost}
- Immunity Theory: ${backstory.immunityTheory}

Generate:
1. 3-4 unique starting perks based on their profession and experiences
2. 2-3 personality traits that will affect dialogue
3. Starting stat distribution (Resilience, Cunning, Empathy, Resolve, Scavenge - total 250 points)
4. A unique companion from their past who might appear (name, relationship, where they might be)
5. 3-5 "echo" moments - brief story events that callback to their backstory

Respond in JSON format:
{
  "perks": [
    {"name": "Perk Name", "description": "Brief description", "effects": {"stat": value}}
  ],
  "personality": ["trait1", "trait2"],
  "stats": {"resilience": X, "cunning": X, "empathy": X, "resolve": X, "scavenge": X},
  "companion": {
    "name": "Name",
    "relationship": "Who they were",
    "location": "Where they might be",
    "description": "Brief description"
  },
  "echoes": [
    {"trigger": "location/event", "text": "Story moment text"}
  ]
}`;
    }

    /**
     * OpenAI API call
     */
    async callOpenAI(prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a creative game master generating RPG character content. Always respond with valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.8
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);

        return this.normalizeAIResponse(content);
    }

    /**
     * Anthropic API call
     */
    async callAnthropic(prompt) {
        // Placeholder for Anthropic Claude API
        // Implementation similar to OpenAI
        throw new Error('Anthropic provider not yet implemented');
    }

    /**
     * Normalize AI response to expected format
     */
    normalizeAIResponse(content) {
        return {
            perks: content.perks || [],
            personality: content.personality || [],
            stats: content.stats || {},
            companion: content.companion || null,
            echoes: content.echoes || []
        };
    }

    /**
     * Fallback generation without AI
     */
    fallbackGeneration(backstory) {
        console.log('Using fallback generation');

        // Match profession to perks
        const perks = this.matchProfessionToPerks(backstory.profession);

        // Generate balanced stats based on profession
        const stats = this.generateStatsFromProfession(backstory.profession);

        // Generate personality traits
        const personality = this.generatePersonality(backstory);

        return {
            success: true,
            generated: false,
            perks,
            stats,
            personality,
            companion: null, // Skip unique companion in fallback
            echoes: [] // Skip echoes in fallback
        };
    }

    /**
     * Match profession keywords to pre-defined perks
     */
    matchProfessionToPerks(profession) {
        const professionLower = profession.toLowerCase();
        const matchedPerks = [];

        // Search through perk templates
        for (const [key, template] of Object.entries(PerkTemplates)) {
            if (template.keywords) {
                for (const keyword of template.keywords) {
                    if (professionLower.includes(keyword.toLowerCase())) {
                        matchedPerks.push({
                            id: key,
                            name: template.name,
                            description: template.description,
                            type: template.type,
                            rarity: template.rarity,
                            effects: template.effects,
                            trigger: template.trigger,
                            icon: template.icon
                        });
                        break;
                    }
                }
            }
        }

        // If no matches, give generic perks
        if (matchedPerks.length === 0) {
            matchedPerks.push({
                id: 'adaptable',
                name: 'Adaptable',
                description: 'Your varied experience helps you adjust to any situation.',
                type: 'backstory',
                rarity: 'common',
                effects: { cunning: 5, resolve: 5 },
                trigger: 'passive',
                icon: '🔄'
            });
        }

        // Limit to 3-4 perks
        return matchedPerks.slice(0, 3 + Math.floor(Math.random() * 2));
    }

    /**
     * Generate stats from profession
     */
    generateStatsFromProfession(profession) {
        const professionLower = profession.toLowerCase();
        const stats = {
            resilience: 50,
            cunning: 50,
            empathy: 50,
            resolve: 50,
            scavenge: 50
        };

        // Adjust based on profession keywords
        if (/doctor|medic|nurse|emt/.test(professionLower)) {
            stats.resilience += 10;
            stats.empathy += 10;
            stats.cunning += 5;
        } else if (/engineer|mechanic|tech/.test(professionLower)) {
            stats.cunning += 15;
            stats.scavenge += 10;
        } else if (/soldier|military|cop|police/.test(professionLower)) {
            stats.resilience += 10;
            stats.resolve += 10;
            stats.cunning += 5;
        } else if (/teacher|professor/.test(professionLower)) {
            stats.empathy += 15;
            stats.resolve += 10;
        } else if (/artist|writer|creative/.test(professionLower)) {
            stats.empathy += 10;
            stats.cunning += 10;
            stats.resolve += 5;
        } else if (/athlete|trainer/.test(professionLower)) {
            stats.resilience += 15;
            stats.resolve += 10;
        } else {
            // Generic balanced boost
            stats.cunning += 8;
            stats.empathy += 8;
            stats.scavenge += 9;
        }

        return stats;
    }

    /**
     * Generate personality traits
     */
    generatePersonality(backstory) {
        const traits = [];

        // Base on what they lost
        if (/family|child|parent/.test(backstory.whatLost.toLowerCase())) {
            traits.push('protective', 'empathetic');
        }

        // Base on profession
        if (/leader|manage|boss/.test(backstory.profession.toLowerCase())) {
            traits.push('decisive');
        }

        // Always add one random trait
        const randomTraits = ['cautious', 'optimistic', 'pragmatic', 'idealistic', 'cynical'];
        traits.push(randomTraits[Math.floor(Math.random() * randomTraits.length)]);

        return traits.slice(0, 3);
    }

    /**
     * Disable AI features
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Enable AI features
     */
    enable() {
        this.enabled = true;
    }
}
