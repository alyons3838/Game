/**
 * Stats Scene - view character stats, perks, and progress
 */
class StatsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StatsScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.character = this.game.character;

        // Background
        this.add.rectangle(0, 0, width, height, 0x1a1a1a, 0.98).setOrigin(0);

        // Title
        const title = this.add.text(width / 2, 50, 'Character Stats', {
            fontSize: '42px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.primary
        });
        title.setOrigin(0.5);

        // Character info
        const infoY = 120;
        const info = this.add.text(width / 2, infoY,
            `${this.character.name}, ${this.character.age}\n${this.character.profession}`,
            {
                fontSize: '22px',
                fontFamily: GameConfig.fonts.ui,
                color: GameConfig.colors.text,
                align: 'center'
            }
        );
        info.setOrigin(0.5);

        // Stats panel
        this.drawStats(100, 220);

        // Perks panel
        this.drawPerks(width / 2 + 50, 220);

        // Journey info
        this.drawJourneyInfo(100, height - 200);

        // Close button
        const closeBtn = this.add.text(width / 2, height - 50, 'Close', {
            fontSize: '28px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.text,
            backgroundColor: GameConfig.colors.secondary,
            padding: { x: 40, y: 15 }
        });
        closeBtn.setOrigin(0.5);
        closeBtn.setInteractive({ useHandCursor: true });

        closeBtn.on('pointerover', () => {
            closeBtn.setBackgroundColor(GameConfig.colors.primary);
        });

        closeBtn.on('pointerout', () => {
            closeBtn.setBackgroundColor(GameConfig.colors.secondary);
        });

        closeBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });
    }

    drawStats(x, y) {
        // Stats panel title
        const title = this.add.text(x, y, 'Stats', {
            fontSize: '28px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.primary
        });

        const stats = [
            { name: 'Resilience', value: this.character.stats.resilience, icon: '💪' },
            { name: 'Cunning', value: this.character.stats.cunning, icon: '🧠' },
            { name: 'Empathy', value: this.character.stats.empathy, icon: '❤️' },
            { name: 'Resolve', value: this.character.stats.resolve, icon: '🛡️' },
            { name: 'Scavenge', value: this.character.stats.scavenge, icon: '🔍' }
        ];

        stats.forEach((stat, index) => {
            const statY = y + 50 + (index * 50);

            // Stat name
            const nameText = this.add.text(x, statY, `${stat.icon} ${stat.name}`, {
                fontSize: '20px',
                fontFamily: GameConfig.fonts.ui,
                color: GameConfig.colors.text
            });

            // Stat bar
            const barX = x + 180;
            const barWidth = 200;
            const barHeight = 20;

            const bg = this.add.rectangle(barX, statY + 5, barWidth, barHeight, 0x333333).setOrigin(0);

            const fillWidth = (stat.value / 100) * barWidth;
            const color = this.character.stats.getStatColor(stat.value);
            const fill = this.add.rectangle(
                barX, statY + 5,
                fillWidth, barHeight,
                parseInt(color.replace('#', '0x'))
            ).setOrigin(0);

            // Stat value
            const valueText = this.add.text(barX + barWidth + 10, statY, stat.value.toString(), {
                fontSize: '20px',
                fontFamily: GameConfig.fonts.ui,
                color
            });
        });

        // Level and XP
        const levelY = y + 50 + (stats.length * 50) + 30;
        const levelText = this.add.text(x, levelY,
            `Level ${this.character.stats.level} - XP: ${this.character.stats.experience}/${this.character.stats.level * 100}`,
            {
                fontSize: '18px',
                fontFamily: GameConfig.fonts.ui,
                color: GameConfig.colors.secondary
            }
        );
    }

    drawPerks(x, y) {
        // Perks panel title
        const title = this.add.text(x, y, 'Perks', {
            fontSize: '28px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.primary
        });

        if (this.character.perks.length === 0) {
            const noPerk = this.add.text(x, y + 50, 'No perks yet', {
                fontSize: '18px',
                fontFamily: GameConfig.fonts.ui,
                color: '#666666',
                fontStyle: 'italic'
            });
        } else {
            this.character.perks.forEach((perk, index) => {
                const perkY = y + 50 + (index * 80);

                // Perk icon and name
                const perkHeader = this.add.text(x, perkY,
                    `${perk.icon} ${perk.name}`,
                    {
                        fontSize: '20px',
                        fontFamily: GameConfig.fonts.main,
                        color: perk.getRarityColor()
                    }
                );

                // Perk description
                const perkDesc = this.add.text(x, perkY + 30,
                    perk.description,
                    {
                        fontSize: '16px',
                        fontFamily: GameConfig.fonts.ui,
                        color: GameConfig.colors.text,
                        wordWrap: { width: 400 }
                    }
                );
            });
        }
    }

    drawJourneyInfo(x, y) {
        const info = [
            `Day: ${this.character.currentDay} / ${GameConfig.settings.journeyDays}`,
            `Supplies: ${this.character.supplies}`,
            `Locations Visited: ${this.character.visitedLocations.length}`,
            `Choices Made: ${this.character.choicesMade}`,
            `Companions: ${this.character.companions.length}`,
            `Active Party: ${this.character.activeCompanions.length}`
        ];

        info.forEach((text, index) => {
            this.add.text(x + (index % 3) * 250, y + Math.floor(index / 3) * 30, text, {
                fontSize: '18px',
                fontFamily: GameConfig.fonts.ui,
                color: GameConfig.colors.text
            });
        });
    }
}
