/**
 * Game data - story content, companions, locations, events
 */
const GameData = {
    /**
     * Companion definitions
     */
    companions: {
        'ava-chen': {
            id: 'ava-chen',
            name: 'Ava Chen',
            age: 34,
            description: 'A former CDC researcher who was working on viral research when the collapse happened.',
            backstory: 'Ava was one of the first to study the virus. She knows things she wishes she didn\'t.',
            portrait: 'ava',
            specialization: 'medical',
            personality: ['analytical', 'guilt-ridden', 'determined'],
            likes: ['scientific', 'helping', 'truth'],
            dislikes: ['military', 'lies', 'reckless'],
            location: 'denver',
            perk: {
                name: 'Medical Expertise',
                description: 'Ava can heal the party more effectively',
                type: 'companion',
                rarity: 'uncommon',
                effects: { resilience: 10 },
                trigger: 'passive',
                icon: '⚕️'
            }
        },
        'marcus-williams': {
            id: 'marcus-williams',
            name: 'Marcus "Doc" Williams',
            age: 42,
            description: 'A battlefield medic with steady hands and a troubled conscience.',
            backstory: 'Doc served in the military before the collapse. He\'s seen the worst humanity has to offer.',
            portrait: 'doc',
            specialization: 'medical',
            personality: ['stoic', 'protective', 'haunted'],
            likes: ['discipline', 'protecting', 'loyalty'],
            dislikes: ['chaos', 'betrayal', 'violence'],
            location: 'phoenix',
            perk: {
                name: 'Combat Medic',
                description: 'Doc can stabilize injuries in combat',
                type: 'companion',
                rarity: 'uncommon',
                effects: { resilience: 8, resolve: 7 },
                trigger: 'combat',
                icon: '🏥'
            }
        },
        'riley': {
            id: 'riley',
            name: 'Riley',
            age: 17,
            description: 'A teenage hacker who survived by staying connected when the world went dark.',
            backstory: 'Riley grew up online. When civilization fell, they retreated into old-world tech, keeping networks alive.',
            portrait: 'riley',
            specialization: 'tech',
            personality: ['sarcastic', 'brilliant', 'vulnerable'],
            likes: ['tech', 'problem-solving', 'protection'],
            dislikes: ['infected', 'crowds', 'trust'],
            location: 'san-francisco',
            perk: {
                name: 'Tech Savvy',
                description: 'Riley can hack old-world systems',
                type: 'companion',
                rarity: 'rare',
                effects: { cunning: 12, scavenge: 8 },
                trigger: 'exploration',
                icon: '💻'
            }
        },
        'dmitri-volkov': {
            id: 'dmitri-volkov',
            name: 'Dmitri Volkov',
            age: 38,
            description: 'Ex-special forces operator. Tactical, efficient, and loyal to those who earn it.',
            backstory: 'Dmitri worked black ops before the fall. He doesn\'t talk about what he did, but he\'s good at it.',
            portrait: 'dmitri',
            specialization: 'combat',
            personality: ['tactical', 'loyal', 'silent'],
            likes: ['planning', 'loyalty', 'efficiency'],
            dislikes: ['recklessness', 'betrayal', 'talking'],
            location: 'salt-lake-city',
            perk: {
                name: 'Tactical Advantage',
                description: 'Dmitri improves combat planning',
                type: 'companion',
                rarity: 'rare',
                effects: { cunning: 10, resolve: 10 },
                trigger: 'combat',
                icon: '🎯'
            }
        },
        'sarah-cross': {
            id: 'sarah-cross',
            name: 'Sarah Cross',
            age: 29,
            description: 'An infected who somehow retained her intelligence. A living mystery.',
            backstory: 'Sarah was infected three months ago but never lost herself. She\'s the only known "Whisper" - infected but aware.',
            portrait: 'sarah',
            specialization: 'unique',
            personality: ['haunted', 'curious', 'lonely'],
            likes: ['acceptance', 'science', 'hope'],
            dislikes: ['fear', 'violence', 'rejection'],
            location: 'chicago',
            perk: {
                name: 'Between Worlds',
                description: 'Sarah can sense infected nearby',
                type: 'companion',
                rarity: 'unique',
                effects: { empathy: 15 },
                trigger: 'exploration',
                icon: '👁️'
            }
        }
    },

    /**
     * Major locations on the journey
     */
    locations: {
        // Act 1: West Coast
        'seattle': {
            id: 'seattle',
            name: 'Seattle, WA',
            act: 1,
            description: 'The rainy city is eerily quiet. Nature is already reclaiming the streets.',
            danger: 3,
            resources: 6,
            events: ['seattle-intro', 'pike-market', 'space-needle']
        },
        'san-francisco': {
            id: 'san-francisco',
            name: 'San Francisco, CA',
            act: 1,
            description: 'The fog hides dangers. The hills are treacherous.',
            danger: 4,
            resources: 5,
            events: ['golden-gate', 'tech-district', 'alcatraz']
        },
        'los-angeles': {
            id: 'los-angeles',
            name: 'Los Angeles, CA',
            act: 1,
            description: 'The sprawling city is a maze. Too many places to hide, too many places to die.',
            danger: 5,
            resources: 7,
            events: ['hollywood', 'downtown', 'port']
        },
        'phoenix': {
            id: 'phoenix',
            name: 'Phoenix, AZ',
            act: 1,
            description: 'The desert heat is unforgiving. Water is worth more than gold.',
            danger: 4,
            resources: 3,
            events: ['desert-crossing', 'military-base', 'survivor-camp']
        },

        // Act 2: Heartland
        'salt-lake-city': {
            id: 'salt-lake-city',
            name: 'Salt Lake City, UT',
            act: 2,
            description: 'A religious community has taken control. They offer sanctuary, but at a price.',
            danger: 2,
            resources: 8,
            events: ['temple-square', 'the-prophet', 'trade-district'],
            faction: 'sanctuary'
        },
        'denver': {
            id: 'denver',
            name: 'Denver, CO',
            act: 2,
            description: 'The mile-high city has become a walled fortress. The largest trading hub in the heartland.',
            danger: 3,
            resources: 9,
            events: ['wall-market', 'faction-war', 'underground'],
            faction: 'traders'
        },
        'kansas-plains': {
            id: 'kansas-plains',
            name: 'Kansas Plains',
            act: 2,
            description: 'Endless plains. Raider territory. No law, no mercy.',
            danger: 7,
            resources: 2,
            events: ['raider-ambush', 'ghost-town', 'caravan']
        },

        // Act 3: Eastern Territories
        'st-louis': {
            id: 'st-louis',
            name: 'St. Louis, MO',
            act: 3,
            description: 'The Gateway Arch still stands, but the city is divided by war.',
            danger: 6,
            resources: 5,
            events: ['arch-battle', 'faction-choice', 'refugee-camp'],
            faction: 'multiple'
        },
        'chicago': {
            id: 'chicago',
            name: 'Chicago, IL',
            act: 3,
            description: 'The ruins are heavily infested, but valuable resources remain.',
            danger: 8,
            resources: 8,
            events: ['loop-ruins', 'navy-pier', 'whisper-encounter']
        },
        'pittsburgh': {
            id: 'pittsburgh',
            name: 'Pittsburgh, PA',
            act: 3,
            description: 'The last major checkpoint before DC. Government forces control this area.',
            danger: 4,
            resources: 7,
            events: ['checkpoint', 'government-contact', 'final-choice'],
            faction: 'government'
        },

        // Act 4: Finale
        'washington-dc': {
            id: 'washington-dc',
            name: 'Washington DC',
            act: 4,
            description: 'The capital. The promised safe zone. The truth awaits.',
            danger: 9,
            resources: 10,
            events: ['arrival', 'revelation', 'final-decision'],
            faction: 'government'
        }
    },

    /**
     * Story events and encounters
     */
    events: {
        'game-intro': {
            id: 'game-intro',
            type: 'story',
            title: 'The Long Road Home',
            dialogue: {
                speaker: 'Narrator',
                text: 'You are {name}, a {profession}. 90 days ago, the world ended. The virus—Project Lazarus they called it—swept across the globe like wildfire. Two-thirds of humanity infected. Feral. Lost.\n\nBut you\'re immune. You don\'t know why. Maybe {immunityTheory}.\n\nLast night, the radio crackled to life:\n\n"This is UESB Alpha-One. Safe zone established, Washington DC. Government operational. All immune individuals, proceed east."\n\n3,000 miles. 90 days of supplies. And the desperate hope that something remains worth fighting for.\n\nDay {day}. Your journey begins.',
                choices: [
                    {
                        id: 'begin-journey',
                        text: 'Begin the journey',
                        next: 'first-morning'
                    }
                ]
            }
        },

        'first-morning': {
            id: 'first-morning',
            type: 'story',
            dialogue: {
                speaker: 'Narrator',
                text: 'Morning light filters through broken windows. You check your supplies: enough food and water for 90 days if you\'re careful. A sturdy backpack. A road atlas with a route marked in red.\n\nYou hear a noise outside—a scream, cut short. The infected are always hunting.\n\nTime to move.',
                choices: [
                    {
                        id: 'leave-quiet',
                        text: 'Leave quietly through the back',
                        type: 'cunning',
                        requirements: { stats: { cunning: 40 } },
                        consequences: {
                            morale: 5
                        },
                        next: 'road-east',
                        tags: ['stealth', 'cautious']
                    },
                    {
                        id: 'check-scream',
                        text: 'Investigate the scream',
                        type: 'empathy',
                        requirements: { stats: { empathy: 40 } },
                        consequences: {
                            morale: -5,
                            experience: 10
                        },
                        next: 'first-encounter',
                        tags: ['helpful', 'risky']
                    },
                    {
                        id: 'leave-fast',
                        text: 'Get out of here, fast',
                        consequences: {
                            supplies: -2
                        },
                        next: 'road-east',
                        tags: ['pragmatic']
                    }
                ]
            }
        },

        'first-encounter': {
            id: 'first-encounter',
            type: 'combat',
            dialogue: {
                speaker: 'Narrator',
                text: 'You round the corner and freeze. Three infected are tearing apart a body. Fresh kill. They haven\'t noticed you yet.\n\nThen one turns. Its eyes—milky white—lock onto yours. It screams.',
                choices: [
                    {
                        id: 'fight',
                        text: 'Stand and fight',
                        icon: '⚔️',
                        requirements: { stats: { resolve: 45 } },
                        consequences: {
                            stats: { resolve: 5 },
                            experience: 25
                        },
                        next: 'combat-victory',
                        tags: ['combat', 'brave']
                    },
                    {
                        id: 'run',
                        text: 'Run!',
                        icon: '🏃',
                        consequences: {
                            morale: -5,
                            supplies: -3
                        },
                        next: 'road-east',
                        tags: ['flee']
                    },
                    {
                        id: 'distract',
                        text: 'Create a distraction and slip away',
                        icon: '🧠',
                        requirements: { stats: { cunning: 50 } },
                        consequences: {
                            stats: { cunning: 5 },
                            experience: 20
                        },
                        next: 'road-east',
                        tags: ['clever']
                    }
                ]
            }
        },

        'road-east': {
            id: 'road-east',
            type: 'travel',
            dialogue: {
                speaker: 'Narrator',
                text: 'The highway stretches before you, empty and broken. Abandoned cars rust in the sun. You see no one—living or dead.\n\nYou walk east. One foot in front of the other. 3,000 miles to go.\n\nThis is just the beginning.',
                choices: [
                    {
                        id: 'continue',
                        text: 'Continue east',
                        next: 'act1-hub'
                    }
                ]
            }
        }
    },

    /**
     * Random encounters by type
     */
    randomEncounters: {
        survivor: [
            {
                id: 'lone-survivor',
                title: 'Lone Survivor',
                description: 'A dirty, exhausted person stands at the roadside, waving weakly.',
                danger: 2,
                choices: [
                    {
                        id: 'help',
                        text: 'Stop and help',
                        consequences: { morale: 5, supplies: -5 },
                        tags: ['helpful']
                    },
                    {
                        id: 'cautious-help',
                        text: 'Approach cautiously',
                        requirements: { stats: { cunning: 45 } },
                        consequences: { morale: 3, supplies: -2 },
                        tags: ['cautious']
                    },
                    {
                        id: 'ignore',
                        text: 'Keep moving',
                        consequences: { morale: -3 },
                        tags: ['pragmatic']
                    }
                ]
            },
            {
                id: 'trader',
                title: 'Wandering Trader',
                description: 'A merchant with a pack full of goods flags you down.',
                danger: 1,
                choices: [
                    {
                        id: 'trade',
                        text: 'See what they have',
                        next: 'trade-menu'
                    },
                    {
                        id: 'talk',
                        text: 'Just talk, gather information',
                        consequences: { experience: 10 },
                        tags: ['social']
                    },
                    {
                        id: 'pass',
                        text: 'No time, keep moving',
                        tags: ['focused']
                    }
                ]
            }
        ],
        infected: [
            {
                id: 'small-horde',
                title: 'Small Horde',
                description: '4-5 infected wandering aimlessly. You could avoid them or engage.',
                danger: 4,
                choices: [
                    {
                        id: 'sneak',
                        text: 'Sneak past',
                        requirements: { stats: { cunning: 50 } },
                        consequences: { experience: 15 },
                        tags: ['stealth']
                    },
                    {
                        id: 'fight',
                        text: 'Eliminate the threat',
                        requirements: { stats: { resolve: 55 } },
                        consequences: { stats: { resolve: 3 }, experience: 30 },
                        tags: ['combat']
                    },
                    {
                        id: 'detour',
                        text: 'Take the long way around',
                        consequences: { supplies: -3 },
                        tags: ['cautious']
                    }
                ]
            }
        ],
        environment: [
            {
                id: 'storm',
                title: 'Severe Storm',
                description: 'Dark clouds gather. A major storm is coming.',
                danger: 3,
                choices: [
                    {
                        id: 'shelter',
                        text: 'Find shelter and wait it out',
                        consequences: { supplies: -2 },
                        tags: ['cautious']
                    },
                    {
                        id: 'push-through',
                        text: 'Push through the storm',
                        requirements: { stats: { resilience: 60 } },
                        consequences: { morale: -5, experience: 20 },
                        tags: ['determined']
                    }
                ]
            }
        ]
    },

    /**
     * Factions
     */
    factions: {
        'sanctuary': {
            id: 'sanctuary',
            name: 'The Sanctuary',
            description: 'A religious community offering safety in exchange for devotion.',
            base: 'salt-lake-city',
            alignment: 'lawful'
        },
        'traders': {
            id: 'traders',
            name: 'Free Traders Union',
            description: 'Merchants and survivors who value trade and cooperation.',
            base: 'denver',
            alignment: 'neutral'
        },
        'government': {
            id: 'government',
            name: 'US Government Remnant',
            description: 'What remains of the federal government, trying to restore order.',
            base: 'washington-dc',
            alignment: 'lawful'
        },
        'resistance': {
            id: 'resistance',
            name: 'The Resistance',
            description: 'Those who distrust the government and its motives.',
            base: 'multiple',
            alignment: 'chaotic'
        }
    }
};
