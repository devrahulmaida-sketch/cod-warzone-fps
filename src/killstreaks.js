// AAA Call of Duty Killstreak Rewards Engine
// Includes: UAV Radar Sweep, Precision Airstrike Jet Bombing Run, VTOL Attack Chopper, Juggernaut Airdrop, and Tactical Nuke Ending
import * as THREE from 'three';
import { soundEngine } from './audio.js';

export class KillstreakManager {
  constructor(scene, enemyManager, hud) {
    this.scene = scene;
    this.enemyManager = enemyManager;
    this.hud = hud;

    this.kills = 0;
    this.currentStreak = 0;

    // Available killstreaks status
    this.streaks = {
      uav: { required: 3, ready: false, active: false, timer: 0, name: 'UAV Radar' },
      airstrike: { required: 5, ready: false, active: false, timer: 0, name: 'Precision Airstrike' },
      chopper: { required: 7, ready: false, active: false, timer: 0, name: 'Attack Chopper' },
      nuke: { required: 25, ready: false, active: false, timer: 0, name: 'Tactical Nuke' }
    };

    // 3D Objects for active streaks
    this.activeChopper = null;
    this.airstrikeBombs = [];
    this.nukeCountdown = 0;
  }

  onPlayerKill(isHeadshot) {
    this.kills++;
    this.currentStreak++;

    // Check for streak unlocks
    for (let key in this.streaks) {
      const s = this.streaks[key];
      if (this.currentStreak >= s.required && !s.ready && !s.active) {
        s.ready = true;
        soundEngine.playAnnouncer(key);
        this.hud.showNotification(`KILLSTREAK READY: ${s.name} [Press ${this.getStreakKey(key)}]`, '#e5b830');
      }
    }

    this.hud.updateStreak(this.currentStreak, this.streaks);
  }

  onPlayerDeath() {
    this.currentStreak = 0;
    this.hud.updateStreak(this.currentStreak, this.streaks);
  }

  getStreakKey(key) {
    if (key === 'uav') return '4';
    if (key === 'airstrike') return '5';
    if (key === 'chopper') return '6';
    if (key === 'nuke') return '7';
    return '4';
  }

  // Activate Streak by Key (4, 5, 6, 7)
  activateStreak(keyNumber, targetPos) {
    if (keyNumber === 4 && this.streaks.uav.ready) {
      this.launchUAV();
    } else if (keyNumber === 5 && this.streaks.airstrike.ready) {
      this.launchAirstrike(targetPos);
    } else if (keyNumber === 6 && this.streaks.chopper.ready) {
      this.launchAttackChopper();
    } else if (keyNumber === 7 && this.streaks.nuke.ready) {
      this.launchTacticalNuke();
    }
  }

  // 1. UAV Radar Sweep (30 seconds)
  launchUAV() {
    this.streaks.uav.ready = false;
    this.streaks.uav.active = true;
    this.streaks.uav.timer = 30.0;
    soundEngine.playAnnouncer('uav');
    this.hud.showNotification('UAV ONLINE - SWEEPING RADAR', '#00ff88');
    this.hud.updateStreak(this.currentStreak, this.streaks);
  }

  // 2. Precision Airstrike Carpet Bombing Run
  launchAirstrike(targetPos) {
    this.streaks.airstrike.ready = false;
    this.streaks.airstrike.active = true;
    soundEngine.playAnnouncer('airstrike');
    this.hud.showNotification('PRECISION AIRSTRIKE INBOUND', '#ff4422');
    this.hud.updateStreak(this.currentStreak, this.streaks);

    const strikeTarget = targetPos ? targetPos.clone() : new THREE.Vector3(0, 0, 0);

    // Jet flyby sound + 6 cascading 500lb bombs
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const bombPos = strikeTarget.clone().add(new THREE.Vector3(
          (i - 2.5) * 8 + (Math.random() - 0.5) * 4,
          0,
          (i - 2.5) * 4 + (Math.random() - 0.5) * 4
        ));

        soundEngine.playExplosion();
        this.createExplosionEffect(bombPos, 14.0, 160);
      }, 1500 + i * 400);
    }
  }

  // 3. Attack Chopper (VTOL Gunship)
  launchAttackChopper() {
    this.streaks.chopper.ready = false;
    this.streaks.chopper.active = true;
    this.streaks.chopper.timer = 35.0;
    soundEngine.playAnnouncer('chopper');
    this.hud.showNotification('ATTACK CHOPPER ON STATION', '#ffcc00');
    this.hud.updateStreak(this.currentStreak, this.streaks);

    // Build 3D Helicopter Mesh
    const chopperGroup = new THREE.Group();
    chopperGroup.position.set(-60, 32, -60);

    const fuselageGeo = new THREE.BoxGeometry(2.4, 2.0, 7.5);
    const fuselageMat = new THREE.MeshStandardMaterial({ color: 0x1f2322, metalness: 0.8, roughness: 0.3 });
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    chopperGroup.add(fuselage);

    // Main Rotor Blades
    const rotorGeo = new THREE.BoxGeometry(16.0, 0.08, 0.6);
    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const mainRotor = new THREE.Mesh(rotorGeo, rotorMat);
    mainRotor.position.set(0, 1.4, 0);
    chopperGroup.add(mainRotor);

    // Tail boom & Tail rotor
    const tailGeo = new THREE.CylinderGeometry(0.3, 0.6, 6.0, 8);
    const tail = new THREE.Mesh(tailGeo, fuselageMat);
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, 0.4, 6.2);
    chopperGroup.add(tail);

    this.scene.add(chopperGroup);

    this.activeChopper = {
      mesh: chopperGroup,
      mainRotor: mainRotor,
      timer: 35.0,
      fireCooldown: 0.4,
      orbitAngle: 0.0
    };
  }

  // 4. Tactical Nuke (25 Kills Match Ending)
  launchTacticalNuke() {
    this.streaks.nuke.ready = false;
    this.streaks.nuke.active = true;
    this.nukeCountdown = 10.0;
    soundEngine.playAnnouncer('nuke');
    this.hud.showNotification('TACTICAL NUKE INBOUND - 10s', '#ff0000');
    this.hud.updateStreak(this.currentStreak, this.streaks);
  }

  // Create massive explosion effect with radial damage to all bots
  createExplosionEffect(centerPos, radius = 12.0, damage = 180) {
    // Blinding fireball flash light
    const blastLight = new THREE.PointLight(0xff7722, 12.0, radius * 2.5);
    blastLight.position.copy(centerPos).add(new THREE.Vector3(0, 2, 0));
    this.scene.add(blastLight);

    setTimeout(() => { this.scene.remove(blastLight); }, 350);

    // Damage bots in radius
    for (let bot of this.enemyManager.bots) {
      if (bot.isDead) continue;
      const dist = bot.group.position.distanceTo(centerPos);
      if (dist < radius) {
        const falloff = 1.0 - (dist / radius);
        const dmg = damage * falloff;
        const shotDir = new THREE.Vector3().subVectors(bot.group.position, centerPos).normalize();
        this.enemyManager.damageBot(bot.group, dmg, false, centerPos, shotDir, (killedBot, isHead, score) => {
          this.hud.showKillScore('+150 AIRSTRIKE KILL', '#ffaa22');
        });
      }
    }
  }

  update(delta, playerPos) {
    // Update UAV
    if (this.streaks.uav.active) {
      this.streaks.uav.timer -= delta;
      if (this.streaks.uav.timer <= 0) {
        this.streaks.uav.active = false;
        this.hud.showNotification('UAV RADAR EXPIRED', '#888888');
        this.hud.updateStreak(this.currentStreak, this.streaks);
      }
    }

    // Update Attack Chopper
    if (this.activeChopper) {
      const ch = this.activeChopper;
      ch.timer -= delta;
      ch.mainRotor.rotation.y += delta * 35.0; // Spin blades

      // Orbit smoothly around center map
      ch.orbitAngle += delta * 0.25;
      const orbitRadius = 45.0;
      ch.mesh.position.set(
        Math.cos(ch.orbitAngle) * orbitRadius,
        28.0 + Math.sin(ch.orbitAngle * 2.0) * 3.0,
        Math.sin(ch.orbitAngle) * orbitRadius
      );
      ch.mesh.lookAt(0, 0, 0);

      // Auto-fire at active bots
      ch.fireCooldown -= delta;
      if (ch.fireCooldown <= 0) {
        ch.fireCooldown = 0.35;
        const targetBot = this.enemyManager.bots.find(b => !b.isDead);
        if (targetBot) {
          soundEngine.playShotgunFire();
          this.createExplosionEffect(targetBot.group.position, 6.0, 85);
        }
      }

      if (ch.timer <= 0) {
        this.scene.remove(ch.mesh);
        this.activeChopper = null;
        this.streaks.chopper.active = false;
        this.hud.showNotification('ATTACK CHOPPER LEFT AREA', '#888888');
        this.hud.updateStreak(this.currentStreak, this.streaks);
      }
    }

    // Update Tactical Nuke Countdown
    if (this.nukeCountdown > 0) {
      this.nukeCountdown -= delta;
      this.hud.updateNukeTimer(Math.ceil(this.nukeCountdown));

      if (this.nukeCountdown <= 0) {
        soundEngine.playExplosion();
        this.hud.triggerVictoryNuke();
      }
    }
  }
}
