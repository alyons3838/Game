/**
 * Dialogue and choice management system
 */
class DialogueManager {
    constructor() {
        this.currentDialogue = null;
        this.dialogueHistory = [];
    }

    /**
     * Process dialogue node and return available choices
     */
    processDialogue(dialogueNode, character) {
        this.currentDialogue = dialogueNode;

        // Filter choices based on requirements
        const availableChoices = dialogueNode.choices.filter(choice => {
            return this.checkRequirements(choice.requirements, character);
        });

        return {
            speaker: dialogueNode.speaker || 'Narrator',
            text: this.processText(dialogueNode.text, character),
            choices: availableChoices.map(choice => ({
                id: choice.id,
                text: this.processText(choice.text, character),
                type: this.getChoiceType(choice, character),
                icon: this.getChoiceIcon(choice),
                consequences: choice.consequences || []
            })),
            portrait: dialogueNode.portrait,
            background: dialogueNode.background
        };
    }

    /**
     * Check if choice requirements are met
     */
    checkRequirements(requirements, character) {
        if (!requirements) return true;

        // Stat requirements
        if (requirements.stats) {
            for (const [stat, value] of Object.entries(requirements.stats)) {
                if (!character.stats.check(stat, value)) {
                    return false;
                }
            }
        }

        // Perk requirements
        if (requirements.perks) {
            for (const perkId of requirements.perks) {
                if (!character.hasPerk(perkId)) {
                    return false;
                }
            }
        }

        // Story flag requirements
        if (requirements.flags) {
            for (const [flag, value] of Object.entries(requirements.flags)) {
                if (character.storyFlags[flag] !== value) {
                    return false;
                }
            }
        }

        // Companion requirements
        if (requirements.companions) {
            const activeCompanionIds = character.activeCompanions;
            for (const companionId of requirements.companions) {
                if (!activeCompanionIds.includes(companionId)) {
                    return false;
                }
            }
        }

        // Item requirements
        if (requirements.items) {
            for (const itemId of requirements.items) {
                if (!character.items.includes(itemId)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Get choice type for UI styling
     */
    getChoiceType(choice, character) {
        if (choice.requirements) {
            if (choice.requirements.stats) return 'stat';
            if (choice.requirements.perks) return 'perk';
            if (choice.requirements.companions) return 'companion';
        }

        if (choice.backstory) return 'backstory';

        return 'standard';
    }

    /**
     * Get icon for choice type
     */
    getChoiceIcon(choice) {
        if (choice.icon) return choice.icon;

        const typeIcons = {
            'stat': '💪',
            'perk': '⭐',
            'backstory': '📖',
            'companion': '👥',
            'aggressive': '⚔️',
            'peaceful': '🤝',
            'clever': '🧠',
            'emotional': '❤️'
        };

        return typeIcons[choice.type] || '💬';
    }

    /**
     * Execute choice consequences
     */
    executeConsequences(choice, character) {
        const results = [];

        if (!choice.consequences) return results;

        // Stat changes
        if (choice.consequences.stats) {
            for (const [stat, value] of Object.entries(choice.consequences.stats)) {
                character.stats.modify(stat, value);
                results.push({
                    type: 'stat',
                    stat,
                    value,
                    text: `${stat} ${value > 0 ? '+' : ''}${value}`
                });
            }
        }

        // Morale changes
        if (choice.consequences.morale) {
            character.stats.changeMorale(choice.consequences.morale);
            results.push({
                type: 'morale',
                value: choice.consequences.morale,
                text: `Morale ${choice.consequences.morale > 0 ? '+' : ''}${choice.consequences.morale}`
            });
        }

        // Companion loyalty changes
        if (choice.consequences.loyalty) {
            for (const [companionId, value] of Object.entries(choice.consequences.loyalty)) {
                const companion = character.companions.find(c => c.id === companionId);
                if (companion) {
                    companion.changeLoyalty(value);
                    results.push({
                        type: 'loyalty',
                        companion: companion.name,
                        value,
                        text: `${companion.name}'s loyalty ${value > 0 ? '+' : ''}${value}`
                    });
                }
            }
        }

        // Faction relationship changes
        if (choice.consequences.relationships) {
            for (const [faction, value] of Object.entries(choice.consequences.relationships)) {
                character.updateRelationship(faction, value);
                results.push({
                    type: 'relationship',
                    faction,
                    value,
                    text: `${faction} ${value > 0 ? '+' : ''}${value}`
                });
            }
        }

        // Item changes
        if (choice.consequences.items) {
            if (choice.consequences.items.add) {
                choice.consequences.items.add.forEach(item => {
                    character.items.push(item);
                    results.push({
                        type: 'item_gain',
                        item,
                        text: `Gained ${item}`
                    });
                });
            }
            if (choice.consequences.items.remove) {
                choice.consequences.items.remove.forEach(item => {
                    const index = character.items.indexOf(item);
                    if (index > -1) {
                        character.items.splice(index, 1);
                        results.push({
                            type: 'item_loss',
                            item,
                            text: `Lost ${item}`
                        });
                    }
                });
            }
        }

        // Supply changes
        if (choice.consequences.supplies) {
            if (choice.consequences.supplies > 0) {
                character.addSupplies(choice.consequences.supplies);
            } else {
                character.useSupplies(-choice.consequences.supplies);
            }
            results.push({
                type: 'supplies',
                value: choice.consequences.supplies,
                text: `Supplies ${choice.consequences.supplies > 0 ? '+' : ''}${choice.consequences.supplies}`
            });
        }

        // Story flags
        if (choice.consequences.flags) {
            for (const [flag, value] of Object.entries(choice.consequences.flags)) {
                character.setStoryFlag(flag, value);
                results.push({
                    type: 'flag',
                    flag,
                    value
                });
            }
        }

        // Experience gain
        if (choice.consequences.experience) {
            const leveledUp = character.stats.addExperience(choice.consequences.experience);
            results.push({
                type: 'experience',
                value: choice.consequences.experience,
                leveledUp,
                text: `+${choice.consequences.experience} XP${leveledUp ? ' - Level Up!' : ''}`
            });
        }

        // Add to choice history
        character.makeChoice(choice.id, choice.tags || []);

        return results;
    }

    /**
     * Process text with variable substitution
     */
    processText(text, character) {
        if (!text) return '';

        // Replace variables in text
        return text
            .replace(/\{name\}/g, character.name)
            .replace(/\{profession\}/g, character.profession)
            .replace(/\{day\}/g, character.currentDay)
            .replace(/\{location\}/g, character.currentLocation);
    }

    /**
     * Add dialogue to history
     */
    addToHistory(dialogue, choice) {
        this.dialogueHistory.push({
            dialogue,
            choice,
            timestamp: Date.now()
        });

        // Keep only last 50 dialogues
        if (this.dialogueHistory.length > 50) {
            this.dialogueHistory.shift();
        }
    }

    /**
     * Get dialogue history
     */
    getHistory() {
        return this.dialogueHistory;
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.dialogueHistory = [];
    }
}
