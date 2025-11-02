/**
 * Perk model - bonuses from backstory and gameplay
 */
class Perk {
    constructor(data) {
        this.id = data.id || this.generateId();
        this.name = data.name;
        this.description = data.description;
        this.type = data.type; // 'backstory', 'earned', 'companion'
        this.rarity = data.rarity || 'common'; // 'common', 'uncommon', 'rare', 'unique'
        this.effects = data.effects || {}; // { stat: amount, ... }
        this.trigger = data.trigger || 'passive'; // 'passive', 'combat', 'dialogue', 'event'
        this.condition = data.condition || null; // Function or null
        this.icon = data.icon || '⭐';
        this.unlocked = data.unlocked !== undefined ? data.unlocked : false;
    }

    generateId() {
        return 'perk_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Apply perk effects to stats
     */
    apply(stats, context = {}) {
        if (this.condition && !this.condition(context)) {
            return false;
        }

        Object.keys(this.effects).forEach(stat => {
            if (stats[stat] !== undefined) {
                stats.modify(stat, this.effects[stat]);
            }
        });

        return true;
    }

    /**
     * Get rarity color
     */
    getRarityColor() {
        const colors = {
            'common': '#c4a876',
            'uncommon': '#6b8e23',
            'rare': '#4682b4',
            'unique': '#9370db'
        };
        return colors[this.rarity] || colors.common;
    }

    /**
     * Serialize for saving
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            rarity: this.rarity,
            effects: this.effects,
            trigger: this.trigger,
            icon: this.icon,
            unlocked: this.unlocked
        };
    }

    /**
     * Load from saved data
     */
    static fromJSON(data) {
        return new Perk(data);
    }
}

/**
 * Pre-defined perk templates
 */
const PerkTemplates = {
    // Medical profession perks
    'first-response': {
        name: 'First Response',
        description: 'Your medical training allows you to heal faster.',
        type: 'backstory',
        rarity: 'uncommon',
        effects: { resilience: 10 },
        trigger: 'passive',
        icon: '⚕️',
        keywords: ['doctor', 'medic', 'nurse', 'emt', 'surgeon']
    },

    // Teaching profession perks
    'patient-mentor': {
        name: 'Patient Mentor',
        description: 'You have a gift for teaching. Companions learn faster.',
        type: 'backstory',
        rarity: 'uncommon',
        effects: { empathy: 10 },
        trigger: 'companion',
        icon: '📚',
        keywords: ['teacher', 'professor', 'educator', 'tutor']
    },

    // Engineering profession perks
    'makeshift-genius': {
        name: 'Makeshift Genius',
        description: 'You can craft items with fewer materials.',
        type: 'backstory',
        rarity: 'rare',
        effects: { scavenge: 15, cunning: 5 },
        trigger: 'crafting',
        icon: '🔧',
        keywords: ['engineer', 'mechanic', 'technician', 'builder']
    },

    // Military profession perks
    'tactical-training': {
        name: 'Tactical Training',
        description: 'Military training gives you an edge in combat.',
        type: 'backstory',
        rarity: 'uncommon',
        effects: { resolve: 10, cunning: 5 },
        trigger: 'combat',
        icon: '⚔️',
        keywords: ['soldier', 'military', 'marine', 'veteran', 'officer']
    },

    // Athletic profession perks
    'second-wind': {
        name: 'Second Wind',
        description: 'Once per day, restore 50% stamina when exhausted.',
        type: 'backstory',
        rarity: 'rare',
        effects: { resilience: 15 },
        trigger: 'special',
        icon: '💪',
        keywords: ['athlete', 'runner', 'trainer', 'coach', 'sports']
    },

    // Parent/caregiver perks
    'protective-instinct': {
        name: 'Protective Instinct',
        description: 'You fight harder when protecting companions.',
        type: 'backstory',
        rarity: 'uncommon',
        effects: { empathy: 10, resolve: 5 },
        trigger: 'combat',
        icon: '🛡️',
        keywords: ['parent', 'father', 'mother', 'caregiver', 'guardian']
    },

    // Creative profession perks
    'creative-solutions': {
        name: 'Creative Solutions',
        description: 'Your artistic mind finds unconventional answers.',
        type: 'backstory',
        rarity: 'uncommon',
        effects: { cunning: 10, empathy: 5 },
        trigger: 'dialogue',
        icon: '🎨',
        keywords: ['artist', 'writer', 'musician', 'designer', 'creative']
    },

    // Law enforcement perks
    'investigators-eye': {
        name: "Investigator's Eye",
        description: 'Notice details others miss. Better scavenging.',
        type: 'backstory',
        rarity: 'uncommon',
        effects: { scavenge: 10, cunning: 5 },
        trigger: 'passive',
        icon: '🔍',
        keywords: ['cop', 'police', 'detective', 'investigator', 'officer']
    },

    // Service industry perks
    'people-person': {
        name: 'People Person',
        description: 'Years of customer service taught you to read people.',
        type: 'backstory',
        rarity: 'common',
        effects: { empathy: 15 },
        trigger: 'dialogue',
        icon: '🤝',
        keywords: ['server', 'bartender', 'retail', 'service', 'hospitality']
    },

    // Survival earned perks
    'hardened-survivor': {
        name: 'Hardened Survivor',
        description: "You've seen it all. Nothing shakes you now.",
        type: 'earned',
        rarity: 'rare',
        effects: { resolve: 15, resilience: 10 },
        trigger: 'passive',
        icon: '💀'
    }
};
