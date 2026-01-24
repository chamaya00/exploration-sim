import { Router, Request, Response } from 'express';
import {
  createUser,
  getUserById,
  getOrCreateUser,
  getPlayerLegacy,
  getPlayerItems,
  getUserExplorers
} from '../db/queries';
import { getAvailableSpecialties } from '../data/specialties';

const router = Router();

// Create or get user
router.post('/auth', async (req: Request, res: Response) => {
  try {
    const { userId, email } = req.body;

    if (userId) {
      // Try to get existing user
      const user = await getUserById(userId);
      if (user) {
        return res.json({ userId: user.id });
      }
    }

    // Create new user
    const newUserId = await createUser(email);
    res.json({ userId: newUserId });
  } catch (error) {
    console.error('Error in auth:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

// Get user legacy and items
router.get('/:userId/legacy', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const legacy = await getPlayerLegacy(userId);
    if (!legacy) {
      return res.status(404).json({ error: 'User not found' });
    }

    const items = await getPlayerItems(userId);

    // Get unlocked specialties
    const unlockedSpecialties = getAvailableSpecialties(legacy.unlockedSpecialties);

    res.json({
      legacy,
      items,
      unlockedSpecialties
    });
  } catch (error) {
    console.error('Error getting user legacy:', error);
    res.status(500).json({ error: 'Failed to get user legacy' });
  }
});

// Get user's explorers
router.get('/:userId/explorers', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const explorers = await getUserExplorers(userId);

    res.json(explorers);
  } catch (error) {
    console.error('Error getting user explorers:', error);
    res.status(500).json({ error: 'Failed to get user explorers' });
  }
});

export default router;
