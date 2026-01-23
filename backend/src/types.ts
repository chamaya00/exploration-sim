// === STATS ===
export interface ExplorerStats {
  vigor: number;    // 1-10: survival, health
  cunning: number;  // 1-10: discovery, traps
  resolve: number;  // 1-10: pushing through
  fortune: number;  // 1-10: lucky breaks
}

// === EFFECTS (unified system) ===
export type EffectType =
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

export interface Effect {
  type: EffectType;
  value: number | boolean | string;
  condition?: string;  // Optional condition
}

// === SPECIALTIES (starting trait) ===
export interface Specialty {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare';
  unlockCondition?: string;  // For uncommon/rare
  effects: Effect[];
}

// === PERSONALITIES (from trial) ===
export interface Personality {
  id: string;
  name: string;
  description: string;
  effects: Effect[];
}

// === ITEMS ===
export interface Item {
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

// === SECRETS (world discoveries) ===
export interface Secret {
  id: string;
  name: string;
  description: string;
  discoveredText: string;  // Journal entry when found
  worldEffect?: string;    // What changes when discovered
}

// === REGIONS ===
export interface Region {
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

// === KEEPSAKES ===
export interface Keepsake {
  id: string;
  name: string;
  deathMention: string;
}

// === TRIAL SCENARIOS ===
export interface TrialOption {
  text: string;
  personality: string;
  statBonus: Partial<ExplorerStats>;
}

export interface TrialScenario {
  id: string;
  scene: string;
  options: TrialOption[];
}

// === FOUND ITEM ===
export interface FoundItem {
  itemId: string;
  foundInRegion: string;
  foundOnDay: number;
}

// === EXPLORER (full state) ===
export interface Explorer {
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

  createdAt: Date;
  updatedAt: Date;
}

// === JOURNAL ENTRY ===
export interface JournalEntry {
  id: string;
  explorerId: string;
  day: number;
  tick: number;
  entryText: string;
  eventType: string;
  isSignificant: boolean;
  createdAt: Date;
}

// === PLAYER LEGACY ===
export interface PlayerLegacy {
  userId: string;
  totalExplorers: number;
  totalReturns: number;
  totalDeaths: number;
  totalDiscoveries: number;
  statFloorVigor: number;
  statFloorCunning: number;
  statFloorResolve: number;
  statFloorFortune: number;
  unlockedSpecialties: string[];
}

// === PLAYER ITEM ===
export interface PlayerItem {
  id: string;
  userId: string;
  itemId: string;
  foundBy?: string;
  foundIn?: string;
  foundOnDay?: number;
  isEquipped: boolean;
  createdAt: Date;
}

// === WORLD STATE ===
export interface WorldState {
  id: string;
  currentTick: number;
  totalExplorersEver: number;
  totalDeathsEver: number;
  totalReturnsEver: number;
  discoveredSecrets: string[];
  regionStates: Record<string, unknown>;
  updatedAt: Date;
}

// === WORLD DISCOVERY ===
export interface WorldDiscovery {
  id: string;
  secretId: string;
  discoveredByExplorer?: string;
  discoveredByUser?: string;
  discoveredOnTick?: number;
  region?: string;
  createdAt: Date;
}

// === MODIFIERS ===
export interface Modifiers {
  survivalBonus: number;
  discoveryBonus: number;
  dangerAvoid: number;
  escapeChance: number;
  deathDefy: number;
  travelSpeed: number;
  itemFind: number;
  secretFind: number;
  restBonus: number;
}

// === SIMULATION RESULTS ===
export interface DangerResult {
  died: boolean;
  cause?: string;
  journalEntry?: string;
}

export interface DiscoveryResult {
  type: 'secret' | 'item' | 'minor';
  journalEntry: string;
}

export interface MovementResult {
  journalEntry: string;
}
