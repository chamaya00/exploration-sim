-- The Beyond Database Schema
-- PostgreSQL 15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (simplified for local development)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player legacy and progression
CREATE TABLE IF NOT EXISTS player_legacy (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS player_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    found_by TEXT,           -- Explorer name who found it
    found_in TEXT,           -- Region
    found_on_day INTEGER,
    is_equipped BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Explorers
CREATE TABLE IF NOT EXISTS explorers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    explorer_id UUID REFERENCES explorers(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    tick INTEGER NOT NULL,
    entry_text TEXT NOT NULL,
    event_type TEXT,  -- quiet, discovery, danger, injury, item_found, recall, death, movement, returning
    is_significant BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- World state (shared across all players)
CREATE TABLE IF NOT EXISTS world_state (
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
CREATE TABLE IF NOT EXISTS world_discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_id TEXT NOT NULL,
    discovered_by_explorer TEXT,
    discovered_by_user UUID REFERENCES users(id) ON DELETE SET NULL,
    discovered_on_tick INTEGER,
    region TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize world state
INSERT INTO world_state (id) VALUES ('world') ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_explorers_user_id ON explorers(user_id);
CREATE INDEX IF NOT EXISTS idx_explorers_status ON explorers(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_explorer_id ON journal_entries(explorer_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_player_items_user_id ON player_items(user_id);
CREATE INDEX IF NOT EXISTS idx_world_discoveries_secret_id ON world_discoveries(secret_id);
