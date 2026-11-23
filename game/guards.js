// Guard patrols, vision cones and pursuit for NIGHTSHIFT.
// A guard walks its waypoint loop, pauses at each stop, and sweeps its
// gaze along its direction of travel. When it sees the thief it raises
// the alarm and gives chase; a noisemaker pulls it off patrol to listen.

export function createGuards(defs) {
  return defs.map((d) => {
    const start = d.waypoints[0];
    return {
      x: start[0], y: start[1],
      waypoints: d.waypoints,
      targetIndex: 1 % d.waypoints.length,
      speed: d.speed, range: d.range,
      halfAngle: (d.halfAngle * Math.PI) / 180,
      pause: d.pause, pauseLeft: 0,
      angle: Math.PI / 2, // facing down the room at spawn
      mode: 'patrol', // patrol | chase | investigate
      investigateX: 0, investigateY: 0, investigateLeft: 0,
      chaseLeft: 0,
      seenFlash: 0,
    };
  });
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1, dy = y2 - y1;
  let tMin = 0, tMax = 1;
  const axes = [
    [dx, x1 - r.x, r.w],
    [dy, y1 - r.y, r.h],
  ];
  for (const [d, origin, size] of axes) {
    if (Math.abs(d) < 1e-9) {
      if (origin < 0 || origin > size) return false;
    } else {
      let t1 = -origin / d;
      let t2 = (size - origin) / d;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      if (t1 > tMin) tMin = t1;
      if (t2 < tMax) tMax = t2;
      if (tMin > tMax) return false;
    }
  }
  return true;
}

// True when no wall or cover stands between the two points.
export function lineOfSightClear(x1, y1, x2, y2, blockers) {
  for (const b of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return false;
  }
  return true;
}

// True when the point is inside the cone and visible.
export function pointInCone(px, py, ox, oy, angle, range, halfAngle, blockers) {
  const dx = px - ox, dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 26) return lineOfSightClear(ox, oy, px, py, blockers);
  const want = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(want, angle)) > halfAngle) return false;
  return lineOfSightClear(ox, oy, px, py, blockers);
}

export function guardSeesThief(guard, thief, blockers) {
  return pointInCone(thief.x, thief.y, guard.x, guard.y, guard.angle, guard.range, guard.halfAngle, blockers);
}

function moveToward(g, tx, ty, dt) {
  const dx = tx - g.x, dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = g.speed * dt;
  if (step >= dist) { g.x = tx; g.y = ty; return true; }
  g.x += (dx / dist) * step;
  g.y += (dy / dist) * step;
  g.angle = Math.atan2(dy, dx);
  return false;
}

export function updateGuards(guards, dt, thief, blockers, effects) {
  for (const g of guards) {
    if (g.seenFlash > 0) g.seenFlash -= dt;
    if (g.mode === 'chase') {
      g.chaseLeft -= dt;
      const arrived = moveToward(g, thief.x, thief.y, dt * 1.18);
      if (g.chaseLeft <= 0 || arrived) { g.mode = 'patrol'; }
      continue;
    }
    if (g.mode === 'investigate') {
      g.investigateLeft -= dt;
      const arrived = moveToward(g, g.investigateX, g.investigateY, dt);
      if (g.investigateLeft <= 0 || arrived) {
        if (arrived) { g.pauseLeft = 1.2; }
        g.mode = 'patrol';
      }
      continue;
    }
    // Patrol: walk the loop, pausing at each waypoint.
    if (g.pauseLeft > 0) {
      g.pauseLeft -= dt;
      continue;
    }
    const target = g.waypoints[g.targetIndex];
    const arrived = moveToward(g, target[0], target[1], dt);
    if (arrived) {
      g.targetIndex = (g.targetIndex + 1) % g.waypoints.length;
      g.pauseLeft = g.pause;
    }
  }
}

// A noisemaker landing pulls the nearest patrolling guard over to listen.
export function distractGuards(guards, x, y) {
  let best = null, bestDist = Infinity;
  for (const g of guards) {
    if (g.mode !== 'patrol') continue;
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestDist) { bestDist = d; best = g; }
  }
  if (best) {
    best.mode = 'investigate';
    best.investigateX = x;
    best.investigateY = y;
    best.investigateLeft = 6;
    return best;
  }
  return null;
}

export function startChase(guard) {
  guard.mode = 'chase';
  guard.chaseLeft = 2.5;
  guard.seenFlash = 0.4;
}
