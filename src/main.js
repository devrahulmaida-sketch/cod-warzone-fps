// AAA Call of Duty First-Person Shooter - Three.js Master Orchestration
// Combines Graphics, Viewmodel Gunplay, Audio Engine, Enemy AI, Killstreaks, HUD, and Gunsmith
import * as THREE from 'three';
import { soundEngine } from './audio.js';
import { textureGen } from './textures.js';
import { weaponFactory } from './weapons.js';
import { ViewmodelRig } from './viewmodel.js';
import { MapBuilder } from './mapBuilder.js';
import { EnemyBotManager } from './aiSystem.js';
import { KillstreakManager } from './killstreaks.js';
import { PlayerController } from './playerController.js';
import { HUDManager } from './hud.js';
import { GunsmithUI } from './gunsmith.js';
import { PostProcessingPipeline } from './shaders.js';

class GameApp {
  constructor() {
    this.container = document.getElementById('app');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.clock = new THREE.Clock();
    this.bulletDecals = [];
    this.impactSparks = [];
    this.rpgRockets = [];

    this.createBriefingOverlay();
    this.initWebGL();
    this.initScene();
    this.bindGlobalKeys();
    this.animate();
  }

  createBriefingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'briefing-overlay';
    overlay.innerHTML = `
      <div class="briefing-box">
        <div class="briefing-tag">TASK FORCE 141 // OPERATION: WARZONE FORTRESS</div>
        <div class="briefing-title">CALL OF DUTY: WARZONE 3D</div>
        <div class="briefing-desc">
          High-intensity tactical urban combat against hostile Shadow Company bot squads.
          Featuring 6 combat classes (Recon, SMG Rushers, Armored Juggernaut, Sniper Overwatch, Riot Shield Enforcers, and Suicide Bomb Drones),
          8 weapons (RPG-7, Minigun, Sniper, Shotgun, AR), wave survival escalation, and full gunsmith customization.
        </div>

        <div class="briefing-controls-grid">
          <div class="ctrl-card"><div class="ctrl-key">WASD</div><div class="ctrl-label">Movement / Strafe</div></div>
          <div class="ctrl-card"><div class="ctrl-key">SHIFT</div><div class="ctrl-label">Tactical Sprint</div></div>
          <div class="ctrl-card"><div class="ctrl-key">C / SPACE</div><div class="ctrl-label">Slide & Cancel</div></div>
          <div class="ctrl-card"><div class="ctrl-key">RIGHT CLICK</div><div class="ctrl-label">ADS Aim Zoom</div></div>
          <div class="ctrl-card"><div class="ctrl-key">1 - 8</div><div class="ctrl-label">Weapon Arsenal</div></div>
          <div class="ctrl-card"><div class="ctrl-key">G / Q</div><div class="ctrl-label">Frag & Stun Grenade</div></div>
          <div class="ctrl-card"><div class="ctrl-key">E / B</div><div class="ctrl-label">Stim Heal / Armor Plate</div></div>
          <div class="ctrl-card"><div class="ctrl-key">TAB / ESC</div><div class="ctrl-label">Scoreboard / Gunsmith</div></div>
        </div>

        <div class="deploy-btn">CLICK TO DEPLOY INTO COMBAT</div>
      </div>
    `;

    overlay.addEventListener('click', () => {
      soundEngine.ensureContext();
      overlay.className = 'briefing-hidden';
      if (this.canvas && this.canvas.requestPointerLock) {
        this.canvas.requestPointerLock();
      }
      soundEngine.playReloadStage('rack');
    });

    document.body.appendChild(overlay);
    this.briefingEl = overlay;
  }

  initWebGL() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'webgl-canvas';
    this.container.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x182030, 0.008);

    this.camera = new THREE.PerspectiveCamera(90, this.width / this.height, 0.05, 1000);
    this.scene.add(this.camera);

    window.addEventListener('resize', () => this.onResize());
  }

  initScene() {
    this.postProcessing = new PostProcessingPipeline(
      this.renderer,
      this.scene,
      this.camera,
      this.width,
      this.height
    );

    const hudRoot = document.getElementById('hud-root');
    this.hud = new HUDManager(hudRoot);

    this.mapBuilder = new MapBuilder(this.scene);
    this.mapData = this.mapBuilder.buildMap();

    this.viewmodel = new ViewmodelRig(this.camera, this.scene);

    this.enemyManager = new EnemyBotManager(this.scene, this.mapData.colliders, this.mapData.spawnPoints);
    this.enemyManager.initBots();

    this.killstreaks = new KillstreakManager(this.scene, this.enemyManager, this.hud);

    this.player = new PlayerController(
      this.camera,
      this.canvas,
      this.viewmodel,
      weaponFactory,
      this.mapData.colliders
    );

    this.gunsmith = new GunsmithUI(
      document.body,
      weaponFactory,
      this.player,
      this.renderer,
      this.camera
    );
  }

  bindGlobalKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyT') {
        this.postProcessing.toggleThermal();
        soundEngine.playReloadStage('in');
      }

      if (e.code === 'KeyV') {
        soundEngine.playMeleeSlash(true);
        this.viewmodel.triggerShoot();
      }

      if (e.code === 'KeyG') {
        this.throwFragGrenade();
      }

      if (e.code === 'Digit4') this.killstreaks.activateStreak(4, this.player.position);
      if (e.code === 'Digit5') this.killstreaks.activateStreak(5, this.player.position);
      if (e.code === 'Digit6') this.killstreaks.activateStreak(6, this.player.position);
      if (e.code === 'Digit7') this.killstreaks.activateStreak(7, this.player.position);
    });
  }

  throwFragGrenade() {
    soundEngine.playReloadStage('out');
    const startPos = this.camera.position.clone();
    const throwDir = new THREE.Vector3();
    this.camera.getWorldDirection(throwDir);

    const grenadeGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const grenadeMat = new THREE.MeshStandardMaterial({ color: 0x334422, roughness: 0.8 });
    const grenadeMesh = new THREE.Mesh(grenadeGeo, grenadeMat);
    grenadeMesh.position.copy(startPos);
    this.scene.add(grenadeMesh);

    const grenadeVel = throwDir.multiplyScalar(22.0).add(new THREE.Vector3(0, 4.0, 0));

    let timer = 2.4;
    const interval = setInterval(() => {
      const delta = 0.03;
      timer -= delta;
      grenadeVel.y -= 14.0 * delta;
      grenadeMesh.position.addScaledVector(grenadeVel, delta);

      if (grenadeMesh.position.y <= 0.12) {
        grenadeMesh.position.y = 0.12;
        grenadeVel.y = -grenadeVel.y * 0.4;
        grenadeVel.x *= 0.7;
        grenadeVel.z *= 0.7;
      }

      if (timer <= 0) {
        clearInterval(interval);
        const explosionPos = grenadeMesh.position.clone();
        this.scene.remove(grenadeMesh);
        soundEngine.playExplosion();
        this.killstreaks.createExplosionEffect(explosionPos, 10.0, 160);
      }
    }, 30);
  }

  onPlayerShootBallistics(weaponData) {
    // RPG Rocket Projectile Launch
    if (weaponData.type === 'rpg') {
      const rocketGeo = new THREE.ConeGeometry(0.08, 0.35, 12);
      const rocketMat = new THREE.MeshStandardMaterial({ color: 0x4a5d3f, metalness: 0.7 });
      const rocket = new THREE.Mesh(rocketGeo, rocketMat);
      rocket.rotation.x = -Math.PI / 2;

      const startPos = this.camera.position.clone().add(new THREE.Vector3(0.2, -0.15, -0.4));
      rocket.position.copy(startPos);

      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      this.scene.add(rocket);

      this.rpgRockets.push({
        mesh: rocket,
        pos: startPos,
        dir: dir,
        speed: 48.0,
        life: 3.5,
        damage: weaponData.damage,
        radius: weaponData.splashRadius
      });
      return;
    }

    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);

    const spread = this.player.isADS ? (weaponData.spread * 0.25) : weaponData.spread;
    center.x += (Math.random() - 0.5) * spread;
    center.y += (Math.random() - 0.5) * spread;

    raycaster.setFromCamera(center, this.camera);

    let botHit = false;
    for (let bot of this.enemyManager.bots) {
      if (bot.isDead) continue;

      const intersects = raycaster.intersectObject(bot.group, true);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const isHeadshot = hit.object.name === 'head_hitbox' || hit.object.parent.name === 'head_hitbox';
        const shotDir = raycaster.ray.direction;

        const hitResult = this.enemyManager.damageBot(
          bot.group,
          weaponData.damage,
          isHeadshot,
          hit.point,
          shotDir,
          (killedBot, headshot, score) => {
            this.killstreaks.onPlayerKill(headshot);
            this.hud.stats.headshots += (headshot ? 1 : 0);
            this.hud.addKillfeedEntry('PLAYER', killedBot.name, weaponData.name, headshot);
            this.hud.showKillScore(headshot ? '+150 HEADSHOT KILL' : '+100 ELIMINATION', headshot ? '#ff4422' : '#e5b830');
          }
        );

        if (hitResult) {
          if (hitResult.isShieldBlock) {
            this.hud.showDamageNumber(0, false, true);
          } else {
            this.hud.showHitmarker(isHeadshot, hitResult.isKill);
            this.hud.showDamageNumber(hitResult.damage ? Math.round(hitResult.damage) : weaponData.damage, isHeadshot, false);
            this.spawnBloodDecal(hit.point, hit.face.normal);
          }
          botHit = true;
          break;
        }
      }
    }

    if (!botHit) {
      // Check shatterable glass panels
      for (let glass of this.mapData.glassPanels) {
        if (glass.userData.shattered) continue;
        const intersects = raycaster.intersectObject(glass, true);
        if (intersects.length > 0) {
          glass.userData.health -= weaponData.damage;
          this.spawnImpactSparks(intersects[0].point, intersects[0].face.normal, 0x88ccff);
          if (glass.userData.health <= 0) {
            glass.userData.shattered = true;
            this.scene.remove(glass);
            soundEngine.playShellCasingPing();
          }
          return;
        }
      }

      for (let barrel of this.mapData.explosiveBarrels) {
        if (barrel.userData.exploded) continue;
        const intersects = raycaster.intersectObject(barrel, true);
        if (intersects.length > 0) {
          barrel.userData.health -= weaponData.damage;
          if (barrel.userData.health <= 0) {
            barrel.userData.exploded = true;
            barrel.visible = false;
            soundEngine.playExplosion();
            this.killstreaks.createExplosionEffect(barrel.userData.worldPos, 12.0, 200);
          }
          return;
        }
      }

      for (let crate of this.mapData.destructibleCrates) {
        if (crate.userData.destroyed) continue;
        const intersects = raycaster.intersectObject(crate, true);
        if (intersects.length > 0) {
          crate.userData.health -= weaponData.damage;
          this.spawnImpactSparks(intersects[0].point, intersects[0].face.normal, 0xbb8844);
          if (crate.userData.health <= 0) {
            crate.userData.destroyed = true;
            this.scene.remove(crate);
            soundEngine.playMeleeSlash(false);
          }
          return;
        }
      }

      const worldHits = raycaster.intersectObjects(this.scene.children, true);
      for (let hit of worldHits) {
        if (hit.object.name !== 'laserBeam' && hit.object.name !== 'reticleLens' && !hit.object.name.includes('bot')) {
          this.spawnBulletDecal(hit.point, hit.face.normal);
          this.spawnImpactSparks(hit.point, hit.face.normal, 0xffcc44);
          break;
        }
      }
    }
  }

  updateRPGRockets(delta) {
    for (let i = this.rpgRockets.length - 1; i >= 0; i--) {
      const r = this.rpgRockets[i];
      r.life -= delta;
      r.pos.addScaledVector(r.dir, r.speed * delta);
      r.mesh.position.copy(r.pos);

      // Trailing rocket smoke particles
      if (Math.random() < 0.6) {
        this.spawnImpactSparks(r.pos, new THREE.Vector3(0, 1, 0), 0xffaa44);
      }

      // Check collision with floor or walls
      let hit = false;
      if (r.pos.y <= 0.1) hit = true;

      if (!hit) {
        for (let box of this.mapData.colliders) {
          if (box.containsPoint(r.pos)) {
            hit = true;
            break;
          }
        }
      }

      if (hit || r.life <= 0) {
        this.scene.remove(r.mesh);
        this.rpgRockets.splice(i, 1);
        soundEngine.playExplosion();
        this.killstreaks.createExplosionEffect(r.pos, r.radius, r.damage);
      }
    }
  }

  spawnBulletDecal(position, normal) {
    const decalTex = textureGen.createBulletHoleTexture();
    const decalMat = new THREE.MeshBasicMaterial({
      map: decalTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4
    });

    const decalGeo = new THREE.PlaneGeometry(0.18, 0.18);
    const decalMesh = new THREE.Mesh(decalGeo, decalMat);
    decalMesh.position.copy(position).addScaledVector(normal, 0.005);
    decalMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.scene.add(decalMesh);

    this.bulletDecals.push(decalMesh);
    if (this.bulletDecals.length > 50) {
      const oldest = this.bulletDecals.shift();
      this.scene.remove(oldest);
    }
  }

  spawnBloodDecal(position, normal) {
    const bloodTex = textureGen.createBloodSplatterTexture();
    const bloodMat = new THREE.MeshBasicMaterial({
      map: bloodTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4
    });

    const bloodGeo = new THREE.PlaneGeometry(0.45, 0.45);
    const bloodMesh = new THREE.Mesh(bloodGeo, bloodMat);
    bloodMesh.position.copy(position).addScaledVector(normal, 0.005);
    bloodMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.scene.add(bloodMesh);

    setTimeout(() => this.scene.remove(bloodMesh), 8000);
  }

  spawnImpactSparks(position, normal, sparkColor = 0xffcc44) {
    const count = 12;
    const sparkGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      velocities.push(new THREE.Vector3(
        normal.x * 4.0 + (Math.random() - 0.5) * 6.0,
        normal.y * 4.0 + Math.random() * 5.0,
        normal.z * 4.0 + (Math.random() - 0.5) * 6.0
      ));
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: sparkColor,
      size: 0.08,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    this.scene.add(sparkPoints);

    this.impactSparks.push({
      mesh: sparkPoints,
      velocities: velocities,
      life: 0.35,
      maxLife: 0.35
    });
  }

  updateSparks(delta) {
    for (let i = this.impactSparks.length - 1; i >= 0; i--) {
      const sp = this.impactSparks[i];
      sp.life -= delta;
      if (sp.life <= 0) {
        this.scene.remove(sp.mesh);
        this.impactSparks.splice(i, 1);
        continue;
      }

      const posAttr = sp.mesh.geometry.attributes.position;
      for (let j = 0; j < sp.velocities.length; j++) {
        sp.velocities[j].y -= 9.8 * delta;
        posAttr.array[j * 3] += sp.velocities[j].x * delta;
        posAttr.array[j * 3 + 1] += sp.velocities[j].y * delta;
        posAttr.array[j * 3 + 2] += sp.velocities[j].z * delta;
      }
      posAttr.needsUpdate = true;
      sp.mesh.material.opacity = sp.life / sp.maxLife;
    }
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.postProcessing.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    this.player.update(delta, (weaponData) => {
      this.onPlayerShootBallistics(weaponData);
    });

    this.updateRPGRockets(delta);

    this.enemyManager.update(
      delta,
      this.player.position,
      (damage, sourcePos) => {
        this.player.takeDamage(damage, sourcePos);
        const dir = new THREE.Vector3().subVectors(sourcePos, this.player.position);
        this.hud.showDamageDirection(Math.atan2(dir.x, dir.z) - this.player.yaw);
      },
      (killedBot, isHeadshot, score) => {
        this.killstreaks.onPlayerKill(isHeadshot);
      }
    );

    this.killstreaks.update(delta, this.player.position);

    this.updateSparks(delta);

    const curWep = this.viewmodel.currentWeaponData;
    if (curWep) {
      this.hud.updateVitals(
        this.player.health,
        this.player.armor,
        this.player.maxHealth,
        curWep.currentAmmo,
        curWep.reserveAmmo,
        curWep.name
      );
    }
    this.hud.updateWave(this.enemyManager.currentWave, this.enemyManager.enemiesRemainingInWave);
    this.hud.renderMinimap(
      this.player.position,
      this.player.yaw,
      this.enemyManager.bots,
      this.killstreaks.streaks.uav.active
    );
    this.hud.updateCompass(this.player.yaw);

    this.postProcessing.render(time, delta, this.player.health, this.player.maxHealth);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
