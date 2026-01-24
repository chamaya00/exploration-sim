import { TrialScenario } from '../types';

export const TRIAL_SCENARIOS: TrialScenario[] = [
  {
    id: 'river',
    scene: 'You stand before a river, too wide to cross. The water is dark and fast.',
    options: [
      { text: 'Search for a crossing upstream', personality: 'cautious', statBonus: { cunning: 1 } },
      { text: 'Build a raft from fallen wood', personality: 'resourceful', statBonus: { vigor: 1 } },
      { text: 'Wade in and trust your strength', personality: 'bold', statBonus: { resolve: 1 } },
      { text: 'Wait for conditions to change', personality: 'steadfast', statBonus: { fortune: 1 } }
    ]
  },
  {
    id: 'sound',
    scene: 'A sound echoes from deeper in. It could be danger. It could be something wonderful.',
    options: [
      { text: 'Move toward it carefully', personality: 'curious', statBonus: { cunning: 1 } },
      { text: 'Call out a greeting', personality: 'bold', statBonus: { resolve: 1 } },
      { text: 'Hide and observe', personality: 'cautious', statBonus: { fortune: 1 } },
      { text: 'Mark the spot and move on', personality: 'wanderer', statBonus: { vigor: 1 } }
    ]
  },
  {
    id: 'creature',
    scene: 'A small creature lies in your path, injured. It watches you with frightened eyes.',
    options: [
      { text: 'Stop to help it', personality: 'steadfast', statBonus: { resolve: 1 } },
      { text: 'Leave food and move on', personality: 'resourceful', statBonus: { fortune: 1 } },
      { text: 'Study it carefully', personality: 'curious', statBonus: { cunning: 1 } },
      { text: 'Keep walking', personality: 'wanderer', statBonus: { vigor: 1 } }
    ]
  },
  {
    id: 'door',
    scene: "A door in the hillside, half-hidden by vines. It's locked.",
    options: [
      { text: 'Search for a key', personality: 'curious', statBonus: { cunning: 1 } },
      { text: 'Try to force it open', personality: 'bold', statBonus: { vigor: 1 } },
      { text: 'Mark it and return later', personality: 'cautious', statBonus: { resolve: 1 } },
      { text: 'Leave it - some doors stay closed', personality: 'wanderer', statBonus: { fortune: 1 } }
    ]
  },
  {
    id: 'storm',
    scene: "Dark clouds gather. A storm is coming, and there's no shelter in sight.",
    options: [
      { text: 'Push forward before it hits', personality: 'bold', statBonus: { vigor: 1 } },
      { text: 'Build a shelter quickly', personality: 'resourceful', statBonus: { cunning: 1 } },
      { text: 'Find low ground and wait', personality: 'cautious', statBonus: { resolve: 1 } },
      { text: 'Keep moving, storms pass', personality: 'steadfast', statBonus: { fortune: 1 } }
    ]
  },
  {
    id: 'light',
    scene: 'A faint light glows in the distance, off the path. Night is falling.',
    options: [
      { text: 'Investigate the light', personality: 'curious', statBonus: { cunning: 1 } },
      { text: 'Stay on the path', personality: 'cautious', statBonus: { vigor: 1 } },
      { text: 'Make camp and watch', personality: 'steadfast', statBonus: { resolve: 1 } },
      { text: 'Signal back', personality: 'bold', statBonus: { fortune: 1 } }
    ]
  }
];

export function getRandomTrialScenarios(count: number = 3): TrialScenario[] {
  const shuffled = [...TRIAL_SCENARIOS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getTrialScenarioById(id: string): TrialScenario | undefined {
  return TRIAL_SCENARIOS.find(t => t.id === id);
}
