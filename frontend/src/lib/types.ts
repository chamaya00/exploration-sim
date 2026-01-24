// === STATS ===
export interface ExplorerStats {
  vigor: number;
  cunning: number;
  resolve: number;
  fortune: number;
}

// === EFFECTS ===
export type EffectType =
  | 'survivalBonus'
  | 'survivalRegion'
  | 'discoveryBonus'
  | 'dangerAvoid'
  | 'escapeChance'
  | 'deathDefy'
  | 'travelSpeed'
  | 'itemFind'
  | 'secretFind'
  | 'restBonus';

export interface Effect {
  type: EffectType;
  value: number | boolean | string;
  condition?: string;
}

// === SPECIALTIES ===
export interface Specialty {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare';
  unlockCondition?: string;
  effects: Effect[];
}

// === PERSONALITIES ===
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
  journalMentions: string[];
}

// === KEEPSAKES ===
export interface Keepsake {
  id: string;
  name: string;
  deathMention: string;
}

// === TRIAL ===
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

// === EXPLORER ===
export interface Explorer {
  id: string;
  userId: string;
  name: string;
  stats: ExplorerStats;
  specialtyId: string;
  personalityId: string;
  keepsake: string;
  equippedItems: string[];
  status: 'active' | 'returning' | 'returned' | 'dead';
  health: number;
  currentRegion: string;
  daysAlive: number;
  isRecalling: boolean;
  recallDaysRemaining: number;
  foundItems: FoundItem[];
  causeOfDeath?: string;
  legacyBonusType?: string;
  legacyBonusValue?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
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
  createdAt: string;
}

// === WORLD STATE ===
export interface WorldState {
  currentTick: number;
  totalExplorersEver: number;
  totalDeathsEver: number;
  totalReturnsEver: number;
  discoveries: WorldDiscovery[];
  regionStats: { regionId: string; currentExplorers: number }[];
}

// === WORLD DISCOVERY ===
export interface WorldDiscovery {
  id: string;
  secretId: string;
  discoveredByExplorer?: string;
  discoveredByUser?: string;
  discoveredOnTick?: number;
  region?: string;
  createdAt: string;
}

// === REGION ===
export interface Region {
  id: string;
  name: string;
  description: string;
  dangerLevel: number;
  discoveryRichness: number;
  connectedTo: string[];
  distanceFromGate: number;
}

// === API RESPONSES ===
export interface RollResponse {
  stats: ExplorerStats;
  specialty: Specialty;
  canReroll: boolean;
  rerollCost: number;
}

export interface TrialResponse {
  personalityId: string;
  statBonuses: Partial<ExplorerStats>;
}

export interface RecallResponse {
  success: boolean;
  estimatedDays: number;
  survivalChance: number;
}
