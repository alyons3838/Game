/**
 * Main Menu Scene
 */
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.cameras.main.setBackgroundColor(GameConfig.colors.background);

        // Title
        const title = this.add.text(width / 2, height * 0.2, 'THE LONG ROAD HOME', {
            fontSize: '64px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.primary,
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);

        // Subtitle
        const subtitle = this.add.text(width / 2, height * 0.28, 'A Post-Apocalyptic Journey', {
            fontSize: '24px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.text,
            fontStyle: 'italic'
        });
        subtitle.setOrigin(0.5);

        // Menu options
        const menuY = height * 0.5;
        const menuOptions = [
            { text: 'New Game', action: () => this.newGame() },
            { text: 'Continue', action: () => this.continue() },
            { text: 'Load Game', action: () => this.loadGame() },
            { text: 'Settings', action: () => this.settings() }
        ];

        menuOptions.forEach((option, index) => {
            const button = this.createMenuButton(
                width / 2,
                menuY + (index * 70),
                option.text,
                option.action
            );
        });

        // Check if autosave exists
        const autosave = this.game.saveManager.load('auto');
        if (!autosave.success) {
            // Disable continue button if no save
            this.children.list.forEach(child => {
                if (child.text === 'Continue') {
                    child.setAlpha(0.5);
                    child.disableInteractive();
                }
            });
        }

        // Version
        const version = this.add.text(width - 10, height - 10, 'v0.1.0', {
            fontSize: '14px',
            fontFamily: GameConfig.fonts.ui,
            color: '#666666'
        });
        version.setOrigin(1, 1);

        // Controls hint
        const hint = this.add.text(width / 2, height - 30, 'Click to select', {
            fontSize: '16px',
            fontFamily: GameConfig.fonts.ui,
            color: GameConfig.colors.text,
            alpha: 0.7
        });
        hint.setOrigin(0.5);
    }

    createMenuButton(x, y, text, callback) {
        const button = this.add.text(x, y, text, {
            fontSize: '32px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.text,
            backgroundColor: '#00000000'
        });
        button.setOrigin(0.5);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setColor(GameConfig.colors.primary);
            button.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setColor(GameConfig.colors.text);
            button.setScale(1);
        });

        button.on('pointerdown', () => {
            callback();
        });

        return button;
    }

    newGame() {
        this.scene.start('CharacterCreationScene');
    }

    continue() {
        const result = this.game.saveManager.load('auto');
        if (result.success) {
            this.game.character = result.character;
            this.scene.start('GameScene');
        }
    }

    loadGame() {
        // TODO: Implement load game menu
        console.log('Load game menu not yet implemented');
        alert('Load game menu coming soon!');
    }

    settings() {
        // TODO: Implement settings menu
        console.log('Settings menu not yet implemented');
        alert('Settings menu coming soon!\n\nTo enable AI features, you\'ll need to provide an API key in the settings.');
    }
}
