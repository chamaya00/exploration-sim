import { Router, Request, Response } from 'express';
import { ExplorerStats } from '../types';
import { getRandomTrialScenarios, getTrialScenarioById } from '../data/trials';
import { PERSONALITIES, getPersonalityById } from '../data/personalities';

const router = Router();

// Get trial scenarios
router.get('/scenarios', async (req: Request, res: Response) => {
  try {
    const scenarios = getRandomTrialScenarios(3);
    res.json({ scenarios });
  } catch (error) {
    console.error('Error getting trial scenarios:', error);
    res.status(500).json({ error: 'Failed to get trial scenarios' });
  }
});

// Complete trial and get personality
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length !== 3) {
      return res.status(400).json({ error: 'Must provide exactly 3 answers' });
    }

    // Count personality votes and stat bonuses
    const personalityVotes: Record<string, number> = {};
    const statBonuses: Partial<ExplorerStats> = {
      vigor: 0,
      cunning: 0,
      resolve: 0,
      fortune: 0
    };

    for (const answer of answers) {
      const { scenarioId, optionIndex } = answer;
      const scenario = getTrialScenarioById(scenarioId);

      if (!scenario) {
        return res.status(400).json({ error: `Invalid scenario: ${scenarioId}` });
      }

      if (optionIndex < 0 || optionIndex >= scenario.options.length) {
        return res.status(400).json({ error: `Invalid option index for scenario ${scenarioId}` });
      }

      const option = scenario.options[optionIndex];

      // Count personality vote
      personalityVotes[option.personality] = (personalityVotes[option.personality] || 0) + 1;

      // Add stat bonuses
      for (const [stat, bonus] of Object.entries(option.statBonus)) {
        (statBonuses as any)[stat] = ((statBonuses as any)[stat] || 0) + bonus;
      }
    }

    // Determine personality (most votes, or random among ties)
    let maxVotes = 0;
    let winningPersonalities: string[] = [];

    for (const [personality, votes] of Object.entries(personalityVotes)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winningPersonalities = [personality];
      } else if (votes === maxVotes) {
        winningPersonalities.push(personality);
      }
    }

    const personalityId = winningPersonalities[Math.floor(Math.random() * winningPersonalities.length)];
    const personality = getPersonalityById(personalityId);

    res.json({
      personalityId,
      personality,
      statBonuses
    });
  } catch (error) {
    console.error('Error completing trial:', error);
    res.status(500).json({ error: 'Failed to complete trial' });
  }
});

// Get all personalities
router.get('/personalities', async (req: Request, res: Response) => {
  res.json({ personalities: PERSONALITIES });
});

export default router;
