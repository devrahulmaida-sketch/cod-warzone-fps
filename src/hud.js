// AAA Modern Call of Duty HUD & UI Engine
// Features: Circular Rotating Minimap, Compass Tape, Dynamic Crosshairs, Hitmarkers, Floating Damage Numbers, Scoreboard, and Wave Tracker
import * as THREE from 'three';
import { soundEngine } from './audio.js';

export class HUDManager {
  constructor(domRoot) {
    this.root = domRoot;
    this.hitmarkerTimeout = null;
    this.isScoreboardOpen = false;

    this.stats = {
      kills: 0,
      headshots: 0,
      deaths: 0,
      score: 0,
      streak: 0,
      wave: 1
    };

    this.createHUDDom();
    this.initMinimapCanvas();
    this.bindScoreboardKeys();
  }

  createHUDDom() {
    this.root.innerHTML = `
      <!-- Top Compass Tape -->
      <div id="compass-container">
        <div id="compass-tape">
          <span class="compass-mark">N</span>
          <span class="compass-tick">|</span>
          <span class="compass-mark">NE</span>
          <span class="compass-tick">|</span>
          <span class="compass-mark">E</span>
          <span class="compass-tick">|</span>
          <span class="compass-mark">SE</span>
          <span class="compass-tick">|</span>
          <span class="compass-mark">S</span>
          <span class="compass-tick">|</span>
          <span class="compass-mark">SW</span>
          <span class="compass-tick">|</span>
          <span class="compass-mark">W</span>
          <span class="compass-tick">|</span>
          <span class="compass-mark">NW</span>
        </div>
        <div id="compass-needle">▼</div>
      </div>

      <!-- Top Wave Counter -->
      <div id="wave-widget">
        <div id="wave-title">WAVE <span id="wave-number">1</span></div>
        <div id="wave-enemies">HOSTILES REMAINING: <span id="enemies-count">6</span></div>
      </div>

      <!-- Top Left: Circular Rotating Minimap -->
      <div id="minimap-wrapper">
        <canvas id="minimap-canvas" width="180" height="180"></canvas>
        <div id="minimap-overlay">
          <div id="minimap-north">N</div>
          <div id="minimap-center-player">▲</div>
        </div>
      </div>

      <!-- Center: Dynamic Crosshair & Hitmarkers -->
      <div id="crosshair-wrapper">
        <div class="ch-line ch-top"></div>
        <div class="ch-line ch-bottom"></div>
        <div class="ch-line ch-left"></div>
        <div class="ch-line ch-right"></div>
        <div class="ch-dot"></div>

        <!-- CoD Hitmarker -->
        <div id="hitmarker" class="hitmarker-hidden">
          <div class="hm-line hm-tl"></div>
          <div class="hm-line hm-tr"></div>
          <div class="hm-line hm-bl"></div>
          <div class="hm-line hm-br"></div>
          <div id="hm-skull" class="skull-hidden">💀</div>
        </div>
      </div>

      <!-- Damage Numbers Floating Container -->
      <div id="damage-numbers-container"></div>

      <!-- Damage Directional Arcs -->
      <div id="damage-indicator-ring">
        <div id="damage-arc-top" class="damage-arc"></div>
        <div id="damage-arc-bottom" class="damage-arc"></div>
        <div id="damage-arc-left" class="damage-arc"></div>
        <div id="damage-arc-right" class="damage-arc"></div>
      </div>

      <!-- Center Floating Score Popups -->
      <div id="score-popup-container"></div>

      <!-- Top Right: Killfeed -->
      <div id="killfeed-container"></div>

      <!-- Right: Killstreak Widget -->
      <div id="killstreak-widget">
        <div class="streak-item" id="streak-uav">
          <span class="streak-key">[4]</span>
          <span class="streak-icon">📡</span>
          <span class="streak-title">UAV (3)</span>
        </div>
        <div class="streak-item" id="streak-airstrike">
          <span class="streak-key">[5]</span>
          <span class="streak-icon">✈️</span>
          <span class="streak-title">AIRSTRIKE (5)</span>
        </div>
        <div class="streak-item" id="streak-chopper">
          <span class="streak-key">[6]</span>
          <span class="streak-icon">🚁</span>
          <span class="streak-title">VTOL (7)</span>
        </div>
        <div class="streak-item" id="streak-nuke">
          <span class="streak-key">[7]</span>
          <span class="streak-icon">☢️</span>
          <span class="streak-title">NUKE (25)</span>
        </div>
      </div>

      <!-- Bottom Center: Health, Armor Plates & Stim -->
      <div id="vitals-container">
        <div id="armor-bars">
          <div class="armor-plate plate-active" id="plate-1"></div>
          <div class="armor-plate plate-active" id="plate-2"></div>
          <div class="armor-plate plate-active" id="plate-3"></div>
        </div>
        <div id="health-bar-wrapper">
          <div id="health-bar-fill"></div>
        </div>
        <div id="equipment-status">
          <span class="eq-badge">[G] FRAG</span>
          <span class="eq-badge">[Q] STUN</span>
          <span class="eq-badge">[E] STIM HEAL</span>
          <span class="eq-badge">[B] ARMOR PLATE</span>
        </div>
      </div>

      <!-- Bottom Right: Weapon & Ammo Counter -->
      <div id="ammo-container">
        <div id="weapon-name">M4A1 TACTICAL</div>
        <div id="ammo-numbers">
          <span id="ammo-current">30</span>
          <span id="ammo-divider">/</span>
          <span id="ammo-reserve">180</span>
        </div>
        <div id="fire-mode">FULL AUTO // 5.56 NATO</div>
      </div>

      <!-- Global Notifications -->
      <div id="banner-notification" class="banner-hidden"></div>
      <div id="nuke-overlay" class="nuke-hidden">
        <div id="nuke-text">TACTICAL NUKE INBOUND</div>
        <div id="nuke-counter">10</div>
      </div>

      <!-- Tactical Scoreboard (TAB Key) -->
      <div id="scoreboard-modal" class="sb-hidden">
        <div id="scoreboard-box">
          <div id="sb-header">OPERATION: SHADOW ZONE // COMBAT REPORT</div>
          <div id="sb-stats-grid">
            <div class="sb-stat-card"><div class="sb-val" id="sb-score">0</div><div class="sb-lbl">TOTAL SCORE</div></div>
            <div class="sb-stat-card"><div class="sb-val" id="sb-kills">0</div><div class="sb-lbl">ELIMINATIONS</div></div>
            <div class="sb-stat-card"><div class="sb-val" id="sb-headshots">0</div><div class="sb-lbl">HEADSHOTS</div></div>
            <div class="sb-stat-card"><div class="sb-val" id="sb-streak">0</div><div class="sb-lbl">HIGHEST STREAK</div></div>
            <div class="sb-stat-card"><div class="sb-val" id="sb-wave">1</div><div class="sb-lbl">WAVE REACHED</div></div>
          </div>
          <div id="sb-footer">PRESS [TAB] TO CLOSE SCOREBOARD</div>
        </div>
      </div>
    `;
  }

  initMinimapCanvas() {
    this.miniCanvas = document.getElementById('minimap-canvas');
    this.miniCtx = this.miniCanvas.getContext('2d');
  }

  bindScoreboardKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        this.toggleScoreboard();
      }
    });
  }

  toggleScoreboard() {
    this.isScoreboardOpen = !this.isScoreboardOpen;
    const sb = document.getElementById('scoreboard-modal');
    if (sb) {
      sb.className = this.isScoreboardOpen ? 'sb-visible' : 'sb-hidden';
      if (this.isScoreboardOpen) this.updateScoreboardDOM();
    }
  }

  updateScoreboardDOM() {
    document.getElementById('sb-score').innerText = this.stats.score;
    document.getElementById('sb-kills').innerText = this.stats.kills;
    document.getElementById('sb-headshots').innerText = this.stats.headshots;
    document.getElementById('sb-streak').innerText = this.stats.streak;
    document.getElementById('sb-wave').innerText = this.stats.wave;
  }

  // Floating Damage Numbers (e.g. 38, 76 CRIT, IMMUNE)
  showDamageNumber(val, isHeadshot = false, isShield = false) {
    const container = document.getElementById('damage-numbers-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = isShield ? 'dmg-shield' : (isHeadshot ? 'dmg-headshot' : 'dmg-body');
    el.innerText = isShield ? 'IMMUNE' : (isHeadshot ? `${val} CRIT` : `${val}`);

    // Random slight offset around center screen
    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = (Math.random() - 0.5) * 40;
    el.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

    container.appendChild(el);
    setTimeout(() => el.remove(), 650);
  }

  // Update Wave Info
  updateWave(waveNum, remaining) {
    this.stats.wave = waveNum;
    const wNum = document.getElementById('wave-number');
    const wEnemies = document.getElementById('enemies-count');
    if (wNum) wNum.innerText = waveNum;
    if (wEnemies) wEnemies.innerText = remaining;
  }

  // CoD Hitmarker Popup
  showHitmarker(isHeadshot = false, isKill = false) {
    const hm = document.getElementById('hitmarker');
    const skull = document.getElementById('hm-skull');
    if (!hm) return;

    hm.className = isHeadshot ? 'hitmarker-headshot' : (isKill ? 'hitmarker-kill' : 'hitmarker-normal');
    if (isHeadshot || isKill) {
      skull.className = 'skull-visible';
      soundEngine.playHitmarker('headshot');
    } else {
      skull.className = 'skull-hidden';
      soundEngine.playHitmarker('body');
    }

    if (this.hitmarkerTimeout) clearTimeout(this.hitmarkerTimeout);
    this.hitmarkerTimeout = setTimeout(() => {
      hm.className = 'hitmarker-hidden';
      skull.className = 'skull-hidden';
    }, 180);
  }

  // Floating Score Notifications (+100 KILL, +50 HEADSHOT)
  showKillScore(text = '+100 KILL', color = '#e5b830') {
    this.stats.score += 100;
    this.stats.kills += 1;
    this.stats.streak += 1;

    const container = document.getElementById('score-popup-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'score-medal-item';
    el.style.color = color;
    el.innerText = text;
    container.appendChild(el);

    soundEngine.playHitmarker('kill');

    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 400);
    }, 1200);
  }

  addKillfeedEntry(killer, victim, weaponName, isHeadshot) {
    const feed = document.getElementById('killfeed-container');
    if (!feed) return;

    const row = document.createElement('div');
    row.className = 'killfeed-row';
    row.innerHTML = `
      <span class="kf-killer">${killer}</span>
      <span class="kf-weapon">[${weaponName}]</span>
      ${isHeadshot ? '<span class="kf-headshot">🎯</span>' : ''}
      <span class="kf-victim">${victim}</span>
    `;

    feed.appendChild(row);
    setTimeout(() => {
      row.style.opacity = '0';
      setTimeout(() => row.remove(), 300);
    }, 3500);
  }

  showNotification(msg, color = '#ffffff') {
    const b = document.getElementById('banner-notification');
    if (!b) return;
    b.innerText = msg;
    b.style.color = color;
    b.className = 'banner-visible';
    setTimeout(() => { b.className = 'banner-hidden'; }, 2800);
  }

  showDamageDirection(angle) {
    const top = document.getElementById('damage-arc-top');
    const bottom = document.getElementById('damage-arc-bottom');
    const left = document.getElementById('damage-arc-left');
    const right = document.getElementById('damage-arc-right');

    const deg = (angle * 180 / Math.PI + 360) % 360;
    if (deg > 315 || deg <= 45) { top.classList.add('arc-flash'); setTimeout(() => top.classList.remove('arc-flash'), 300); }
    else if (deg > 45 && deg <= 135) { right.classList.add('arc-flash'); setTimeout(() => right.classList.remove('arc-flash'), 300); }
    else if (deg > 135 && deg <= 225) { bottom.classList.add('arc-flash'); setTimeout(() => bottom.classList.remove('arc-flash'), 300); }
    else { left.classList.add('arc-flash'); setTimeout(() => left.classList.remove('arc-flash'), 300); }
  }

  updateVitals(health, armor, maxHealth, currentAmmo, reserveAmmo, weaponName) {
    const hFill = document.getElementById('health-bar-fill');
    if (hFill) hFill.style.width = `${Math.max(0, (health / maxHealth) * 100)}%`;

    const p1 = document.getElementById('plate-1');
    const p2 = document.getElementById('plate-2');
    const p3 = document.getElementById('plate-3');
    if (p1 && p2 && p3) {
      p1.className = armor >= 33 ? 'armor-plate plate-active' : 'armor-plate plate-empty';
      p2.className = armor >= 66 ? 'armor-plate plate-active' : 'armor-plate plate-empty';
      p3.className = armor >= 99 ? 'armor-plate plate-active' : 'armor-plate plate-empty';
    }

    const curEl = document.getElementById('ammo-current');
    const resEl = document.getElementById('ammo-reserve');
    const nameEl = document.getElementById('weapon-name');
    if (curEl) curEl.innerText = currentAmmo;
    if (resEl) resEl.innerText = reserveAmmo;
    if (nameEl) nameEl.innerText = weaponName.toUpperCase();
  }

  updateStreak(currentKills, streaks) {
    for (let key in streaks) {
      const el = document.getElementById(`streak-${key}`);
      if (el) {
        if (streaks[key].ready) {
          el.className = 'streak-item streak-ready';
        } else if (streaks[key].active) {
          el.className = 'streak-item streak-active';
        } else {
          el.className = 'streak-item streak-locked';
        }
      }
    }
  }

  updateNukeTimer(secondsLeft) {
    const overlay = document.getElementById('nuke-overlay');
    const count = document.getElementById('nuke-counter');
    if (overlay && count) {
      overlay.className = 'nuke-visible';
      count.innerText = secondsLeft;
    }
  }

  triggerVictoryNuke() {
    const overlay = document.getElementById('nuke-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div id="victory-title">M.O.A.B. DETONATION</div>
        <div id="victory-sub">MATCH VICTORY // TASK FORCE 141</div>
      `;
      overlay.style.backgroundColor = '#ffffff';
    }
  }

  renderMinimap(playerPos, playerYaw, bots, isUAVActive) {
    if (!this.miniCtx) return;
    const ctx = this.miniCtx;
    const cx = 90;
    const cy = 90;
    const radius = 85;

    ctx.clearRect(0, 0, 180, 180);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(12, 16, 24, 0.85)';
    ctx.fillRect(0, 0, 180, 180);

    ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.stroke();

    const sweepAngle = (performance.now() * 0.003) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * radius, cy + Math.sin(sweepAngle) * radius);
    ctx.stroke();

    const scale = 1.6;
    bots.forEach(bot => {
      if (bot.isDead) return;
      const bPos = bot.group.position;
      const dx = bPos.x - playerPos.x;
      const dz = bPos.z - playerPos.z;

      const rotX = dx * Math.cos(-playerYaw) - dz * Math.sin(-playerYaw);
      const rotZ = dx * Math.sin(-playerYaw) + dz * Math.cos(-playerYaw);

      const mapX = cx + rotX * scale;
      const mapY = cy + rotZ * scale;

      const dist = Math.sqrt(rotX * rotX + rotZ * rotZ) * scale;
      if (dist < radius - 4) {
        ctx.fillStyle = bot.type === 'juggernaut' ? '#ffaa00' : (bot.type === 'drone' ? '#ff00ff' : '#ff2222');
        ctx.beginPath();
        ctx.arc(mapX, mapY, bot.type === 'juggernaut' ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mapX, mapY, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.restore();

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  updateCompass(yaw) {
    const tape = document.getElementById('compass-tape');
    if (!tape) return;
    const deg = ((-yaw * 180 / Math.PI) % 360 + 360) % 360;
    const offset = (deg / 360) * -380;
    tape.style.transform = `translateX(${offset}px)`;
  }
}
