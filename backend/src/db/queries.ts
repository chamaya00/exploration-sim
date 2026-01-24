import { query } from './connection';
import {
  Explorer,
  ExplorerStats,
  JournalEntry,
  PlayerLegacy,
  PlayerItem,
  WorldState,
  WorldDiscovery,
  FoundItem
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// === USER QUERIES ===

export async function createUser(email?: string): Promise<string> {
  const id = uuidv4();
  await query(
    'INSERT INTO users (id, email) VALUES ($1, $2)',
    [id, email || null]
  );
  // Initialize player legacy
  await query(
    'INSERT INTO player_legacy (user_id) VALUES ($1)',
    [id]
  );
  return id;
}

export async function getUserById(id: string): Promise<{ id: string; email?: string } | null> {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getOrCreateUser(userId?: string): Promise<string> {
  if (userId) {
    const user = await getUserById(userId);
    if (user) return user.id;
  }
  return createUser();
}

// === PLAYER LEGACY QUERIES ===

export async function getPlayerLegacy(userId: string): Promise<PlayerLegacy | null> {
  const result = await query('SELECT * FROM player_legacy WHERE user_id = $1', [userId]);
  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    userId: row.user_id,
    totalExplorers: row.total_explorers,
    totalReturns: row.total_returns,
    totalDeaths: row.total_deaths,
    totalDiscoveries: row.total_discoveries,
    statFloorVigor: row.stat_floor_vigor,
    statFloorCunning: row.stat_floor_cunning,
    statFloorResolve: row.stat_floor_resolve,
    statFloorFortune: row.stat_floor_fortune,
    unlockedSpecialties: row.unlocked_specialties || []
  };
}

export async function updatePlayerLegacy(
  userId: string,
  updates: Partial<{
    totalExplorers: number;
    totalReturns: number;
    totalDeaths: number;
    totalDiscoveries: number;
    statFloorVigor: number;
    statFloorCunning: number;
    statFloorResolve: number;
    statFloorFortune: number;
    unlockedSpecialties: string[];
  }>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (updates.totalExplorers !== undefined) {
    fields.push(`total_explorers = $${idx++}`);
    values.push(updates.totalExplorers);
  }
  if (updates.totalReturns !== undefined) {
    fields.push(`total_returns = $${idx++}`);
    values.push(updates.totalReturns);
  }
  if (updates.totalDeaths !== undefined) {
    fields.push(`total_deaths = $${idx++}`);
    values.push(updates.totalDeaths);
  }
  if (updates.totalDiscoveries !== undefined) {
    fields.push(`total_discoveries = $${idx++}`);
    values.push(updates.totalDiscoveries);
  }
  if (updates.statFloorVigor !== undefined) {
    fields.push(`stat_floor_vigor = $${idx++}`);
    values.push(updates.statFloorVigor);
  }
  if (updates.statFloorCunning !== undefined) {
    fields.push(`stat_floor_cunning = $${idx++}`);
    values.push(updates.statFloorCunning);
  }
  if (updates.statFloorResolve !== undefined) {
    fields.push(`stat_floor_resolve = $${idx++}`);
    values.push(updates.statFloorResolve);
  }
  if (updates.statFloorFortune !== undefined) {
    fields.push(`stat_floor_fortune = $${idx++}`);
    values.push(updates.statFloorFortune);
  }
  if (updates.unlockedSpecialties !== undefined) {
    fields.push(`unlocked_specialties = $${idx++}`);
    values.push(JSON.stringify(updates.unlockedSpecialties));
  }

  if (fields.length === 0) return;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  await query(
    `UPDATE player_legacy SET ${fields.join(', ')} WHERE user_id = $${idx}`,
    values
  );
}

export async function incrementLegacyStat(
  userId: string,
  stat: 'totalExplorers' | 'totalReturns' | 'totalDeaths' | 'totalDiscoveries'
): Promise<void> {
  const columnMap = {
    totalExplorers: 'total_explorers',
    totalReturns: 'total_returns',
    totalDeaths: 'total_deaths',
    totalDiscoveries: 'total_discoveries'
  };
  await query(
    `UPDATE player_legacy SET ${columnMap[stat]} = ${columnMap[stat]} + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
    [userId]
  );
}

// === PLAYER ITEMS QUERIES ===

export async function getPlayerItems(userId: string): Promise<PlayerItem[]> {
  const result = await query(
    'SELECT * FROM player_items WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    itemId: row.item_id,
    foundBy: row.found_by,
    foundIn: row.found_in,
    foundOnDay: row.found_on_day,
    isEquipped: row.is_equipped,
    createdAt: row.created_at
  }));
}

export async function addPlayerItem(
  userId: string,
  itemId: string,
  foundBy?: string,
  foundIn?: string,
  foundOnDay?: number
): Promise<string> {
  const id = uuidv4();
  await query(
    'INSERT INTO player_items (id, user_id, item_id, found_by, found_in, found_on_day) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, userId, itemId, foundBy, foundIn, foundOnDay]
  );
  return id;
}

export async function setItemEquipped(itemInstanceId: string, equipped: boolean): Promise<void> {
  await query(
    'UPDATE player_items SET is_equipped = $1 WHERE id = $2',
    [equipped, itemInstanceId]
  );
}

export async function getPlayerItemById(id: string): Promise<PlayerItem | null> {
  const result = await query('SELECT * FROM player_items WHERE id = $1', [id]);
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    itemId: row.item_id,
    foundBy: row.found_by,
    foundIn: row.found_in,
    foundOnDay: row.found_on_day,
    isEquipped: row.is_equipped,
    createdAt: row.created_at
  };
}

// === EXPLORER QUERIES ===

export async function createExplorer(data: {
  userId: string;
  name: string;
  stats: ExplorerStats;
  specialtyId: string;
  personalityId: string;
  keepsake: string;
  equippedItems: string[];
}): Promise<Explorer> {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO explorers (
      id, user_id, name, vigor, cunning, resolve, fortune,
      specialty_id, personality_id, keepsake, equipped_items
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      id, data.userId, data.name,
      data.stats.vigor, data.stats.cunning, data.stats.resolve, data.stats.fortune,
      data.specialtyId, data.personalityId, data.keepsake,
      JSON.stringify(data.equippedItems)
    ]
  );

  return rowToExplorer(result.rows[0]);
}

export async function getExplorerById(id: string): Promise<Explorer | null> {
  const result = await query('SELECT * FROM explorers WHERE id = $1', [id]);
  if (!result.rows[0]) return null;
  return rowToExplorer(result.rows[0]);
}

export async function getActiveExplorers(): Promise<Explorer[]> {
  const result = await query(
    "SELECT * FROM explorers WHERE status IN ('active', 'returning')"
  );
  return result.rows.map(rowToExplorer);
}

export async function getUserExplorers(userId: string): Promise<{
  active: Explorer[];
  returned: Explorer[];
  dead: Explorer[];
}> {
  const result = await query(
    'SELECT * FROM explorers WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );

  const explorers = result.rows.map(rowToExplorer);
  return {
    active: explorers.filter(e => e.status === 'active' || e.status === 'returning'),
    returned: explorers.filter(e => e.status === 'returned'),
    dead: explorers.filter(e => e.status === 'dead')
  };
}

export async function updateExplorer(
  id: string,
  updates: Partial<{
    status: string;
    health: number;
    currentRegion: string;
    daysAlive: number;
    isRecalling: boolean;
    recallDaysRemaining: number;
    foundItems: FoundItem[];
    causeOfDeath: string;
    legacyBonusType: string;
    legacyBonusValue: string;
  }>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (updates.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(updates.status);
  }
  if (updates.health !== undefined) {
    fields.push(`health = $${idx++}`);
    values.push(updates.health);
  }
  if (updates.currentRegion !== undefined) {
    fields.push(`current_region = $${idx++}`);
    values.push(updates.currentRegion);
  }
  if (updates.daysAlive !== undefined) {
    fields.push(`days_alive = $${idx++}`);
    values.push(updates.daysAlive);
  }
  if (updates.isRecalling !== undefined) {
    fields.push(`is_recalling = $${idx++}`);
    values.push(updates.isRecalling);
  }
  if (updates.recallDaysRemaining !== undefined) {
    fields.push(`recall_days_remaining = $${idx++}`);
    values.push(updates.recallDaysRemaining);
  }
  if (updates.foundItems !== undefined) {
    fields.push(`found_items = $${idx++}`);
    values.push(JSON.stringify(updates.foundItems));
  }
  if (updates.causeOfDeath !== undefined) {
    fields.push(`cause_of_death = $${idx++}`);
    values.push(updates.causeOfDeath);
  }
  if (updates.legacyBonusType !== undefined) {
    fields.push(`legacy_bonus_type = $${idx++}`);
    values.push(updates.legacyBonusType);
  }
  if (updates.legacyBonusValue !== undefined) {
    fields.push(`legacy_bonus_value = $${idx++}`);
    values.push(updates.legacyBonusValue);
  }

  if (fields.length === 0) return;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  await query(
    `UPDATE explorers SET ${fields.join(', ')} WHERE id = $${idx}`,
    values
  );
}

function rowToExplorer(row: any): Explorer {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    stats: {
      vigor: row.vigor,
      cunning: row.cunning,
      resolve: row.resolve,
      fortune: row.fortune
    },
    specialtyId: row.specialty_id,
    personalityId: row.personality_id,
    keepsake: row.keepsake,
    equippedItems: row.equipped_items || [],
    status: row.status,
    health: row.health,
    currentRegion: row.current_region,
    daysAlive: parseFloat(row.days_alive),
    isRecalling: row.is_recalling,
    recallDaysRemaining: parseFloat(row.recall_days_remaining),
    foundItems: row.found_items || [],
    causeOfDeath: row.cause_of_death,
    legacyBonusType: row.legacy_bonus_type,
    legacyBonusValue: row.legacy_bonus_value,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// === JOURNAL ENTRY QUERIES ===

export async function createJournalEntry(
  explorerId: string,
  day: number,
  tick: number,
  entryText: string,
  eventType: string,
  isSignificant: boolean = false
): Promise<JournalEntry> {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO journal_entries (id, explorer_id, day, tick, entry_text, event_type, is_significant)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, explorerId, day, tick, entryText, eventType, isSignificant]
  );

  return rowToJournalEntry(result.rows[0]);
}

export async function getExplorerJournal(explorerId: string, limit?: number): Promise<JournalEntry[]> {
  const result = await query(
    `SELECT * FROM journal_entries WHERE explorer_id = $1 ORDER BY created_at DESC ${limit ? `LIMIT ${limit}` : ''}`,
    [explorerId]
  );
  return result.rows.map(rowToJournalEntry);
}

function rowToJournalEntry(row: any): JournalEntry {
  return {
    id: row.id,
    explorerId: row.explorer_id,
    day: row.day,
    tick: row.tick,
    entryText: row.entry_text,
    eventType: row.event_type,
    isSignificant: row.is_significant,
    createdAt: row.created_at
  };
}

// === WORLD STATE QUERIES ===

export async function getWorldState(): Promise<WorldState> {
  const result = await query("SELECT * FROM world_state WHERE id = 'world'");
  if (!result.rows[0]) {
    // Initialize if not exists
    await query("INSERT INTO world_state (id) VALUES ('world') ON CONFLICT DO NOTHING");
    return getWorldState();
  }

  const row = result.rows[0];
  return {
    id: row.id,
    currentTick: row.current_tick,
    totalExplorersEver: row.total_explorers_ever,
    totalDeathsEver: row.total_deaths_ever,
    totalReturnsEver: row.total_returns_ever,
    discoveredSecrets: row.discovered_secrets || [],
    regionStates: row.region_states || {},
    updatedAt: row.updated_at
  };
}

export async function updateWorldState(updates: Partial<{
  currentTick: number;
  totalExplorersEver: number;
  totalDeathsEver: number;
  totalReturnsEver: number;
  discoveredSecrets: string[];
  regionStates: Record<string, unknown>;
}>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (updates.currentTick !== undefined) {
    fields.push(`current_tick = $${idx++}`);
    values.push(updates.currentTick);
  }
  if (updates.totalExplorersEver !== undefined) {
    fields.push(`total_explorers_ever = $${idx++}`);
    values.push(updates.totalExplorersEver);
  }
  if (updates.totalDeathsEver !== undefined) {
    fields.push(`total_deaths_ever = $${idx++}`);
    values.push(updates.totalDeathsEver);
  }
  if (updates.totalReturnsEver !== undefined) {
    fields.push(`total_returns_ever = $${idx++}`);
    values.push(updates.totalReturnsEver);
  }
  if (updates.discoveredSecrets !== undefined) {
    fields.push(`discovered_secrets = $${idx++}`);
    values.push(JSON.stringify(updates.discoveredSecrets));
  }
  if (updates.regionStates !== undefined) {
    fields.push(`region_states = $${idx++}`);
    values.push(JSON.stringify(updates.regionStates));
  }

  if (fields.length === 0) return;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE world_state SET ${fields.join(', ')} WHERE id = 'world'`,
    values
  );
}

export async function incrementWorldStat(
  stat: 'totalExplorersEver' | 'totalDeathsEver' | 'totalReturnsEver'
): Promise<void> {
  const columnMap = {
    totalExplorersEver: 'total_explorers_ever',
    totalDeathsEver: 'total_deaths_ever',
    totalReturnsEver: 'total_returns_ever'
  };
  await query(
    `UPDATE world_state SET ${columnMap[stat]} = ${columnMap[stat]} + 1, updated_at = CURRENT_TIMESTAMP WHERE id = 'world'`
  );
}

// === WORLD DISCOVERY QUERIES ===

export async function recordWorldDiscovery(
  secretId: string,
  explorerName: string,
  userId: string,
  tick: number,
  region: string
): Promise<WorldDiscovery> {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO world_discoveries (id, secret_id, discovered_by_explorer, discovered_by_user, discovered_on_tick, region)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, secretId, explorerName, userId, tick, region]
  );

  return {
    id: result.rows[0].id,
    secretId: result.rows[0].secret_id,
    discoveredByExplorer: result.rows[0].discovered_by_explorer,
    discoveredByUser: result.rows[0].discovered_by_user,
    discoveredOnTick: result.rows[0].discovered_on_tick,
    region: result.rows[0].region,
    createdAt: result.rows[0].created_at
  };
}

export async function getWorldDiscoveries(): Promise<WorldDiscovery[]> {
  const result = await query('SELECT * FROM world_discoveries ORDER BY created_at DESC');
  return result.rows.map(row => ({
    id: row.id,
    secretId: row.secret_id,
    discoveredByExplorer: row.discovered_by_explorer,
    discoveredByUser: row.discovered_by_user,
    discoveredOnTick: row.discovered_on_tick,
    region: row.region,
    createdAt: row.created_at
  }));
}

// === REGION STATS ===

export async function getRegionExplorerCounts(): Promise<{ regionId: string; count: number }[]> {
  const result = await query(
    `SELECT current_region, COUNT(*) as count FROM explorers
     WHERE status IN ('active', 'returning')
     GROUP BY current_region`
  );
  return result.rows.map(row => ({
    regionId: row.current_region,
    count: parseInt(row.count)
  }));
}
