export const QUIET_JOURNAL_TEMPLATES: Record<string, string[]> = {
  the_gate: [
    '{name} rested near the gate, watching others prepare to leave.',
    'The gate hummed quietly. {name} wondered what lay beyond.',
    '{name} checked their supplies one more time.',
    'The air near the gate felt different. Charged, somehow.',
    '{name} watched the horizon, gathering courage.'
  ],
  mistwood: [
    'The mist swirled around {name}. Everything looked the same.',
    '{name} followed the sound of water through the fog.',
    'Something moved in the mist. {name} waited. Nothing.',
    'The trees here were ancient. {name} felt watched.',
    'Footsteps echoed strangely in the mist. Were they alone?',
    '{name} pressed deeper into the fog, one careful step at a time.',
    'The mist thinned briefly. {name} caught a glimpse of sky.'
  ],
  crystal_caves: [
    'Light danced on the cave walls. {name} paused to watch.',
    'The crystals sang softly when {name} passed.',
    'Deeper into the caves. The air grew cold.',
    '{name} found a chamber of perfect silence.',
    'Colors {name} had never seen before reflected off every surface.',
    'The crystals here grew in impossible patterns.',
    '{name} rested against a warm crystal. It pulsed like a heartbeat.'
  ],
  the_depths: [
    'The ruins stretched endlessly downward.',
    '{name} found marks on the wall. Someone was here before.',
    'The machine sounds were louder here. Closer.',
    'Darkness pressed in from all sides. {name} kept moving.',
    'Ancient symbols covered the walls. {name} traced them without understanding.',
    'The air was stale. How long since anyone breathed here?',
    '{name} found a room filled with broken statues. Broken by what?'
  ],
  the_summit: [
    'The wind cut through everything.',
    '{name} could see forever from here.',
    'The sky was different at the summit. Wrong, somehow.',
    'So few had made it this far. {name} understood why.',
    'The silence at the summit was absolute.',
    '{name} felt the weight of every step that brought them here.',
    'Stars were visible even in daylight. They moved too fast.'
  ]
};

export const ESCAPE_TEMPLATES: Record<string, string[]> = {
  mistwood: [
    '{name} ducked into the mist just in time.',
    'The fog provided cover. {name} slipped away unseen.',
    '{name} scrambled up a tree. Whatever it was passed below.'
  ],
  crystal_caves: [
    '{name} squeezed through a narrow crystal gap.',
    'The light confused it. {name} escaped in the glare.',
    '{name} dropped into a lower passage. Safe, for now.'
  ],
  the_depths: [
    '{name} hid in the shadows of the ancient machines.',
    'A door sealed behind {name}. Something pounded on the other side.',
    '{name} ran. The echoes made it impossible to follow.'
  ],
  the_summit: [
    '{name} found shelter behind a stone outcrop.',
    'The wind shifted. {name} used it to disappear.',
    '{name} dropped below the ridgeline. Out of sight, out of danger.'
  ]
};

export const INJURY_TEMPLATES: Record<string, string[]> = {
  mistwood: [
    '{name} stumbled into a thorn thicket. The scratches burned.',
    'Something bit {name} in the fog. They never saw what.',
    '{name} fell into a hidden ravine. The climb back was painful.'
  ],
  crystal_caves: [
    'A crystal formation collapsed. {name} barely avoided the worst.',
    '{name} slipped on wet stone. Their leg would remember this.',
    'The air here was wrong. {name} coughed blood.'
  ],
  the_depths: [
    'Something in the darkness struck {name}.',
    'A mechanism triggered. {name} was lucky to escape with just wounds.',
    '{name} touched the wrong thing. The burns were severe.'
  ],
  the_summit: [
    'The cold sapped {name}\'s strength. Frostbite was setting in.',
    'A rockslide. {name} was caught in the edge of it.',
    'Lightning struck nearby. {name} felt the charge through their whole body.'
  ]
};

export const DEATH_TEMPLATES: Record<string, string[]> = {
  mistwood: [
    '{name} wandered too deep into the mist.',
    'The mist took {name}.',
    '{name} was last seen walking into the fog. They never walked out.'
  ],
  crystal_caves: [
    "The cave collapsed. {name} didn't escape.",
    '{name} fell into the darkness.',
    'The crystals dimmed. When they lit again, {name} was gone.'
  ],
  the_depths: [
    'Something in the depths found {name}.',
    'The machines finally noticed {name}.',
    '{name} descended too far. Some depths have no bottom.'
  ],
  the_summit: [
    'The summit claimed {name}.',
    'The cold was too much. {name} stopped moving.',
    '{name} saw something at the peak. It was the last thing they saw.'
  ],
  lost_returning: [
    '{name} never made it home.',
    'The way back was harder than {name} knew.',
    'So close to the gate. But not close enough.'
  ],
  injuries: [
    "{name}'s wounds were too severe.",
    '{name} fought hard. But the body has limits.',
    'Rest would not come. {name} grew still.'
  ]
};

export const MINOR_DISCOVERY_TEMPLATES: Record<string, string[]> = {
  the_gate: [
    '{name} found footprints from those who came before.',
    'A message scratched into the gate: "Keep moving."'
  ],
  mistwood: [
    '{name} found the remains of an old campfire. Cold for years.',
    'Strange mushrooms grew here. {name} left them alone.',
    'Animal tracks crossed the path. Something large.'
  ],
  crystal_caves: [
    '{name} discovered a pool of perfectly still water.',
    'Old mining tools. Someone tried to harvest the crystals.',
    'A skeleton, half-buried in crystal. {name} moved on quickly.'
  ],
  the_depths: [
    '{name} found a room of broken clocks. All stopped at the same time.',
    'Writing on the walls. A language no one speaks anymore.',
    'Tools of unknown purpose. {name} dared not touch them.'
  ],
  the_summit: [
    '{name} found cairns built by other explorers.',
    'The bones of a great beast, half-buried in snow.',
    'A view of lands not shown on any map.'
  ]
};

export const RETURN_TEMPLATES: string[] = [
  '{name} pressed on toward the gate. Not far now.',
  'Home. The word kept {name} moving.',
  'Every step brought {name} closer to safety.',
  '{name} could almost see the gate through the trees.',
  'The compass needle swung. Home was that way.',
  '{name} thought of all they would tell when they returned.',
  'Tired. Hurt. But alive. {name} kept walking.'
];

export function getRandomTemplate(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

export function fillTemplate(template: string, name: string): string {
  return template.replace(/{name}/g, name);
}
