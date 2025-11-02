/**
 * Save/Load game state manager
 */
class SaveManager {
    constructor() {
        this.storageKey = 'long_road_home_save';
        this.autoSaveKey = 'long_road_home_autosave';
    }

    /**
     * Save game state
     */
    save(character, slot = 'manual') {
        try {
            const saveData = {
                version: '0.1.0',
                timestamp: Date.now(),
                character: character.toJSON(),
                meta: {
                    saveDate: new Date().toISOString(),
                    playtime: character.playtime,
                    currentDay: character.currentDay,
                    location: character.currentLocation
                }
            };

            const key = slot === 'auto' ? this.autoSaveKey : `${this.storageKey}_${slot}`;
            localStorage.setItem(key, JSON.stringify(saveData));

            return { success: true, slot };
        } catch (error) {
            console.error('Save failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load game state
     */
    load(slot = 'manual') {
        try {
            const key = slot === 'auto' ? this.autoSaveKey : `${this.storageKey}_${slot}`;
            const data = localStorage.getItem(key);

            if (!data) {
                return { success: false, error: 'No save found' };
            }

            const saveData = JSON.parse(data);
            const character = Character.fromJSON(saveData.character);

            return {
                success: true,
                character,
                meta: saveData.meta
            };
        } catch (error) {
            console.error('Load failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all save slots
     */
    getAllSaves() {
        const saves = [];

        // Check manual saves (slots 1-5)
        for (let i = 1; i <= 5; i++) {
            const key = `${this.storageKey}_${i}`;
            const data = localStorage.getItem(key);

            if (data) {
                try {
                    const saveData = JSON.parse(data);
                    saves.push({
                        slot: i,
                        meta: saveData.meta,
                        exists: true
                    });
                } catch (e) {
                    saves.push({ slot: i, exists: false });
                }
            } else {
                saves.push({ slot: i, exists: false });
            }
        }

        // Check autosave
        const autoData = localStorage.getItem(this.autoSaveKey);
        if (autoData) {
            try {
                const saveData = JSON.parse(autoData);
                saves.push({
                    slot: 'auto',
                    meta: saveData.meta,
                    exists: true
                });
            } catch (e) {
                saves.push({ slot: 'auto', exists: false });
            }
        }

        return saves;
    }

    /**
     * Delete save slot
     */
    deleteSave(slot) {
        try {
            const key = slot === 'auto' ? this.autoSaveKey : `${this.storageKey}_${slot}`;
            localStorage.removeItem(key);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Export save to file
     */
    exportSave(slot = 'manual') {
        const result = this.load(slot);
        if (!result.success) {
            return result;
        }

        const saveData = {
            version: '0.1.0',
            character: result.character.toJSON(),
            meta: result.meta
        };

        const blob = new Blob([JSON.stringify(saveData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `long_road_save_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        return { success: true };
    }

    /**
     * Import save from file
     */
    importSave(fileData, slot = 'manual') {
        try {
            const saveData = JSON.parse(fileData);
            const character = Character.fromJSON(saveData.character);

            // Save to specified slot
            const key = slot === 'auto' ? this.autoSaveKey : `${this.storageKey}_${slot}`;
            localStorage.setItem(key, fileData);

            return {
                success: true,
                character,
                meta: saveData.meta
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Clear all saves
     */
    clearAllSaves() {
        try {
            for (let i = 1; i <= 5; i++) {
                localStorage.removeItem(`${this.storageKey}_${i}`);
            }
            localStorage.removeItem(this.autoSaveKey);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
