/**
 * Main Game Scene - the hub for gameplay
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.setBackgroundColor(GameConfig.colors.background);

        this.character = this.game.character;

        // Check if this is first time in game
        if (!this.character.hasStoryFlag('game_started')) {
            this.character.setStoryFlag('game_started', true);
            // Start with intro
            this.startEvent('game-intro');
            return;
        }

        // Create UI
        this.createUI();

        // Show current location
        this.showLocation();
    }

    createUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Top bar - status
        const topBar = this.add.rectangle(0, 0, width, 80, 0x000000, 0.8).setOrigin(0);

        // Character name and day
        this.dayText = this.add.text(20, 20, `Day ${this.character.currentDay} - ${this.character.name}`, {
            fontSize: '24px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.primary
        });

        // Stats bar
        this.healthBar = this.createStatBar(20, 50, 200, 20, this.character.stats.health, this.character.stats.maxHealth, '#6b8e23');
        this.moraleBar = this.createStatBar(240, 50, 200, 20, this.character.stats.morale, this.character.stats.maxMorale, '#4682b4');

        // Supplies
        this.suppliesText = this.add.text(width - 20, 20, `Supplies: ${this.character.supplies}`, {
            fontSize: '20px',
            fontFamily: GameConfig.fonts.ui,
            color: this.getSuppliesColor()
        });
        this.suppliesText.setOrigin(1, 0);

        // Progress
        this.progressText = this.add.text(width - 20, 50, `Progress: ${this.character.getProgress().toFixed(1)}%`, {
            fontSize: '18px',
            fontFamily: GameConfig.fonts.ui,
            color: GameConfig.colors.text,
            alpha: 0.8
        });
        this.progressText.setOrigin(1, 0);

        // Bottom menu bar
        const menuBar = this.add.rectangle(0, height - 60, width, 60, 0x000000, 0.9).setOrigin(0);

        const menuButtons = [
            { text: '📍 Map', action: () => this.openMap() },
            { text: '📊 Stats', action: () => this.openStats() },
            { text: '👥 Companions', action: () => this.openCompanions() },
            { text: '🎒 Inventory', action: () => this.openInventory() },
            { text: '💾 Save', action: () => this.saveGame() }
        ];

        const buttonWidth = width / menuButtons.length;
        menuButtons.forEach((btn, index) => {
            const x = (index * buttonWidth) + (buttonWidth / 2);
            const button = this.add.text(x, height - 30, btn.text, {
                fontSize: '18px',
                fontFamily: GameConfig.fonts.ui,
                color: GameConfig.colors.text
            });
            button.setOrigin(0.5);
            button.setInteractive({ useHandCursor: true });

            button.on('pointerover', () => button.setColor(GameConfig.colors.primary));
            button.on('pointerout', () => button.setColor(GameConfig.colors.text));
            button.on('pointerdown', btn.action);
        });
    }

    showLocation() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const location = GameData.locations[this.character.currentLocation];

        if (location) {
            // Location title
            const locTitle = this.add.text(width / 2, 150, location.name, {
                fontSize: '48px',
                fontFamily: GameConfig.fonts.main,
                color: GameConfig.colors.primary,
                stroke: '#000000',
                strokeThickness: 4
            });
            locTitle.setOrigin(0.5);

            // Location description
            const locDesc = this.add.text(width / 2, 220, location.description, {
                fontSize: '20px',
                fontFamily: GameConfig.fonts.ui,
                color: GameConfig.colors.text,
                align: 'center',
                wordWrap: { width: width * 0.7 }
            });
            locDesc.setOrigin(0.5);

            // Action buttons
            const actionsY = height / 2 + 50;

            const exploreBtn = this.createActionButton(width / 2, actionsY, '🔍 Explore', () => {
                this.explore();
            });

            const restBtn = this.createActionButton(width / 2, actionsY + 70, '😴 Rest', () => {
                this.rest();
            });

            const travelBtn = this.createActionButton(width / 2, actionsY + 140, '🚶 Travel East', () => {
                this.travel();
            });
        }
    }

    createActionButton(x, y, text, callback) {
        const button = this.add.text(x, y, text, {
            fontSize: '28px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.text,
            backgroundColor: GameConfig.colors.secondary,
            padding: { x: 40, y: 15 }
        });
        button.setOrigin(0.5);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setBackgroundColor(GameConfig.colors.primary);
            button.setScale(1.05);
        });

        button.on('pointerout', () => {
            button.setBackgroundColor(GameConfig.colors.secondary);
            button.setScale(1);
        });

        button.on('pointerdown', callback);

        return button;
    }

    createStatBar(x, y, width, height, value, max, color) {
        const bg = this.add.rectangle(x, y, width, height, 0x333333).setOrigin(0);
        const barWidth = (value / max) * width;
        const bar = this.add.rectangle(x, y, barWidth, height, parseInt(color.replace('#', '0x'))).setOrigin(0);

        const text = this.add.text(x + width / 2, y + height / 2, `${Math.round(value)}/${max}`, {
            fontSize: '14px',
            fontFamily: GameConfig.fonts.ui,
            color: '#ffffff'
        });
        text.setOrigin(0.5);

        return { bg, bar, text };
    }

    explore() {
        // Trigger random encounter or location event
        const location = GameData.locations[this.character.currentLocation];

        if (location && location.events && location.events.length > 0) {
            // Pick a random event
            const eventId = location.events[Math.floor(Math.random() * location.events.length)];
            const event = GameData.events[eventId];

            if (event && !this.character.completedEvents.includes(eventId)) {
                this.startEvent(eventId);
            } else {
                // Random encounter
                this.randomEncounter();
            }
        } else {
            this.randomEncounter();
        }

        // Advance time
        this.character.advanceDay(0.5);
        this.updateUI();
    }

    randomEncounter() {
        const encounterTypes = Object.keys(GameData.randomEncounters);
        const randomType = encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
        const encounters = GameData.randomEncounters[randomType];
        const encounter = encounters[Math.floor(Math.random() * encounters.length)];

        // Create dialogue from encounter
        const dialogue = {
            speaker: 'Narrator',
            text: encounter.description,
            choices: encounter.choices
        };

        this.scene.pause();
        this.scene.launch('DialogueScene', { dialogue });
    }

    rest() {
        // Rest for a day
        this.character.advanceDay(1);
        this.character.stats.heal(30);
        this.character.stats.changeMorale(10);

        const status = this.character.useSupplies(2 + (this.character.activeCompanions.length * 0.5));

        this.scene.pause();
        this.scene.launch('DialogueScene', {
            dialogue: {
                speaker: 'Narrator',
                text: `You rest for the day. Your wounds heal somewhat, and your spirits lift.\n\nSupplies: ${this.character.supplies}${status === 'low_supplies' ? ' (Running low!)' : ''}`,
                choices: [{
                    id: 'continue',
                    text: 'Continue',
                    next: null
                }]
            }
        });

        this.updateUI();
    }

    travel() {
        // TODO: Open map to select next destination
        this.openMap();
    }

    startEvent(eventId) {
        const event = GameData.events[eventId];
        if (event && event.dialogue) {
            this.scene.pause();
            this.scene.launch('DialogueScene', { dialogue: event.dialogue });

            if (!this.character.completedEvents.includes(eventId)) {
                this.character.completedEvents.push(eventId);
            }
        }
    }

    openMap() {
        this.scene.pause();
        this.scene.launch('MapScene');
    }

    openStats() {
        this.scene.pause();
        this.scene.launch('StatsScene');
    }

    openCompanions() {
        // TODO: Implement companion menu
        alert('Companions menu coming soon!');
    }

    openInventory() {
        // TODO: Implement inventory
        alert('Inventory coming soon!');
    }

    saveGame() {
        const result = this.game.saveManager.save(this.character, 1);
        if (result.success) {
            const savedText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                'Game Saved!',
                {
                    fontSize: '36px',
                    fontFamily: GameConfig.fonts.main,
                    color: GameConfig.colors.primary,
                    backgroundColor: '#000000',
                    padding: { x: 30, y: 20 }
                }
            );
            savedText.setOrigin(0.5);

            this.time.delayedCall(2000, () => {
                savedText.destroy();
            });
        }
    }

    updateUI() {
        this.dayText.setText(`Day ${this.character.currentDay} - ${this.character.name}`);
        this.suppliesText.setText(`Supplies: ${this.character.supplies}`);
        this.suppliesText.setColor(this.getSuppliesColor());
        this.progressText.setText(`Progress: ${this.character.getProgress().toFixed(1)}%`);

        // Update bars
        this.healthBar.bar.width = (this.character.stats.health / this.character.stats.maxHealth) * 200;
        this.healthBar.text.setText(`${Math.round(this.character.stats.health)}/${this.character.stats.maxHealth}`);

        this.moraleBar.bar.width = (this.character.stats.morale / this.character.stats.maxMorale) * 200;
        this.moraleBar.text.setText(`${Math.round(this.character.stats.morale)}/${this.character.stats.maxMorale}`);
    }

    getSuppliesColor() {
        if (this.character.supplies < 10) return '#a84432';
        if (this.character.supplies < 30) return '#cc8800';
        return GameConfig.colors.text;
    }
}
