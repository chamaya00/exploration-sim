import { Specialty } from '../types';

export const SPECIALTIES: Specialty[] = [
  // Common (always available)
  {
    id: 'forager',
    name: 'Forager',
    description: 'Can find sustenance anywhere',
    rarity: 'common',
    effects: [{ type: 'survivalBonus', value: 0.15 }]
  },
  {
    id: 'scout',
    name: 'Scout',
    description: 'Moves quickly and quietly',
    rarity: 'common',
    effects: [
      { type: 'dangerAvoid', value: 0.2 },
      { type: 'travelSpeed', value: 0.15 }
    ]
  },
  {
    id: 'keen_eye',
    name: 'Keen Eye',
    description: 'Notices what others miss',
    rarity: 'common',
    effects: [
      { type: 'discoveryBonus', value: 0.2 },
      { type: 'secretFind', value: 0.15 }
    ]
  },
  {
    id: 'thick_skin',
    name: 'Thick Skin',
    description: 'Shrugs off minor injuries',
    rarity: 'common',
    effects: [
      { type: 'survivalBonus', value: 0.1 },
      { type: 'escapeChance', value: 0.15 }
    ]
  },
  {
    id: 'lucky',
    name: 'Lucky',
    description: 'Fortune favors them',
    rarity: 'common',
    effects: [
      { type: 'deathDefy', value: 0.1 },
      { type: 'itemFind', value: 0.15 }
    ]
  },

  // Uncommon (unlocked)
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Knows the safe routes',
    rarity: 'uncommon',
    unlockCondition: 'Return 3 explorers',
    effects: [
      { type: 'survivalBonus', value: 0.2 },
      { type: 'travelSpeed', value: 0.25 }
    ]
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Has cheated death before',
    rarity: 'uncommon',
    unlockCondition: 'Lose 5 explorers',
    effects: [
      { type: 'deathDefy', value: 0.2 },
      { type: 'escapeChance', value: 0.2 }
    ]
  },

  // Rare (unlocked)
  {
    id: 'fated',
    name: 'Fated',
    description: 'Destiny has plans for them',
    rarity: 'rare',
    unlockCondition: 'Have an explorer survive 30 days',
    effects: [
      { type: 'deathDefy', value: 0.25 },
      { type: 'secretFind', value: 0.3 }
    ]
  }
];

export function getSpecialtyById(id: string): Specialty | undefined {
  return SPECIALTIES.find(s => s.id === id);
}

export function getCommonSpecialties(): Specialty[] {
  return SPECIALTIES.filter(s => s.rarity === 'common');
}

export function getAvailableSpecialties(unlockedIds: string[]): Specialty[] {
  const common = getCommonSpecialties();
  const unlocked = SPECIALTIES.filter(
    s => s.rarity !== 'common' && unlockedIds.includes(s.id)
  );
  return [...common, ...unlocked];
}
