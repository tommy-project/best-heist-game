// DOM overlay for NIGHTSHIFT: the top HUD bar (room, loot, alarm
// meter, tools, timer), the center warning banner, the bottom hint
// line, and the title / end screens. The canvas draws the room; this
// module owns every HTML element the player reads.

function el(id) {
  return document.getElementById(id);
}

export function showHud(show) {
  el('hud').classList.toggle('hidden', !show);
  el('hint').classList.toggle('hidden', !show);
}

export function showTitle(show) {
  el('title-screen').classList.toggle('hidden', !show);
}

export function showEnd(show) {
  el('end-screen').classList.toggle('hidden', !show);
}

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return m + ':' + s;
}

export function formatMoney(value) {
  return '$' + value.toLocaleString('en-US');
}

export function updateHud(state) {
  const room = state.room;
  const taken = room.loot.filter((l) => l.taken).length;
  const value = room.loot.filter((l) => l.taken).reduce((sum, l) => sum + l.value, 0);
  el('hud-room-name').textContent = room.name;
  el('hud-room-num').textContent = 'ROOM ' + (state.roomIndex + 1) + ' / 3';
  el('hud-loot').textContent = formatMoney(value);
  el('hud-loot-count').textContent = taken + ' / ' + room.loot.length + ' taken';
  el('hud-time').textContent = formatTime(state.time);
  const alarm = Math.round(state.alarm);
  el('alarm-num').textContent = alarm + '%';
  el('alarm-fill').style.width = alarm + '%';
  const word = el('alarm-word');
  if (alarm >= 70) {
    word.textContent = 'ALARM!';
    word.className = 'hot';
  } else if (alarm >= 30 || state.spotted) {
    word.textContent = state.spotted ? 'SPOTTED!' : 'SUSPICIOUS';
    word.className = 'warn';
  } else {
    word.textContent = 'UNDETECTED';
    word.className = '';
  }
  setTool('tool-emp', state.tools.emp);
  setTool('tool-smoke', state.tools.smoke);
  setTool('tool-noise', state.tools.noise);
}

function setTool(id, count) {
  const node = el(id);
  node.querySelector('b').textContent = count;
  node.classList.toggle('spent', count <= 0);
  node.classList.toggle('ready', count > 0);
}

export function showBanner(text, calm) {
  const b = el('banner');
  if (!text) {
    b.classList.add('hidden');
    return;
  }
  b.textContent = text;
  b.classList.toggle('calm', !!calm);
  b.classList.remove('hidden');
}

export function showEndScreen(kind, stats) {
  const kicker = el('end-kicker');
  const title = el('end-title');
  const text = el('end-text');
  const statsBox = el('end-stats');
  const again = el('again-btn');
  const next = el('next-btn');
  if (kind === 'win') {
    kicker.textContent = 'THE JOB IS DONE';
    title.textContent = 'CLEAN GETAWAY';
    text.textContent = 'Every room emptied, every eye dodged. The crew is already counting it.';
    next.classList.add('hidden');
    again.textContent = 'PLAY AGAIN';
  } else if (kind === 'roomclear') {
    kicker.textContent = 'ROOM CLEARED';
    title.textContent = 'ONE DOWN';
    text.textContent = 'Loot secured and out the door. The next room is watching harder.';
    next.classList.remove('hidden');
    again.textContent = 'REPLAY ROOM';
  } else {
    kicker.textContent = 'THE JOB WENT BAD';
    title.textContent = 'CAUGHT';
    text.textContent = stats.reason || 'The alarm hit the roof and the room locked down.';
    next.classList.add('hidden');
    again.textContent = 'TRY AGAIN';
  }
  statsBox.innerHTML = stats.lines.map((line) => {
    return '<div><span>' + line[0] + '</span><b>' + line[1] + '</b></div>';
  }).join('');
  showEnd(true);
}
