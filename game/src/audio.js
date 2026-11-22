// Subtle synthesized WebAudio cues for Emberfall, gated behind a mute toggle.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  _ensure() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _tone(freq, dur, type = 'triangle', gain = 0.06, delay = 0, freqEnd = null) {
    const ctx = this._ensure();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + dur);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  playCard() {
    this._tone(310, 0.11, 'triangle', 0.055, 0, 440);
    this._tone(490, 0.12, 'sine', 0.04, 0.05, 580);
  }

  playSpell() {
    this._tone(420, 0.16, 'sine', 0.05, 0, 760);
    this._tone(640, 0.18, 'triangle', 0.035, 0.06, 920);
  }

  attack() {
    this._tone(190, 0.12, 'sawtooth', 0.045, 0, 88);
    this._tone(120, 0.14, 'triangle', 0.06, 0.04, 64);
  }

  heal() {
    this._tone(523, 0.14, 'sine', 0.045, 0, 659);
    this._tone(659, 0.16, 'sine', 0.04, 0.07, 784);
  }

  blocked() {
    this._tone(210, 0.09, 'square', 0.03, 0, 165);
  }

  turnChime() {
    this._tone(392, 0.12, 'triangle', 0.045, 0);
    this._tone(523, 0.18, 'sine', 0.045, 0.08);
  }

  victory() {
    const notes = [392, 493.88, 587.33, 783.99];
    notes.forEach((n, idx) => this._tone(n, 0.28, 'triangle', 0.055, idx * 0.095));
  }

  defeat() {
    const notes = [330, 293.66, 246.94, 196];
    notes.forEach((n, idx) => this._tone(n, 0.3, 'sine', 0.05, idx * 0.11));
  }
}

export const audio = new SoundEngine();
