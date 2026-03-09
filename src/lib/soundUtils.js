/**
 * Web Audio API sound synthesizer for naval battle.
 * No external files needed — all sounds are generated programmatically.
 */

const ctx = () => new (window.AudioContext || window.webkitAudioContext)();

/** Adds shaped noise burst (useful for explosions / splashes) */
const noiseBuffer = (audioCtx, duration) => {
  const sampleRate = audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
};

/**
 * CANNON FIRE — short sharp boom when you click to fire.
 * Layered: low thud + noise burst.
 */
export const playFire = () => {
  try {
    const ac = ctx();

    // Low boom oscillator (the "thud")
    const osc = ac.createOscillator();
    const oscGain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 0.15);
    oscGain.gain.setValueAtTime(1.2, ac.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
    osc.connect(oscGain);
    oscGain.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.25);

    // Noise burst (the "crack")
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(ac, 0.15);
    const noiseFilter = ac.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 800;
    noiseFilter.Q.value = 0.5;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0.8, ac.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ac.destination);
    noise.start(ac.currentTime);
    noise.stop(ac.currentTime + 0.15);

    setTimeout(() => ac.close(), 500);
  } catch (e) { /* silent fail */ }
};

/**
 * SPLASH / MISS — watery plonk sound.
 */
export const playMiss = () => {
  try {
    const ac = ctx();

    // Low plop tone
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.4);
    gain.gain.setValueAtTime(0.6, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.4);

    // White noise "splash" tail
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(ac, 0.5);
    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0.15, ac.currentTime + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ac.destination);
    noise.start(ac.currentTime + 0.05);
    noise.stop(ac.currentTime + 0.5);

    setTimeout(() => ac.close(), 700);
  } catch (e) { /* silent fail */ }
};

/**
 * HIT EXPLOSION — mid explosion when a ship cell is hit.
 */
export const playHit = () => {
  try {
    const ac = ctx();

    // Heavy low boom
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ac.currentTime + 0.35);
    gain.gain.setValueAtTime(1.5, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.35);

    // Noise burst (explosion debris)
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(ac, 0.45);
    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(1.0, ac.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ac.destination);
    noise.start(ac.currentTime);
    noise.stop(ac.currentTime + 0.45);

    setTimeout(() => ac.close(), 700);
  } catch (e) { /* silent fail */ }
};

/**
 * KILL / SHIP SUNK — dramatic large explosion.
 * Longer, deeper, with secondary rumble.
 */
export const playKill = () => {
  try {
    const ac = ctx();

    // Primary deep boom
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(60, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(12, ac.currentTime + 0.8);
    gain.gain.setValueAtTime(2.0, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.8);

    // Secondary rumble
    const osc2 = ac.createOscillator();
    const gain2 = ac.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(40, ac.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(18, ac.currentTime + 1.2);
    gain2.gain.setValueAtTime(0.8, ac.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.2);
    osc2.connect(gain2);
    gain2.connect(ac.destination);
    osc2.start(ac.currentTime + 0.1);
    osc2.stop(ac.currentTime + 1.2);

    // Long noise tail
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(ac, 1.0);
    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(1.5, ac.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.0);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ac.destination);
    noise.start(ac.currentTime);
    noise.stop(ac.currentTime + 1.0);

    setTimeout(() => ac.close(), 1500);
  } catch (e) { /* silent fail */ }
};
