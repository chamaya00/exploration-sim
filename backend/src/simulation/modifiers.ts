import { Explorer, Modifiers, Effect } from '../types';
import { getSpecialtyById } from '../data/specialties';
import { getPersonalityById } from '../data/personalities';
import { getItemById } from '../data/items';
import { getPlayerItemById } from '../db/queries';

export function applyEffects(
  mods: Modifiers,
  effects: Effect[],
  currentRegion?: string
): void {
  for (const effect of effects) {
    // Check condition if present
    if (effect.condition && effect.condition !== currentRegion) {
      continue;
    }

    const value = typeof effect.value === 'number' ? effect.value : 0;

    switch (effect.type) {
      case 'survivalBonus':
      case 'survivalRegion':
        mods.survivalBonus += value;
        break;
      case 'discoveryBonus':
        mods.discoveryBonus += value;
        break;
      case 'dangerAvoid':
        mods.dangerAvoid += value;
        break;
      case 'escapeChance':
        mods.escapeChance += value;
        break;
      case 'deathDefy':
        mods.deathDefy += value;
        break;
      case 'travelSpeed':
        mods.travelSpeed += value;
        break;
      case 'itemFind':
        mods.itemFind += value;
        break;
      case 'secretFind':
        mods.secretFind += value;
        break;
      case 'restBonus':
        mods.restBonus += value;
        break;
    }
  }
}

export async function calculateModifiers(explorer: Explorer): Promise<Modifiers> {
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
  const specialty = getSpecialtyById(explorer.specialtyId);
  if (specialty) {
    applyEffects(mods, specialty.effects, explorer.currentRegion);
  }

  // Personality
  const personality = getPersonalityById(explorer.personalityId);
  if (personality) {
    applyEffects(mods, personality.effects, explorer.currentRegion);
  }

  // Equipped items
  for (const itemInstanceId of explorer.equippedItems) {
    const playerItem = await getPlayerItemById(itemInstanceId);
    if (playerItem) {
      const item = getItemById(playerItem.itemId);
      if (item) {
        applyEffects(mods, item.effects, explorer.currentRegion);
      }
    }
  }

  return mods;
}

export function createEmptyModifiers(): Modifiers {
  return {
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
}
