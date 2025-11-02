/**
 * Dialogue Scene - handles all dialogue and choice interactions
 */
class DialogueScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DialogueScene' });
    }

    init(data) {
        this.currentDialogue = data.dialogue;
        this.character = this.game.character;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Semi-transparent background overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

        // Dialogue box
        const boxHeight = height * 0.4;
        const boxY = height - boxHeight - 20;

        const dialogueBox = this.add.rectangle(
            width / 2, boxY + boxHeight / 2,
            width - 100, boxHeight,
            0x1a1a1a, 0.95
        );
        dialogueBox.setStrokeStyle(3, parseInt(GameConfig.colors.primary.replace('#', '0x')));

        // Process dialogue
        const processed = this.game.dialogueManager.processDialogue(
            this.currentDialogue,
            this.character
        );

        // Speaker name
        if (processed.speaker !== 'Narrator') {
            const speakerText = this.add.text(
                80, boxY + 20,
                processed.speaker,
                {
                    fontSize: '24px',
                    fontFamily: GameConfig.fonts.main,
                    color: GameConfig.colors.primary,
                    fontStyle: 'bold'
                }
            );
        }

        // Dialogue text
        const dialogueText = this.add.text(
            80, boxY + (processed.speaker !== 'Narrator' ? 60 : 30),
            processed.text,
            {
                fontSize: '20px',
                fontFamily: GameConfig.fonts.ui,
                color: GameConfig.colors.text,
                wordWrap: { width: width - 160 },
                lineSpacing: 8
            }
        );

        // Choices
        const choicesY = boxY + boxHeight + 40;
        this.createChoices(processed.choices, width, choicesY);
    }

    createChoices(choices, width, startY) {
        const spacing = 70;

        choices.forEach((choice, index) => {
            const y = startY + (index * spacing);

            // Choice background
            const choiceBox = this.add.rectangle(
                width / 2, y,
                width - 120, 60,
                parseInt(GameConfig.colors.secondary.replace('#', '0x')), 0.8
            );

            // Choice text with icon
            const choiceText = this.add.text(
                100, y,
                `${choice.icon} ${choice.text}`,
                {
                    fontSize: '18px',
                    fontFamily: GameConfig.fonts.ui,
                    color: GameConfig.colors.text,
                    wordWrap: { width: width - 220 }
                }
            );
            choiceText.setOrigin(0, 0.5);

            // Type indicator
            if (choice.type !== 'standard') {
                const typeColor = this.getTypeColor(choice.type);
                const typeIndicator = this.add.text(
                    width - 120, y,
                    this.getTypeLabel(choice.type),
                    {
                        fontSize: '14px',
                        fontFamily: GameConfig.fonts.ui,
                        color: typeColor,
                        fontStyle: 'italic'
                    }
                );
                typeIndicator.setOrigin(1, 0.5);
            }

            // Make interactive
            choiceBox.setInteractive({ useHandCursor: true });
            choiceText.setInteractive({ useHandCursor: true });

            const hoverIn = () => {
                choiceBox.setFillStyle(parseInt(GameConfig.colors.primary.replace('#', '0x')), 0.9);
                choiceText.setColor('#ffffff');
            };

            const hoverOut = () => {
                choiceBox.setFillStyle(parseInt(GameConfig.colors.secondary.replace('#', '0x')), 0.8);
                choiceText.setColor(GameConfig.colors.text);
            };

            choiceBox.on('pointerover', hoverIn);
            choiceText.on('pointerover', hoverIn);
            choiceBox.on('pointerout', hoverOut);
            choiceText.on('pointerout', hoverOut);

            const selectChoice = () => {
                this.onChoiceSelected(choice);
            };

            choiceBox.on('pointerdown', selectChoice);
            choiceText.on('pointerdown', selectChoice);
        });
    }

    onChoiceSelected(choice) {
        // Execute consequences
        const results = this.game.dialogueManager.executeConsequences(choice, this.character);

        // Show consequences if any
        if (results.length > 0) {
            this.showConsequences(results, () => {
                this.proceedAfterChoice(choice);
            });
        } else {
            this.proceedAfterChoice(choice);
        }
    }

    showConsequences(results, callback) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Consequences panel
        const panel = this.add.container(0, 0);

        const bg = this.add.rectangle(
            width / 2, height / 2,
            500, 400,
            0x000000, 0.95
        );
        bg.setStrokeStyle(3, parseInt(GameConfig.colors.primary.replace('#', '0x')));
        panel.add(bg);

        const title = this.add.text(
            width / 2, height / 2 - 160,
            'Consequences',
            {
                fontSize: '28px',
                fontFamily: GameConfig.fonts.main,
                color: GameConfig.colors.primary
            }
        );
        title.setOrigin(0.5);
        panel.add(title);

        results.forEach((result, index) => {
            const y = height / 2 - 100 + (index * 40);
            const text = this.add.text(
                width / 2, y,
                result.text,
                {
                    fontSize: '18px',
                    fontFamily: GameConfig.fonts.ui,
                    color: this.getConsequenceColor(result.type)
                }
            );
            text.setOrigin(0.5);
            panel.add(text);
        });

        const continueBtn = this.add.text(
            width / 2, height / 2 + 150,
            'Continue',
            {
                fontSize: '24px',
                fontFamily: GameConfig.fonts.main,
                color: GameConfig.colors.text,
                backgroundColor: GameConfig.colors.secondary,
                padding: { x: 30, y: 10 }
            }
        );
        continueBtn.setOrigin(0.5);
        continueBtn.setInteractive({ useHandCursor: true });
        continueBtn.on('pointerdown', () => {
            panel.destroy();
            callback();
        });
        panel.add(continueBtn);
    }

    proceedAfterChoice(choice) {
        // Check for next dialogue
        if (choice.next) {
            const nextDialogue = GameData.events[choice.next];
            if (nextDialogue) {
                this.scene.restart({ dialogue: nextDialogue });
            } else {
                // Return to game scene
                this.scene.stop();
                this.scene.resume('GameScene');
            }
        } else {
            // Return to game scene
            this.scene.stop();
            this.scene.resume('GameScene');
        }

        // Auto-save
        this.game.saveManager.save(this.character, 'auto');
    }

    getTypeColor(type) {
        const colors = {
            'stat': '#6b8e23',
            'perk': '#9370db',
            'backstory': '#c4a876',
            'companion': '#4682b4'
        };
        return colors[type] || GameConfig.colors.text;
    }

    getTypeLabel(type) {
        const labels = {
            'stat': '[Stat Check]',
            'perk': '[Perk Required]',
            'backstory': '[Personal]',
            'companion': '[Companion]'
        };
        return labels[type] || '';
    }

    getConsequenceColor(type) {
        if (type.includes('gain') || type === 'stat' || type === 'experience') {
            return '#6b8e23';
        } else if (type.includes('loss')) {
            return '#a84432';
        }
        return GameConfig.colors.text;
    }
}
