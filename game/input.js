// Keyboard and mouse input for NIGHTSHIFT.
// WASD / arrows move, E (held) cracks the loot, 1 fires the EMP,
// 2 drops smoke, and a click throws a noisemaker at that spot.
// The module only records intent; main.js decides what it means.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouse: { x: 0, y: 0, clicked: false },
    interactHeld: false,
  };

  const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  window.addEventListener('keydown', (e) => {
    if (MOVE_KEYS.includes(e.code) || e.code === 'Space') e.preventDefault();
    if (e.repeat) return;
    input.keys.add(e.code);
    if (e.code === 'KeyE') input.interactHeld = true;
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.code);
    if (e.code === 'KeyE') input.interactHeld = false;
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.interactHeld = false;
  });

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((e.clientX - rect.left) / rect.width) * 1280;
    input.mouse.y = ((e.clientY - rect.top) / rect.height) * 720;
    input.mouse.clicked = true;
  });

  return input;
}

export function moveVector(input) {
  let x = 0, y = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y += 1;
  if (x !== 0 && y !== 0) {
    const len = Math.hypot(x, y);
    x /= len; y /= len;
  }
  return { x, y };
}

export function consumeClick(input) {
  if (!input.mouse.clicked) return null;
  input.mouse.clicked = false;
  return { x: input.mouse.x, y: input.mouse.y };
}

export function consumeKey(input, code) {
  if (!input.keys.has(code)) return false;
  input.keys.delete(code);
  return true;
}
