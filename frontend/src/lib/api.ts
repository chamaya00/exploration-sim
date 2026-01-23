import {
  Explorer,
  ExplorerStats,
  JournalEntry,
  PlayerLegacy,
  PlayerItem,
  RollResponse,
  TrialScenario,
  TrialResponse,
  RecallResponse,
  WorldState,
  Item,
  Keepsake,
  Specialty
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// === EXPLORER API ===

export async function rollExplorer(userId: string): Promise<RollResponse> {
  return fetchApi<RollResponse>('/api/explorers/roll', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function createExplorer(data: {
  userId: string;
  name: string;
  stats: ExplorerStats;
  specialtyId: string;
  personalityId: string;
  keepsake: string;
  equippedItems: string[];
}): Promise<{ explorer: Explorer }> {
  return fetchApi<{ explorer: Explorer }>('/api/explorers/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getExplorer(id: string): Promise<{ explorer: Explorer; journal: JournalEntry[] }> {
  return fetchApi<{ explorer: Explorer; journal: JournalEntry[] }>(`/api/explorers/${id}`);
}

export async function recallExplorer(id: string): Promise<RecallResponse> {
  return fetchApi<RecallResponse>(`/api/explorers/${id}/recall`, {
    method: 'POST',
  });
}

// === TRIAL API ===

export async function getTrialScenarios(): Promise<{ scenarios: TrialScenario[] }> {
  return fetchApi<{ scenarios: TrialScenario[] }>('/api/trial/scenarios');
}

export async function completeTrial(
  answers: { scenarioId: string; optionIndex: number }[]
): Promise<TrialResponse> {
  return fetchApi<TrialResponse>('/api/trial/complete', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

// === USER API ===

export async function getOrCreateUser(userId?: string): Promise<{ userId: string }> {
  return fetchApi<{ userId: string }>('/api/users/init', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function getUserExplorers(userId: string): Promise<{
  active: Explorer[];
  returned: Explorer[];
  dead: Explorer[];
}> {
  return fetchApi<{ active: Explorer[]; returned: Explorer[]; dead: Explorer[] }>(
    `/api/users/${userId}/explorers`
  );
}

export async function getUserLegacy(userId: string): Promise<{
  legacy: PlayerLegacy;
  items: PlayerItem[];
  unlockedSpecialties: Specialty[];
}> {
  return fetchApi<{
    legacy: PlayerLegacy;
    items: PlayerItem[];
    unlockedSpecialties: Specialty[];
  }>(`/api/users/${userId}/legacy`);
}

// === WORLD API ===

export async function getWorldState(): Promise<WorldState> {
  return fetchApi<WorldState>('/api/world');
}

// === ITEMS API ===

export async function getGuildItems(): Promise<{ items: Item[] }> {
  return fetchApi<{ items: Item[] }>('/api/items/guild');
}

// === DATA API ===

export async function getKeepsakes(): Promise<{ keepsakes: Keepsake[] }> {
  return fetchApi<{ keepsakes: Keepsake[] }>('/api/explorers/data/keepsakes');
}

export async function getSpecialties(): Promise<{ specialties: Specialty[] }> {
  return fetchApi<{ specialties: Specialty[] }>('/api/explorers/data/specialties');
}
