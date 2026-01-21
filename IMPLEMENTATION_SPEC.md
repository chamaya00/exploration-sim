# The Beyond: Weekend MVP Implementation Spec

## Overview

Build a simulation game where users create explorers, send them into a persistent fantasy world, watch their journey unfold through journal entries, and decide when to recall them. Returned explorers provide legacy bonuses for future runs.

**Core Loop:** Roll → Equip → Trial → Send → Watch → Recall or Die → Legacy

**Target:** Weekend buildable (~20-30 hours), easily extensible

-----

## Tech Stack

- **Backend:** Node.js + Express + TypeScript (deployed on Render)
- **Database:** PostgreSQL via Supabase
- **Frontend:** Next.js 14 + Tailwind CSS
- **Tick System:** node-cron (15-minute intervals)
- **Auth:** Supabase Auth (email/password or magic link)

-----

## Database Schema

```sql
-- Users (managed by Supabase Auth, but we reference them)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player legacy and progression
CREATE TABLE player_legacy (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    total_explorers INTEGER DEFAULT 0,
    total_returns INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,
    total_discoveries INTEGER DEFAULT 0,
    stat_floor_vigor INTEGER DEFAULT 1,
    stat_floor_cunning INTEGER DEFAULT 1,
    stat_floor_resolve INTEGER DEFAULT 1,
    stat_floor_fortune INTEGER DEFAULT 1,
    unlocked_specialties JSONB DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player's item collection
CREATE TABLE player_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    item_id TEXT NOT NULL,
    found_by TEXT,           -- Explorer name who found it
    found_in TEXT,           -- Region
    found_on_day INTEGER,
    is_equipped BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Explorers
CREATE TABLE explorers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,

    -- Stats (1-10)
    vigor INTEGER NOT NULL,
    cunning INTEGER NOT NULL,
    resolve INTEGER NOT NULL,
    fortune INTEGER NOT NULL,

    -- Traits
    specialty_id TEXT NOT NULL,
    personality_id TEXT NOT NULL,
    keepsake TEXT,

    -- Equipped items (JSON array of item IDs)
    equipped_items JSONB DEFAULT '[]',

    -- Current state
    status TEXT DEFAULT 'active',  -- active, returning, returned, dead
    health INTEGER DEFAULT 100,
    current_region TEXT DEFAULT 'the_gate',
    days_alive REAL DEFAULT 0,

    -- Recall state
    is_recalling BOOLEAN DEFAULT false,
    recall_days_remaining REAL DEFAULT 0,

    -- Found items during journey (JSON array)
    found_items JSONB DEFAULT '[]',

    -- Outcome
    cause_of_death TEXT,
    legacy_bonus_type TEXT,
    legacy_bonus_value TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    explorer_id UUID REFERENCES explorers(id),
    day INTEGER NOT NULL,
    tick INTEGER NOT NULL,
    entry_text TEXT NOT NULL,
    event_type TEXT,  -- quiet, discovery, danger, injury, item_found, recall, death
    is_significant BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- World state (shared across all players)
CREATE TABLE world_state (
    id TEXT PRIMARY KEY DEFAULT 'world',
    current_tick INTEGER DEFAULT 0,
    total_explorers_ever INTEGER DEFAULT 0,
    total_deaths_ever INTEGER DEFAULT 0,
    total_returns_ever INTEGER DEFAULT 0,
    discovered_secrets JSONB DEFAULT '[]',
    region_states JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- World discoveries (first-to-find credit)
CREATE TABLE world_discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_id TEXT NOT NULL,
    discovered_by_explorer TEXT,
    discovered_by_user UUID,
    discovered_on_tick INTEGER,
    region TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

-----

## Core Data Types

```typescript
// === STATS ===
interface ExplorerStats {
  vigor: number;    // 1-10: survival, health
  cunning: number;  // 1-10: discovery, traps
  resolve: number;  // 1-10: pushing through
  fortune: number;  // 1-10: lucky breaks
}

// === SPECIALTIES (starting trait) ===
interface Specialty {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare';
  unlockCondition?: string;  // For uncommon/rare
  effects: Effect[];
}

// === PERSONALITIES (from trial) ===
interface Personality {
  id: string;
  name: string;
  description: string;
  effects: Effect[];
}

// === ITEMS ===
interface Item {
  id: string;
  name: string;
  description: string;
  flavorText: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  source: 'guild' | 'found';
  consumable: boolean;
  effects: Effect[];
  journalMentions: string[];  // Templates
}

// === EFFECTS (unified system) ===
interface Effect {
  type: EffectType;
  value: number | boolean | string;
  condition?: string;  // Optional condition
}

type EffectType =
  | 'survivalBonus'      // +% survival all regions
  | 'survivalRegion'     // +% survival specific region
  | 'discoveryBonus'     // +% discovery chance
  | 'dangerAvoid'        // +% avoid danger events
  | 'escapeChance'       // +% escape when danger hits
  | 'deathDefy'          // % chance to survive fatal
  | 'travelSpeed'        // +% faster movement
  | 'itemFind'           // +% chance to find items
  | 'secretFind'         // +% chance to find secrets
  | 'restBonus';         // +% health recovery on rest

// === REGIONS ===
interface Region {
  id: string;
  name: string;
  description: string;
  dangerLevel: number;     // 1-10
  discoveryRichness: number; // 1-10
  connectedTo: string[];
  distanceFromGate: number; // For recall calculation
  secrets: Secret[];
  possibleItems: string[]; // Item IDs that can be found here
}

// === SECRETS (world discoveries) ===
interface Secret {
  id: string;
  name: string;
  description: string;
  discoveredText: string;  // Journal entry when found
  worldEffect?: string;    // What changes when discovered
}

// === EXPLORER (full state) ===
interface Explorer {
  id: string;
  userId: string;
  name: string;

  stats: ExplorerStats;
  specialtyId: string;
  personalityId: string;
  keepsake: string;
  equippedItems: string[];  // Item instance IDs

  status: 'active' | 'returning' | 'returned' | 'dead';
  health: number;
  currentRegion: string;
  daysAlive: number;

  isRecalling: boolean;
  recallDaysRemaining: number;

  foundItems: FoundItem[];  // Items found during journey

  causeOfDeath?: string;
  legacyBonusType?: string;
  legacyBonusValue?: string;
}

interface FoundItem {
  itemId: string;
  foundInRegion: string;
  foundOnDay: number;
}
```

-----

## Game Data (Constants)

### Regions (MVP: 5 regions)

```typescript
const REGIONS: Region[] = [
  {
    id: 'the_gate',
    name: 'The Gate',
    description: 'Where all journeys begin. Safe, but unremarkable.',
    dangerLevel: 1,
    discoveryRichness: 2,
    connectedTo: ['mistwood'],
    distanceFromGate: 0,
    secrets: [
      { id: 'gate_inscription', name: 'Ancient Inscription', description: 'Words carved into the gate itself...', discoveredText: '{name} traced the worn carvings on the gate. Words from before memory.' }
    ],
    possibleItems: []
  },
  {
    id: 'mistwood',
    name: 'The Mistwood',
    description: 'Dense forest shrouded in perpetual fog. Easy to get lost.',
    dangerLevel: 3,
    discoveryRichness: 5,
    connectedTo: ['the_gate', 'crystal_caves', 'the_depths'],
    distanceFromGate: 1,
    secrets: [
      { id: 'hidden_shrine', name: 'Hidden Shrine', description: 'A moss-covered shrine to something forgotten', discoveredText: '{name} pushed through the mist and found a shrine older than the trees around it.' },
      { id: 'safe_path', name: 'The Safe Path', description: 'A route through the wood that the mist cannot touch', discoveredText: '{name} noticed the fog parting along a faint trail. A path the mist fears?' }
    ],
    possibleItems: ['travelers_charm', 'fog_cloak']
  },
  {
    id: 'crystal_caves',
    name: 'Crystal Caves',
    description: 'Glittering underground passages. Beautiful and treacherous.',
    dangerLevel: 5,
    discoveryRichness: 7,
    connectedTo: ['mistwood', 'the_summit'],
    distanceFromGate: 2,
    secrets: [
      { id: 'crystal_heart', name: 'The Crystal Heart', description: 'A massive crystal that pulses with inner light', discoveredText: '{name} entered a chamber dominated by a crystal the size of a house. It was... breathing.' },
      { id: 'echo_chamber', name: 'Echo Chamber', description: 'A place where whispers never die', discoveredText: 'Voices. Not {name}\'s own. Words from explorers long gone, trapped in the stone.' }
    ],
    possibleItems: ['crystal_shard', 'glowstone', 'echo_compass']
  },
  {
    id: 'the_depths',
    name: 'The Depths',
    description: 'Ancient ruins descending into darkness. What built this place?',
    dangerLevel: 7,
    discoveryRichness: 8,
    connectedTo: ['mistwood', 'the_summit'],
    distanceFromGate: 2,
    secrets: [
      { id: 'library_remains', name: 'Library Remains', description: 'Fragments of knowledge from before', discoveredText: '{name} found shelves carved into the walls. Most empty. But not all.' },
      { id: 'the_machine', name: 'The Machine', description: 'It still works. But what does it do?', discoveredText: 'Gears turned as {name} approached. Something here still lives. Still waits.' }
    ],
    possibleItems: ['ancient_key', 'preserved_scroll', 'depth_lantern']
  },
  {
    id: 'the_summit',
    name: 'The Summit',
    description: 'The highest point. The end of all journeys, one way or another.',
    dangerLevel: 9,
    discoveryRichness: 10,
    connectedTo: ['crystal_caves', 'the_depths'],
    distanceFromGate: 3,
    secrets: [
      { id: 'sky_shrine', name: 'Sky Shrine', description: 'An altar open to the heavens', discoveredText: '{name} stood at the peak. An altar waited there, aimed at stars no map has named.' },
      { id: 'the_truth', name: 'The Truth', description: 'What the Beyond actually is', discoveredText: 'At the summit, {name} finally understood. The Beyond is not a place. It\'s a—' }
    ],
    possibleItems: ['star_fragment', 'summit_stone', 'truth_shard']
  }
];
```

### Specialties (MVP: 8)

```typescript
const SPECIALTIES: Specialty[] = [
  // Common (always available)
  {
    id: 'forager',
    name: 'Forager',
    description: 'Can find sustenance anywhere',
    rarity: 'common',
    effects: [{ type: 'survivalBonus', value: 0.15 }]
  },
  {
    id: 'scout',
    name: 'Scout',
    description: 'Moves quickly and quietly',
    rarity: 'common',
    effects: [{ type: 'dangerAvoid', value: 0.2 }, { type: 'travelSpeed', value: 0.15 }]
  },
  {
    id: 'keen_eye',
    name: 'Keen Eye',
    description: 'Notices what others miss',
    rarity: 'common',
    effects: [{ type: 'discoveryBonus', value: 0.2 }, { type: 'secretFind', value: 0.15 }]
  },
  {
    id: 'thick_skin',
    name: 'Thick Skin',
    description: 'Shrugs off minor injuries',
    rarity: 'common',
    effects: [{ type: 'survivalBonus', value: 0.1 }, { type: 'escapeChance', value: 0.15 }]
  },
  {
    id: 'lucky',
    name: 'Lucky',
    description: 'Fortune favors them',
    rarity: 'common',
    effects: [{ type: 'deathDefy', value: 0.1 }, { type: 'itemFind', value: 0.15 }]
  },

  // Uncommon (unlocked)
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Knows the safe routes',
    rarity: 'uncommon',
    unlockCondition: 'Return 3 explorers',
    effects: [{ type: 'survivalBonus', value: 0.2 }, { type: 'travelSpeed', value: 0.25 }]
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Has cheated death before',
    rarity: 'uncommon',
    unlockCondition: 'Lose 5 explorers',
    effects: [{ type: 'deathDefy', value: 0.2 }, { type: 'escapeChance', value: 0.2 }]
  },

  // Rare (unlocked)
  {
    id: 'fated',
    name: 'Fated',
    description: 'Destiny has plans for them',
    rarity: 'rare',
    unlockCondition: 'Have an explorer survive 30 days',
    effects: [{ type: 'deathDefy', value: 0.25 }, { type: 'secretFind', value: 0.3 }]
  }
];
```

### Personalities (MVP: 6)

```typescript
const PERSONALITIES: Personality[] = [
  {
    id: 'bold',
    name: 'Bold',
    description: 'Faces the unknown head-on',
    effects: [{ type: 'travelSpeed', value: 0.2 }, { type: 'dangerAvoid', value: -0.1 }]
  },
  {
    id: 'cautious',
    name: 'Cautious',
    description: 'Careful and deliberate',
    effects: [{ type: 'dangerAvoid', value: 0.2 }, { type: 'travelSpeed', value: -0.1 }]
  },
  {
    id: 'curious',
    name: 'Curious',
    description: 'Drawn to mysteries',
    effects: [{ type: 'discoveryBonus', value: 0.25 }, { type: 'dangerAvoid', value: -0.05 }]
  },
  {
    id: 'resourceful',
    name: 'Resourceful',
    description: 'Makes do with what\'s at hand',
    effects: [{ type: 'itemFind', value: 0.2 }, { type: 'survivalBonus', value: 0.1 }]
  },
  {
    id: 'steadfast',
    name: 'Steadfast',
    description: 'Endures where others falter',
    effects: [{ type: 'survivalBonus', value: 0.15 }, { type: 'restBonus', value: 0.2 }]
  },
  {
    id: 'wanderer',
    name: 'Wanderer',
    description: 'Born to roam',
    effects: [{ type: 'travelSpeed', value: 0.25 }, { type: 'discoveryBonus', value: 0.1 }]
  }
];
```

### Items (MVP: 15)

```typescript
const ITEMS: Item[] = [
  // === GUILD SUPPLIES (always available) ===
  {
    id: 'rations',
    name: 'Rations',
    description: 'Three days of food',
    flavorText: 'Not tasty, but reliable',
    rarity: 'common',
    source: 'guild',
    consumable: true,
    effects: [{ type: 'survivalBonus', value: 0.15 }],
    journalMentions: ['{name} ate sparingly from their rations.']
  },
  {
    id: 'rope',
    name: 'Rope',
    description: 'Fifty feet of strong hemp',
    flavorText: 'A hundred uses',
    rarity: 'common',
    source: 'guild',
    consumable: false,
    effects: [{ type: 'escapeChance', value: 0.15 }, { type: 'survivalRegion', value: 0.2, condition: 'crystal_caves' }],
    journalMentions: ['The rope held firm.', '{name} coiled the rope carefully.']
  },
  {
    id: 'lantern',
    name: 'Lantern',
    description: 'Oil lamp with spare fuel',
    flavorText: 'Push back the dark',
    rarity: 'common',
    source: 'guild',
    consumable: false,
    effects: [{ type: 'survivalRegion', value: 0.25, condition: 'crystal_caves' }, { type: 'survivalRegion', value: 0.25, condition: 'the_depths' }],
    journalMentions: ['The lantern flickered but held.', '{name} checked the oil. Enough for now.']
  },
  {
    id: 'healing_salve',
    name: 'Healing Salve',
    description: 'Numbs pain, prevents infection',
    flavorText: 'Burns, then bliss',
    rarity: 'common',
    source: 'guild',
    consumable: true,
    effects: [{ type: 'deathDefy', value: 0.2 }],
    journalMentions: ['{name} applied the salve, wincing.', 'The wound was bad, but the salve helped.']
  },
  {
    id: 'warm_cloak',
    name: 'Warm Cloak',
    description: 'Keeps out cold and rain',
    flavorText: 'Smells like campfires',
    rarity: 'common',
    source: 'guild',
    consumable: false,
    effects: [{ type: 'survivalBonus', value: 0.1 }, { type: 'restBonus', value: 0.15 }],
    journalMentions: ['{name} pulled the cloak tighter.', 'Under the cloak, almost warm.']
  },
  {
    id: 'compass',
    name: 'Compass',
    description: 'Always points home',
    flavorText: 'When lost, trust the needle',
    rarity: 'common',
    source: 'guild',
    consumable: false,
    effects: [{ type: 'travelSpeed', value: 0.15 }, { type: 'dangerAvoid', value: 0.1 }],
    journalMentions: ['{name} checked the compass. Still pointing home.']
  },

  // === FOUND ITEMS (discovered in the world) ===
  {
    id: 'travelers_charm',
    name: 'Traveler\'s Charm',
    description: 'A worn token from a previous explorer',
    flavorText: 'Someone carried this far',
    rarity: 'uncommon',
    source: 'found',
    consumable: false,
    effects: [{ type: 'survivalBonus', value: 0.1 }, { type: 'travelSpeed', value: 0.1 }],
    journalMentions: ['{name} rubbed the charm for luck.']
  },
  {
    id: 'fog_cloak',
    name: 'Fog Cloak',
    description: 'Woven from the mist itself',
    flavorText: 'Hard to see, hard to find',
    rarity: 'rare',
    source: 'found',
    consumable: false,
    effects: [{ type: 'dangerAvoid', value: 0.3 }, { type: 'survivalRegion', value: 0.3, condition: 'mistwood' }],
    journalMentions: ['The fog cloak made {name} nearly invisible.']
  },
  {
    id: 'crystal_shard',
    name: 'Crystal Shard',
    description: 'Glows faintly in darkness',
    flavorText: 'Warm to the touch',
    rarity: 'uncommon',
    source: 'found',
    consumable: false,
    effects: [{ type: 'discoveryBonus', value: 0.15 }, { type: 'survivalRegion', value: 0.2, condition: 'crystal_caves' }],
    journalMentions: ['The crystal shard pulsed gently.']
  },
  {
    id: 'glowstone',
    name: 'Glowstone',
    description: 'Never needs fuel, never dims',
    flavorText: 'What powers it?',
    rarity: 'rare',
    source: 'found',
    consumable: false,
    effects: [{ type: 'survivalRegion', value: 0.35, condition: 'crystal_caves' }, { type: 'survivalRegion', value: 0.35, condition: 'the_depths' }, { type: 'discoveryBonus', value: 0.1 }],
    journalMentions: ['The glowstone lit the way.']
  },
  {
    id: 'echo_compass',
    name: 'Echo Compass',
    description: 'Points toward secrets',
    flavorText: 'It knows things',
    rarity: 'rare',
    source: 'found',
    consumable: false,
    effects: [{ type: 'secretFind', value: 0.35 }, { type: 'discoveryBonus', value: 0.2 }],
    journalMentions: ['The echo compass spun, then stopped. That way.']
  },
  {
    id: 'ancient_key',
    name: 'Ancient Key',
    description: 'Opens... something',
    flavorText: 'Heavy with purpose',
    rarity: 'rare',
    source: 'found',
    consumable: false,
    effects: [{ type: 'secretFind', value: 0.25 }, { type: 'survivalRegion', value: 0.2, condition: 'the_depths' }],
    journalMentions: ['The key grew warm as {name} approached the door.']
  },
  {
    id: 'depth_lantern',
    name: 'Depth Lantern',
    description: 'Burns with blue flame',
    flavorText: 'The flame fears nothing',
    rarity: 'rare',
    source: 'found',
    consumable: false,
    effects: [{ type: 'survivalRegion', value: 0.4, condition: 'the_depths' }, { type: 'dangerAvoid', value: 0.15 }],
    journalMentions: ['The blue flame pushed back even the deepest dark.']
  },
  {
    id: 'star_fragment',
    name: 'Star Fragment',
    description: 'Fallen from above',
    flavorText: 'Cold as the void',
    rarity: 'legendary',
    source: 'found',
    consumable: false,
    effects: [{ type: 'deathDefy', value: 0.3 }, { type: 'secretFind', value: 0.3 }, { type: 'survivalBonus', value: 0.15 }],
    journalMentions: ['The star fragment hummed with distant light.']
  },
  {
    id: 'summit_stone',
    name: 'Summit Stone',
    description: 'From the very peak',
    flavorText: 'It remembers the sky',
    rarity: 'legendary',
    source: 'found',
    consumable: false,
    effects: [{ type: 'survivalBonus', value: 0.25 }, { type: 'travelSpeed', value: 0.2 }, { type: 'discoveryBonus', value: 0.2 }],
    journalMentions: ['{name} held the summit stone. It felt like home.']
  }
];
```

### Keepsakes (MVP: 6)

```typescript
const KEEPSAKES = [
  { id: 'letter', name: 'A letter never sent', deathMention: '{name}\'s hand found the letter in their pocket.' },
  { id: 'ring', name: 'A ring that no longer fits', deathMention: '{name} touched the ring one last time.' },
  { id: 'drawing', name: 'A child\'s drawing', deathMention: 'The drawing was creased from being held so often.' },
  { id: 'seeds', name: 'Seeds from the old garden', deathMention: 'The seeds would never grow now.' },
  { id: 'coin', name: 'A lucky coin', deathMention: '{name} flipped the coin. It landed on edge.' },
  { id: 'nothing', name: 'Nothing - they left it all behind', deathMention: 'They had come with nothing. They left with nothing.' }
];
```

### Trial Scenarios (MVP: 6, pick 3)

```typescript
const TRIAL_SCENARIOS = [
  {
    id: 'river',
    scene: 'You stand before a river, too wide to cross. The water is dark and fast.',
    options: [
      { text: 'Search for a crossing upstream', personality: 'cautious', statBonus: { cunning: 1 } },
      { text: 'Build a raft from fallen wood', personality: 'resourceful', statBonus: { vigor: 1 } },
      { text: 'Wade in and trust your strength', personality: 'bold', statBonus: { resolve: 1 } },
      { text: 'Wait for conditions to change', personality: 'steadfast', statBonus: { fortune: 1 } }
    ]
  },
  {
    id: 'sound',
    scene: 'A sound echoes from deeper in. It could be danger. It could be something wonderful.',
    options: [
      { text: 'Move toward it carefully', personality: 'curious', statBonus: { cunning: 1 } },
      { text: 'Call out a greeting', personality: 'bold', statBonus: { resolve: 1 } },
      { text: 'Hide and observe', personality: 'cautious', statBonus: { fortune: 1 } },
      { text: 'Mark the spot and move on', personality: 'wanderer', statBonus: { vigor: 1 } }
    ]
  },
  {
    id: 'creature',
    scene: 'A small creature lies in your path, injured. It watches you with frightened eyes.',
    options: [
      { text: 'Stop to help it', personality: 'steadfast', statBonus: { resolve: 1 } },
      { text: 'Leave food and move on', personality: 'resourceful', statBonus: { fortune: 1 } },
      { text: 'Study it carefully', personality: 'curious', statBonus: { cunning: 1 } },
      { text: 'Keep walking', personality: 'wanderer', statBonus: { vigor: 1 } }
    ]
  },
  {
    id: 'door',
    scene: 'A door in the hillside, half-hidden by vines. It\'s locked.',
    options: [
      { text: 'Search for a key', personality: 'curious', statBonus: { cunning: 1 } },
      { text: 'Try to force it open', personality: 'bold', statBonus: { vigor: 1 } },
      { text: 'Mark it and return later', personality: 'cautious', statBonus: { resolve: 1 } },
      { text: 'Leave it—some doors stay closed', personality: 'wanderer', statBonus: { fortune: 1 } }
    ]
  },
  {
    id: 'storm',
    scene: 'Dark clouds gather. A storm is coming, and there\'s no shelter in sight.',
    options: [
      { text: 'Push forward before it hits', personality: 'bold', statBonus: { vigor: 1 } },
      { text: 'Build a shelter quickly', personality: 'resourceful', statBonus: { cunning: 1 } },
      { text: 'Find low ground and wait', personality: 'cautious', statBonus: { resolve: 1 } },
      { text: 'Keep moving, storms pass', personality: 'steadfast', statBonus: { fortune: 1 } }
    ]
  },
  {
    id: 'light',
    scene: 'A faint light glows in the distance, off the path. Night is falling.',
    options: [
      { text: 'Investigate the light', personality: 'curious', statBonus: { cunning: 1 } },
      { text: 'Stay on the path', personality: 'cautious', statBonus: { vigor: 1 } },
      { text: 'Make camp and watch', personality: 'steadfast', statBonus: { resolve: 1 } },
      { text: 'Signal back', personality: 'bold', statBonus: { fortune: 1 } }
    ]
  }
];
```

-----

## Simulation Engine

### Tick Configuration

```typescript
const TICK_CONFIG = {
  intervalMinutes: 15,           // Real-time between ticks
  worldDaysPerTick: 0.25,        // 4 ticks = 1 world day
  journalChance: 0.7,            // 70% chance of journal entry per tick
  significantEventChance: 0.15,  // 15% chance of major event
};
```

### Main Tick Function

```typescript
async function runSimulationTick(): Promise<void> {
  const world = await getWorldState();
  world.current_tick += 1;

  // Get all active/returning explorers
  const explorers = await getActiveExplorers();

  for (const explorer of explorers) {
    if (explorer.status === 'returning') {
      await processReturningExplorer(explorer, world);
    } else {
      await processActiveExplorer(explorer, world);
    }
  }

  await saveWorldState(world);
}

async function processActiveExplorer(explorer: Explorer, world: WorldState): Promise<void> {
  const region = REGIONS.find(r => r.id === explorer.currentRegion)!;

  // Calculate modifiers from stats, specialty, personality, items
  const mods = calculateModifiers(explorer);

  // 1. Survival check
  const survivalRoll = Math.random();
  const survivalThreshold = calculateSurvivalChance(explorer, region, mods);

  if (survivalRoll > survivalThreshold) {
    // Danger event
    const dangerResult = processDangerEvent(explorer, region, mods);

    if (dangerResult.died) {
      await processExplorerDeath(explorer, dangerResult.cause, world);
      return;
    }

    if (dangerResult.journalEntry) {
      await createJournalEntry(explorer, dangerResult.journalEntry, 'danger');
    }
  }

  // 2. Discovery check
  const discoveryRoll = Math.random();
  const discoveryThreshold = 0.1 + (mods.discoveryBonus || 0);

  if (discoveryRoll < discoveryThreshold) {
    const discovery = processDiscovery(explorer, region, world, mods);
    if (discovery) {
      await createJournalEntry(explorer, discovery.journalEntry, discovery.type);
    }
  }

  // 3. Movement check (only if not just arrived)
  const moveRoll = Math.random();
  const moveThreshold = 0.15 + (mods.travelSpeed || 0);

  if (moveRoll < moveThreshold && explorer.daysAlive > 1) {
    const moved = processMovement(explorer, region, mods);
    if (moved) {
      await createJournalEntry(explorer, moved.journalEntry, 'movement');
    }
  }

  // 4. Generate journal entry (if nothing significant happened)
  if (Math.random() < TICK_CONFIG.journalChance) {
    const quietEntry = generateQuietJournalEntry(explorer, region);
    await createJournalEntry(explorer, quietEntry, 'quiet');
  }

  // 5. Update explorer
  explorer.daysAlive += TICK_CONFIG.worldDaysPerTick;
  explorer.health = Math.min(100, explorer.health + (mods.restBonus || 0) * 5);

  await saveExplorer(explorer);
}

async function processReturningExplorer(explorer: Explorer, world: WorldState): Promise<void> {
  const mods = calculateModifiers(explorer);

  // Return journey is dangerous
  const survivalRoll = Math.random();
  const baseReturnSurvival = 0.85 + (mods.survivalBonus || 0);

  if (survivalRoll > baseReturnSurvival) {
    // Danger during return
    if (Math.random() < 0.3) {
      // Fatal
      await processExplorerDeath(explorer, 'lost_returning', world);
      return;
    } else {
      // Delayed
      explorer.recallDaysRemaining += 0.5;
      explorer.health -= 15;

      // Might lose an item
      if (Math.random() < 0.2 && explorer.foundItems.length > 0) {
        const lostItem = explorer.foundItems.pop();
        await createJournalEntry(explorer, `The ${ITEMS.find(i => i.id === lostItem?.itemId)?.name} was lost in the chaos.`, 'item_lost');
      }
    }
  }

  // Progress toward home
  explorer.recallDaysRemaining -= TICK_CONFIG.worldDaysPerTick;
  explorer.daysAlive += TICK_CONFIG.worldDaysPerTick;

  if (explorer.recallDaysRemaining <= 0) {
    await processExplorerReturn(explorer, world);
    return;
  }

  await createJournalEntry(explorer, generateReturnJournalEntry(explorer), 'returning');
  await saveExplorer(explorer);
}
```

### Helper Functions

```typescript
function calculateModifiers(explorer: Explorer): Modifiers {
  const mods: Modifiers = {
    survivalBonus: 0,
    discoveryBonus: 0,
    dangerAvoid: 0,
    escapeChance: 0,
    deathDefy: 0,
    travelSpeed: 0,
    itemFind: 0,
    secretFind: 0,
    restBonus: 0,
  };

  // Stats contribution
  mods.survivalBonus += (explorer.stats.vigor - 5) * 0.02;
  mods.discoveryBonus += (explorer.stats.cunning - 5) * 0.02;
  mods.escapeChance += (explorer.stats.resolve - 5) * 0.02;
  mods.deathDefy += (explorer.stats.fortune - 5) * 0.015;
  mods.itemFind += (explorer.stats.fortune - 5) * 0.02;

  // Specialty
  const specialty = SPECIALTIES.find(s => s.id === explorer.specialtyId);
  if (specialty) {
    applyEffects(mods, specialty.effects);
  }

  // Personality
  const personality = PERSONALITIES.find(p => p.id === explorer.personalityId);
  if (personality) {
    applyEffects(mods, personality.effects);
  }

  // Items
  for (const itemInstanceId of explorer.equippedItems) {
    const playerItem = getPlayerItem(itemInstanceId);
    const item = ITEMS.find(i => i.id === playerItem.itemId);
    if (item) {
      applyEffects(mods, item.effects, explorer.currentRegion);
    }
  }

  return mods;
}

function calculateSurvivalChance(explorer: Explorer, region: Region, mods: Modifiers): number {
  // Base survival chance based on region danger
  const baseSurvival = 1 - (region.dangerLevel * 0.08);

  // Apply modifiers
  let survival = baseSurvival;
  survival += mods.survivalBonus || 0;
  survival += mods.dangerAvoid || 0;

  // Health penalty
  if (explorer.health < 30) {
    survival -= 0.15;
  } else if (explorer.health < 50) {
    survival -= 0.05;
  }

  return Math.max(0.1, Math.min(0.98, survival));
}

function processDangerEvent(explorer: Explorer, region: Region, mods: Modifiers): DangerResult {
  // Escape check
  if (Math.random() < (mods.escapeChance || 0)) {
    return {
      died: false,
      journalEntry: generateEscapeEntry(explorer, region)
    };
  }

  // Death check
  const deathChance = 0.25 - (mods.deathDefy || 0);
  if (Math.random() < deathChance) {
    return {
      died: true,
      cause: generateDeathCause(region)
    };
  }

  // Injury
  explorer.health -= 20 + Math.floor(Math.random() * 20);

  if (explorer.health <= 0) {
    return {
      died: true,
      cause: 'injuries'
    };
  }

  return {
    died: false,
    journalEntry: generateInjuryEntry(explorer, region)
  };
}

function processDiscovery(explorer: Explorer, region: Region, world: WorldState, mods: Modifiers): DiscoveryResult | null {
  // Check for secret discovery first
  const secretRoll = Math.random();
  const secretThreshold = 0.05 + (mods.secretFind || 0);

  if (secretRoll < secretThreshold) {
    const undiscoveredSecrets = region.secrets.filter(s => !world.discovered_secrets.includes(s.id));

    if (undiscoveredSecrets.length > 0) {
      const secret = undiscoveredSecrets[Math.floor(Math.random() * undiscoveredSecrets.length)];
      world.discovered_secrets.push(secret.id);

      // Record first-to-find
      await recordWorldDiscovery(secret.id, explorer);

      return {
        type: 'secret',
        journalEntry: secret.discoveredText.replace('{name}', explorer.name)
      };
    }
  }

  // Check for item discovery
  const itemRoll = Math.random();
  const itemThreshold = 0.1 + (mods.itemFind || 0);

  if (itemRoll < itemThreshold && region.possibleItems.length > 0) {
    const itemId = region.possibleItems[Math.floor(Math.random() * region.possibleItems.length)];
    const item = ITEMS.find(i => i.id === itemId);

    if (item) {
      explorer.foundItems.push({
        itemId: item.id,
        foundInRegion: region.id,
        foundOnDay: Math.floor(explorer.daysAlive)
      });

      return {
        type: 'item',
        journalEntry: `${explorer.name} found something: ${item.name}. ${item.flavorText}`
      };
    }
  }

  // Minor discovery
  return {
    type: 'minor',
    journalEntry: generateMinorDiscoveryEntry(explorer, region)
  };
}

function processMovement(explorer: Explorer, region: Region, mods: Modifiers): MovementResult | null {
  const connectedRegions = region.connectedTo;
  if (connectedRegions.length === 0) return null;

  // Bias toward progression (away from gate)
  const currentDistance = region.distanceFromGate;
  const forwardRegions = connectedRegions.filter(r => {
    const target = REGIONS.find(reg => reg.id === r);
    return target && target.distanceFromGate > currentDistance;
  });

  // 70% chance to move forward if possible
  let targetRegionId: string;
  if (forwardRegions.length > 0 && Math.random() < 0.7) {
    targetRegionId = forwardRegions[Math.floor(Math.random() * forwardRegions.length)];
  } else {
    targetRegionId = connectedRegions[Math.floor(Math.random() * connectedRegions.length)];
  }

  const targetRegion = REGIONS.find(r => r.id === targetRegionId);
  if (!targetRegion) return null;

  explorer.currentRegion = targetRegionId;

  return {
    journalEntry: `${explorer.name} traveled to ${targetRegion.name}. ${targetRegion.description}`
  };
}
```

### Journal Entry Templates

```typescript
const QUIET_JOURNAL_TEMPLATES = {
  the_gate: [
    '{name} rested near the gate, watching others prepare to leave.',
    'The gate hummed quietly. {name} wondered what lay beyond.',
    '{name} checked their supplies one more time.'
  ],
  mistwood: [
    'The mist swirled around {name}. Everything looked the same.',
    '{name} followed the sound of water through the fog.',
    'Something moved in the mist. {name} waited. Nothing.',
    'The trees here were ancient. {name} felt watched.'
  ],
  crystal_caves: [
    'Light danced on the cave walls. {name} paused to watch.',
    'The crystals sang softly when {name} passed.',
    'Deeper into the caves. The air grew cold.',
    '{name} found a chamber of perfect silence.'
  ],
  the_depths: [
    'The ruins stretched endlessly downward.',
    '{name} found marks on the wall. Someone was here before.',
    'The machine sounds were louder here. Closer.',
    'Darkness pressed in from all sides. {name} kept moving.'
  ],
  the_summit: [
    'The wind cut through everything.',
    '{name} could see forever from here.',
    'The sky was different at the summit. Wrong, somehow.',
    'So few had made it this far. {name} understood why.'
  ]
};

const DEATH_TEMPLATES = {
  mistwood: ['{name} wandered too deep into the mist.', 'The mist took {name}.'],
  crystal_caves: ['The cave collapsed. {name} didn\'t escape.', '{name} fell into the darkness.'],
  the_depths: ['Something in the depths found {name}.', 'The machines finally noticed {name}.'],
  the_summit: ['The summit claimed {name}.', 'The cold was too much. {name} stopped moving.'],
  lost_returning: ['{name} never made it home.', 'The way back was harder than {name} knew.'],
  injuries: ['{name}\'s wounds were too severe.']
};

const RETURN_TEMPLATES = [
  '{name} pressed on toward the gate. Not far now.',
  'Home. The word kept {name} moving.',
  'Every step brought {name} closer to safety.',
  '{name} could almost see the gate through the trees.'
];

function generateQuietJournalEntry(explorer: Explorer, region: Region): string {
  const templates = QUIET_JOURNAL_TEMPLATES[region.id] || QUIET_JOURNAL_TEMPLATES.mistwood;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{name}', explorer.name);
}

function generateDeathEntry(explorer: Explorer, cause: string): string {
  const keepsake = KEEPSAKES.find(k => k.id === explorer.keepsake);
  const deathTemplate = DEATH_TEMPLATES[cause] || DEATH_TEMPLATES[explorer.currentRegion] || [`${explorer.name} did not survive.`];
  const template = deathTemplate[Math.floor(Math.random() * deathTemplate.length)];

  let entry = template.replace('{name}', explorer.name);

  if (keepsake) {
    entry += '\n\n' + keepsake.deathMention.replace('{name}', explorer.name);
  }

  return entry;
}
```

-----

## API Endpoints

```typescript
// === CHARACTER CREATION ===

// Roll a new explorer (stats + specialty)
POST /api/explorers/roll
Request: { userId: string }
Response: {
  stats: { vigor, cunning, resolve, fortune },
  specialty: Specialty,
  canReroll: boolean,
  rerollCost: number
}

// Complete explorer creation
POST /api/explorers/create
Request: {
  userId: string,
  name: string,
  stats: ExplorerStats,
  specialtyId: string,
  personalityId: string,
  keepsake: string,
  equippedItems: string[]  // Player item instance IDs
}
Response: { explorer: Explorer }

// Get trial scenarios
GET /api/trial/scenarios
Response: { scenarios: TrialScenario[] }  // Returns 3 random

// Submit trial answers, get personality
POST /api/trial/complete
Request: { answers: { scenarioId: string, optionIndex: number }[] }
Response: { personalityId: string, statBonuses: Partial<ExplorerStats> }


// === EXPLORER STATE ===

// Get explorer status
GET /api/explorers/:id
Response: { explorer: Explorer, journal: JournalEntry[] }

// Initiate recall
POST /api/explorers/:id/recall
Response: {
  success: boolean,
  estimatedDays: number,
  survivalChance: number
}

// Get all user's explorers
GET /api/users/:userId/explorers
Response: {
  active: Explorer[],
  returned: Explorer[],
  dead: Explorer[]
}


// === PLAYER DATA ===

// Get player legacy and inventory
GET /api/users/:userId/legacy
Response: {
  legacy: PlayerLegacy,
  items: PlayerItem[],
  unlockedSpecialties: Specialty[]
}

// Get available guild items
GET /api/items/guild
Response: { items: Item[] }


// === WORLD STATE ===

// Get world status
GET /api/world
Response: {
  currentTick: number,
  totalExplorers: number,
  totalDeaths: number,
  totalReturns: number,
  discoveries: WorldDiscovery[],
  regionStats: { regionId: string, currentExplorers: number }[]
}
```

-----

## Frontend Pages

### 1. Home / Dashboard

- Active explorer status (if any)
- Quick stats: total explorers, returns, deaths
- [Create Explorer] button (if no active)
- Recent world discoveries

### 2. Create Explorer Flow

**Step 1: Roll Stats**

- Display rolled stats (vigor/cunning/resolve/fortune bars)
- Display specialty with description
- [Accept] or [Reroll] buttons

**Step 2: Equip Items**

- Left column: Your collection (rare items from returns)
- Right column: Guild supplies (always available)
- Select 2 total
- Warning if equipping rare items (can be lost)

**Step 3: The Trial**

- 3 sequential scenario cards
- Each shows scene + 4 options
- Progress indicator

**Step 4: Final Details**

- Name input
- Keepsake selection
- Summary of build
- [Send Into The Beyond] button

### 3. Explorer View (Active)

- Name, day count, current region
- Health bar
- Carrying: equipped items + found items
- Recent journal entries (scrollable)
- [Recall] button with survival estimate
- Next tick countdown

### 4. Explorer View (Returning)

- Same as active but with return progress
- Days remaining
- Danger warnings

### 5. Explorer View (Memorial)

- Final stats, days survived
- Full journal
- Cause of death
- Items lost
- [Send Another] button

### 6. Explorer View (Returned)

- Success celebration
- Items brought back (added to collection)
- Legacy bonus earned
- [Send Another] button

### 7. Your Explorers

- Tabs: Active | Returned | Lost
- List view with key stats
- Click to view details

### 8. World Map

- Simple region visualization
- Discovery count per region
- Current explorer distribution
- First-to-find credits

-----

## File Structure

```
/the-beyond
├── /backend
│   ├── /src
│   │   ├── /data
│   │   │   ├── regions.ts
│   │   │   ├── specialties.ts
│   │   │   ├── personalities.ts
│   │   │   ├── items.ts
│   │   │   ├── keepsakes.ts
│   │   │   ├── trials.ts
│   │   │   └── journal-templates.ts
│   │   ├── /db
│   │   │   ├── schema.sql
│   │   │   ├── supabase.ts          # Supabase client setup
│   │   │   └── queries.ts
│   │   ├── /simulation
│   │   │   ├── tick.ts
│   │   │   ├── survival.ts
│   │   │   ├── discovery.ts
│   │   │   ├── movement.ts
│   │   │   ├── death.ts
│   │   │   ├── return.ts
│   │   │   └── modifiers.ts
│   │   ├── /api
│   │   │   ├── explorers.ts
│   │   │   ├── users.ts
│   │   │   ├── world.ts
│   │   │   ├── trial.ts
│   │   │   └── items.ts
│   │   ├── /jobs
│   │   │   └── tick-scheduler.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── /frontend
│   ├── /src
│   │   ├── /app
│   │   │   ├── page.tsx                 # Dashboard
│   │   │   ├── /create
│   │   │   │   ├── page.tsx             # Create flow
│   │   │   │   ├── roll.tsx
│   │   │   │   ├── equip.tsx
│   │   │   │   ├── trial.tsx
│   │   │   │   └── finalize.tsx
│   │   │   ├── /explorer
│   │   │   │   └── [id]/page.tsx        # Explorer view
│   │   │   ├── /explorers
│   │   │   │   └── page.tsx             # Your explorers list
│   │   │   └── /world
│   │   │       └── page.tsx             # World map
│   │   ├── /components
│   │   │   ├── StatBar.tsx
│   │   │   ├── ItemCard.tsx
│   │   │   ├── JournalEntry.tsx
│   │   │   ├── RegionMap.tsx
│   │   │   ├── TrialScenario.tsx
│   │   │   └── ExplorerCard.tsx
│   │   └── /lib
│   │       ├── api.ts
│   │       └── types.ts
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

-----

## Weekend Build Priority

### Day 1: Core Backend (8-10 hours)

1. ☐ Supabase project setup + schema deployment
1. ☐ Supabase Auth configuration
1. ☐ Data files (regions, items, etc.)
1. ☐ Roll/create explorer endpoints
1. ☐ Basic tick simulation (survival + journal)
1. ☐ Tick scheduler (15-min cron)

### Day 2: Frontend + Polish (8-10 hours)

1. ☐ Dashboard page
1. ☐ Create explorer flow (4 steps)
1. ☐ Explorer view page
1. ☐ Recall functionality
1. ☐ Your explorers list
1. ☐ Basic styling

### Day 3: Complete Loop (4-6 hours)

1. ☐ Death handling + memorial
1. ☐ Return handling + legacy bonus
1. ☐ Item discovery + collection
1. ☐ World state + discoveries
1. ☐ Testing full loop

-----

## Extension Points (Post-MVP)

### Easy Adds

- More regions (just add to data file)
- More items, specialties, personalities
- More trial scenarios
- More journal templates
- Email notifications on death/return

### Medium Adds

- Explorer encounters (two explorers meet)
- World events (affect all explorers)
- Achievements system
- Leaderboards
- Social sharing

### Larger Features

- Multiple active explorers
- Guilds/parties
- Seasonal worlds
- AI-generated journal entries
- Mobile app

-----

## Testing Checklist

### Character Creation

- [ ] Can roll stats
- [ ] Reroll works
- [ ] Can select 2 items
- [ ] Warning when selecting rare items
- [ ] Trial scenarios work
- [ ] Personality determined correctly
- [ ] Stat bonuses applied
- [ ] Can name and create explorer
- [ ] Items marked as equipped

### Simulation

- [ ] Tick runs every 15 minutes
- [ ] Health/survival calculated correctly
- [ ] Journal entries generated
- [ ] Movement between regions works
- [ ] Items affect modifiers
- [ ] Item discovery works
- [ ] Secret discovery works
- [ ] Death handled correctly
- [ ] Memorial created

### Recall

- [ ] Can initiate recall
- [ ] Return journey simulated
- [ ] Items can be lost during return
- [ ] Successful return handled
- [ ] Items added to collection
- [ ] Legacy bonus calculated

### Legacy

- [ ] Stat floors affect new rolls
- [ ] Unlocked specialties appear
- [ ] Region bonuses apply
- [ ] Items available in collection

-----

## Deployment & Infrastructure

### Supabase Setup

1. **Create a Supabase Project:**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and API keys

2. **Run Database Migrations:**
   - Navigate to SQL Editor in Supabase dashboard
   - Copy and paste the schema from the Database Schema section
   - Execute to create tables

3. **Configure Row Level Security (RLS):**
   - Enable RLS on all tables
   - Add policies for user access:
     ```sql
     -- Example: Users can only access their own data
     CREATE POLICY "Users can read own legacy"
       ON player_legacy FOR SELECT
       USING (auth.uid() = user_id);

     CREATE POLICY "Users can read own explorers"
       ON explorers FOR SELECT
       USING (auth.uid() = user_id);
     ```

4. **Set up Supabase Auth:**
   - Configure email provider in Authentication settings
   - Optional: Set up magic link authentication
   - Configure redirect URLs for your domain

### Render Deployment

1. **Prepare Your Repository:**
   - Ensure all code is pushed to GitHub
   - Add a `render.yaml` file (optional) for configuration:
     ```yaml
     services:
       - type: web
         name: the-beyond-backend
         env: node
         buildCommand: cd backend && npm install && npm run build
         startCommand: cd backend && npm start
         envVars:
           - key: SUPABASE_URL
             sync: false
           - key: SUPABASE_ANON_KEY
             sync: false
           - key: SUPABASE_SERVICE_KEY
             sync: false
     ```

2. **Create Render Service:**
   - Go to https://render.com
   - Create a new Web Service
   - Connect your GitHub repository
   - Select the backend directory
   - Set build command: `cd backend && npm install && npm run build`
   - Set start command: `cd backend && npm start`

3. **Configure Environment Variables:**
   - Add all Supabase credentials
   - Set NODE_ENV to 'production'
   - Configure PORT (Render provides this automatically)

4. **Deploy Frontend:**
   - Deploy Next.js frontend to Vercel or Render
   - Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Configure API endpoint to point to Render backend

### Database Connection Example

```typescript
// backend/src/db/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Server-side client with service role for admin operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// For user-scoped operations, use the anon key with user JWT
export const createUserClient = (userToken: string) => {
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  });
};
```

-----

## Quick Start Commands

```bash
# Backend
cd backend
npm init -y
npm install express typescript ts-node @types/node @types/express @supabase/supabase-js node-cron dotenv
npm install -D nodemon
npx tsc --init

# Create .env file
cat > .env << EOF
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3001
EOF

# Frontend
cd frontend
npx create-next-app@latest . --typescript --tailwind --app
npm install lucide-react @supabase/supabase-js

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF

# Run locally
cd backend && npm run dev
cd frontend && npm run dev

# Deploy to Render
# 1. Push code to GitHub
# 2. Create new Web Service on Render
# 3. Connect your repository
# 4. Set environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
# 5. Deploy
```

-----

*This spec is designed to be self-contained. Copy into Claude Code and build section by section.*
