import { Explorer, WorldState } from '../types';
import { getRegionById } from '../data/regions';
import {
  getActiveExplorers,
  getWorldState,
  updateWorldState,
  createJournalEntry,
  updateExplorer
} from '../db/queries';
import { calculateModifiers } from './modifiers';
import { calculateSurvivalChance, processDangerEvent } from './survival';
import { processDiscovery } from './discovery';
import { processMovement } from './movement';
import { processExplorerDeath } from './death';
import { processReturningExplorer } from './return';
import {
  QUIET_JOURNAL_TEMPLATES,
  getRandomTemplate,
  fillTemplate
} from '../data/journal-templates';

export const TICK_CONFIG = {
  intervalMinutes: 15,           // Real-time between ticks
  worldDaysPerTick: 0.25,        // 4 ticks = 1 world day
  journalChance: 0.7,            // 70% chance of journal entry per tick
  significantEventChance: 0.15,  // 15% chance of major event
};

export async function runSimulationTick(): Promise<{
  tickNumber: number;
  explorersProcessed: number;
  events: string[];
}> {
  const world = await getWorldState();
  world.currentTick += 1;

  const events: string[] = [];

  // Get all active/returning explorers
  const explorers = await getActiveExplorers();

  for (const explorer of explorers) {
    try {
      if (explorer.status === 'returning') {
        await processReturningExplorerTick(explorer, world);
        events.push(`${explorer.name}: processed returning`);
      } else {
        const result = await processActiveExplorerTick(explorer, world);
        events.push(`${explorer.name}: ${result}`);
      }
    } catch (error) {
      console.error(`Error processing explorer ${explorer.id}:`, error);
      events.push(`${explorer.name}: error`);
    }
  }

  // Save world state
  await updateWorldState({ currentTick: world.currentTick });

  return {
    tickNumber: world.currentTick,
    explorersProcessed: explorers.length,
    events
  };
}

async function processActiveExplorerTick(
  explorer: Explorer,
  world: WorldState
): Promise<string> {
  const region = getRegionById(explorer.currentRegion);
  if (!region) {
    return 'invalid region';
  }

  // Calculate modifiers from stats, specialty, personality, items
  const mods = await calculateModifiers(explorer);

  let significantEvent = false;
  let eventDescription = 'quiet';

  // 1. Survival check
  const survivalRoll = Math.random();
  const survivalThreshold = calculateSurvivalChance(explorer, region, mods);

  if (survivalRoll > survivalThreshold) {
    // Danger event
    const dangerResult = processDangerEvent(explorer, region, mods);

    if (dangerResult.died) {
      await processExplorerDeath(explorer, dangerResult.cause || 'unknown', world);
      return 'died';
    }

    if (dangerResult.journalEntry) {
      await createJournalEntry(
        explorer.id,
        Math.floor(explorer.daysAlive),
        world.currentTick,
        dangerResult.journalEntry,
        'danger',
        true
      );
      significantEvent = true;
      eventDescription = 'danger survived';
    }
  }

  // 2. Discovery check (only if no danger event)
  if (!significantEvent) {
    const discoveryRoll = Math.random();
    const discoveryThreshold = 0.1 + (mods.discoveryBonus || 0);

    if (discoveryRoll < discoveryThreshold) {
      const discovery = await processDiscovery(explorer, region, world, mods);
      if (discovery) {
        await createJournalEntry(
          explorer.id,
          Math.floor(explorer.daysAlive),
          world.currentTick,
          discovery.journalEntry,
          discovery.type === 'secret' ? 'discovery' : discovery.type === 'item' ? 'item_found' : 'discovery',
          discovery.type === 'secret' || discovery.type === 'item'
        );

        if (discovery.type === 'item') {
          // Update explorer's found items
          await updateExplorer(explorer.id, { foundItems: explorer.foundItems });
        }

        significantEvent = discovery.type !== 'minor';
        eventDescription = `discovery (${discovery.type})`;
      }
    }
  }

  // 3. Movement check (only if not just arrived and no significant event)
  if (!significantEvent && explorer.daysAlive > 1) {
    const moveRoll = Math.random();
    const moveThreshold = 0.15 + (mods.travelSpeed || 0);

    if (moveRoll < moveThreshold) {
      const moved = processMovement(explorer, region, mods);
      if (moved) {
        await createJournalEntry(
          explorer.id,
          Math.floor(explorer.daysAlive),
          world.currentTick,
          moved.journalEntry,
          'movement',
          false
        );
        eventDescription = 'moved';
      }
    }
  }

  // 4. Generate quiet journal entry (if nothing significant happened)
  if (!significantEvent && Math.random() < TICK_CONFIG.journalChance) {
    const templates = QUIET_JOURNAL_TEMPLATES[region.id] || QUIET_JOURNAL_TEMPLATES.mistwood;
    const quietEntry = fillTemplate(getRandomTemplate(templates), explorer.name);
    await createJournalEntry(
      explorer.id,
      Math.floor(explorer.daysAlive),
      world.currentTick,
      quietEntry,
      'quiet',
      false
    );
  }

  // 5. Update explorer state
  explorer.daysAlive += TICK_CONFIG.worldDaysPerTick;
  explorer.health = Math.min(100, explorer.health + (mods.restBonus || 0) * 5);

  await updateExplorer(explorer.id, {
    daysAlive: explorer.daysAlive,
    health: explorer.health,
    currentRegion: explorer.currentRegion
  });

  return eventDescription;
}

async function processReturningExplorerTick(
  explorer: Explorer,
  world: WorldState
): Promise<void> {
  const mods = await calculateModifiers(explorer);

  // Progress toward home
  explorer.recallDaysRemaining -= TICK_CONFIG.worldDaysPerTick;
  explorer.daysAlive += TICK_CONFIG.worldDaysPerTick;

  // Update explorer first
  await updateExplorer(explorer.id, {
    recallDaysRemaining: explorer.recallDaysRemaining,
    daysAlive: explorer.daysAlive
  });

  // Process returning logic (handles death, delays, and arrival)
  await processReturningExplorer(explorer, world, mods);
}
