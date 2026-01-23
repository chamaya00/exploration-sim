import { Explorer, WorldState } from '../types';
import { getKeepsakeById } from '../data/keepsakes';
import {
  DEATH_TEMPLATES,
  getRandomTemplate,
  fillTemplate
} from '../data/journal-templates';
import {
  updateExplorer,
  createJournalEntry,
  incrementLegacyStat,
  incrementWorldStat,
  getWorldState
} from '../db/queries';

export function generateDeathEntry(explorer: Explorer, cause: string): string {
  const keepsake = getKeepsakeById(explorer.keepsake);

  // Get death templates for the cause
  const deathTemplates = DEATH_TEMPLATES[cause] ||
    DEATH_TEMPLATES[explorer.currentRegion] ||
    [`${explorer.name} did not survive.`];

  const template = getRandomTemplate(deathTemplates);
  let entry = fillTemplate(template, explorer.name);

  // Add keepsake mention
  if (keepsake && keepsake.id !== 'nothing') {
    entry += '\n\n' + fillTemplate(keepsake.deathMention, explorer.name);
  }

  return entry;
}

export async function processExplorerDeath(
  explorer: Explorer,
  cause: string,
  world: WorldState
): Promise<void> {
  // Generate death entry
  const deathEntry = generateDeathEntry(explorer, cause);

  // Create journal entry
  await createJournalEntry(
    explorer.id,
    Math.floor(explorer.daysAlive),
    world.currentTick,
    deathEntry,
    'death',
    true
  );

  // Update explorer status
  await updateExplorer(explorer.id, {
    status: 'dead',
    causeOfDeath: cause,
    health: 0
  });

  // Update player legacy
  await incrementLegacyStat(explorer.userId, 'totalDeaths');

  // Update world state
  await incrementWorldStat('totalDeathsEver');
}
