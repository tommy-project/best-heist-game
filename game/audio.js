// Synthesized sound for NIGHTSHIFT: no audio files, no network.
// Everything is WebAudio oscillators and filtered noise, built at run
// time: a low ambient pad, soft footsteps, a pickup chime, a warning
// blip when a cone first touches the thief, and a rising alarm tone.

let ctx = null;
let padNodes = null;
let alarmNodes = null;
let muted = false;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function unlockAudio() {
  const c = ensureContext();
  if (c && c.state === 'suspended') c.resume();
  startPad();
}

function startPad() {
  if (!ctx || padNodes) return;
  const gain = ctx.createGain();
  gain.gain.value = 0.035;
  gain.connect(ctx.destination);
  const oscA = ctx.createOscillator();
  oscA.type = 'sine'; oscA.frequency.value = 55;
  const oscB = ctx.createOscillator();
  oscB.type = 'triangle'; oscB.frequency.value = 82.5;
  const oscC = ctx.createOscillator();
  oscC.type = 'sine'; oscC.frequency.value = 110.3;
  const slow = ctx.createOscillator();
  slow.type = 'sine'; slow.frequency.value = 0.07;
  const slowGain = ctx.createGain();
  slowGain.gain.value = 0.015;
  slow.connect(slowGain); slowGain.connect(gain.gain);
  oscA.connect(gain); oscB.connect(gain); oscC.connect(gain);
  oscA.start(); oscB.start(); oscC.start(); slow.start();
  padNodes = { gain, oscA, oscB, oscC, slow };
}

function blip(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const c = ensureContext();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol || 0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain); gain.connect(c.destination);
  osc.start(t); osc.stop(t + dur + 0.02);
}

export function playFootstep() {
  if (muted) return;
  const c = ensureContext();
  if (!c) return;
  const t = c.currentTime;
  const buffer = c.createBuffer(1, 2205, 44100);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 320;
  const gain = c.createGain();
  gain.gain.value = 0.05;
  src.connect(filter); filter.connect(gain); gain.connect(c.destination);
  src.start(t);
}

export function playPickup() {
  blip(660, 0.12, 'sine', 0.14);
  setTimeout(() => blip(990, 0.2, 'sine', 0.14), 90);
  setTimeout(() => blip(1320, 0.28, 'sine', 0.1), 180);
}

export function playWarning() {
  blip(520, 0.14, 'square', 0.06, 380);
}

export function playCaught() {
  blip(220, 0.5, 'sawtooth', 0.12, 90);
  setTimeout(() => blip(180, 0.6, 'sawtooth', 0.1, 70), 120);
}

export function playEmp() {
  blip(1400, 0.35, 'sine', 0.1, 120);
}

export function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'sine', 0.13), i * 130));
}

export function playClick() {
  blip(880, 0.06, 'sine', 0.08);
}

// Alarm tone follows the meter: silent when calm, a slow pulse when
// warm, a fast two-tone wail when the meter is nearly full.
export function setAlarmLevel(level) {
  if (!ctx || muted) { stopAlarm(); return; }
  if (level < 0.12) { stopAlarm(); return; }
  if (!alarmNodes) {
    const gain = ctx.createGain();
    gain.gain.value = 0.0;
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 620;
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    osc.connect(gain);
    osc.start(); lfo.start();
    alarmNodes = { gain, osc, lfo };
  }
  const t = ctx.currentTime;
  alarmNodes.gain.gain.setTargetAtTime(0.02 + level * 0.05, t, 0.1);
  alarmNodes.lfo.frequency.setTargetAtTime(0.8 + level * 5, t, 0.2);
}

function stopAlarm() {
  if (!alarmNodes || !ctx) return;
  const t = ctx.currentTime;
  alarmNodes.gain.gain.setTargetAtTime(0, t, 0.05);
  const nodes = alarmNodes;
  alarmNodes = null;
  setTimeout(() => {
    try { nodes.osc.stop(); nodes.lfo.stop(); } catch (e) { /* already stopped */ }
  }, 600);
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopAlarm();
  return muted;
}
