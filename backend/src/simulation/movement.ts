import { Explorer, Region, Modifiers, MovementResult } from '../types';
import { REGIONS, getRegionById } from '../data/regions';

export function processMovement(
  explorer: Explorer,
  region: Region,
  mods: Modifiers
): MovementResult | null {
  const connectedRegions = region.connectedTo;
  if (connectedRegions.length === 0) return null;

  // Bias toward progression (away from gate)
  const currentDistance = region.distanceFromGate;
  const forwardRegions = connectedRegions.filter(r => {
    const target = getRegionById(r);
    return target && target.distanceFromGate > currentDistance;
  });

  // 70% chance to move forward if possible
  let targetRegionId: string;
  if (forwardRegions.length > 0 && Math.random() < 0.7) {
    targetRegionId = forwardRegions[Math.floor(Math.random() * forwardRegions.length)];
  } else {
    targetRegionId = connectedRegions[Math.floor(Math.random() * connectedRegions.length)];
  }

  const targetRegion = getRegionById(targetRegionId);
  if (!targetRegion) return null;

  explorer.currentRegion = targetRegionId;

  return {
    journalEntry: `${explorer.name} traveled to ${targetRegion.name}. ${targetRegion.description}`
  };
}

export function getReturnDistance(region: Region): number {
  // Return journey takes time based on distance from gate
  // Base: 1 day per distance unit, plus some randomness
  return region.distanceFromGate + 0.5 + Math.random() * 0.5;
}
