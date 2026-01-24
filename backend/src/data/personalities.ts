import { Personality } from '../types';

export const PERSONALITIES: Personality[] = [
  {
    id: 'bold',
    name: 'Bold',
    description: 'Faces the unknown head-on',
    effects: [
      { type: 'travelSpeed', value: 0.2 },
      { type: 'dangerAvoid', value: -0.1 }
    ]
  },
  {
    id: 'cautious',
    name: 'Cautious',
    description: 'Careful and deliberate',
    effects: [
      { type: 'dangerAvoid', value: 0.2 },
      { type: 'travelSpeed', value: -0.1 }
    ]
  },
  {
    id: 'curious',
    name: 'Curious',
    description: 'Drawn to mysteries',
    effects: [
      { type: 'discoveryBonus', value: 0.25 },
      { type: 'dangerAvoid', value: -0.05 }
    ]
  },
  {
    id: 'resourceful',
    name: 'Resourceful',
    description: "Makes do with what's at hand",
    effects: [
      { type: 'itemFind', value: 0.2 },
      { type: 'survivalBonus', value: 0.1 }
    ]
  },
  {
    id: 'steadfast',
    name: 'Steadfast',
    description: 'Endures where others falter',
    effects: [
      { type: 'survivalBonus', value: 0.15 },
      { type: 'restBonus', value: 0.2 }
    ]
  },
  {
    id: 'wanderer',
    name: 'Wanderer',
    description: 'Born to roam',
    effects: [
      { type: 'travelSpeed', value: 0.25 },
      { type: 'discoveryBonus', value: 0.1 }
    ]
  }
];

export function getPersonalityById(id: string): Personality | undefined {
  return PERSONALITIES.find(p => p.id === id);
}
