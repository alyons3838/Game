/**
 * Main game entry point
 * Initializes Phaser and starts the game
 */

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GameConfig.width,
    height: GameConfig.height,
    backgroundColor: GameConfig.colors.background,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: GameConfig.minWidth,
            height: GameConfig.minHeight
        },
        max: {
            width: GameConfig.width,
            height: GameConfig.height
        }
    },
    scene: [
        BootScene,
        MainMenuScene,
        CharacterCreationScene,
        GameScene,
        DialogueScene,
        MapScene,
        StatsScene
    ],
    dom: {
        createContainer: true
    },
    input: {
        activePointers: 3 // Support multi-touch for mobile
    }
};

// Create game instance
const game = new Phaser.Game(config);

// Handle window resize for responsive design
window.addEventListener('resize', () => {
    game.scale.refresh();
});

// Service worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}

// Prevent default touch behaviors for better mobile experience
document.addEventListener('touchmove', (e) => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
}, { passive: false });

// Log game info
console.log('%c🎮 The Long Road Home', 'font-size: 24px; color: #c4a876; font-weight: bold;');
console.log('Version: 0.1.0');
console.log('A post-apocalyptic narrative adventure game');
console.log('');
console.log('%cDebug mode:', 'color: #6b8e23', GameConfig.debug);
