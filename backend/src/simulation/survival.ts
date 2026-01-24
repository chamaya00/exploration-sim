import { Explorer, Region, Modifiers, DangerResult } from '../types';
import {
  ESCAPE_TEMPLATES,
  INJURY_TEMPLATES,
  DEATH_TEMPLATES,
  getRandomTemplate,
  fillTemplate
} from '../data/journal-templates';

export function calculateSurvivalChance(
  explorer: Explorer,
  region: Region,
  mods: Modifiers
): number {
  // Base survival chance based on region danger (1-10 scale)
  // dangerLevel 1 = 92% base survival, dangerLevel 10 = 20% base survival
  const baseSurvival = 1 - (region.dangerLevel * 0.08);

  // Apply modifiers
  let survival = baseSurvival;
  survival += mods.survivalBonus || 0;
  survival += mods.dangerAvoid || 0;

  // Health penalty
  if (explorer.health < 30) {
    survival -= 0.15;
  } else if (explorer.health < 50) {
    survival -= 0.05;
  }

  // Clamp between 10% and 98%
  return Math.max(0.1, Math.min(0.98, survival));
}

export function processDangerEvent(
  explorer: Explorer,
  region: Region,
  mods: Modifiers
): DangerResult {
  // Escape check
  if (Math.random() < (mods.escapeChance || 0)) {
    const templates = ESCAPE_TEMPLATES[region.id] || ESCAPE_TEMPLATES.mistwood;
    return {
      died: false,
      journalEntry: fillTemplate(getRandomTemplate(templates), explorer.name)
    };
  }

  // Death check
  const deathChance = 0.25 - (mods.deathDefy || 0);
  if (Math.random() < Math.max(0.05, deathChance)) {
    return {
      died: true,
      cause: region.id
    };
  }

  // Injury
  const damage = 20 + Math.floor(Math.random() * 20);
  explorer.health -= damage;

  if (explorer.health <= 0) {
    return {
      died: true,
      cause: 'injuries'
    };
  }

  const templates = INJURY_TEMPLATES[region.id] || INJURY_TEMPLATES.mistwood;
  return {
    died: false,
    journalEntry: fillTemplate(getRandomTemplate(templates), explorer.name)
  };
}

export function generateDeathCause(region: Region): string {
  return region.id;
}
