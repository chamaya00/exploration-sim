import { Explorer, Region, Modifiers, WorldState, DiscoveryResult } from '../types';
import { getItemById } from '../data/items';
import {
  MINOR_DISCOVERY_TEMPLATES,
  getRandomTemplate,
  fillTemplate
} from '../data/journal-templates';
import { recordWorldDiscovery, updateWorldState } from '../db/queries';

export async function processDiscovery(
  explorer: Explorer,
  region: Region,
  world: WorldState,
  mods: Modifiers
): Promise<DiscoveryResult | null> {
  // Check for secret discovery first
  const secretRoll = Math.random();
  const secretThreshold = 0.05 + (mods.secretFind || 0);

  if (secretRoll < secretThreshold) {
    const undiscoveredSecrets = region.secrets.filter(
      s => !world.discoveredSecrets.includes(s.id)
    );

    if (undiscoveredSecrets.length > 0) {
      const secret = undiscoveredSecrets[Math.floor(Math.random() * undiscoveredSecrets.length)];

      // Add to world's discovered secrets
      world.discoveredSecrets.push(secret.id);
      await updateWorldState({ discoveredSecrets: world.discoveredSecrets });

      // Record first-to-find
      await recordWorldDiscovery(
        secret.id,
        explorer.name,
        explorer.userId,
        world.currentTick,
        region.id
      );

      return {
        type: 'secret',
        journalEntry: fillTemplate(secret.discoveredText, explorer.name)
      };
    }
  }

  // Check for item discovery
  const itemRoll = Math.random();
  const itemThreshold = 0.1 + (mods.itemFind || 0);

  if (itemRoll < itemThreshold && region.possibleItems.length > 0) {
    const itemId = region.possibleItems[Math.floor(Math.random() * region.possibleItems.length)];
    const item = getItemById(itemId);

    if (item) {
      // Add to explorer's found items
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

  // Minor discovery (flavor text)
  const templates = MINOR_DISCOVERY_TEMPLATES[region.id] || MINOR_DISCOVERY_TEMPLATES.mistwood;
  return {
    type: 'minor',
    journalEntry: fillTemplate(getRandomTemplate(templates), explorer.name)
  };
}
