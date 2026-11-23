// The thief's tools for NIGHTSHIFT. Every tool is limited and costs a
// use, so the player spends them where the plan needs them most:
// EMP kills cameras, smoke hides the thief, a noisemaker pulls a guard
// away, and the lockpick is time spent exposed beside the loot.

export const TOOL_COST = { emp: 1, smoke: 1, noise: 1 };
export const EMP_SECONDS = 6;
export const SMOKE_SECONDS = 5;
export const LOCKPICK_SECONDS = 1.5;
export const NOISE_RADIUS = 260;

export function createTools() {
  return { emp: 2, smoke: 2, noise: 2 };
}

export function useEmp(tools, cameras, now) {
  if (tools.emp <= 0) return false;
  tools.emp -= 1;
  return true;
}

export function useSmoke(tools, smokes, x, y, now) {
  if (tools.smoke <= 0) return false;
  tools.smoke -= 1;
  smokes.push({ x, y, r: 90, until: now + SMOKE_SECONDS });
  return true;
}

export function throwNoisemaker(tools, noises, x, y, now) {
  if (tools.noise <= 0) return false;
  tools.noise -= 1;
  noises.push({ x, y, until: now + 2.2 });
  return true;
}

// True when the thief is inside a smoke cloud (unseeable).
export function insideSmoke(smokes, x, y, now) {
  for (const s of smokes) {
    if (now < s.until && Math.hypot(x - s.x, y - s.y) < s.r) return true;
  }
  return false;
}

export function pruneEffects(smokes, noises, now) {
  for (let i = smokes.length - 1; i >= 0; i--) {
    if (now >= smokes[i].until) smokes.splice(i, 1);
  }
  for (let i = noises.length - 1; i >= 0; i--) {
    if (now >= noises[i].until) noises.splice(i, 1);
  }
}

// Lockpick channel: hold E beside untaken loot. Moving cancels it.
// Returns the loot being picked, or null.
export function nearestLootInReach(room, thief, reach) {
  let best = null, bestDist = Infinity;
  for (const l of room.loot) {
    if (l.taken) continue;
    const d = Math.hypot(l.x - thief.x, l.y - thief.y);
    if (d < reach && d < bestDist) { bestDist = d; best = l; }
  }
  return best;
}

export function advanceLockpick(loot, dt) {
  loot.channel += dt;
  if (loot.channel >= LOCKPICK_SECONDS) {
    loot.taken = true;
    loot.channel = 0;
    return true;
  }
  return false;
}

export function cancelLockpick(room) {
  for (const l of room.loot) l.channel = 0;
}
