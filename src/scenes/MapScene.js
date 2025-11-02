/**
 * Map Scene - show journey progress and travel
 */
class MapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.character = this.game.character;

        // Background
        this.add.rectangle(0, 0, width, height, 0x1a1a1a, 0.98).setOrigin(0);

        // Title
        const title = this.add.text(width / 2, 50, 'Journey Map', {
            fontSize: '42px',
            fontFamily: GameConfig.fonts.main,
            color: GameConfig.colors.primary
        });
        title.setOrigin(0.5);

        // Current location info
        const currentLoc = GameData.locations[this.character.currentLocation];
        if (currentLoc) {
            const locInfo = this.add.text(width / 2, 120, `Current: ${currentLoc.name}`, {
                fontSize: '24px',
                fontFamily: GameConfig.fonts.ui,
                color: GameConfig.colors.text
            });
            locInfo.setOrigin(0.5);
        }

        // Map visualization (simple vertical path)
        this.drawMap();

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

    drawMap() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const mapStartY = 200;
        const mapEndY = height - 150;
        const mapHeight = mapEndY - mapStartY;

        // Get all locations in order
        const allLocations = Object.values(GameData.locations).sort((a, b) => {
            const actDiff = a.act - b.act;
            if (actDiff !== 0) return actDiff;
            return 0;
        });

        const totalLocations = allLocations.length;
        const spacing = mapHeight / (totalLocations - 1);

        // Draw path
        allLocations.forEach((location, index) => {
            const y = mapStartY + (index * spacing);
            const isVisited = this.character.visitedLocations.includes(location.id);
            const isCurrent = this.character.currentLocation === location.id;

            // Location node
            const nodeColor = isCurrent ? 0xc4a876 :
                             isVisited ? 0x6b8e23 :
                             0x333333;

            const node = this.add.circle(width / 2, y, 20, nodeColor);

            if (isCurrent) {
                node.setStrokeStyle(4, 0xffffff);
            }

            // Location name
            const nameColor = isCurrent ? GameConfig.colors.primary :
                            isVisited ? '#6b8e23' :
                            '#666666';

            const name = this.add.text(width / 2 + 40, y, location.name, {
                fontSize: '18px',
                fontFamily: GameConfig.fonts.ui,
                color: nameColor
            });
            name.setOrigin(0, 0.5);

            // Act label
            if (index === 0 || allLocations[index - 1].act !== location.act) {
                const actLabel = this.add.text(width / 2 - 200, y, `Act ${location.act}`, {
                    fontSize: '16px',
                    fontFamily: GameConfig.fonts.main,
                    color: GameConfig.colors.secondary,
                    fontStyle: 'italic'
                });
                actLabel.setOrigin(0, 0.5);
            }

            // Connect to previous location
            if (index > 0) {
                const prevY = mapStartY + ((index - 1) * spacing);
                const lineColor = isVisited ? 0x6b8e23 : 0x333333;

                const line = this.add.line(
                    0, 0,
                    width / 2, prevY,
                    width / 2, y,
                    lineColor, 0.5
                );
                line.setLineWidth(3);
            }

            // Make clickable if accessible
            if (isVisited || isCurrent) {
                node.setInteractive({ useHandCursor: true });
                name.setInteractive({ useHandCursor: true });

                const hoverIn = () => {
                    node.setScale(1.2);
                    name.setFontSize(20);
                };

                const hoverOut = () => {
                    node.setScale(1);
                    name.setFontSize(18);
                };

                node.on('pointerover', hoverIn);
                name.on('pointerover', hoverIn);
                node.on('pointerout', hoverOut);
                name.on('pointerout', hoverOut);

                if (!isCurrent) {
                    const travelTo = () => {
                        this.travelToLocation(location.id);
                    };

                    node.on('pointerdown', travelTo);
                    name.on('pointerdown', travelTo);
                }
            }
        });

        // Progress indicator
        const progress = this.character.getProgress();
        const progressBar = this.add.rectangle(
            50, mapStartY,
            20, mapHeight,
            0x333333
        );
        progressBar.setOrigin(0);

        const progressFill = this.add.rectangle(
            50, mapStartY,
            20, (mapHeight * progress / 100),
            parseInt(GameConfig.colors.primary.replace('#', '0x'))
        );
        progressFill.setOrigin(0);

        const progressText = this.add.text(35, mapStartY - 20, `${progress.toFixed(0)}%`, {
            fontSize: '16px',
            fontFamily: GameConfig.fonts.ui,
            color: GameConfig.colors.primary
        });
        progressText.setOrigin(0.5, 1);
    }

    travelToLocation(locationId) {
        // Calculate days to travel
        const currentLoc = GameData.locations[this.character.currentLocation];
        const targetLoc = GameData.locations[locationId];

        if (!currentLoc || !targetLoc) return;

        // Simple travel calculation
        const daysToTravel = Math.abs(targetLoc.act - currentLoc.act) * 5 + Math.floor(Math.random() * 3);

        // Confirm travel
        if (confirm(`Travel to ${targetLoc.name}?\n\nThis will take approximately ${daysToTravel} days.`)) {
            this.character.advanceDay(daysToTravel);
            this.character.currentLocation = locationId;

            if (!this.character.visitedLocations.includes(locationId)) {
                this.character.visitedLocations.push(locationId);
            }

            this.game.saveManager.save(this.character, 'auto');

            this.scene.stop();
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        }
    }
}
