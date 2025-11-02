/**
 * Player character model
 */
class Character {
    constructor(data = {}) {
        // Basic info
        this.name = data.name || '';
        this.age = data.age || 30;
        this.profession = data.profession || '';
        this.definingMoment = data.definingMoment || '';
        this.whatLost = data.whatLost || '';
        this.immunityTheory = data.immunityTheory || '';

        // Generated content
        this.aiGenerated = data.aiGenerated || false;
        this.backstoryEchoes = data.backstoryEchoes || []; // AI-generated callback moments
        this.uniqueCompanion = data.uniqueCompanion || null;

        // Stats and progression
        this.stats = data.stats ? Stats.fromJSON(data.stats) : new Stats();
        this.perks = (data.perks || []).map(p => Perk.fromJSON(p));

        // Companions
        this.companions = (data.companions || []).map(c => Companion.fromJSON(c));
        this.activeCompanions = data.activeCompanions || []; // IDs of companions in party

        // Journey progress
        this.currentDay = data.currentDay || 1;
        this.currentLocation = data.currentLocation || 'seattle';
        this.visitedLocations = data.visitedLocations || [];

        // Inventory
        this.supplies = data.supplies || 90;
        this.items = data.items || [];
        this.equipment = data.equipment || {
            weapon: null,
            armor: null,
            accessory: null
        };

        // Story progress
        this.storyFlags = data.storyFlags || {}; // Track major choices
        this.completedEvents = data.completedEvents || [];
        this.relationships = data.relationships || {}; // Faction standings

        // Meta
        this.playtime = data.playtime || 0;
        this.choicesMade = data.choicesMade || 0;
    }

    /**
     * Add a perk to character
     */
    addPerk(perk) {
        if (!(perk instanceof Perk)) {
            perk = new Perk(perk);
        }
        this.perks.push(perk);
        perk.unlocked = true;
    }

    /**
     * Check if character has a specific perk
     */
    hasPerk(perkId) {
        return this.perks.some(p => p.id === perkId);
    }

    /**
     * Add companion to roster
     */
    addCompanion(companion) {
        if (!(companion instanceof Companion)) {
            companion = new Companion(companion);
        }
        companion.recruited = true;
        this.companions.push(companion);
    }

    /**
     * Add companion to active party
     */
    addToParty(companionId) {
        if (this.activeCompanions.length >= GameConfig.settings.maxCompanions) {
            return { success: false, reason: 'party_full' };
        }

        const companion = this.companions.find(c => c.id === companionId);
        if (!companion) {
            return { success: false, reason: 'not_found' };
        }

        if (!companion.recruited) {
            return { success: false, reason: 'not_recruited' };
        }

        companion.inParty = true;
        this.activeCompanions.push(companionId);
        return { success: true };
    }

    /**
     * Remove companion from party
     */
    removeFromParty(companionId) {
        const companion = this.companions.find(c => c.id === companionId);
        if (companion) {
            companion.inParty = false;
        }
        this.activeCompanions = this.activeCompanions.filter(id => id !== companionId);
    }

    /**
     * Get all active companions
     */
    getActiveCompanions() {
        return this.companions.filter(c => c.inParty);
    }

    /**
     * Use supplies
     */
    useSupplies(amount) {
        this.supplies = Math.max(0, this.supplies - amount);
        if (this.supplies === 0) {
            return 'out_of_supplies';
        } else if (this.supplies < 10) {
            return 'low_supplies';
        }
        return 'ok';
    }

    /**
     * Add supplies
     */
    addSupplies(amount) {
        this.supplies += amount;
    }

    /**
     * Advance day
     */
    advanceDay(daysElapsed = 1) {
        this.currentDay += daysElapsed;

        // Daily resource consumption
        const dailyConsumption = 1 + (this.activeCompanions.length * 0.5);
        return this.useSupplies(dailyConsumption * daysElapsed);
    }

    /**
     * Set story flag
     */
    setStoryFlag(flag, value = true) {
        this.storyFlags[flag] = value;
    }

    /**
     * Check story flag
     */
    hasStoryFlag(flag) {
        return this.storyFlags[flag] === true;
    }

    /**
     * Track choice made
     */
    makeChoice(choiceId, choiceTags = []) {
        this.choicesMade++;
        this.completedEvents.push({
            id: choiceId,
            day: this.currentDay,
            tags: choiceTags
        });

        // Update companion loyalty based on choice
        this.getActiveCompanions().forEach(companion => {
            const loyaltyChange = companion.evaluateChoice({ tags: choiceTags });
            if (loyaltyChange !== 0) {
                companion.changeLoyalty(loyaltyChange);
            }
        });
    }

    /**
     * Update faction relationship
     */
    updateRelationship(factionId, amount) {
        if (!this.relationships[factionId]) {
            this.relationships[factionId] = 0;
        }
        this.relationships[factionId] = Math.max(-100, Math.min(100,
            this.relationships[factionId] + amount));
    }

    /**
     * Get relationship with faction
     */
    getRelationship(factionId) {
        return this.relationships[factionId] || 0;
    }

    /**
     * Get journey progress percentage
     */
    getProgress() {
        return Math.min(100, (this.currentDay / GameConfig.settings.journeyDays) * 100);
    }

    /**
     * Serialize for saving
     */
    toJSON() {
        return {
            name: this.name,
            age: this.age,
            profession: this.profession,
            definingMoment: this.definingMoment,
            whatLost: this.whatLost,
            immunityTheory: this.immunityTheory,
            aiGenerated: this.aiGenerated,
            backstoryEchoes: this.backstoryEchoes,
            uniqueCompanion: this.uniqueCompanion,
            stats: this.stats.toJSON(),
            perks: this.perks.map(p => p.toJSON()),
            companions: this.companions.map(c => c.toJSON()),
            activeCompanions: this.activeCompanions,
            currentDay: this.currentDay,
            currentLocation: this.currentLocation,
            visitedLocations: this.visitedLocations,
            supplies: this.supplies,
            items: this.items,
            equipment: this.equipment,
            storyFlags: this.storyFlags,
            completedEvents: this.completedEvents,
            relationships: this.relationships,
            playtime: this.playtime,
            choicesMade: this.choicesMade
        };
    }

    /**
     * Load from saved data
     */
    static fromJSON(data) {
        return new Character(data);
    }
}
