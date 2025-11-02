/**
 * Main game configuration
 */
const GameConfig = {
    // Game dimensions - responsive design
    width: 1920,
    height: 1080,
    minWidth: 375,  // Mobile minimum
    minHeight: 667,

    // Colors
    colors: {
        primary: '#c4a876',      // Dusty gold
        secondary: '#8b6f47',    // Brown
        background: '#1a1a1a',   // Dark
        text: '#e8dcc4',         // Light parchment
        danger: '#a84432',       // Rust red
        success: '#6b8e23',      // Olive green
        warning: '#cc8800',      // Orange
    },

    // Typography
    fonts: {
        main: 'Georgia, serif',
        ui: 'Arial, sans-serif',
    },

    // Game settings
    settings: {
        journeyDays: 100,
        startingSupplies: 90,
        maxCompanions: 3,
        autoSaveInterval: 30000, // 30 seconds
    },

    // AI Service configuration
    ai: {
        enabled: true,
        provider: 'openai', // Can be 'openai', 'anthropic', or 'local'
        fallbackToStatic: true,
        maxRetries: 2,
    },

    // Starting locations based on backstory
    startLocations: {
        'seattle': {
            name: 'Seattle, WA',
            coords: { x: 200, y: 150 },
            description: 'The rainy city, now eerily silent.',
            backstoryTags: ['tech', 'maritime', 'science']
        },
        'san-francisco': {
            name: 'San Francisco, CA',
            coords: { x: 150, y: 250 },
            description: 'The bay area, fog hiding the infected.',
            backstoryTags: ['academic', 'medical', 'creative']
        },
        'los-angeles': {
            name: 'Los Angeles, CA',
            coords: { x: 180, y: 350 },
            description: 'The sprawling metropolis, now a maze of danger.',
            backstoryTags: ['entertainment', 'law', 'business']
        },
        'phoenix': {
            name: 'Phoenix, AZ',
            coords: { x: 300, y: 380 },
            description: 'The desert city, scorched and desperate.',
            backstoryTags: ['military', 'government', 'survival']
        }
    },

    // Debug mode
    debug: true,
};
