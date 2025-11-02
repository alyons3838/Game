/**
 * Character stats model
 */
class Stats {
    constructor(initial = {}) {
        // Base stats (0-100 scale)
        this.resilience = initial.resilience || 50;  // Physical endurance
        this.cunning = initial.cunning || 50;        // Problem-solving
        this.empathy = initial.empathy || 50;        // Social interactions
        this.resolve = initial.resolve || 50;        // Mental fortitude
        this.scavenge = initial.scavenge || 50;      // Resource finding

        // Derived stats
        this.health = 100;
        this.maxHealth = 100;
        this.morale = 75;
        this.maxMorale = 100;
        this.experience = 0;
        this.level = 1;
    }

    /**
     * Modify a stat by amount
     */
    modify(statName, amount) {
        if (this[statName] !== undefined) {
            this[statName] = Math.max(0, Math.min(100, this[statName] + amount));
            return this[statName];
        }
        return null;
    }

    /**
     * Check if stat meets threshold
     */
    check(statName, threshold) {
        return this[statName] >= threshold;
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health === 0) {
            return 'death';
        } else if (this.health < 30) {
            return 'critical';
        } else if (this.health < 60) {
            return 'injured';
        }
        return 'ok';
    }

    /**
     * Heal health
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /**
     * Modify morale
     */
    changeMorale(amount) {
        this.morale = Math.max(0, Math.min(this.maxMorale, this.morale + amount));
    }

    /**
     * Add experience and check for level up
     */
    addExperience(amount) {
        this.experience += amount;
        const xpNeeded = this.level * 100;

        if (this.experience >= xpNeeded) {
            this.levelUp();
            return true;
        }
        return false;
    }

    /**
     * Level up character
     */
    levelUp() {
        this.level++;
        this.maxHealth += 10;
        this.health = this.maxHealth;
        // Return stat points to allocate
        return 5;
    }

    /**
     * Get stat color based on value
     */
    getStatColor(value) {
        if (value >= 75) return '#6b8e23'; // High - green
        if (value >= 50) return '#c4a876'; // Medium - gold
        if (value >= 25) return '#cc8800'; // Low - orange
        return '#a84432'; // Very low - red
    }

    /**
     * Serialize for saving
     */
    toJSON() {
        return {
            resilience: this.resilience,
            cunning: this.cunning,
            empathy: this.empathy,
            resolve: this.resolve,
            scavenge: this.scavenge,
            health: this.health,
            maxHealth: this.maxHealth,
            morale: this.morale,
            maxMorale: this.maxMorale,
            experience: this.experience,
            level: this.level
        };
    }

    /**
     * Load from saved data
     */
    static fromJSON(data) {
        const stats = new Stats();
        Object.assign(stats, data);
        return stats;
    }
}
