// A felt piano, far below deck. No audio files: every note is three partials
// with a long decay, so it stays a whisper instead of a jingle. Silent by
// default — the switch in the footer is the only thing that wakes it.

type Motif = [note: number, delay: number, velocity: number][];

// A minor, pentatonic. Sparse, low, nothing that resolves into a tune.
const MOTIFS: Motif[] = [
  [
    [69, 0, 0.9],
    [72, 0.62, 0.7],
    [76, 1.08, 0.82],
    [67, 1.95, 0.9],
    [69, 2.45, 0.58],
  ],
  [
    [64, 0, 0.8],
    [69, 0.52, 0.88],
    [72, 1.18, 0.66],
    [60, 2.1, 0.84],
  ],
  [
    [72, 0, 0.74],
    [69, 0.46, 0.84],
    [64, 0.96, 0.78],
    [62, 1.72, 0.9],
    [67, 2.34, 0.56],
  ],
  [
    [67, 0, 0.88],
    [69, 0.72, 0.7],
    [72, 1.4, 0.82],
    [76, 2.2, 0.66],
  ],
  [
    [60, 0, 0.82],
    [64, 0.66, 0.9],
    [67, 1.3, 0.7],
    [72, 2.05, 0.6],
    [69, 2.6, 0.72],
  ],
];

const STORAGE_KEY = 'odela:sound';

export function initPiano(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-sound-toggle]');
  if (!button) return;
  const label = button.querySelector<HTMLElement>('[data-sound-label]');
  const onText = button.dataset.on ?? 'Sound on';
  const offText = button.dataset.off ?? 'Sound off';

  let audio: AudioContext | null = null;
  let master: GainNode | null = null;
  let timer = 0;
  let enabled = false;
  let lastPlay = -30;

  const paint = () => {
    button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    button.setAttribute('aria-label', enabled ? onText : offText);
    if (label) label.textContent = enabled ? onText : offText;
  };

  function ensure(): AudioContext {
    if (!audio) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audio = new Ctor();
      master = audio.createGain();
      master.gain.value = 0.9;
      master.connect(audio.destination);
    }
    if (audio.state === 'suspended') void audio.resume();
    return audio;
  }

  function note(midi: number, delay: number, velocity: number): void {
    if (!audio || !master) return;
    const freq = 440 * 2 ** ((midi - 69) / 12);
    const at = audio.currentTime + delay;
    const peak = 0.055 * velocity;

    const env = audio.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(peak, at + 0.02);
    env.gain.exponentialRampToValueAtTime(peak * 0.4, at + 0.3);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 3.4);

    const body = audio.createBiquadFilter();
    body.type = 'lowpass';
    body.frequency.value = 1900 + Math.random() * 700;
    body.Q.value = 0.7;

    env.connect(body);
    body.connect(master);

    for (const [mult, amp] of [
      [1, 1],
      [2, 0.4],
      [3, 0.15],
      [4.04, 0.06],
    ]) {
      const osc = audio.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      const gain = audio.createGain();
      gain.gain.value = amp;
      osc.connect(gain);
      gain.connect(env);
      osc.start(at);
      osc.stop(at + 3.55);
    }
  }

  function phrase(): void {
    if (!enabled) return;
    const ctx = ensure();
    if (ctx.currentTime - lastPlay < 4) return;
    lastPlay = ctx.currentTime;
    const motif = MOTIFS[Math.floor(Math.random() * MOTIFS.length)];
    for (const [midi, delay, velocity] of motif) note(midi, delay + Math.random() * 0.08, velocity);
  }

  function schedule(): void {
    window.clearTimeout(timer);
    if (!enabled) return;
    timer = window.setTimeout(() => {
      phrase();
      schedule();
    }, 11000 + Math.random() * 7000);
  }

  function enable(): void {
    enabled = true;
    paint();
    try {
      localStorage.setItem(STORAGE_KEY, 'on');
    } catch {
      /* storage can be off */
    }
    const ctx = ensure();
    // one quiet note so the switch confirms itself
    lastPlay = ctx.currentTime;
    note(69, 0.05, 0.85);
    note(64, 0.55, 0.7);
    schedule();
  }

  function disable(): void {
    enabled = false;
    paint();
    window.clearTimeout(timer);
    try {
      localStorage.setItem(STORAGE_KEY, 'off');
    } catch {
      /* storage can be off */
    }
    if (audio) void audio.suspend();
  }

  button.addEventListener('click', () => (enabled ? disable() : enable()));

  // the boat tells the piano it has reached the middle of the water
  window.addEventListener('odela:boat', () => {
    if (!enabled) return;
    window.setTimeout(phrase, 900);
  });

  document.addEventListener('visibilitychange', () => {
    if (!audio) return;
    if (document.hidden) void audio.suspend();
    else if (enabled) void audio.resume();
  });

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'on') {
      // Browsers only start audio on a gesture, so wait for the first click.
      const wake = () => {
        window.removeEventListener('pointerdown', wake);
        window.removeEventListener('keydown', wake);
        enable();
      };
      window.addEventListener('pointerdown', wake, { once: true });
      window.addEventListener('keydown', wake, { once: true });
    }
  } catch {
    /* storage can be off */
  }

  paint();
}
