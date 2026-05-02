let _ctx: AudioContext | null = null;
let _enabled = true;

function ctx(): AudioContext | null {
  if (!_enabled) return null;
  try {
    if (!_ctx || _ctx.state === "closed") _ctx = new AudioContext();
    if (_ctx.state === "suspended") _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, type: OscillatorType, start: number, dur: number, gain: number) {
  const c = ctx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.connect(g);
  g.connect(c.destination);
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.start(start);
  o.stop(start + dur + 0.01);
}

export function playClick() {
  const c = ctx();
  if (!c) return;
  tone(900, "sine", c.currentTime, 0.06, 0.08);
}

export function playWin() {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  [523, 659, 784].forEach((f, i) => tone(f, "sine", t + i * 0.11, 0.22, 0.15));
}

export function playBigWin() {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => tone(f, "triangle", t + i * 0.09, 0.4, 0.18));
}

export function playLoss() {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  [400, 350].forEach((f, i) => tone(f, "sine", t + i * 0.15, 0.2, 0.1));
}

export function playOpenModal() {
  const c = ctx();
  if (!c) return;
  tone(600, "sine", c.currentTime, 0.12, 0.08);
  tone(900, "sine", c.currentTime + 0.07, 0.12, 0.06);
}

export const playLose = playLoss;

export function setSoundsEnabled(v: boolean) { _enabled = v; }
export function isSoundsEnabled() { return _enabled; }
