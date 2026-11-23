// Canvas rendering for NIGHTSHIFT: a cinematic night-heist look —
// dark marble floors with a soft sheen, warm gold loot glow, red
// vision cones that read as danger at a glance, teal safe cover, and
// a green exit door. No tiles, no sprites: every shape is drawn.

import { WORLD_W, WORLD_H } from './levels.js';

function conePath(ctx, x, y, angle, range, halfAngle) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, color, alpha) {
  const grad = ctx.createRadialGradient(x, y, 10, x, y, range);
  grad.addColorStop(0, color.replace('A', String(alpha)));
  grad.addColorStop(1, color.replace('A', '0'));
  conePath(ctx, x, y, angle, range, halfAngle);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = color.replace('A', '0.25');
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, room) {
  const p = room.palette;
  const grad = ctx.createLinearGradient(0, 0, WORLD_W, WORLD_H);
  grad.addColorStop(0, p.floorA);
  grad.addColorStop(1, p.floorB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  // Marble sheen: faint large tiles and a diagonal light wash.
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 160; x < WORLD_W; x += 160) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke();
  }
  for (let y = 120; y < WORLD_H; y += 120) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke();
  }
  const wash = ctx.createLinearGradient(0, 0, WORLD_W, 0);
  wash.addColorStop(0, 'rgba(255,217,122,0.05)');
  wash.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  wash.addColorStop(1, 'rgba(125,216,192,0.05)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}

function drawWalls(ctx, room) {
  for (const w of room.walls) {
    ctx.fillStyle = room.palette.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = room.palette.trim;
    if (w.h <= 26) ctx.fillRect(w.x, w.y + w.h - 4, w.w, 4);
    else ctx.fillRect(w.x + w.w - 4, w.y, 4, w.h);
  }
}

function drawCovers(ctx, room) {
  for (const c of room.covers) {
    if (c.kind === 'pillar') {
      ctx.fillStyle = '#3a2f22';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9a86a';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a6f3f';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 13, 0, Math.PI * 2); ctx.fill();
    } else if (c.kind === 'case') {
      ctx.fillStyle = 'rgba(180,200,255,0.16)';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#8fa8d8';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(c.x + 6, c.y + 5, c.w - 12, 8);
    } else if (c.kind === 'sofa') {
      ctx.fillStyle = '#5a2436';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#7a3049';
      ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
      ctx.strokeStyle = '#c98a2e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    } else { // plant
      ctx.fillStyle = '#2c4a2e';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f7a44';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 6, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawExit(ctx, room, allTaken, now) {
  const e = room.exit;
  const open = allTaken;
  const pulse = open ? 0.65 + 0.35 * Math.sin(now * 4) : 0.35;
  ctx.fillStyle = open ? 'rgba(47,214,163,' + pulse + ')' : 'rgba(47,214,163,0.18)';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? '#2fd6a3' : '#2a7a5e';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = open ? '#06281d' : '#9fd8c0';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT OPEN' : 'EXIT', e.x + e.w / 2, e.y + e.h / 2);
  if (open) {
    ctx.strokeStyle = 'rgba(47,214,163,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x - 6, e.y - 6, e.w + 12, e.h + 12);
  }
}

function drawLoot(ctx, room, now) {
  for (const l of room.loot) {
    if (l.taken) continue;
    const bob = Math.sin(now * 2 + l.x) * 3;
    const glow = ctx.createRadialGradient(l.x, l.y + bob, 4, l.x, l.y + bob, 70);
    glow.addColorStop(0, 'rgba(255,217,122,0.55)');
    glow.addColorStop(1, 'rgba(255,217,122,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(l.x, l.y + bob, 70, 0, Math.PI * 2); ctx.fill();
    // Diamond / gem shape.
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.moveTo(l.x, l.y - 16 + bob);
    ctx.lineTo(l.x + 12, l.y - 4 + bob);
    ctx.lineTo(l.x, l.y + 12 + bob);
    ctx.lineTo(l.x - 12, l.y - 4 + bob);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath();
    ctx.moveTo(l.x, l.y - 16 + bob);
    ctx.lineTo(l.x + 12, l.y - 4 + bob);
    ctx.lineTo(l.x, l.y - 4 + bob);
    ctx.lineTo(l.x - 12, l.y - 4 + bob);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,233,168,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(l.x, l.y + bob, 22, 0, Math.PI * 2); ctx.stroke();
    // Lockpick progress ring.
    if (l.channel > 0) {
      ctx.strokeStyle = '#ffd97a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(l.x, l.y + bob, 30, -Math.PI / 2, -Math.PI / 2 + (l.channel / 1.5) * Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd97a';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(l.name.toUpperCase(), l.x, l.y + 44 + bob);
  }
}

function drawGuards(ctx, guards, thief, now) {
  for (const g of guards) {
    const chasing = g.mode === 'chase';
    const color = chasing ? 'rgba(255,93,108,A)' : 'rgba(255,120,80,A)';
    drawCone(ctx, g.x, g.y, g.angle, g.range, g.halfAngle, color, chasing ? 0.34 : 0.22);
  }
  for (const g of guards) {
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(g.x, g.y + 12, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
    // Body: dark suit with a red tie line.
    ctx.fillStyle = '#1d2334';
    ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4a5878';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ff5d6c';
    ctx.fillRect(g.x - 1.5, g.y - 8, 3, 14);
    // Head and cap.
    ctx.fillStyle = '#d9a06b';
    ctx.beginPath(); ctx.arc(g.x, g.y - 4, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#141a2e';
    ctx.fillRect(g.x - 8, g.y - 13, 16, 5);
    // Facing tick.
    ctx.strokeStyle = '#ffd97a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20);
    ctx.stroke();
    if (g.mode === 'chase') {
      ctx.fillStyle = '#ff5d6c';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 24);
    } else if (g.mode === 'investigate') {
      ctx.fillStyle = '#ffb648';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 24);
    }
  }
}

function drawCameras(ctx, cameras, now) {
  for (const c of cameras) {
    const off = now < c.disabledUntil;
    if (!off) {
      drawCone(ctx, c.x, c.y, c.angle, c.range, c.halfAngle, 'rgba(255,182,72,A)', 0.18);
    }
    ctx.fillStyle = off ? '#3a3f52' : '#20263c';
    ctx.beginPath(); ctx.arc(c.x, c.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = off ? '#555c72' : '#ffb648';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = off ? '#222' : '#ff5d6c';
    ctx.beginPath(); ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2); ctx.fill();
    if (off) {
      ctx.fillStyle = '#8b96b0';
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFF', c.x, c.y - 18);
    }
  }
}

function drawThief(ctx, thief, now, hidden) {
  const bob = Math.sin(now * 10) * (thief.moving ? 1.5 : 0);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(thief.x, thief.y + 13, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = hidden ? 0.55 : 1;
  // Hooded figure in teal.
  ctx.fillStyle = '#0f766e';
  ctx.beginPath(); ctx.arc(thief.x, thief.y + bob, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5eead4';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#134e4a';
  ctx.beginPath(); ctx.arc(thief.x, thief.y - 3 + bob, 7.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5eead4';
  ctx.beginPath(); ctx.arc(thief.x - 2.5, thief.y - 3 + bob, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(thief.x + 2.5, thief.y - 3 + bob, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawEffects(ctx, state, now) {
  for (const s of state.smokes) {
    const fade = Math.min(1, (s.until - now) / 1.5);
    ctx.fillStyle = 'rgba(200,205,220,' + (0.5 * fade) + ')';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220,225,240,' + (0.35 * fade) + ')';
    ctx.beginPath(); ctx.arc(s.x - 30, s.y + 12, s.r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s.x + 32, s.y - 10, s.r * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  for (const n of state.noises) {
    const age = 2.2 - (n.until - now);
    const r = 12 + age * 46;
    ctx.strokeStyle = 'rgba(255,182,72,' + Math.max(0, 0.8 - age * 0.35) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffb648';
    ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, Math.PI * 2); ctx.fill();
  }
  if (state.empFlash > now) {
    ctx.fillStyle = 'rgba(140,220,255,0.10)';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
}

function drawVignette(ctx, alarm) {
  const grad = ctx.createRadialGradient(640, 360, 300, 640, 360, 780);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  if (alarm > 55) {
    const a = ((alarm - 55) / 45) * 0.16 * (0.6 + 0.4 * Math.sin(Date.now() / 130));
    ctx.strokeStyle = 'rgba(255,93,108,' + a + ')';
    ctx.lineWidth = 26;
    ctx.strokeRect(0, 0, WORLD_W, WORLD_H);
  }
}

export function render(ctx, state) {
  const room = state.room;
  const now = state.now;
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);
  drawFloor(ctx, room);
  drawExit(ctx, room, state.allLootTaken, now);
  drawCovers(ctx, room);
  drawWalls(ctx, room);
  drawLoot(ctx, room, now);
  drawCameras(ctx, state.cameras, now);
  drawGuards(ctx, state.guards, state.thief, now);
  drawThief(ctx, state.thief, now, state.hiddenInSmoke);
  drawEffects(ctx, state, now);
  drawVignette(ctx, state.alarm);
}
