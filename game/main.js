// NIGHTSHIFT — game orchestration: state machine, main loop, thief
// movement and collision, the alarm meter with its fair warning beat,
// tool wiring, win / lose, and the demo staging used for screenshots.
// The room data lives in levels.js; guards, cameras, tools, sound,
// rendering and the HUD each own their own module.

import { LEVELS, buildRoom, allLootTaken, lootTakenValue } from './levels.js';
import { createGuards, updateGuards, guardSeesThief, distractGuards, startChase } from './guards.js';
import { createCameras, updateCameras, cameraSeesThief, empBlast } from './cameras.js';
import { createTools, useEmp, useSmoke, throwNoisemaker, insideSmoke, pruneEffects, nearestLootInReach, advanceLockpick, cancelLockpick, EMP_SECONDS } from './tools.js';
import { render } from './render.js';
import { createInput, moveVector, consumeClick, consumeKey } from './input.js';
import { updateHud, showHud, showTitle, showEnd, showBanner, showEndScreen, formatTime, formatMoney } from './hud.js';
import { unlockAudio, playFootstep, playPickup, playWarning, playCaught, playEmp, playWin, playClick, setAlarmLevel } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);

const THIEF_SPEED = 205;
const THIEF_RADIUS = 13;
const GRACE_SECONDS = 0.55;   // fair warning beat before the alarm climbs
const ALARM_RISE = 30;        // points per second while seen
const ALARM_FALL = 9;         // points per second while hidden
const CHASE_AFTER = 0.9;      // seconds of being seen before guards run

const state = {
  screen: 'title', // title | playing | roomclear | win | lost
  roomIndex: 0,
  room: null,
  thief: { x: 90, y: 620, moving: false },
  guards: [],
  cameras: [],
  alarm: 0,
  alarmPeak: 0,
  spotted: false,
  grace: 0,
  warned: false,
  tools: createTools(),
  smokes: [],
  noises: [],
  empFlash: 0,
  time: 0,
  now: 0,
  totalTime: 0,
  totalLoot: 0,
  entryLoot: 0, // totals as they stood when the current room was entered
  entryTime: 0,
  hiddenInSmoke: false,
  allLootTaken: false,
  bannerUntil: 0,
  bannerText: '',
  stepTimer: 0,
  endReason: '',
};

function solids() {
  return state.room.walls.concat(state.room.covers);
}

function circleHitsSolids(x, y) {
  for (const s of solids()) {
    const nx = Math.max(s.x, Math.min(x, s.x + s.w));
    const ny = Math.max(s.y, Math.min(y, s.y + s.h));
    if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < THIEF_RADIUS * THIEF_RADIUS) return true;
  }
  return false;
}

function moveThief(dt) {
  const v = moveVector(input);
  const moving = v.x !== 0 || v.y !== 0;
  state.thief.moving = moving;
  if (!moving) return;
  const step = THIEF_SPEED * dt;
  const nx = state.thief.x + v.x * step;
  if (!circleHitsSolids(nx, state.thief.y)) state.thief.x = nx;
  const ny = state.thief.y + v.y * step;
  if (!circleHitsSolids(state.thief.x, ny)) state.thief.y = ny;
  state.thief.x = Math.max(26 + THIEF_RADIUS, Math.min(1254 - THIEF_RADIUS, state.thief.x));
  state.thief.y = Math.max(26 + THIEF_RADIUS, Math.min(694 - THIEF_RADIUS, state.thief.y));
  cancelLockpick(state.room);
  state.stepTimer -= dt;
  if (state.stepTimer <= 0) {
    state.stepTimer = 0.32;
    playFootstep();
  }
}

function updateAlarm(dt) {
  const blockers = solids();
  state.hiddenInSmoke = insideSmoke(state.smokes, state.thief.x, state.thief.y, state.now);
  let seen = false;
  let seeingGuard = null;
  if (!state.hiddenInSmoke) {
    for (const g of state.guards) {
      if (guardSeesThief(g, state.thief, blockers)) { seen = true; seeingGuard = g; break; }
    }
    if (!seen) {
      for (const c of state.cameras) {
        if (cameraSeesThief(c, state.thief, blockers, state.now)) { seen = true; break; }
      }
    }
  }
  state.spotted = seen;
  if (seen) {
    state.grace += dt;
    if (!state.warned) {
      state.warned = true;
      playWarning();
      flashBanner('SPOTTED!', 1.2);
    }
    if (state.grace > GRACE_SECONDS) {
      state.alarm = Math.min(100, state.alarm + ALARM_RISE * dt);
    }
    if (state.grace > CHASE_AFTER && seeingGuard && seeingGuard.mode === 'patrol') {
      startChase(seeingGuard);
    }
  } else {
    state.grace = 0;
    state.warned = false;
    state.alarm = Math.max(0, state.alarm - ALARM_FALL * dt);
  }
  state.alarmPeak = Math.max(state.alarmPeak, state.alarm);
  setAlarmLevel(state.alarm / 100);
}

function updateTools(dt) {
  if (consumeKey(input, 'Digit1')) {
    if (state.tools.emp > 0) {
      useEmp(state.tools, state.cameras, state.now);
      empBlast(state.cameras, state.now, EMP_SECONDS);
      state.empFlash = state.now + 0.4;
      playEmp();
      flashBanner('EMP — CAMERAS DARK', 1.4);
    }
  }
  if (consumeKey(input, 'Digit2')) {
    if (useSmoke(state.tools, state.smokes, state.thief.x, state.thief.y, state.now)) {
      flashBanner('SMOKE — YOU ARE HIDDEN', 1.4);
    }
  }
  const click = consumeClick(input);
  if (click) {
    if (throwNoisemaker(state.tools, state.noises, click.x, click.y, state.now)) {
      distractGuards(state.guards, click.x, click.y);
      flashBanner('NOISEMAKER THROWN', 1.2);
    }
  }
  pruneEffects(state.smokes, state.noises, state.now);
}

function updateLockpick(dt) {
  if (!input.interactHeld || state.thief.moving) return;
  const loot = nearestLootInReach(state.room, state.thief, 62);
  if (!loot) return;
  if (advanceLockpick(loot, dt)) {
    playPickup();
    state.totalLoot += loot.value;
    flashBanner('LOOT SECURED — ' + formatMoney(loot.value), 1.6);
  }
}

function updateExit() {
  state.allLootTaken = allLootTaken(state.room);
  if (!state.allLootTaken) return;
  const e = state.room.exit;
  const t = state.thief;
  if (t.x > e.x && t.x < e.x + e.w && t.y > e.y && t.y < e.y + e.h) {
    roomCleared();
  }
}

function updateCaught() {
  for (const g of state.guards) {
    if (Math.hypot(g.x - state.thief.x, g.y - state.thief.y) < 26) {
      state.alarm = 100;
      loseGame('A guard grabbed you in the open.');
      return;
    }
  }
  if (state.alarm >= 100) {
    loseGame('The alarm hit 100% and the room locked down.');
  }
}

function flashBanner(text, seconds) {
  state.bannerText = text;
  state.bannerUntil = state.now + seconds;
}

function roomCleared() {
  state.totalTime += state.time;
  if (state.roomIndex >= LEVELS.length - 1) {
    state.screen = 'win';
    playWin();
    setAlarmLevel(0);
    showEndScreen('win', {
      lines: [
        ['Total loot', formatMoney(state.totalLoot)],
        ['Total time', formatTime(state.totalTime)],
        ['Rooms cleared', '3 / 3'],
        ['Peak alarm', Math.round(state.alarmPeak) + '%'],
      ],
    });
  } else {
    state.screen = 'roomclear';
    playWin();
    setAlarmLevel(0);
    showEndScreen('roomclear', {
      lines: [
        ['Room loot', formatMoney(lootTakenValue(state.room))],
        ['Room time', formatTime(state.time)],
        ['Total loot so far', formatMoney(state.totalLoot)],
        ['Peak alarm', Math.round(state.alarmPeak) + '%'],
      ],
    });
  }
  showHud(false);
  showBanner('', false);
}

function loseGame(reason) {
  if (state.screen !== 'playing') return;
  state.screen = 'lost';
  state.endReason = reason;
  playCaught();
  setAlarmLevel(0);
  showHud(false);
  showBanner('', false);
  showEndScreen('lost', {
    reason,
    lines: [
      ['Room', state.room.name],
      ['Loot taken', formatMoney(lootTakenValue(state.room))],
      ['Time survived', formatTime(state.time)],
      ['Peak alarm', Math.round(state.alarmPeak) + '%'],
    ],
  });
}

function setupRoom(index) {
  state.roomIndex = index;
  state.room = buildRoom(index);
  state.thief.x = state.room.thiefStart.x;
  state.thief.y = state.room.thiefStart.y;
  state.thief.moving = false;
  state.guards = createGuards(state.room.guards);
  state.cameras = createCameras(state.room.cameras);
  state.alarm = 0;
  state.alarmPeak = 0;
  state.spotted = false;
  state.grace = 0;
  state.warned = false;
  state.tools = createTools();
  state.smokes = [];
  state.noises = [];
  state.empFlash = 0;
  state.time = 0;
  state.allLootTaken = false;
  state.hiddenInSmoke = false;
  state.bannerUntil = 0;
  state.entryLoot = state.totalLoot;
  state.entryTime = state.totalTime;
}

function loadRoom(index) {
  // Replay / retry of the room already loaded: roll its contribution
  // back to the totals as they stood when the room was entered, so the
  // same loot cannot be banked twice and cleared time is not re-added.
  if (state.room && index === state.roomIndex) {
    state.totalLoot = state.entryLoot;
    state.totalTime = state.entryTime;
  }
  setupRoom(index);
  showEnd(false);
  showTitle(false);
  showHud(true);
  state.screen = 'playing';
  updateHud(state);
}

function startGame(roomIndex) {
  state.totalLoot = 0;
  state.totalTime = 0;
  loadRoom(roomIndex || 0);
}

// Demo / screenshot staging from URL params: ?demo=1 starts at once,
// ?room=N picks the room, ?stage=emp|loot|getaway|spotted|smoke presets
// a moment inside the room. This is the game's own code rendering.
function applyStaging() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('demo') && !params.has('room') && !params.has('stage')) return false;
  const roomIndex = Math.min(LEVELS.length - 1, Math.max(0, parseInt(params.get('room') || '0', 10) || 0));
  startGame(roomIndex);
  const stage = params.get('stage') || '';
  if (stage === 'emp') {
    useEmp(state.tools, state.cameras, state.now);
    empBlast(state.cameras, state.now, EMP_SECONDS);
    state.empFlash = state.now + 30; // hold the flash tint for the shot
    const loot = state.room.loot[0];
    state.thief.x = loot.x - 90;
    state.thief.y = loot.y + 40;
  } else if (stage === 'loot') {
    const loot = state.room.loot[0];
    state.thief.x = loot.x - 40;
    state.thief.y = loot.y + 30;
    loot.channel = 0.9;
  } else if (stage === 'getaway') {
    for (const l of state.room.loot) l.taken = true;
    state.totalLoot = lootTakenValue(state.room);
    const e = state.room.exit;
    state.thief.x = e.x - 70;
    state.thief.y = e.y + e.h / 2;
    state.allLootTaken = true;
  } else if (stage === 'spotted') {
    const g = state.guards[0];
    state.thief.x = g.x + Math.cos(g.angle) * 150;
    state.thief.y = g.y + Math.sin(g.angle) * 150;
    state.alarm = 55;
    state.grace = 1.2;
    state.spotted = true;
  } else if (stage === 'smoke') {
    useSmoke(state.tools, state.smokes, state.thief.x, state.thief.y, state.now);
    const loot = state.room.loot[0];
    state.thief.x = loot.x - 120;
    state.thief.y = loot.y;
  }
  updateHud(state);
  return true;
}

function update(dt) {
  state.now += dt;
  state.time += dt;
  moveThief(dt);
  updateTools(dt);
  updateLockpick(dt);
  updateGuards(state.guards, dt, state.thief, solids(), null);
  updateCameras(state.cameras, state.now, dt);
  updateAlarm(dt);
  updateExit();
  updateCaught();
  if (state.now < state.bannerUntil) showBanner(state.bannerText, false);
  else showBanner('', false);
  updateHud(state);
}

let lastTimestamp = 0;
function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000 || 0.016);
  lastTimestamp = timestamp;
  if (state.screen === 'playing') update(dt);
  render(ctx, state);
  requestAnimationFrame(frame);
}

document.getElementById('start-btn').addEventListener('click', () => {
  unlockAudio();
  playClick();
  startGame(0);
});
document.getElementById('again-btn').addEventListener('click', () => {
  unlockAudio();
  playClick();
  if (state.screen === 'win') startGame(0);
  else loadRoom(state.roomIndex);
});
document.getElementById('next-btn').addEventListener('click', () => {
  unlockAudio();
  playClick();
  loadRoom(state.roomIndex + 1);
});

// Test handle: the playtest driver reads state and drives input here.
window.HEIST = { state, startGame, loadRoom, input };

// Backdrop room behind the title screen, so the first paint already
// shows the vault, its guards and its loot.
setupRoom(0);
if (!applyStaging()) {
  render(ctx, state);
  showTitle(true);
}
requestAnimationFrame(frame);
