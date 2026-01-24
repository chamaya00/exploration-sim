import { Keepsake } from '../types';

export const KEEPSAKES: Keepsake[] = [
  {
    id: 'letter',
    name: 'A letter never sent',
    deathMention: "{name}'s hand found the letter in their pocket."
  },
  {
    id: 'ring',
    name: 'A ring that no longer fits',
    deathMention: '{name} touched the ring one last time.'
  },
  {
    id: 'drawing',
    name: "A child's drawing",
    deathMention: 'The drawing was creased from being held so often.'
  },
  {
    id: 'seeds',
    name: 'Seeds from the old garden',
    deathMention: 'The seeds would never grow now.'
  },
  {
    id: 'coin',
    name: 'A lucky coin',
    deathMention: '{name} flipped the coin. It landed on edge.'
  },
  {
    id: 'nothing',
    name: 'Nothing - they left it all behind',
    deathMention: 'They had come with nothing. They left with nothing.'
  }
];

export function getKeepsakeById(id: string): Keepsake | undefined {
  return KEEPSAKES.find(k => k.id === id);
}
