import { Item } from '../types';

export const ITEMS: Item[] = [
  // === GUILD SUPPLIES (always available) ===
  {
    id: 'rations',
    name: 'Rations',
    description: 'Three days of food',
    flavorText: 'Not tasty, but reliable',
    rarity: 'common',
    source: 'guild',
    consumable: true,
    effects: [{ type: 'survivalBonus', value: 0.15 }],
    journalMentions: ['{name} ate sparingly from their rations.']
  },
  {
    id: 'rope',
    name: 'Rope',
    description: 'Fifty feet of strong hemp',
    flavorText: 'A hundred uses',
    rarity: 'common',
    source: 'guild',
    consumable: false,
    effects: [
      { type: 'escapeChance', value: 0.15 },
      { type: 'survivalRegion', value: 0.2, condition: 'crystal_caves' }
    ],
    journalMentions: ['The rope held firm.', '{name} coiled the rope carefully.']
  },
  {
    id: 'lantern',
    name: 'Lantern',
    description: 'Oil lamp with spare fuel',
    flavorText: 'Push back the dark',
    rarity: 'common',
    source: 'guild',
    consumable: false,
    effects: [
      { type: 'survivalRegion', value: 0.25, condition: 'crystal_caves' },
      { type: 'survivalRegion', value: 0.25, condition: 'the_depths' }
    ],
    journalMentions: ['The lantern flickered but held.', '{name} checked the oil. Enough for now.']
  },
  {
    id: 'healing_salve',
    name: 'Healing Salve',
    description: 'Numbs pain, prevents infection',
    flavorText: 'Burns, then bliss',
    rarity: 'common',
    source: 'guild',
    consumable: true,
    effects: [{ type: 'deathDefy', value: 0.2 }],
    journalMentions: ['{name} applied the salve, wincing.', 'The wound was bad, but the salve helped.']
  },
  {
    id: 'warm_cloak',
    name: 'Warm Cloak',
    description: 'Keeps out cold and rain',
    flavorText: 'Smells like campfires',
    rarity: 'common',
    source: 'guild',
    consumable: false,
    effects: [
      { type: 'survivalBonus', value: 0.1 },
      { type: 'restBonus', value: 0.15 }
    ],
    journalMentions: ['{name} pulled the cloak tighter.', 'Under the cloak, almost warm.']
  },
  {
    id: 'compass',
    name: 'Compass',
    description: 'Always points home',
    flavorText: 'When lost, trust the needle',
    rarity: 'common',
    source: 'guild',
    consumable: false,
    effects: [
      { type: 'travelSpeed', value: 0.15 },
      { type: 'dangerAvoid', value: 0.1 }
    ],
    journalMentions: ['{name} checked the compass. Still pointing home.']
  },

  // === FOUND ITEMS (discovered in the world) ===
  {
    id: 'travelers_charm',
    name: "Traveler's Charm",
    description: 'A worn token from a previous explorer',
    flavorText: 'Someone carried this far',
    rarity: 'uncommon',
    source: 'found',
    consumable: false,
    effects: [
      { type: 'survivalBonus', value: 0.1 },
      { type: 'travelSpeed', value: 0.1 }
    ],
    journalMentions: ['{name} rubbed the charm for luck.']
  },
  {
    id: 'fog_cloak',
    name: 'Fog Cloak',
    description: 'Woven from the mist itself',
    flavorText: 'Hard to see, hard to find',
    rarity: 'rare',
    source: 'found',
    consumable: false,
    effects: [
      { type: 'dangerAvoid', value: 0.3 },
      { type: 'survivalRegion', value: 0.3, condition: 'mistwood' }
    ],
    journalMentions: ['The fog cloak made {name} nearly invisible.']
  },
  {
    id: 'crystal_shard',
    name: 'Crystal Shard',
    description: 'Glows faintly in darkness',
    flavorText: 'Warm to the touch',
    rarity: 'uncommon',
    source: 'found',
    consumable: false,
    effects: [
      { type: 'discoveryBonus', value: 0.15 },
      { type: 'survivalRegion', value: 0.2, condition: 'crystal_caves' }
    ],
    journalMentions: ['The crystal shard pulsed gently.']
  },
  {
    id: 'glowstone',
    name: 'Glowstone',
    description: 'Never needs fuel, never dims',
    flavorText: 'What powers it?',
    rarity: 'rare',
    source: 'found',
    consumable: false,
    effects: [
      { type: 'survivalRegion', value: 0.35, condition: 'crystal_caves' },
      { type: 'survivalRegion', value: 0.35, condition: 'the_depths' },
      { type: 'discoveryBonus', value: 0.1 }
    ],
    journalMentions: ['The glowstone lit the way.']
  },
  {
    id: 'echo_compass',
    name: 'Echo Compass',
    description: 'Points toward secrets',
    flavorText: 'It knows things',
    rarity: 'rare',
    source: 'found',
    consumable: false,
    effects: [
      { type: 'secretFind', value: 0.35 },
      { type: 'discoveryBonus', value: 0.2 }
    ],
    journalMentions: ['The echo compass spun, then stopped. That way.']
  },
  {
    id: 'ancient_key',
    name: 'Ancient Key',
    description: 'Opens... something',
    flavorText: 'Heavy with purpose',
    rarity: 'rare',
    source: 'found',
    consumable: false,
    effects: [
      { type: 'secretFind', value: 0.25 },
      { type: 'survivalRegion', value: 0.2, condition: 'the_depths' }
    ],
    journalMentions: ['The key grew warm as {name} approached the door.']
  },
  {
    id: 'preserved_scroll',
    name: 'Preserved Scroll',
    description: 'Ancient knowledge, barely readable',
    flavorText: 'The ink still moves',
    rarity: 'uncommon',
    source: 'found',
    consumable: false,
    effects: [
      { type: 'discoveryBonus', value: 0.2 },
      { type: 'secretFind', value: 0.15 }
    ],
    journalMentions: ['{name} studied the scroll. Some words were clear.']
  },
  {
    id: 'depth_lantern',
    name: 'Depth Lantern',
    description: 'Burns with blue flame',
    flavorText: 'The flame fears nothing',
    rarity: 'rare',
    source: 'found',
    consumable: false,
    effects: [
      { type: 'survivalRegion', value: 0.4, condition: 'the_depths' },
      { type: 'dangerAvoid', value: 0.15 }
    ],
    journalMentions: ['The blue flame pushed back even the deepest dark.']
  },
  {
    id: 'star_fragment',
    name: 'Star Fragment',
    description: 'Fallen from above',
    flavorText: 'Cold as the void',
    rarity: 'legendary',
    source: 'found',
    consumable: false,
    effects: [
      { type: 'deathDefy', value: 0.3 },
      { type: 'secretFind', value: 0.3 },
      { type: 'survivalBonus', value: 0.15 }
    ],
    journalMentions: ['The star fragment hummed with distant light.']
  },
  {
    id: 'summit_stone',
    name: 'Summit Stone',
    description: 'From the very peak',
    flavorText: 'It remembers the sky',
    rarity: 'legendary',
    source: 'found',
    consumable: false,
    effects: [
      { type: 'survivalBonus', value: 0.25 },
      { type: 'travelSpeed', value: 0.2 },
      { type: 'discoveryBonus', value: 0.2 }
    ],
    journalMentions: ['{name} held the summit stone. It felt like home.']
  },
  {
    id: 'truth_shard',
    name: 'Truth Shard',
    description: 'A piece of something greater',
    flavorText: 'It whispers answers',
    rarity: 'legendary',
    source: 'found',
    consumable: false,
    effects: [
      { type: 'secretFind', value: 0.4 },
      { type: 'discoveryBonus', value: 0.25 },
      { type: 'deathDefy', value: 0.2 }
    ],
    journalMentions: ['The truth shard showed {name} things that could not be unseen.']
  }
];

export function getItemById(id: string): Item | undefined {
  return ITEMS.find(i => i.id === id);
}

export function getGuildItems(): Item[] {
  return ITEMS.filter(i => i.source === 'guild');
}

export function getFoundItems(): Item[] {
  return ITEMS.filter(i => i.source === 'found');
}
