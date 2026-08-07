// AAA Procedural Web Audio Engine for Call of Duty WebGL Experience
// 100% Procedural synthesis using Web Audio API: Zero latency, zero external asset dependencies

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.voiceGain = null;
    this.initialized = false;
    this.isMuted = false;
    this.musicInterval = null;
    this.combatIntensity = 0.0;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.2, this.ctx.currentTime);
      compressor.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(compressor);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.voiceGain.connect(this.masterGain);

      this.initialized = true;
      this.startAmbientMusic();
    } catch (e) {
      console.warn('Web Audio API initialized on first interaction', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createNoiseBuffer(seconds = 0.5) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // --- WEAPON SOUNDS ---

  // 1. M4A1 Assault Rifle
  playM4Fire(isSilenced = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (isSilenced) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.18);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      return;
    }

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 0.18);
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.23);

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.createNoiseBuffer(0.35);
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(6500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(800, now + 0.25);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noiseNode.start(now);

    this.bumpCombatIntensity(0.12);
  }

  // 2. SMG / Lachmann Sub
  playSMGFire(isSilenced = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(190, now);
    subOsc.frequency.exponentialRampToValueAtTime(55, now + 0.12);
    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.15);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.2);
    const filter = this.ctx.createBiquadFilter();
    filter.type = isSilenced ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(isSilenced ? 2200 : 7500, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);

    this.bumpCombatIntensity(0.08);
  }

  // 3. Sniper Rifle .50 Caliber
  playSniperFire() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(220, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.5);
    subGain.gain.setValueAtTime(1.0, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.65);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.8);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(9000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.7);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);

    this.bumpCombatIntensity(0.25);
  }

  // 4. Tactical Shotgun Blast
  playShotgunFire() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(160, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    subGain.gain.setValueAtTime(0.8, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.36);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.5);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(5000, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);

    this.bumpCombatIntensity(0.18);
  }

  // 5. Desert Eagle .50 GS Handgun
  playDeagleFire() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
    oscGain.gain.setValueAtTime(0.9, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.4);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(7000, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);

    this.bumpCombatIntensity(0.15);
  }

  // 6. RPG-7 Rocket Launch & Ignition Whoosh
  playRPGLaunch() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Ignition pop + roaring rocket motor hiss
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.8);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + 0.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);

    this.bumpCombatIntensity(0.3);
  }

  // 7. Juggernaut 6-Barrel Minigun (1200 RPM Heavy Cadence)
  playMinigunFire() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);

    g.gain.setValueAtTime(0.8, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.1);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(4500, now);

    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.7, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(f);
    f.connect(ng);
    ng.connect(this.sfxGain);
    noise.start(now);
  }

  // 8. Riot Shield Deflection Ping
  playShieldDeflect() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(3200, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

    g.gain.setValueAtTime(0.7, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // 9. Kamikaze Drone Propeller Buzz & Warning Beep
  playDroneBeep() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2400, now);

    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // 10. Tactical Stim Injection Hiss & Adrenaline Heartbeat
  playStimInject() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Pneumatic needle hiss
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.3);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);

    // Deep heartbeat thump
    for (let i = 0; i < 3; i++) {
      const heartTime = now + 0.3 + i * 0.4;
      const hOsc = this.ctx.createOscillator();
      const hGain = this.ctx.createGain();
      hOsc.type = 'sine';
      hOsc.frequency.setValueAtTime(90, heartTime);
      hOsc.frequency.exponentialRampToValueAtTime(45, heartTime + 0.12);

      hGain.gain.setValueAtTime(0.8, heartTime);
      hGain.gain.exponentialRampToValueAtTime(0.001, heartTime + 0.18);

      hOsc.connect(hGain);
      hGain.connect(this.sfxGain);
      hOsc.start(heartTime);
      hOsc.stop(heartTime + 0.2);
    }
  }

  // 11. Armor Plate Slot-In Sound
  playArmorPlate() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);

    g.gain.setValueAtTime(0.7, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 12. Knife Melee Slash
  playMeleeSlash(hitEnemy = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.2);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);

    if (hitEnemy) {
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'sawtooth';
      thud.frequency.setValueAtTime(120, now + 0.05);
      thud.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      thudGain.gain.setValueAtTime(0.8, now + 0.05);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      thud.connect(thudGain);
      thudGain.connect(this.sfxGain);
      thud.start(now + 0.05);
      thud.stop(now + 0.25);
    }
  }

  // 13. Tactical Reload Stages
  playReloadStage(stage = 'out') {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (stage === 'out') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (stage === 'in') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
      g.gain.setValueAtTime(0.6, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (stage === 'rack') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.14);
      g.gain.setValueAtTime(0.7, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  // 14. Ejected Brass Shell Ping
  playShellCasingPing() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime + 0.22 + Math.random() * 0.15;

    for (let i = 0; i < 3; i++) {
      const delay = now + i * (0.06 + Math.random() * 0.04);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      const freq = 2800 + Math.random() * 800;
      osc.frequency.setValueAtTime(freq, delay);
      const vol = (0.25 / (i + 1)) * (0.8 + Math.random() * 0.4);
      g.gain.setValueAtTime(vol, delay);
      g.gain.exponentialRampToValueAtTime(0.001, delay + 0.05);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(delay);
      osc.stop(delay + 0.06);
    }
  }

  // 15. Hitmarkers & Headshot Crunch
  playHitmarker(type = 'body') {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (type === 'headshot') {
      const osc1 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(2600, now);
      osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
      g1.gain.setValueAtTime(0.8, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(g1);
      g1.connect(this.sfxGain);
      osc1.start(now);
      osc1.stop(now + 0.13);

      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(450, now);
      osc2.frequency.exponentialRampToValueAtTime(120, now + 0.1);
      g2.gain.setValueAtTime(0.9, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc2.connect(g2);
      g2.connect(this.sfxGain);
      osc2.start(now);
      osc2.stop(now + 0.15);
    } else if (type === 'kill') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      g.gain.setValueAtTime(0.6, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.28);
    } else {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1900, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.05);
      g.gain.setValueAtTime(0.55, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  }

  // 16. Surface Footsteps
  playFootstep(surface = 'concrete', isSprint = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const vol = isSprint ? 0.45 : 0.25;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.12);
    const filter = this.ctx.createBiquadFilter();
    filter.type = surface === 'metal' ? 'highpass' : 'bandpass';
    filter.frequency.setValueAtTime(surface === 'metal' ? 1400 : 380, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isSprint ? 0.08 : 0.11));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  // 17. Explosion
  playExplosion() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 1.2);
    subGain.gain.setValueAtTime(1.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 1.6);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(1.8);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3500, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 1.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);

    this.bumpCombatIntensity(0.5);
  }

  // 18. Tactical Announcer Callouts & Wave Alerts
  playAnnouncer(callout = 'kill') {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const squelch = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    squelch.type = 'square';
    squelch.frequency.setValueAtTime(1800, now);
    squelch.frequency.setValueAtTime(2400, now + 0.03);
    sGain.gain.setValueAtTime(0.2, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    squelch.connect(sGain);
    sGain.connect(this.voiceGain);
    squelch.start(now);
    squelch.stop(now + 0.07);

    const freqs = {
      'kill': [330, 440, 660],
      'headshot': [550, 770, 1100],
      'wave_start': [300, 450, 600, 750],
      'wave_cleared': [440, 554, 659, 880],
      'juggernaut_wave': [180, 220, 330, 440],
      'uav': [400, 600, 900],
      'airstrike': [280, 420, 630],
      'chopper': [220, 330, 440, 550],
      'nuke': [180, 270, 360, 540, 720]
    }[callout] || [440, 660];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      const startTime = now + 0.08 + idx * 0.07;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.1, startTime + 0.12);

      g.gain.setValueAtTime(0.25, startTime);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.5, startTime);

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.voiceGain);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  // 19. Adaptive Dynamic Combat Music
  startAmbientMusic() {
    if (!this.ctx || this.musicInterval) return;

    let step = 0;
    const bassNotes = [55, 55, 65.4, 49.0];
    const leadNotes = [220, 261.6, 329.6, 392.0, 440, 523.2];

    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || this.isMuted) return;
      const now = this.ctx.currentTime;

      this.combatIntensity = Math.max(0.0, this.combatIntensity - 0.04);

      if (step % 4 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        const rootFreq = bassNotes[Math.floor(step / 8) % bassNotes.length];
        bassOsc.frequency.setValueAtTime(rootFreq, now);
        bassOsc.frequency.exponentialRampToValueAtTime(rootFreq * 0.5, now + 0.4);

        const vol = 0.35 + this.combatIntensity * 0.4;
        bassGain.gain.setValueAtTime(vol, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.5);
      }

      if (this.combatIntensity > 0.15 && step % 2 === 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'sawtooth';
        const noteIdx = (step * 3) % leadNotes.length;
        leadOsc.frequency.setValueAtTime(leadNotes[noteIdx], now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 + this.combatIntensity * 2200, now);

        const leadVol = 0.15 * this.combatIntensity;
        leadGain.gain.setValueAtTime(leadVol, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        leadOsc.connect(filter);
        filter.connect(leadGain);
        leadGain.connect(this.musicGain);
        leadOsc.start(now);
        leadOsc.stop(now + 0.2);
      }

      step = (step + 1) % 64;
    }, 140);
  }

  bumpCombatIntensity(amount = 0.2) {
    this.combatIntensity = Math.min(1.0, this.combatIntensity + amount);
  }

  setVolume(sfx = 1.0, music = 0.4) {
    if (!this.ctx) return;
    this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(music, this.ctx.currentTime);
  }
}

export const soundEngine = new SoundEngine();
