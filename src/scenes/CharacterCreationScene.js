/**
 * Character Creation Scene with AI backstory integration
 */
class CharacterCreationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterCreationScene' });
        this.currentStep = 0;
        this.characterData = {};
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.setBackgroundColor(GameConfig.colors.background);

        // Create UI container
        this.uiContainer = this.add.container(0, 0);

        // Title
        this.title = this.add.text(width / 2, 80, 'CHARACTER CREATION', {
            fontSize: '48px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.primary
        });
        this.title.setOrigin(0.5);
        this.uiContainer.add(this.title);

        // Progress indicator
        this.progressText = this.add.text(width / 2, 140, 'Step 1 of 6', {
            fontSize: '20px',
            fontFamily: GameConfig.fonts.ui,
            color: GameConfig.colors.text,
            alpha: 0.7
        });
        this.progressText.setOrigin(0.5);
        this.uiContainer.add(this.progressText);

        // Create form
        this.showStep(0);
    }

    showStep(step) {
        this.currentStep = step;
        this.progressText.setText(`Step ${step + 1} of 6`);

        // Clear previous step
        if (this.stepContainer) {
            this.stepContainer.destroy();
        }

        this.stepContainer = this.add.container(0, 0);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerY = height / 2;

        switch (step) {
            case 0:
                this.createNameStep(width, centerY);
                break;
            case 1:
                this.createProfessionStep(width, centerY);
                break;
            case 2:
                this.createDefiningMomentStep(width, centerY);
                break;
            case 3:
                this.createLossStep(width, centerY);
                break;
            case 4:
                this.createImmunityTheoryStep(width, centerY);
                break;
            case 5:
                this.createSummaryStep(width, centerY);
                break;
        }
    }

    createNameStep(width, centerY) {
        const label = this.add.text(width / 2, centerY - 100, 'What is your name?', {
            fontSize: '32px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.text
        });
        label.setOrigin(0.5);
        this.stepContainer.add(label);

        // Create HTML input for name
        const inputHtml = this.createTextInput('name', this.characterData.name || '', width / 2, centerY);

        // Age selector
        const ageLabel = this.add.text(width / 2, centerY + 80, 'Age:', {
            fontSize: '24px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.text
        });
        ageLabel.setOrigin(0.5);
        this.stepContainer.add(ageLabel);

        const ageInput = this.createTextInput('age', this.characterData.age || '30', width / 2, centerY + 120, 'number');

        // Next button
        const nextBtn = this.createButton(width / 2, centerY + 200, 'Next', () => {
            const nameInput = document.getElementById('input-name');
            const ageInput = document.getElementById('input-age');

            if (nameInput && nameInput.value.trim()) {
                this.characterData.name = nameInput.value.trim();
                this.characterData.age = parseInt(ageInput.value) || 30;
                this.cleanupInputs();
                this.showStep(1);
            } else {
                alert('Please enter a name');
            }
        });
        this.stepContainer.add(nextBtn);
    }

    createProfessionStep(width, centerY) {
        const label = this.add.text(width / 2, centerY - 150, 'What was your profession before the collapse?', {
            fontSize: '28px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.text,
            align: 'center',
            wordWrap: { width: width * 0.8 }
        });
        label.setOrigin(0.5);
        this.stepContainer.add(label);

        const hint = this.add.text(width / 2, centerY - 80, 'Examples: Doctor, Teacher, Engineer, Soldier, Artist, etc.', {
            fontSize: '18px',
            fontFamily: GameConfig.fonts.ui,
            color: GameConfig.colors.text,
            alpha: 0.6,
            align: 'center'
        });
        hint.setOrigin(0.5);
        this.stepContainer.add(hint);

        this.createTextInput('profession', this.characterData.profession || '', width / 2, centerY);

        // Navigation
        this.addNavButtons(width, centerY + 150, () => this.showStep(0), () => {
            const input = document.getElementById('input-profession');
            if (input && input.value.trim()) {
                this.characterData.profession = input.value.trim();
                this.cleanupInputs();
                this.showStep(2);
            } else {
                alert('Please enter your profession');
            }
        });
    }

    createDefiningMomentStep(width, centerY) {
        const label = this.add.text(width / 2, centerY - 150, 'Describe a defining moment from your past', {
            fontSize: '28px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.text,
            align: 'center',
            wordWrap: { width: width * 0.8 }
        });
        label.setOrigin(0.5);
        this.stepContainer.add(label);

        const hint = this.add.text(width / 2, centerY - 80, '(2-3 sentences that shaped who you are)', {
            fontSize: '18px',
            fontFamily: GameConfig.fonts.ui,
            color: GameConfig.colors.text,
            alpha: 0.6
        });
        hint.setOrigin(0.5);
        this.stepContainer.add(hint);

        this.createTextArea('definingMoment', this.characterData.definingMoment || '', width / 2, centerY);

        this.addNavButtons(width, centerY + 180, () => this.showStep(1), () => {
            const input = document.getElementById('input-definingMoment');
            if (input && input.value.trim()) {
                this.characterData.definingMoment = input.value.trim();
                this.cleanupInputs();
                this.showStep(3);
            } else {
                alert('Please describe a defining moment');
            }
        });
    }

    createLossStep(width, centerY) {
        const label = this.add.text(width / 2, centerY - 150, 'What did you lose when the virus hit?', {
            fontSize: '28px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.text,
            align: 'center',
            wordWrap: { width: width * 0.8 }
        });
        label.setOrigin(0.5);
        this.stepContainer.add(label);

        this.createTextArea('whatLost', this.characterData.whatLost || '', width / 2, centerY);

        this.addNavButtons(width, centerY + 180, () => this.showStep(2), () => {
            const input = document.getElementById('input-whatLost');
            if (input && input.value.trim()) {
                this.characterData.whatLost = input.value.trim();
                this.cleanupInputs();
                this.showStep(4);
            } else {
                alert('Please describe what you lost');
            }
        });
    }

    createImmunityTheoryStep(width, centerY) {
        const label = this.add.text(width / 2, centerY - 150, "Why do you think you're immune?", {
            fontSize: '28px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.text,
            align: 'center',
            wordWrap: { width: width * 0.8 }
        });
        label.setOrigin(0.5);
        this.stepContainer.add(label);

        const hint = this.add.text(width / 2, centerY - 80, '(Your theory - it doesn\'t have to be correct)', {
            fontSize: '18px',
            fontFamily: GameConfig.fonts.ui,
            color: GameConfig.colors.text,
            alpha: 0.6
        });
        hint.setOrigin(0.5);
        this.stepContainer.add(hint);

        this.createTextArea('immunityTheory', this.characterData.immunityTheory || '', width / 2, centerY);

        this.addNavButtons(width, centerY + 180, () => this.showStep(3), () => {
            const input = document.getElementById('input-immunityTheory');
            if (input && input.value.trim()) {
                this.characterData.immunityTheory = input.value.trim();
                this.cleanupInputs();
                this.showStep(5);
            } else {
                alert('Please enter your theory');
            }
        });
    }

    createSummaryStep(width, centerY) {
        const summary = this.add.text(width / 2, centerY - 220,
            `Name: ${this.characterData.name}, Age ${this.characterData.age}\n\n` +
            `Profession: ${this.characterData.profession}\n\n` +
            `Defining Moment: ${this.characterData.definingMoment}\n\n` +
            `Lost: ${this.characterData.whatLost}\n\n` +
            `Immunity Theory: ${this.characterData.immunityTheory}`,
            {
                fontSize: '18px',
                fontFamily: GameConfig.fonts.ui,
                color: GameConfig.colors.text,
                align: 'center',
                wordWrap: { width: width * 0.7 }
            }
        );
        summary.setOrigin(0.5, 0);
        this.stepContainer.add(summary);

        const aiLabel = this.add.text(width / 2, centerY + 100,
            'AI will generate perks and stats based on your backstory',
            {
                fontSize: '20px',
                fontFamily: GameConfig.fonts.main,
                color: GameConfig.colors.primary,
                align: 'center'
            }
        );
        aiLabel.setOrigin(0.5);
        this.stepContainer.add(aiLabel);

        this.addNavButtons(width, centerY + 200, () => this.showStep(4), () => {
            this.generateCharacter();
        }, 'Generate Character');
    }

    async generateCharacter() {
        // Show loading
        this.stepContainer.destroy();

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const loading = this.add.text(width / 2, height / 2, 'Generating character...', {
            fontSize: '32px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.primary
        });
        loading.setOrigin(0.5);

        // Call AI service
        const aiResult = await this.game.aiService.generateCharacterContent(this.characterData);

        loading.destroy();

        if (aiResult.success) {
            // Create character
            const character = new Character(this.characterData);

            // Apply AI-generated content
            if (aiResult.stats) {
                Object.assign(character.stats, aiResult.stats);
            }

            if (aiResult.perks) {
                aiResult.perks.forEach(perk => character.addPerk(perk));
            }

            if (aiResult.personality) {
                character.personality = aiResult.personality;
            }

            if (aiResult.companion) {
                character.uniqueCompanion = aiResult.companion;
            }

            if (aiResult.echoes) {
                character.backstoryEchoes = aiResult.echoes;
            }

            character.aiGenerated = aiResult.generated;

            // Determine starting location based on profession
            character.currentLocation = this.determineStartLocation(character.profession);

            // Save character to game
            this.game.character = character;

            // Auto-save
            this.game.saveManager.save(character, 'auto');

            // Start game
            this.scene.start('GameScene');
        } else {
            alert('Character generation failed. Please try again.');
            this.showStep(5);
        }
    }

    determineStartLocation(profession) {
        const profLower = profession.toLowerCase();
        const locations = GameConfig.startLocations;

        for (const [key, loc] of Object.entries(locations)) {
            for (const tag of loc.backstoryTags) {
                if (profLower.includes(tag)) {
                    return key;
                }
            }
        }

        // Default to Seattle
        return 'seattle';
    }

    createTextInput(id, defaultValue, x, y, type = 'text') {
        const input = document.createElement('input');
        input.type = type;
        input.id = `input-${id}`;
        input.value = defaultValue;
        input.style.position = 'absolute';
        input.style.left = `${x - 200}px`;
        input.style.top = `${y - 20}px`;
        input.style.width = '400px';
        input.style.height = '40px';
        input.style.fontSize = '20px';
        input.style.fontFamily = GameConfig.fonts.ui;
        input.style.padding = '8px';
        input.style.backgroundColor = '#2a2a2a';
        input.style.color = GameConfig.colors.text;
        input.style.border = `2px solid ${GameConfig.colors.secondary}`;
        input.style.borderRadius = '4px';
        input.style.outline = 'none';

        input.addEventListener('focus', () => {
            input.style.borderColor = GameConfig.colors.primary;
        });

        input.addEventListener('blur', () => {
            input.style.borderColor = GameConfig.colors.secondary;
        });

        document.body.appendChild(input);
        return input;
    }

    createTextArea(id, defaultValue, x, y) {
        const textarea = document.createElement('textarea');
        textarea.id = `input-${id}`;
        textarea.value = defaultValue;
        textarea.style.position = 'absolute';
        textarea.style.left = `${x - 300}px`;
        textarea.style.top = `${y - 40}px`;
        textarea.style.width = '600px';
        textarea.style.height = '120px';
        textarea.style.fontSize = '18px';
        textarea.style.fontFamily = GameConfig.fonts.ui;
        textarea.style.padding = '12px';
        textarea.style.backgroundColor = '#2a2a2a';
        textarea.style.color = GameConfig.colors.text;
        textarea.style.border = `2px solid ${GameConfig.colors.secondary}`;
        textarea.style.borderRadius = '4px';
        textarea.style.outline = 'none';
        textarea.style.resize = 'vertical';

        textarea.addEventListener('focus', () => {
            textarea.style.borderColor = GameConfig.colors.primary;
        });

        textarea.addEventListener('blur', () => {
            textarea.style.borderColor = GameConfig.colors.secondary;
        });

        document.body.appendChild(textarea);
        return textarea;
    }

    createButton(x, y, text, callback) {
        const button = this.add.text(x, y, text, {
            fontSize: '28px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.text,
            backgroundColor: GameConfig.colors.secondary,
            padding: { x: 30, y: 15 }
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

    addNavButtons(width, y, backCallback, nextCallback, nextText = 'Next') {
        const backBtn = this.createButton(width / 2 - 150, y, 'Back', backCallback);
        this.stepContainer.add(backBtn);

        const nextBtn = this.createButton(width / 2 + 150, y, nextText, nextCallback);
        this.stepContainer.add(nextBtn);
    }

    cleanupInputs() {
        // Remove all HTML inputs
        const inputs = document.querySelectorAll('input[id^="input-"], textarea[id^="input-"]');
        inputs.forEach(input => input.remove());
    }

    shutdown() {
        this.cleanupInputs();
    }
}
