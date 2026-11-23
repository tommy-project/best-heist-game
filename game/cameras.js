// Security cameras for NIGHTSHIFT: wall-mounted lenses that sweep a
// fixed arc. An EMP freezes them dark for a few seconds; while dark
// their cone is gone and they cannot raise the alarm.

import { pointInCone } from './guards.js';

export function createCameras(defs) {
  return defs.map((d) => ({
    x: d.x, y: d.y,
    baseAngle: (d.baseAngle * Math.PI) / 180,
    sweep: (d.sweep * Math.PI) / 180,
    speed: d.speed, range: d.range,
    halfAngle: (d.halfAngle * Math.PI) / 180,
    phase: Math.random() * Math.PI * 2,
    angle: (d.baseAngle * Math.PI) / 180,
    disabledUntil: 0,
  }));
}

export function updateCameras(cameras, now, dt) {
  for (const c of cameras) {
    if (now < c.disabledUntil) continue; // EMP: frozen dark
    c.phase += c.speed * dt;
    c.angle = c.baseAngle + Math.sin(c.phase) * c.sweep;
  }
}

export function cameraSeesThief(camera, thief, blockers, now) {
  if (now < camera.disabledUntil) return false;
  return pointInCone(thief.x, thief.y, camera.x, camera.y, camera.angle, camera.range, camera.halfAngle, blockers);
}

export function camerasDisabledCount(cameras, now) {
  return cameras.filter((c) => now < c.disabledUntil).length;
}

export function empBlast(cameras, now, seconds) {
  for (const c of cameras) c.disabledUntil = now + seconds;
}
