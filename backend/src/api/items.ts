import { Router, Request, Response } from 'express';
import { ITEMS, getGuildItems, getFoundItems, getItemById } from '../data/items';
import { getPlayerItems } from '../db/queries';

const router = Router();

// Get all guild items (always available)
router.get('/guild', async (req: Request, res: Response) => {
  try {
    const guildItems = getGuildItems();
    res.json({ items: guildItems });
  } catch (error) {
    console.error('Error getting guild items:', error);
    res.status(500).json({ error: 'Failed to get guild items' });
  }
});

// Get all found items (for reference)
router.get('/found', async (req: Request, res: Response) => {
  try {
    const foundItems = getFoundItems();
    res.json({ items: foundItems });
  } catch (error) {
    console.error('Error getting found items:', error);
    res.status(500).json({ error: 'Failed to get found items' });
  }
});

// Get all items
router.get('/', async (req: Request, res: Response) => {
  try {
    res.json({ items: ITEMS });
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

// Get single item by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = getItemById(id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ item });
  } catch (error) {
    console.error('Error getting item:', error);
    res.status(500).json({ error: 'Failed to get item' });
  }
});

// Get user's available items for equipping
router.get('/user/:userId/available', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get player's found items that are not currently equipped
    const playerItems = await getPlayerItems(userId);
    const availablePlayerItems = playerItems.filter(pi => !pi.isEquipped);

    // Get guild items (always available)
    const guildItems = getGuildItems();

    // Combine and return
    const available = {
      guildItems: guildItems,
      collectionItems: availablePlayerItems.map(pi => {
        const item = getItemById(pi.itemId);
        return {
          instanceId: pi.id,
          item: item,
          foundBy: pi.foundBy,
          foundIn: pi.foundIn
        };
      }).filter(i => i.item !== undefined)
    };

    res.json(available);
  } catch (error) {
    console.error('Error getting available items:', error);
    res.status(500).json({ error: 'Failed to get available items' });
  }
});

export default router;
