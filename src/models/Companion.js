/**
 * Companion model
 */
class Companion {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.age = data.age;
        this.description = data.description;
        this.backstory = data.backstory;
        this.portrait = data.portrait || 'default';

        // Companion stats
        this.loyalty = data.loyalty || 50; // 0-100
        this.bond = data.bond || 0; // 0-100, increases over time
        this.alive = data.alive !== undefined ? data.alive : true;
        this.inParty = data.inParty || false;
        this.recruited = data.recruited || false;

        // Companion abilities
        this.specialization = data.specialization; // 'combat', 'medical', 'tech', 'social'
        this.perk = data.perk ? new Perk(data.perk) : null;
        this.questComplete = data.questComplete || false;

        // Personality traits for dialogue
        this.personality = data.personality || [];

        // Relationship preferences
        this.likes = data.likes || []; // What increases loyalty
        this.dislikes = data.dislikes || []; // What decreases loyalty

        // Location tracking
        this.location = data.location || null;
        this.canRecruit = data.canRecruit !== undefined ? data.canRecruit : true;
    }

    /**
     * Modify loyalty
     */
    changeLoyalty(amount, reason = '') {
        const oldLoyalty = this.loyalty;
        this.loyalty = Math.max(0, Math.min(100, this.loyalty + amount));

        // Check for loyalty thresholds
        if (this.loyalty >= 75 && oldLoyalty < 75) {
            return 'high'; // Unlock special dialogue/quest
        } else if (this.loyalty <= 25 && oldLoyalty > 25) {
            return 'low'; // Risk of betrayal/leaving
        } else if (this.loyalty === 0) {
            return 'betrayal'; // Companion leaves or betrays
        }

        return 'normal';
    }

    /**
     * Increase bond level
     */
    increaseBond(amount) {
        this.bond = Math.min(100, this.bond + amount);

        // Check for bond milestones
        if (this.bond >= 100) {
            return 'max_bond';
        } else if (this.bond >= 75) {
            return 'strong_bond';
        } else if (this.bond >= 50) {
            return 'close_bond';
        }

        return 'growing_bond';
    }

    /**
     * Get companion status
     */
    getStatus() {
        if (!this.alive) return 'dead';
        if (!this.recruited) return 'not_recruited';
        if (!this.inParty) return 'in_camp';

        if (this.loyalty >= 75) return 'loyal';
        if (this.loyalty >= 50) return 'friendly';
        if (this.loyalty >= 25) return 'neutral';
        return 'hostile';
    }

    /**
     * Check if player choice aligns with companion preferences
     */
    evaluateChoice(choice) {
        let loyaltyChange = 0;

        // Check if choice matches likes
        this.likes.forEach(like => {
            if (choice.tags && choice.tags.includes(like)) {
                loyaltyChange += 5;
            }
        });

        // Check if choice matches dislikes
        this.dislikes.forEach(dislike => {
            if (choice.tags && choice.tags.includes(dislike)) {
                loyaltyChange -= 5;
            }
        });

        return loyaltyChange;
    }

    /**
     * Get dialogue based on loyalty and bond
     */
    getDialogueTone() {
        if (this.loyalty >= 75 && this.bond >= 75) return 'devoted';
        if (this.loyalty >= 75) return 'loyal';
        if (this.loyalty >= 50) return 'friendly';
        if (this.loyalty >= 25) return 'neutral';
        return 'cold';
    }

    /**
     * Serialize for saving
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            age: this.age,
            description: this.description,
            backstory: this.backstory,
            portrait: this.portrait,
            loyalty: this.loyalty,
            bond: this.bond,
            alive: this.alive,
            inParty: this.inParty,
            recruited: this.recruited,
            specialization: this.specialization,
            perk: this.perk ? this.perk.toJSON() : null,
            questComplete: this.questComplete,
            personality: this.personality,
            likes: this.likes,
            dislikes: this.dislikes,
            location: this.location,
            canRecruit: this.canRecruit
        };
    }

    /**
     * Load from saved data
     */
    static fromJSON(data) {
        return new Companion(data);
    }
}
