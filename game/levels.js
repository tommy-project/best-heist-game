// Room definitions for NIGHTSHIFT: three rooms of rising difficulty.
// Each room is plain data: walls and cover block movement and vision,
// guards patrol waypoint loops, cameras sweep, loot must all be taken
// before the green exit opens. Coordinates are in the 1280x720 world.

export const WORLD_W = 1280;
export const WORLD_H = 720;

function rect(x, y, w, h, kind) {
  return { x, y, w, h, kind: kind || 'wall' };
}

function outerWalls() {
  return [
    rect(0, 0, 1280, 26),
    rect(0, 694, 1280, 26),
    rect(0, 0, 26, 720),
    rect(1254, 0, 26, 720),
  ];
}

export const LEVELS = [
  {
    name: 'THE MERIDIAN VAULT',
    short: 'Vault',
    palette: { floorA: '#141a2e', floorB: '#0d1122', accent: '#ffd97a', wall: '#2b3352', trim: '#3d4a75' },
    thiefStart: { x: 90, y: 620 },
    exit: { x: 1150, y: 620, w: 78, h: 56, label: 'EXIT' },
    walls: outerWalls().concat([
      rect(340, 180, 26, 220),
      rect(914, 320, 26, 220),
    ]),
    covers: [
      rect(560, 140, 44, 44, 'pillar'),
      rect(676, 140, 44, 44, 'pillar'),
      rect(560, 540, 160, 44, 'case'),
      rect(120, 120, 40, 40, 'plant'),
      rect(1120, 560, 40, 40, 'plant'),
    ],
    loot: [
      { x: 640, y: 360, name: 'Meridian Diamond', value: 25000 },
    ],
    guards: [
      { waypoints: [[300, 200], [300, 500], [640, 500], [640, 200]], speed: 72, range: 250, halfAngle: 33, pause: 0.7 },
      { waypoints: [[980, 180], [980, 520], [820, 520], [820, 180]], speed: 78, range: 250, halfAngle: 33, pause: 0.7 },
    ],
    cameras: [
      { x: 640, y: 34, baseAngle: 90, sweep: 55, speed: 0.55, range: 300, halfAngle: 30 },
    ],
  },
  {
    name: 'THE GILDED GALLERY',
    short: 'Gallery',
    palette: { floorA: '#1c1426', floorB: '#120d1c', accent: '#ffb648', wall: '#33254a', trim: '#4d3a6e' },
    thiefStart: { x: 1150, y: 620 },
    exit: { x: 52, y: 52, w: 78, h: 56, label: 'EXIT' },
    walls: outerWalls().concat([
      rect(300, 120, 200, 26),
      rect(780, 574, 200, 26),
    ]),
    covers: [
      rect(420, 180, 90, 50, 'case'),
      rect(770, 180, 90, 50, 'case'),
      rect(420, 490, 90, 50, 'case'),
      rect(770, 490, 90, 50, 'case'),
      rect(620, 330, 40, 40, 'pillar'),
    ],
    loot: [
      { x: 465, y: 245, name: 'Sunset Canvas', value: 18000 },
      { x: 815, y: 480, name: 'Golden Ibis', value: 22000 },
    ],
    guards: [
      { waypoints: [[240, 260], [240, 560], [560, 560], [560, 260]], speed: 82, range: 260, halfAngle: 32, pause: 0.5 },
      { waypoints: [[1040, 260], [1040, 560], [720, 560], [720, 260]], speed: 86, range: 260, halfAngle: 32, pause: 0.5 },
      { waypoints: [[640, 120], [640, 420], [380, 420], [900, 420], [900, 120]], speed: 76, range: 240, halfAngle: 34, pause: 0.6 },
    ],
    cameras: [
      { x: 34, y: 360, baseAngle: 0, sweep: 50, speed: 0.7, range: 300, halfAngle: 30 },
      { x: 1246, y: 360, baseAngle: 180, sweep: 50, speed: 0.6, range: 300, halfAngle: 30 },
    ],
  },
  {
    name: 'THE STARLIGHT PENTHOUSE',
    short: 'Penthouse',
    palette: { floorA: '#0f1e2a', floorB: '#0a141d', accent: '#7dd8c0', wall: '#22384a', trim: '#33536b' },
    thiefStart: { x: 90, y: 360 },
    exit: { x: 1196, y: 330, w: 58, h: 60, label: 'EXIT' },
    walls: outerWalls().concat([
      rect(430, 240, 26, 240),
      rect(824, 240, 26, 240),
    ]),
    covers: [
      rect(560, 180, 160, 50, 'sofa'),
      rect(560, 490, 160, 50, 'sofa'),
      rect(300, 360, 44, 44, 'pillar'),
      rect(936, 360, 44, 44, 'pillar'),
      rect(100, 300, 60, 120, 'case'),
    ],
    loot: [
      { x: 640, y: 120, name: 'Starlight Tiara', value: 30000 },
      { x: 640, y: 600, name: 'Nebula Opal', value: 28000 },
    ],
    guards: [
      { waypoints: [[260, 160], [260, 560], [420, 560], [420, 160]], speed: 90, range: 270, halfAngle: 31, pause: 0.4 },
      { waypoints: [[1020, 160], [1020, 560], [860, 560], [860, 160]], speed: 92, range: 270, halfAngle: 31, pause: 0.4 },
      { waypoints: [[640, 260], [640, 640], [500, 640], [780, 640], [780, 260]], speed: 84, range: 260, halfAngle: 32, pause: 0.5 },
      { waypoints: [[540, 360], [740, 360]], speed: 70, range: 250, halfAngle: 34, pause: 1.0 },
    ],
    cameras: [
      { x: 640, y: 34, baseAngle: 90, sweep: 60, speed: 0.8, range: 310, halfAngle: 29 },
      { x: 34, y: 120, baseAngle: 0, sweep: 45, speed: 0.65, range: 290, halfAngle: 30 },
      { x: 1246, y: 600, baseAngle: 180, sweep: 45, speed: 0.65, range: 290, halfAngle: 30 },
    ],
  },
];

// Build a fresh runtime copy of a room so replays never share state.
export function buildRoom(index) {
  const def = LEVELS[index % LEVELS.length];
  return {
    index,
    name: def.name,
    short: def.short,
    palette: { ...def.palette },
    thiefStart: { ...def.thiefStart },
    exit: { ...def.exit },
    walls: def.walls.map((w) => ({ ...w })),
    covers: def.covers.map((c) => ({ ...c })),
    loot: def.loot.map((l) => ({ ...l, taken: false, channel: 0 })),
    guards: def.guards.map((g) => ({
      waypoints: g.waypoints.map((p) => [...p]),
      speed: g.speed, range: g.range, halfAngle: g.halfAngle, pause: g.pause,
    })),
    cameras: def.cameras.map((c) => ({ ...c })),
  };
}

export function lootTotal(room) {
  return room.loot.reduce((sum, l) => sum + l.value, 0);
}

export function lootTakenValue(room) {
  return room.loot.filter((l) => l.taken).reduce((sum, l) => sum + l.value, 0);
}

export function allLootTaken(room) {
  return room.loot.every((l) => l.taken);
}
