// AAA Call of Duty Enemy Combat AI Engine & Wave Survival System
// Features: 6 Combat Archetypes (Recon, Rusher, Juggernaut, Sniper, Riot Shield Enforcer, Kamikaze Drones), 3D Floating Healthbars, Blood Pooling, and Wave Escalation
import * as THREE from 'three';
import { soundEngine } from './audio.js';
import { textureGen } from './textures.js';

export class EnemyBotManager {
  constructor(scene, colliders, spawnPoints) {
    this.scene = scene;
    this.colliders = colliders;
    this.spawnPoints = spawnPoints.length > 0 ? spawnPoints : [
      new THREE.Vector3(-18, 1, -18),
      new THREE.Vector3(18, 1, 18),
      new THREE.Vector3(-28, 1, 22),
      new THREE.Vector3(22, 1, -22),
      new THREE.Vector3(0, 1, -28),
      new THREE.Vector3(-35, 7.2, -35),
      new THREE.Vector3(32, 1, 32)
    ];

    this.bots = [];
    this.botProjectiles = [];
    this.ragdolls = [];
    this.bloodPools = [];
    this.raycaster = new THREE.Raycaster();

    // Wave Survival Progression
    this.currentWave = 1;
    this.waveState = 'ACTIVE'; // 'ACTIVE', 'INTERMISSION', 'BOSS'
    this.waveTimer = 0;
    this.enemiesRemainingInWave = 0;
  }

  initBots() {
    this.startWave(1);
  }

  startWave(waveNumber) {
    this.currentWave = waveNumber;
    this.waveState = (waveNumber % 3 === 0) ? 'BOSS' : 'ACTIVE';

    // Clear existing bots
    for (let bot of this.bots) {
      this.scene.remove(bot.group);
    }
    this.bots = [];

    soundEngine.playAnnouncer(this.waveState === 'BOSS' ? 'juggernaut_wave' : 'wave_start');

    // Calculate wave composition
    const botArchetypes = [];
    if (this.waveState === 'BOSS') {
      botArchetypes.push('juggernaut', 'juggernaut', 'sniper', 'shield', 'rusher', 'drone', 'drone');
    } else {
      const count = Math.min(12, 4 + waveNumber * 2);
      for (let i = 0; i < count; i++) {
        if (i === 0 && waveNumber >= 2) botArchetypes.push('shield');
        else if (i === 1 && waveNumber >= 2) botArchetypes.push('sniper');
        else if (i % 4 === 0 && waveNumber >= 3) botArchetypes.push('drone');
        else if (i % 3 === 0) botArchetypes.push('rusher');
        else botArchetypes.push('assault');
      }
    }

    this.enemiesRemainingInWave = botArchetypes.length;
    botArchetypes.forEach((type, idx) => {
      this.spawnBot(type, idx);
    });
  }

  // Spawn Enemy with distinct 3D geometry, attachments, and healthbar
  spawnBot(type = 'assault', index = 0) {
    const botGroup = new THREE.Group();
    botGroup.name = `bot_${type}_${index}`;

    const spawnPos = this.spawnPoints[index % this.spawnPoints.length].clone();
    spawnPos.x += (Math.random() - 0.5) * 6;
    spawnPos.z += (Math.random() - 0.5) * 6;
    botGroup.position.copy(spawnPos);

    let uniformColor = 0x2e3532;
    let armorColor = 0x1f2322;
    let maxHealth = 100;
    let maxArmor = 50;
    let speed = 4.2;
    let fireRate = 0.18;
    let burstCount = 4;
    let damage = 12;

    let isFlyingDrone = (type === 'drone');
    let hasRiotShield = (type === 'shield');

    if (type === 'rusher') {
      uniformColor = 0x3d433b;
      speed = 6.2;
      fireRate = 0.11;
      burstCount = 6;
      damage = 9;
    } else if (type === 'juggernaut') {
      uniformColor = 0x151618;
      armorColor = 0x4a4d52;
      maxHealth = 450; // Heavy Armor Boss
      maxArmor = 200;
      speed = 2.4;
      fireRate = 0.06; // Minigun
      burstCount = 24;
      damage = 16;
    } else if (type === 'sniper') {
      uniformColor = 0x444036;
      speed = 3.4;
      fireRate = 1.8;
      burstCount = 1;
      damage = 55;
    } else if (type === 'shield') {
      uniformColor = 0x222628;
      maxHealth = 140;
      speed = 3.6;
      fireRate = 0.35;
      burstCount = 3;
      damage = 18;
    } else if (type === 'drone') {
      maxHealth = 45;
      maxArmor = 0;
      speed = 8.5;
      damage = 90; // Suicide explosion
    }

    const uniformMat = new THREE.MeshStandardMaterial({ color: uniformColor, roughness: 0.8 });
    const armorMat = new THREE.MeshStandardMaterial({ color: armorColor, roughness: 0.4, metalness: 0.7 });
    const fleshMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 });

    let torso, headGroup, leftLeg, rightLeg, sniperLaser, riotShieldMesh, minigunMesh, droneRotors;

    if (isFlyingDrone) {
      // 3D Quadcopter Kamikaze Drone Mesh
      const droneBodyGeo = new THREE.BoxGeometry(0.4, 0.12, 0.4);
      const droneMat = new THREE.MeshStandardMaterial({ color: 0x111113, metalness: 0.9, roughness: 0.2 });
      torso = new THREE.Mesh(droneBodyGeo, droneMat);
      torso.name = 'body_hitbox';
      botGroup.add(torso);

      // 4 Drone Rotor Arms
      droneRotors = [];
      const armAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
      armAngles.forEach(ang => {
        const armGeo = new THREE.BoxGeometry(0.04, 0.02, 0.28);
        const arm = new THREE.Mesh(armGeo, droneMat);
        arm.rotation.y = ang;
        botGroup.add(arm);

        const bladeGeo = new THREE.BoxGeometry(0.24, 0.005, 0.02);
        const bladeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.set(Math.cos(ang) * 0.22, 0.06, Math.sin(ang) * 0.22);
        botGroup.add(blade);
        droneRotors.push(blade);
      });

      // Red Blinking Suicide LED Eye
      const ledGeo = new THREE.SphereGeometry(0.05, 8, 8);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, 0, 0.22);
      botGroup.add(led);
    } else {
      // Humanoid Mesh
      const torsoGeo = new THREE.BoxGeometry(type === 'juggernaut' ? 0.7 : 0.5, 0.75, 0.32);
      torso = new THREE.Mesh(torsoGeo, uniformMat);
      torso.position.set(0, 0.95, 0);
      torso.castShadow = true;
      torso.name = 'body_hitbox';
      botGroup.add(torso);

      // Ballistic Vest
      const vestGeo = new THREE.BoxGeometry(type === 'juggernaut' ? 0.76 : 0.54, 0.55, 0.36);
      const vest = new THREE.Mesh(vestGeo, armorMat);
      vest.position.set(0, 0.98, 0);
      vest.castShadow = true;
      botGroup.add(vest);

      // Head & Ballistic Helmet
      headGroup = new THREE.Group();
      headGroup.position.set(0, 1.55, 0);
      headGroup.name = 'head_hitbox';

      const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const head = new THREE.Mesh(headGeo, fleshMat);
      headGroup.add(head);

      const helmetGeo = new THREE.SphereGeometry(0.22, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
      const helmet = new THREE.Mesh(helmetGeo, armorMat);
      headGroup.add(helmet);

      // Tactical Visor / NVG Eyes
      const visorGeo = new THREE.BoxGeometry(0.24, 0.06, 0.08);
      const visorColor = (type === 'sniper' ? 0xff2222 : (type === 'juggernaut' ? 0xffaa00 : 0x00ff88));
      const visorMat = new THREE.MeshBasicMaterial({ color: visorColor });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 0, 0.16);
      headGroup.add(visor);

      botGroup.add(headGroup);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
      leftLeg = new THREE.Mesh(legGeo, uniformMat);
      leftLeg.position.set(-0.16, 0.35, 0);
      leftLeg.castShadow = true;
      botGroup.add(leftLeg);

      rightLeg = new THREE.Mesh(legGeo, uniformMat);
      rightLeg.position.set(0.16, 0.35, 0);
      rightLeg.castShadow = true;
      botGroup.add(rightLeg);

      // Weapons / Shields
      if (hasRiotShield) {
        // Heavy Bulletproof Riot Shield
        const shieldGeo = new THREE.BoxGeometry(0.85, 1.45, 0.08);
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0x181a1f, metalness: 0.8, roughness: 0.3 });
        riotShieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        riotShieldMesh.position.set(0, 0.9, 0.45);
        riotShieldMesh.name = 'riot_shield';
        botGroup.add(riotShieldMesh);

        // Polycarbonate Viewport Window
        const windowGeo = new THREE.PlaneGeometry(0.35, 0.15);
        const windowMat = new THREE.MeshPhysicalMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4, transmission: 0.9 });
        const viewWin = new THREE.Mesh(windowGeo, windowMat);
        viewWin.position.set(0, 1.25, 0.5);
        botGroup.add(viewWin);
      } else if (type === 'juggernaut') {
        // Rotating 6-Barrel Gatling Minigun
        minigunMesh = new THREE.Group();
        const minigunBodyGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.7, 12);
        const minigunBody = new THREE.Mesh(minigunBodyGeo, armorMat);
        minigunBody.rotation.x = Math.PI / 2;
        minigunBody.position.set(0.25, 0.85, 0.5);
        minigunMesh.add(minigunBody);
        botGroup.add(minigunMesh);
      } else if (type === 'sniper') {
        const sniperGunGeo = new THREE.BoxGeometry(0.06, 0.08, 1.1);
        const sniperGunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
        const sniperGun = new THREE.Mesh(sniperGunGeo, sniperGunMat);
        sniperGun.position.set(0.2, 0.85, 0.6);
        botGroup.add(sniperGun);

        // Visible Red Targeting Laser
        const laserGeo = new THREE.CylinderGeometry(0.003, 0.003, 50, 6);
        const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
        sniperLaser = new THREE.Mesh(laserGeo, laserMat);
        sniperLaser.rotation.x = Math.PI / 2;
        sniperLaser.position.set(0.2, 0.85, 25.6);
        botGroup.add(sniperLaser);
      } else {
        const botGunGeo = new THREE.BoxGeometry(0.08, 0.12, 0.6);
        const botGunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
        const botGun = new THREE.Mesh(botGunGeo, botGunMat);
        botGun.position.set(0.2, 0.85, 0.4);
        botGroup.add(botGun);
      }
    }

    // 3D Floating Healthbar Plane
    const hbCanvas = document.createElement('canvas');
    hbCanvas.width = 128;
    hbCanvas.height = 32;
    const hbCtx = hbCanvas.getContext('2d');
    const hbTexture = new THREE.CanvasTexture(hbCanvas);
    const hbMaterial = new THREE.MeshBasicMaterial({ map: hbTexture, transparent: true, depthWrite: false });
    const hbMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), hbMaterial);
    hbMesh.position.set(0, isFlyingDrone ? 0.45 : 1.95, 0);
    hbMesh.name = 'healthbar';
    botGroup.add(hbMesh);

    this.scene.add(botGroup);

    const botObj = {
      group: botGroup,
      headGroup: headGroup,
      torso: torso,
      leftLeg: leftLeg,
      rightLeg: rightLeg,
      sniperLaser: sniperLaser,
      riotShieldMesh: riotShieldMesh,
      minigunMesh: minigunMesh,
      droneRotors: droneRotors,
      hbCanvas: hbCanvas,
      hbCtx: hbCtx,
      hbTexture: hbTexture,
      hbMesh: hbMesh,
      type: type,
      name: `SHADOW_${type.toUpperCase()}_${index + 1}`,
      maxHealth: maxHealth,
      health: maxHealth,
      maxArmor: maxArmor,
      armor: maxArmor,
      speed: speed,
      fireRate: fireRate,
      burstCount: burstCount,
      currentBurst: 0,
      damage: damage,
      state: 'PATROL',
      shootCooldown: 0.5 + Math.random() * 0.8,
      moveTarget: this.getRandomPatrolPoint(),
      walkPhase: Math.random() * Math.PI * 2,
      isDead: false,
      isFlyingDrone: isFlyingDrone,
      hasRiotShield: hasRiotShield
    };

    this.update3DHealthbar(botObj);
    this.bots.push(botObj);
  }

  update3DHealthbar(bot) {
    const ctx = bot.hbCtx;
    ctx.clearRect(0, 0, 128, 32);

    // Background bar
    ctx.fillStyle = 'rgba(10, 14, 20, 0.85)';
    ctx.fillRect(0, 0, 128, 32);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 128, 32);

    // Health fill (Red / Orange / Green)
    const hpPct = Math.max(0, bot.health / bot.maxHealth);
    ctx.fillStyle = bot.type === 'juggernaut' ? '#ffaa00' : (hpPct > 0.5 ? '#00ff88' : '#ff2222');
    ctx.fillRect(4, 14, (120 * hpPct), 14);

    // Armor fill bar (Cyan)
    if (bot.maxArmor > 0) {
      const armPct = Math.max(0, bot.armor / bot.maxArmor);
      ctx.fillStyle = '#3399ff';
      ctx.fillRect(4, 4, (120 * armPct), 8);
    }

    // Name text
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(bot.name.substring(0, 12), 6, 12);

    bot.hbTexture.needsUpdate = true;
  }

  getRandomPatrolPoint() {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 60,
      0,
      (Math.random() - 0.5) * 60
    );
  }

  hasLineOfSight(botPos, playerPos) {
    const dir = new THREE.Vector3().subVectors(playerPos, botPos);
    const dist = dir.length();
    dir.normalize();

    this.raycaster.set(botPos, dir);
    this.raycaster.far = dist;

    for (let box of this.colliders) {
      const ray = new THREE.Ray(botPos, dir);
      const hit = ray.intersectBox(box, new THREE.Vector3());
      if (hit && hit.distanceTo(botPos) < dist - 0.5) {
        return false;
      }
    }
    return true;
  }

  update(delta, playerPos, playerTakeDamageCallback, onBotKilledCallback) {
    for (let bot of this.bots) {
      if (bot.isDead) continue;

      const botPos = bot.group.position;
      const distToPlayer = botPos.distanceTo(playerPos);
      const eyePos = botPos.clone().add(new THREE.Vector3(0, bot.isFlyingDrone ? 0.3 : 1.5, 0));
      const playerEyePos = playerPos.clone().add(new THREE.Vector3(0, 1.5, 0));

      const canSeePlayer = this.hasLineOfSight(eyePos, playerEyePos);

      // Rotate healthbar towards player camera
      if (bot.hbMesh) {
        bot.hbMesh.lookAt(playerEyePos);
      }

      // Drone flight mechanics
      if (bot.isFlyingDrone) {
        // Spin rotors
        bot.droneRotors.forEach(r => r.rotation.y += delta * 45.0);
        botPos.y = 1.8 + Math.sin(performance.now() * 0.005) * 0.4;

        if (distToPlayer < 2.5) {
          // Kamikaze Suicide Detonation!
          bot.isDead = true;
          this.scene.remove(bot.group);
          soundEngine.playExplosion();
          playerTakeDamageCallback(bot.damage, botPos);
          this.checkWaveProgress(onBotKilledCallback);
          continue;
        } else if (distToPlayer < 40) {
          // Fly aggressively toward player
          const flyDir = new THREE.Vector3().subVectors(playerPos, botPos).normalize();
          botPos.addScaledVector(flyDir, bot.speed * delta);
          bot.group.lookAt(playerPos);
          if (Math.random() < 0.1) soundEngine.playDroneBeep();
        }
        continue;
      }

      // Juggernaut Minigun Spin
      if (bot.type === 'juggernaut' && bot.minigunMesh && bot.state === 'ATTACK') {
        bot.minigunMesh.rotation.z += delta * 25.0;
      }

      // State Machine
      if (canSeePlayer && distToPlayer < 55) {
        if (bot.health < bot.maxHealth * 0.35 && distToPlayer > 15 && !bot.hasRiotShield) {
          bot.state = 'COVER';
        } else {
          bot.state = 'ATTACK';
        }
      } else if (distToPlayer < 35) {
        bot.state = 'CHASE';
      } else {
        bot.state = 'PATROL';
      }

      // Execute Behaviors
      if (bot.state === 'ATTACK') {
        const lookTarget = new THREE.Vector3(playerPos.x, botPos.y, playerPos.z);
        bot.group.lookAt(lookTarget);

        if (bot.type === 'rusher') {
          const strafeDir = new THREE.Vector3(Math.cos(bot.walkPhase), 0, Math.sin(bot.walkPhase));
          botPos.addScaledVector(strafeDir, bot.speed * 0.6 * delta);
        } else if (bot.hasRiotShield) {
          // Slow advance while keeping shield between bot and player
          const advanceDir = new THREE.Vector3().subVectors(playerPos, botPos).normalize();
          advanceDir.y = 0;
          botPos.addScaledVector(advanceDir, bot.speed * 0.7 * delta);
        }

        bot.shootCooldown -= delta;
        if (bot.shootCooldown <= 0) {
          this.botFireShot(bot, playerPos, playerTakeDamageCallback);
        }
      } else if (bot.state === 'CHASE') {
        const dir = new THREE.Vector3().subVectors(playerPos, botPos);
        dir.y = 0;
        dir.normalize();

        bot.group.lookAt(botPos.clone().add(dir));
        botPos.addScaledVector(dir, bot.speed * delta);
        this.animateBotWalking(bot, delta);
      } else if (bot.state === 'PATROL') {
        const dir = new THREE.Vector3().subVectors(bot.moveTarget, botPos);
        dir.y = 0;
        const dist = dir.length();

        if (dist < 2.0) {
          bot.moveTarget = this.getRandomPatrolPoint();
        } else {
          dir.normalize();
          bot.group.lookAt(botPos.clone().add(dir));
          botPos.addScaledVector(dir, bot.speed * 0.7 * delta);
          this.animateBotWalking(bot, delta);
        }
      }

      if (botPos.y < 0) botPos.y = 0;
    }

    this.updateBotProjectiles(delta);
    this.updateRagdolls(delta);
    this.updateBloodPools(delta);
  }

  animateBotWalking(bot, delta) {
    if (!bot.leftLeg || !bot.rightLeg) return;
    bot.walkPhase += delta * 10.0;
    bot.leftLeg.rotation.x = Math.sin(bot.walkPhase) * 0.5;
    bot.rightLeg.rotation.x = -Math.sin(bot.walkPhase) * 0.5;
  }

  botFireShot(bot, playerPos, playerTakeDamageCallback) {
    bot.currentBurst++;
    if (bot.currentBurst >= bot.burstCount) {
      bot.currentBurst = 0;
      bot.shootCooldown = bot.type === 'sniper' ? 1.8 : (bot.type === 'juggernaut' ? 0.35 : (0.8 + Math.random() * 0.6));
    } else {
      bot.shootCooldown = bot.fireRate;
    }

    if (bot.type === 'sniper') soundEngine.playSniperFire();
    else if (bot.type === 'juggernaut') soundEngine.playMinigunFire();
    else if (bot.type === 'rusher') soundEngine.playSMGFire(false);
    else soundEngine.playM4Fire(false);

    const startPos = bot.group.position.clone().add(new THREE.Vector3(0.2, 1.4, 0.4));
    const targetPos = playerPos.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * (bot.type === 'sniper' ? 0.35 : 1.2),
      0.9 + (Math.random() - 0.5) * 0.6,
      (Math.random() - 0.5) * (bot.type === 'sniper' ? 0.35 : 1.2)
    ));

    const dir = new THREE.Vector3().subVectors(targetPos, startPos).normalize();

    const tracerGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6);
    const tracerMat = new THREE.MeshBasicMaterial({ color: bot.type === 'juggernaut' ? 0xffaa00 : 0xff4411 });
    const tracer = new THREE.Mesh(tracerGeo, tracerMat);
    tracer.position.copy(startPos);
    tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    this.scene.add(tracer);

    this.botProjectiles.push({
      mesh: tracer,
      pos: startPos,
      dir: dir,
      speed: 90.0,
      life: 1.2,
      damage: bot.damage
    });

    const distToPlayer = bot.group.position.distanceTo(playerPos);
    const hitChance = bot.type === 'sniper' ? 0.8 : (bot.type === 'juggernaut' ? 0.6 : Math.max(0.25, 0.7 - distToPlayer * 0.015));

    if (Math.random() < hitChance) {
      setTimeout(() => {
        playerTakeDamageCallback(bot.damage, bot.group.position);
      }, (distToPlayer / 90.0) * 1000);
    }
  }

  updateBotProjectiles(delta) {
    for (let i = this.botProjectiles.length - 1; i >= 0; i--) {
      const p = this.botProjectiles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.botProjectiles.splice(i, 1);
        continue;
      }
      p.pos.addScaledVector(p.dir, p.speed * delta);
      p.mesh.position.copy(p.pos);
    }
  }

  damageBot(botMesh, damage, isHeadshot, hitPoint, shotDir, onBotKilledCallback) {
    const bot = this.bots.find(b => b.group === botMesh || b.group.getObjectById(botMesh.id));
    if (!bot || bot.isDead) return null;

    // Check Riot Shield deflection
    if (bot.hasRiotShield && hitPoint) {
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(bot.group.quaternion);
      const toShooter = shotDir.clone().negate();
      const dot = forward.dot(toShooter);
      if (dot > 0.3 && !isHeadshot) {
        soundEngine.playShieldDeflect();
        return { isShieldBlock: true, damage: 0 };
      }
    }

    let actualDamage = isHeadshot ? damage * (bot.type === 'sniper' ? 3.0 : 2.2) : damage;

    // Absorb with armor first
    if (bot.armor > 0) {
      const absorbed = Math.min(bot.armor, actualDamage);
      bot.armor -= absorbed;
      actualDamage -= absorbed;
    }

    bot.health -= actualDamage;
    this.update3DHealthbar(bot);

    if (bot.health <= 0) {
      bot.isDead = true;
      bot.health = 0;
      this.triggerRagdollDeath(bot, shotDir);
      this.spawnBloodPool(bot.group.position);

      const score = (bot.type === 'juggernaut') ? 500 : (isHeadshot ? 150 : 100);
      onBotKilledCallback(bot, isHeadshot, score);
      this.checkWaveProgress(onBotKilledCallback);

      return { isKill: true, isHeadshot: isHeadshot, score: score, botName: bot.name };
    }

    return { isKill: false, isHeadshot: isHeadshot, damage: actualDamage };
  }

  checkWaveProgress(onBotKilledCallback) {
    const aliveCount = this.bots.filter(b => !b.isDead).length;
    this.enemiesRemainingInWave = aliveCount;

    if (aliveCount === 0) {
      soundEngine.playAnnouncer('wave_cleared');
      setTimeout(() => {
        this.startWave(this.currentWave + 1);
      }, 4000);
    }
  }

  spawnBloodPool(position) {
    const poolTex = textureGen.createBloodSplatterTexture();
    const poolMat = new THREE.MeshBasicMaterial({
      map: poolTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4
    });
    const poolGeo = new THREE.PlaneGeometry(0.3, 0.3);
    const poolMesh = new THREE.Mesh(poolGeo, poolMat);
    poolMesh.rotation.x = -Math.PI / 2;
    poolMesh.position.set(position.x, 0.015, position.z);
    this.scene.add(poolMesh);

    this.bloodPools.push({
      mesh: poolMesh,
      scale: 0.3,
      maxScale: 1.8 + Math.random() * 0.8
    });
  }

  updateBloodPools(delta) {
    for (let p of this.bloodPools) {
      if (p.scale < p.maxScale) {
        p.scale += delta * 0.4;
        p.mesh.scale.set(p.scale, p.scale, 1);
      }
    }
  }

  triggerRagdollDeath(bot, shotDir) {
    bot.group.visible = false;

    const ragdollMesh = bot.group.clone();
    ragdollMesh.visible = true;
    this.scene.add(ragdollMesh);

    const impulse = shotDir.clone().normalize().multiplyScalar(4.8).add(new THREE.Vector3(0, 2.8, 0));
    const rotImpulse = new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8
    );

    this.ragdolls.push({
      mesh: ragdollMesh,
      velocity: impulse,
      rotVel: rotImpulse,
      life: 8.0
    });
  }

  updateRagdolls(delta) {
    const gravity = -9.81;
    for (let i = this.ragdolls.length - 1; i >= 0; i--) {
      const r = this.ragdolls[i];
      r.life -= delta;
      if (r.life <= 0) {
        this.scene.remove(r.mesh);
        this.ragdolls.splice(i, 1);
        continue;
      }

      r.velocity.y += gravity * delta;
      r.mesh.position.addScaledVector(r.velocity, delta);

      r.mesh.rotation.x += r.rotVel.x * delta;
      r.mesh.rotation.y += r.rotVel.y * delta;
      r.mesh.rotation.z += r.rotVel.z * delta;

      if (r.mesh.position.y <= 0.2) {
        r.mesh.position.y = 0.2;
        r.velocity.set(0, 0, 0);
        r.rotVel.set(0, 0, 0);
        r.mesh.rotation.x = Math.PI / 2;
      }
    }
  }
}
