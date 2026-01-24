import { Router, Request, Response } from 'express';
import {
  getWorldState,
  getWorldDiscoveries,
  getRegionExplorerCounts
} from '../db/queries';
import { REGIONS } from '../data/regions';

const router = Router();

// Get world status
router.get('/', async (req: Request, res: Response) => {
  try {
    const worldState = await getWorldState();
    const discoveries = await getWorldDiscoveries();
    const regionCounts = await getRegionExplorerCounts();

    // Build region stats
    const regionStats = REGIONS.map(region => {
      const count = regionCounts.find(r => r.regionId === region.id);
      return {
        regionId: region.id,
        regionName: region.name,
        currentExplorers: count?.count || 0,
        dangerLevel: region.dangerLevel,
        discoveryRichness: region.discoveryRichness
      };
    });

    res.json({
      currentTick: worldState.currentTick,
      totalExplorers: worldState.totalExplorersEver,
      totalDeaths: worldState.totalDeathsEver,
      totalReturns: worldState.totalReturnsEver,
      discoveries: discoveries.map(d => ({
        secretId: d.secretId,
        discoveredBy: d.discoveredByExplorer,
        region: d.region,
        tick: d.discoveredOnTick
      })),
      regionStats,
      discoveredSecrets: worldState.discoveredSecrets
    });
  } catch (error) {
    console.error('Error getting world state:', error);
    res.status(500).json({ error: 'Failed to get world state' });
  }
});

// Get regions data
router.get('/regions', async (req: Request, res: Response) => {
  res.json({
    regions: REGIONS.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      dangerLevel: r.dangerLevel,
      discoveryRichness: r.discoveryRichness,
      connectedTo: r.connectedTo,
      distanceFromGate: r.distanceFromGate,
      secretCount: r.secrets.length
    }))
  });
});

export default router;
