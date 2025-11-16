# 🎮 The Long Road Home

A cross-platform, narrative-driven post-apocalyptic survival game featuring AI-powered character creation and deep branching storylines.

## 🌟 Features

### Core Gameplay
- **Dynamic Character Creation**: AI-generated perks, stats, and story moments based on your unique backstory
- **Branching Narrative**: Hundreds of choices that meaningfully impact the story
- **RPG Mechanics**: 5 core stats (Resilience, Cunning, Empathy, Resolve, Scavenge) that unlock dialogue options
- **Companion System**: Recruit up to 3 companions with their own stories, loyalty systems, and perks
- **Journey Progression**: 100-day trek across America from the West Coast to Washington DC
- **Multiple Endings**: Your choices determine the fate of humanity

### Technical Features
- **Cross-Platform**: Works on mobile, tablet, desktop, and TV browsers
- **Progressive Web App**: Install on mobile devices for offline play
- **Local Save System**: Multiple save slots with import/export functionality
- **Responsive Design**: Adapts to any screen size
- **No Installation Required**: Runs directly in the browser

## 📖 Story

Three months ago, the virus designated "Project Lazarus" escaped containment. Two-thirds of humanity became infected—feral, aggressive, but cunning. You're immune, but you don't know why.

A radio broadcast promises a safe zone in Washington DC where the government is rebuilding. Your journey begins on the West Coast. 3,000 miles. 90 days of supplies. And the desperate hope that something remains worth fighting for.

## 🎯 How to Play

### Starting the Game

1. **Installation** (see below for setup)
2. **New Game**: Create your character
3. **Character Creation**:
   - Enter your name and age
   - Define your pre-collapse profession
   - Describe a defining moment from your past
   - Explain what you lost when the virus hit
   - Share your theory about your immunity

4. **AI Generation**: The game will generate:
   - 3-4 unique perks based on your backstory
   - Custom stat distribution
   - Personality traits affecting dialogue
   - A unique companion from your past (optional)
   - 5 "echo" moments that callback to your story

### Gameplay Loop

**At Each Location:**
- 🔍 **Explore**: Discover events, encounter survivors or infected, find resources
- 😴 **Rest**: Heal wounds, restore morale, consume supplies
- 🚶 **Travel**: Move to the next location on your journey

**During Events:**
- Read the narrative
- Choose from multiple dialogue options
- Different choices available based on:
  - 💪 Your stats
  - ⭐ Your perks
  - 📖 Your backstory
  - 👥 Your companions
  - Your previous choices

**Manage Resources:**
- Supplies (food/water)
- Health and morale
- Companion loyalty
- Faction relationships

### Controls

**Desktop/TV:**
- Mouse click to interact
- Scroll to read long text

**Mobile/Tablet:**
- Tap to interact
- Swipe to scroll

### Menu Options

- **📍 Map**: View your journey progress and travel between visited locations
- **📊 Stats**: See character stats, perks, and progression
- **👥 Companions**: Manage your party (coming soon)
- **🎒 Inventory**: View items and equipment (coming soon)
- **💾 Save**: Manually save your game (auto-save also active)

## 🚀 Setup & Installation

### Option 1: Quick Start (Local Development)

1. **Clone or download this repository**

2. **Open a terminal in the Game directory**

3. **Start a local server:**
   ```bash
   # If you have Node.js installed:
   npm start

   # Or use Python:
   python -m http.server 8080

   # Or use any other local web server
   ```

4. **Open your browser to `http://localhost:8080`**

### Option 2: NPM Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The game will open automatically in your default browser.

### Option 3: Deploy to Web Server

The game is configured for easy deployment to multiple platforms. **See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.**

**Quick Deploy Options:**
- **GitHub Pages** - Already configured! Push to `main` branch and enable GitHub Pages in repository settings
- **Cloudflare Pages** - Connect your GitHub repo or use `wrangler pages deploy`
- **Vercel** - Run `vercel` or connect your GitHub repo
- **Netlify** - Drag & drop deployment or connect your GitHub repo

The game requires no backend—it's entirely client-side!

**Live Demo:** Once deployed, your game will be accessible at your chosen platform's URL.

## 🤖 AI Integration (Optional)

The game includes AI-powered character generation using OpenAI's API. This is **completely optional**—the game works perfectly without it using fallback generation.

### To Enable AI Features:

1. Get an API key from [OpenAI](https://platform.openai.com/)

2. In the game, go to **Settings** (from main menu)

3. Enter your API key

4. AI will now generate unique content for each playthrough

### Privacy Note:
- Your backstory is sent to the AI service only during character creation
- No data is stored on external servers
- All game saves are local to your browser
- You can export/import saves as JSON files

## 🎨 Game Design

### Core Stats

1. **Resilience** 💪 - Physical endurance, health, resistance to injuries
2. **Cunning** 🧠 - Problem-solving, resourcefulness, stealth
3. **Empathy** ❤️ - Social interactions, companion loyalty, moral choices
4. **Resolve** 🛡️ - Mental fortitude, stress management, leadership
5. **Scavenge** 🔍 - Finding resources, crafting, survival skills

### Companion System

Meet 8+ unique companions across your journey:
- **Ava Chen**: Former CDC researcher
- **Marcus "Doc" Williams**: Battlefield medic
- **Riley**: Teenage hacker
- **Dmitri Volkov**: Ex-special forces
- **Sarah Cross**: An infected "Whisper" who retained intelligence
- **Plus more...**

Each companion has:
- Loyalty system (affected by your choices)
- Personal backstory and quest
- Unique perk when in your party
- Likes/dislikes that influence their loyalty

### Act Structure

**Act 1: The West Coast** (Days 1-30)
- Starting locations: Seattle, San Francisco, Los Angeles, Phoenix
- Learn survival basics
- First companions
- Introduce the "Whispers" (intelligent infected)

**Act 2: The Heartland** (Days 31-60)
- Salt Lake City, Denver, Kansas Plains
- Faction politics
- Moral dilemmas
- The "Shepherd" storyline

**Act 3: Eastern Territories** (Days 61-90)
- St. Louis, Chicago, Pittsburgh
- Government contact
- Betrayals and revelations
- Truth about immunity begins to surface

**Act 4: Washington DC** (Days 91-100)
- The safe zone
- The final revelation
- Multiple ending paths based on your journey

## 📱 Mobile/PWA Installation

### iOS (iPhone/iPad):
1. Open the game in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. The game will appear as an app icon

### Android:
1. Open the game in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen" or "Install App"
4. The game will appear as an app

## 💾 Save System

### Auto-Save
The game auto-saves every 30 seconds during gameplay.

### Manual Saves
- Save to slots 1-5 from the Save menu
- Export saves as JSON files
- Import saves from other devices

### Save Location
Saves are stored in your browser's localStorage. To preserve saves:
- Don't clear browser data
- Export important saves
- Use the same browser and device

## 🛠️ Development

### Project Structure

```
/Game
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── GAME_DESIGN.md         # Comprehensive game design doc
├── README.md              # This file
├── package.json           # Node dependencies
├── /styles
│   └── main.css           # Global styles
├── /src
│   ├── /config
│   │   └── gameConfig.js  # Game configuration
│   ├── /models
│   │   ├── Character.js   # Player character model
│   │   ├── Companion.js   # Companion model
│   │   ├── Stats.js       # Stats system
│   │   └── Perk.js        # Perk system
│   ├── /utils
│   │   ├── SaveManager.js # Save/load system
│   │   └── DialogueManager.js # Dialogue engine
│   ├── /services
│   │   └── AIService.js   # AI integration
│   ├── /data
│   │   └── GameData.js    # Story content
│   ├── /scenes
│   │   ├── BootScene.js
│   │   ├── MainMenuScene.js
│   │   ├── CharacterCreationScene.js
│   │   ├── GameScene.js
│   │   ├── DialogueScene.js
│   │   ├── MapScene.js
│   │   └── StatsScene.js
│   └── main.js            # Game initialization
└── /assets               # (Future: images, audio)
```

### Technology Stack

- **Game Engine**: Phaser 3 (v3.70.0)
- **Language**: JavaScript (ES6+)
- **Architecture**: Scene-based state management
- **Storage**: LocalStorage API
- **AI**: OpenAI API (optional)
- **PWA**: Service Workers, Web App Manifest

### Adding Content

**New Story Events** - Edit `/src/data/GameData.js`:
```javascript
GameData.events['new-event'] = {
    id: 'new-event',
    type: 'story',
    dialogue: {
        speaker: 'Character Name',
        text: 'Dialogue text here',
        choices: [
            {
                id: 'choice-1',
                text: 'Choice text',
                consequences: { morale: 5 },
                next: 'next-event-id'
            }
        ]
    }
};
```

**New Companions** - Edit `/src/data/GameData.js`:
```javascript
GameData.companions['companion-id'] = {
    id: 'companion-id',
    name: 'Companion Name',
    // ... (see existing companions for full structure)
};
```

**New Perks** - Edit `/src/models/Perk.js`:
```javascript
PerkTemplates['perk-id'] = {
    name: 'Perk Name',
    description: 'Description',
    effects: { stat: value },
    keywords: ['keyword1', 'keyword2']
};
```

## 🎮 Gameplay Tips

1. **Backstory Matters**: Your character creation choices affect:
   - Starting stats and perks
   - Starting location
   - Unique dialogue options throughout the game
   - Special story moments

2. **Manage Resources**:
   - Supplies deplete daily
   - Each companion consumes 0.5 supplies per day
   - Rest and exploration cost time and supplies

3. **Companion Loyalty**:
   - Pay attention to what companions like/dislike
   - High loyalty unlocks special abilities
   - Low loyalty can lead to betrayal

4. **Multiple Playthroughs**:
   - Different professions yield different perks
   - Stat checks open different paths
   - Multiple endings based on choices

## 🐛 Known Issues & Roadmap

### Current Limitations (v0.1.0)
- Limited story content (Act 1 outlined, others planned)
- AI generation requires API key (fallback system works)
- Companion menu not yet implemented
- Inventory system not yet implemented
- Audio not yet added
- Visual assets are placeholder text/shapes

### Planned Features
- [ ] Complete Acts 2-4 story content
- [ ] Full companion interaction system
- [ ] Inventory and crafting
- [ ] Combat encounters (currently dialogue-based)
- [ ] Random event generator
- [ ] Achievement system
- [ ] Audio and music
- [ ] Character portrait art
- [ ] Location background art
- [ ] Animated transitions
- [ ] Cloud save sync (optional)
- [ ] Multiple language support

## 📜 License

MIT License - Feel free to modify and distribute!

## 🙏 Credits

**Game Design & Development**: Created as a demonstration of AI-assisted game development

**Powered By**:
- Phaser 3 game engine
- OpenAI API (optional)
- Modern web standards

## 🎯 Quick Start Checklist

- [ ] Download/clone the repository
- [ ] Start a local web server (`npm start` or `python -m http.server 8080`)
- [ ] Open `http://localhost:8080` in your browser
- [ ] Click "New Game"
- [ ] Create your character
- [ ] Begin your journey!

---

**Ready to begin your journey? The long road awaits...**

*Day 1. Your survival depends on the choices you make.*
