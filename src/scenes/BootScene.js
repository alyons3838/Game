/**
 * Boot Scene - Initial loading
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px ' + GameConfig.fonts.main,
                fill: GameConfig.colors.primary
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px ' + GameConfig.fonts.ui,
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        // Update progress bar
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xc4a876, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // Load assets here
        // For now, using simple colored rectangles and text
        // In production, load actual image and audio assets
    }

    create() {
        // Initialize managers
        if (!this.game.saveManager) {
            this.game.saveManager = new SaveManager();
        }
        if (!this.game.dialogueManager) {
            this.game.dialogueManager = new DialogueManager();
        }
        if (!this.game.aiService) {
            this.game.aiService = new AIService();
            this.game.aiService.loadAPIKey();
        }

        // Start main menu
        this.scene.start('MainMenuScene');
    }
}
