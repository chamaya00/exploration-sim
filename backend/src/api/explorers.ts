import { Router, Request, Response } from 'express';
import { ExplorerStats } from '../types';
import { SPECIALTIES, getCommonSpecialties, getAvailableSpecialties, getSpecialtyById } from '../data/specialties';
import { KEEPSAKES } from '../data/keepsakes';
import {
  createExplorer,
  getExplorerById,
  getUserExplorers,
  getExplorerJournal,
  getPlayerLegacy,
  incrementLegacyStat,
  incrementWorldStat,
  setItemEquipped
} from '../db/queries';
import { initiateRecall } from '../simulation/return';

const router = Router();

// Roll new explorer stats and specialty
router.post('/roll', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get player legacy for stat floors
    const legacy = await getPlayerLegacy(userId);
    const statFloors = legacy ? {
      vigor: legacy.statFloorVigor,
      cunning: legacy.statFloorCunning,
      resolve: legacy.statFloorResolve,
      fortune: legacy.statFloorFortune
    } : { vigor: 1, cunning: 1, resolve: 1, fortune: 1 };

    // Roll stats (3d4, drop lowest, plus stat floor)
    const rollStat = (floor: number): number => {
      const rolls = [
        Math.floor(Math.random() * 4) + 1,
        Math.floor(Math.random() * 4) + 1,
        Math.floor(Math.random() * 4) + 1
      ];
      rolls.sort((a, b) => a - b);
      const value = rolls[1] + rolls[2] + floor;
      return Math.min(10, value);
    };

    const stats: ExplorerStats = {
      vigor: rollStat(statFloors.vigor),
      cunning: rollStat(statFloors.cunning),
      resolve: rollStat(statFloors.resolve),
      fortune: rollStat(statFloors.fortune)
    };

    // Get available specialties
    const unlockedSpecialties = legacy?.unlockedSpecialties || [];
    const availableSpecialties = getAvailableSpecialties(unlockedSpecialties);

    // Roll a random specialty
    const specialty = availableSpecialties[Math.floor(Math.random() * availableSpecialties.length)];

    res.json({
      stats,
      specialty,
      canReroll: true,
      rerollCost: 0
    });
  } catch (error) {
    console.error('Error rolling explorer:', error);
    res.status(500).json({ error: 'Failed to roll explorer' });
  }
});

// Create explorer
router.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      name,
      stats,
      specialtyId,
      personalityId,
      keepsake,
      equippedItems
    } = req.body;

    if (!userId || !name || !stats || !specialtyId || !personalityId || !keepsake) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate specialty
    const specialty = getSpecialtyById(specialtyId);
    if (!specialty) {
      return res.status(400).json({ error: 'Invalid specialty' });
    }

    // Validate keepsake
    const keepsakeValid = KEEPSAKES.some(k => k.id === keepsake);
    if (!keepsakeValid) {
      return res.status(400).json({ error: 'Invalid keepsake' });
    }

    // Create explorer
    const explorer = await createExplorer({
      userId,
      name,
      stats,
      specialtyId,
      personalityId,
      keepsake,
      equippedItems: equippedItems || []
    });

    // Mark items as equipped
    for (const itemId of (equippedItems || [])) {
      await setItemEquipped(itemId, true);
    }

    // Update player legacy
    await incrementLegacyStat(userId, 'totalExplorers');

    // Update world state
    await incrementWorldStat('totalExplorersEver');

    res.json({ explorer });
  } catch (error) {
    console.error('Error creating explorer:', error);
    res.status(500).json({ error: 'Failed to create explorer' });
  }
});

// Get explorer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const explorer = await getExplorerById(id);
    if (!explorer) {
      return res.status(404).json({ error: 'Explorer not found' });
    }

    const journal = await getExplorerJournal(id);

    res.json({ explorer, journal });
  } catch (error) {
    console.error('Error getting explorer:', error);
    res.status(500).json({ error: 'Failed to get explorer' });
  }
});

// Initiate recall
router.post('/:id/recall', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const explorer = await getExplorerById(id);
    if (!explorer) {
      return res.status(404).json({ error: 'Explorer not found' });
    }

    if (explorer.status !== 'active') {
      return res.status(400).json({ error: 'Explorer is not active' });
    }

    const result = await initiateRecall(explorer);

    res.json(result);
  } catch (error) {
    console.error('Error initiating recall:', error);
    res.status(500).json({ error: 'Failed to initiate recall' });
  }
});

// Get keepsakes
router.get('/data/keepsakes', async (req: Request, res: Response) => {
  res.json({ keepsakes: KEEPSAKES });
});

// Get specialties
router.get('/data/specialties', async (req: Request, res: Response) => {
  res.json({ specialties: SPECIALTIES });
});

export default router;
