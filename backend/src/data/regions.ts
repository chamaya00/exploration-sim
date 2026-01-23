import { Region } from '../types';

export const REGIONS: Region[] = [
  {
    id: 'the_gate',
    name: 'The Gate',
    description: 'Where all journeys begin. Safe, but unremarkable.',
    dangerLevel: 1,
    discoveryRichness: 2,
    connectedTo: ['mistwood'],
    distanceFromGate: 0,
    secrets: [
      {
        id: 'gate_inscription',
        name: 'Ancient Inscription',
        description: 'Words carved into the gate itself...',
        discoveredText: '{name} traced the worn carvings on the gate. Words from before memory.'
      }
    ],
    possibleItems: []
  },
  {
    id: 'mistwood',
    name: 'The Mistwood',
    description: 'Dense forest shrouded in perpetual fog. Easy to get lost.',
    dangerLevel: 3,
    discoveryRichness: 5,
    connectedTo: ['the_gate', 'crystal_caves', 'the_depths'],
    distanceFromGate: 1,
    secrets: [
      {
        id: 'hidden_shrine',
        name: 'Hidden Shrine',
        description: 'A moss-covered shrine to something forgotten',
        discoveredText: '{name} pushed through the mist and found a shrine older than the trees around it.'
      },
      {
        id: 'safe_path',
        name: 'The Safe Path',
        description: 'A route through the wood that the mist cannot touch',
        discoveredText: '{name} noticed the fog parting along a faint trail. A path the mist fears?'
      }
    ],
    possibleItems: ['travelers_charm', 'fog_cloak']
  },
  {
    id: 'crystal_caves',
    name: 'Crystal Caves',
    description: 'Glittering underground passages. Beautiful and treacherous.',
    dangerLevel: 5,
    discoveryRichness: 7,
    connectedTo: ['mistwood', 'the_summit'],
    distanceFromGate: 2,
    secrets: [
      {
        id: 'crystal_heart',
        name: 'The Crystal Heart',
        description: 'A massive crystal that pulses with inner light',
        discoveredText: '{name} entered a chamber dominated by a crystal the size of a house. It was... breathing.'
      },
      {
        id: 'echo_chamber',
        name: 'Echo Chamber',
        description: 'A place where whispers never die',
        discoveredText: "Voices. Not {name}'s own. Words from explorers long gone, trapped in the stone."
      }
    ],
    possibleItems: ['crystal_shard', 'glowstone', 'echo_compass']
  },
  {
    id: 'the_depths',
    name: 'The Depths',
    description: 'Ancient ruins descending into darkness. What built this place?',
    dangerLevel: 7,
    discoveryRichness: 8,
    connectedTo: ['mistwood', 'the_summit'],
    distanceFromGate: 2,
    secrets: [
      {
        id: 'library_remains',
        name: 'Library Remains',
        description: 'Fragments of knowledge from before',
        discoveredText: '{name} found shelves carved into the walls. Most empty. But not all.'
      },
      {
        id: 'the_machine',
        name: 'The Machine',
        description: 'It still works. But what does it do?',
        discoveredText: 'Gears turned as {name} approached. Something here still lives. Still waits.'
      }
    ],
    possibleItems: ['ancient_key', 'preserved_scroll', 'depth_lantern']
  },
  {
    id: 'the_summit',
    name: 'The Summit',
    description: 'The highest point. The end of all journeys, one way or another.',
    dangerLevel: 9,
    discoveryRichness: 10,
    connectedTo: ['crystal_caves', 'the_depths'],
    distanceFromGate: 3,
    secrets: [
      {
        id: 'sky_shrine',
        name: 'Sky Shrine',
        description: 'An altar open to the heavens',
        discoveredText: '{name} stood at the peak. An altar waited there, aimed at stars no map has named.'
      },
      {
        id: 'the_truth',
        name: 'The Truth',
        description: 'What the Beyond actually is',
        discoveredText: "At the summit, {name} finally understood. The Beyond is not a place. It's a--"
      }
    ],
    possibleItems: ['star_fragment', 'summit_stone', 'truth_shard']
  }
];

export function getRegionById(id: string): Region | undefined {
  return REGIONS.find(r => r.id === id);
}
