import { Explorer, WorldState, Modifiers } from '../types';
import {
  RETURN_TEMPLATES,
  getRandomTemplate,
  fillTemplate
} from '../data/journal-templates';
import { getItemById } from '../data/items';
import {
  updateExplorer,
  createJournalEntry,
  incrementLegacyStat,
  incrementWorldStat,
  addPlayerItem,
  updatePlayerLegacy,
  getPlayerLegacy
} from '../db/queries';
import { getRegionById } from '../data/regions';
import { processExplorerDeath } from './death';

export function generateReturnJournalEntry(explorer: Explorer): string {
  const template = getRandomTemplate(RETURN_TEMPLATES);
  return fillTemplate(template, explorer.name);
}

export async function processReturningExplorer(
  explorer: Explorer,
  world: WorldState,
  mods: Modifiers
): Promise<void> {
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
        if (lostItem) {
          const item = getItemById(lostItem.itemId);
          if (item) {
            await createJournalEntry(
              explorer.id,
              Math.floor(explorer.daysAlive),
              world.currentTick,
              `The ${item.name} was lost in the chaos.`,
              'item_lost',
              false
            );
          }
        }
        await updateExplorer(explorer.id, { foundItems: explorer.foundItems });
      }
    }
  }

  // Check if arrived home
  if (explorer.recallDaysRemaining <= 0) {
    await processExplorerReturn(explorer, world);
    return;
  }

  // Still returning - create journal entry
  await createJournalEntry(
    explorer.id,
    Math.floor(explorer.daysAlive),
    world.currentTick,
    generateReturnJournalEntry(explorer),
    'returning',
    false
  );
}

export async function processExplorerReturn(
  explorer: Explorer,
  world: WorldState
): Promise<void> {
  // Create success journal entry
  await createJournalEntry(
    explorer.id,
    Math.floor(explorer.daysAlive),
    world.currentTick,
    `${explorer.name} passed through the gate. They had returned from The Beyond.`,
    'return',
    true
  );

  // Add found items to player's collection
  for (const foundItem of explorer.foundItems) {
    await addPlayerItem(
      explorer.userId,
      foundItem.itemId,
      explorer.name,
      foundItem.foundInRegion,
      foundItem.foundOnDay
    );
  }

  // Calculate legacy bonus based on survival
  let legacyBonusType = 'none';
  let legacyBonusValue = '';

  if (explorer.daysAlive >= 30) {
    legacyBonusType = 'stat_floor';
    legacyBonusValue = 'all';
  } else if (explorer.daysAlive >= 15) {
    const stats = ['vigor', 'cunning', 'resolve', 'fortune'];
    legacyBonusType = 'stat_floor';
    legacyBonusValue = stats[Math.floor(Math.random() * stats.length)];
  } else if (explorer.daysAlive >= 7) {
    legacyBonusType = 'item_bonus';
    legacyBonusValue = 'common';
  }

  // Apply legacy bonus
  if (legacyBonusType === 'stat_floor') {
    const legacy = await getPlayerLegacy(explorer.userId);
    if (legacy) {
      if (legacyBonusValue === 'all') {
        await updatePlayerLegacy(explorer.userId, {
          statFloorVigor: Math.min(5, legacy.statFloorVigor + 1),
          statFloorCunning: Math.min(5, legacy.statFloorCunning + 1),
          statFloorResolve: Math.min(5, legacy.statFloorResolve + 1),
          statFloorFortune: Math.min(5, legacy.statFloorFortune + 1)
        });
      } else {
        const updateKey = `statFloor${legacyBonusValue.charAt(0).toUpperCase() + legacyBonusValue.slice(1)}` as keyof typeof legacy;
        const currentValue = (legacy as any)[updateKey] as number;
        await updatePlayerLegacy(explorer.userId, {
          [updateKey]: Math.min(5, currentValue + 1)
        } as any);
      }
    }
  }

  // Update explorer status
  await updateExplorer(explorer.id, {
    status: 'returned',
    isRecalling: false,
    recallDaysRemaining: 0,
    legacyBonusType,
    legacyBonusValue
  });

  // Update player legacy
  await incrementLegacyStat(explorer.userId, 'totalReturns');

  // Update world state
  await incrementWorldStat('totalReturnsEver');
}

export async function initiateRecall(explorer: Explorer): Promise<{
  success: boolean;
  estimatedDays: number;
  survivalChance: number;
}> {
  const region = getRegionById(explorer.currentRegion);
  if (!region) {
    return { success: false, estimatedDays: 0, survivalChance: 0 };
  }

  // Calculate return time based on distance from gate
  const estimatedDays = region.distanceFromGate + 0.5 + Math.random() * 0.5;

  // Estimate survival chance (rough estimate)
  const survivalChance = Math.max(0.5, 0.85 - (region.distanceFromGate * 0.1));

  // Update explorer state
  await updateExplorer(explorer.id, {
    status: 'returning',
    isRecalling: true,
    recallDaysRemaining: estimatedDays
  });

  return {
    success: true,
    estimatedDays,
    survivalChance
  };
}
