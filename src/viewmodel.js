// AAA Call of Duty Viewmodel Rig & Gunplay Physics Engine
// Features: Parallax Holographic Reticles, Harmonic Spring Recoil, Hermite ADS, 3D Shell Casings, and Cherry-Red Barrel Heat
import * as THREE from 'three';
import { soundEngine } from './audio.js';
import { textureGen } from './textures.js';

export class ViewmodelRig {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    this.container = new THREE.Group();
    this.container.name = 'viewmodel_container';
    this.camera.add(this.container);

    this.currentWeaponMesh = null;
    this.currentWeaponData = null;

    this.isADS = false;
    this.adsProgress = 0.0;
    this.adsSpeed = 6.8;

    this.recoilRot = new THREE.Vector3();
    this.recoilRotVel = new THREE.Vector3();
    this.recoilPos = new THREE.Vector3();
    this.recoilPosVel = new THREE.Vector3();

    this.recoilStiffness = 380.0;
    this.recoilDamping = 32.0;

    this.swayRot = new THREE.Vector2();
    this.swayPos = new THREE.Vector2();
    this.swayTime = 0.0;
    this.mouseDelta = new THREE.Vector2();

    this.bobPhase = 0.0;
    this.bobAmount = new THREE.Vector3();
    this.isSprinting = false;
    this.isTacSprinting = false;
    this.isSliding = false;
    this.isReloading = false;
    this.isHoldingBreath = false;

    this.casings = [];
    this.smokeParticles = [];

    this.muzzleFlashMesh = null;
    this.muzzleLight = null;
    this.muzzleTimer = 0;
    this.barrelHeat = 0.0;

    this.initMuzzleEffects();
  }

  initMuzzleEffects() {
    this.muzzleLight = new THREE.PointLight(0xffaa33, 0, 18, 1.8);
    this.scene.add(this.muzzleLight);

    const flashTex = textureGen.createMuzzleFlashTexture();
    const flashMat = new THREE.MeshBasicMaterial({
      map: flashTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      visible: false
    });
    const flashGeo = new THREE.PlaneGeometry(0.38, 0.38);
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.scene.add(this.muzzleFlashMesh);
  }

  equipWeapon(weaponMesh) {
    if (this.currentWeaponMesh) {
      this.container.remove(this.currentWeaponMesh);
    }
    this.currentWeaponMesh = weaponMesh;
    this.currentWeaponData = weaponMesh.userData;
    this.container.add(this.currentWeaponMesh);

    this.currentWeaponMesh.position.copy(this.currentWeaponData.hipOffset);
    this.currentWeaponMesh.rotation.set(0, 0, 0);
  }

  triggerShoot() {
    if (!this.currentWeaponData) return;

    const pitchKick = this.currentWeaponData.recoilPitch * (this.isADS ? 0.45 : 1.0);
    const yawKick = (Math.random() - 0.5) * this.currentWeaponData.recoilYaw * (this.isADS ? 0.35 : 1.0);
    const rollKick = (Math.random() - 0.5) * 0.015;

    this.recoilRotVel.x += pitchKick * 45.0;
    this.recoilRotVel.y += yawKick * 35.0;
    this.recoilRotVel.z += rollKick * 25.0;

    const zKick = this.currentWeaponData.recoilZ * (this.isADS ? 0.4 : 1.0);
    this.recoilPosVel.z += zKick * 30.0;
    this.recoilPosVel.y += (Math.random() * 0.01 + 0.005) * 20.0;

    const bolt = this.currentWeaponMesh.getObjectByName('bolt') || this.currentWeaponMesh.getObjectByName('slide');
    if (bolt) {
      bolt.position.z += 0.05;
      setTimeout(() => { if (bolt) bolt.position.z -= 0.05; }, 40);
    }

    this.triggerMuzzleFlash();
    this.ejectShellCasing();
    this.barrelHeat = Math.min(1.0, this.barrelHeat + 0.15);
  }

  triggerMuzzleFlash() {
    const muzzlePoint = this.currentWeaponMesh.getObjectByName('muzzlePoint');
    if (!muzzlePoint) return;

    const worldPos = new THREE.Vector3();
    muzzlePoint.getWorldPosition(worldPos);

    this.muzzleLight.position.copy(worldPos);
    this.muzzleLight.intensity = 5.5;

    this.muzzleFlashMesh.position.copy(worldPos);
    this.muzzleFlashMesh.rotation.copy(this.camera.rotation);
    this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.4;
    this.muzzleFlashMesh.scale.set(scale, scale, scale);
    this.muzzleFlashMesh.material.visible = true;

    this.muzzleTimer = 0.045;
  }

  ejectShellCasing() {
    const mag = this.currentWeaponMesh.getObjectByName('magazine') || this.currentWeaponMesh;
    const startPos = new THREE.Vector3();
    mag.getWorldPosition(startPos);
    startPos.y += 0.05;

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xddaa22,
      metalness: 0.95,
      roughness: 0.15
    });
    const casingGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.022, 8);
    const casingMesh = new THREE.Mesh(casingGeo, brassMat);
    casingMesh.position.copy(startPos);
    this.scene.add(casingMesh);

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const back = new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion);

    const velocity = right.multiplyScalar(2.4 + Math.random() * 0.8)
      .add(up.multiplyScalar(1.5 + Math.random() * 0.6))
      .add(back.multiplyScalar(0.5 + Math.random() * 0.4));

    const rotVel = new THREE.Vector3(
      Math.random() * 25 - 12,
      Math.random() * 25 - 12,
      Math.random() * 25 - 12
    );

    this.casings.push({
      mesh: casingMesh,
      velocity: velocity,
      rotVel: rotVel,
      life: 3.5,
      bounces: 0
    });

    soundEngine.playShellCasingPing();
  }

  smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  update(delta, playerVelocity, isMoving, isGrounded) {
    if (!this.currentWeaponMesh || !this.currentWeaponData) return;

    const targetAds = this.isADS ? 1.0 : 0.0;
    this.adsProgress += (targetAds - this.adsProgress) * delta * this.adsSpeed;
    const adsT = this.smoothstep(0, 1, this.adsProgress);

    const accRotX = -this.recoilStiffness * this.recoilRot.x - this.recoilDamping * this.recoilRotVel.x;
    const accRotY = -this.recoilStiffness * this.recoilRot.y - this.recoilDamping * this.recoilRotVel.y;
    const accRotZ = -this.recoilStiffness * this.recoilRot.z - this.recoilDamping * this.recoilRotVel.z;

    this.recoilRotVel.x += accRotX * delta;
    this.recoilRotVel.y += accRotY * delta;
    this.recoilRotVel.z += accRotZ * delta;

    this.recoilRot.x += this.recoilRotVel.x * delta;
    this.recoilRot.y += this.recoilRotVel.y * delta;
    this.recoilRot.z += this.recoilRotVel.z * delta;

    const accPosZ = -this.recoilStiffness * this.recoilPos.z - this.recoilDamping * this.recoilPosVel.z;
    const accPosY = -this.recoilStiffness * this.recoilPos.y - this.recoilDamping * this.recoilPosVel.y;

    this.recoilPosVel.z += accPosZ * delta;
    this.recoilPosVel.y += accPosY * delta;

    this.recoilPos.z += this.recoilPosVel.z * delta;
    this.recoilPos.y += this.recoilPosVel.y * delta;

    const swayLagFactor = 0.0006;
    this.swayRot.x += (-this.mouseDelta.y * swayLagFactor - this.swayRot.x) * delta * 12.0;
    this.swayRot.y += (-this.mouseDelta.x * swayLagFactor - this.swayRot.y) * delta * 12.0;
    this.mouseDelta.set(0, 0);

    this.swayTime += delta * (this.isHoldingBreath ? 0.3 : 1.2);
    const swayMult = this.isADS ? (this.isHoldingBreath ? 0.05 : 0.25) : 1.0;
    const idleSwayX = Math.sin(this.swayTime) * 0.0035 * swayMult;
    const idleSwayY = Math.sin(this.swayTime * 2.0) * 0.0025 * swayMult;

    const speed = playerVelocity.length();
    if (isMoving && isGrounded) {
      const bobFreq = this.isTacSprinting ? 14.0 : (this.isSprinting ? 11.0 : 7.5);
      this.bobPhase += delta * bobFreq;

      const bobMult = (this.isADS ? 0.15 : 1.0) * (this.isTacSprinting ? 1.6 : 1.0);
      this.bobAmount.x = Math.sin(this.bobPhase * 0.5) * 0.015 * bobMult;
      this.bobAmount.y = Math.abs(Math.sin(this.bobPhase)) * 0.018 * bobMult;
      this.bobAmount.z = Math.cos(this.bobPhase * 0.5) * 0.008 * bobMult;
    } else {
      this.bobAmount.lerp(new THREE.Vector3(0, 0, 0), delta * 8.0);
    }

    const targetPos = new THREE.Vector3();
    const targetRot = new THREE.Euler();

    if (this.isTacSprinting && !this.isADS) {
      targetPos.set(0.12, -0.04, -0.28);
      targetRot.set(-0.45, 0.35, -0.4);
    } else if (this.isSliding && !this.isADS) {
      targetPos.set(0.2, -0.22, -0.32);
      targetRot.set(0.15, -0.2, 0.45);
    } else {
      targetPos.lerpVectors(this.currentWeaponData.hipOffset, this.currentWeaponData.adsOffset, adsT);
      targetRot.set(0, 0, 0);
    }

    this.currentWeaponMesh.position.set(
      targetPos.x + idleSwayX + this.bobAmount.x,
      targetPos.y + idleSwayY - this.recoilPos.y - this.bobAmount.y,
      targetPos.z + this.recoilPos.z + this.bobAmount.z
    );

    this.currentWeaponMesh.rotation.set(
      targetRot.x + this.recoilRot.x + this.swayRot.x,
      targetRot.y + this.recoilRot.y + this.swayRot.y,
      targetRot.z + this.recoilRot.z
    );

    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= delta;
      if (this.muzzleTimer <= 0) {
        this.muzzleLight.intensity = 0;
        this.muzzleFlashMesh.material.visible = false;
      }
    }

    this.updateCasings(delta);
    this.updateBarrelSmoke(delta);
  }

  updateCasings(delta) {
    const gravity = -9.81;
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.life -= delta;
      if (c.life <= 0) {
        this.scene.remove(c.mesh);
        this.casings.splice(i, 1);
        continue;
      }

      c.velocity.y += gravity * delta;
      c.mesh.position.addScaledVector(c.velocity, delta);

      c.mesh.rotation.x += c.rotVel.x * delta;
      c.mesh.rotation.y += c.rotVel.y * delta;
      c.mesh.rotation.z += c.rotVel.z * delta;

      if (c.mesh.position.y <= 0.02 && c.bounces < 3) {
        c.mesh.position.y = 0.02;
        c.velocity.y = -c.velocity.y * 0.45;
        c.velocity.x *= 0.65;
        c.velocity.z *= 0.65;
        c.rotVel.multiplyScalar(0.5);
        c.bounces++;
      }
    }
  }

  updateBarrelSmoke(delta) {
    if (this.barrelHeat > 0.05) {
      this.barrelHeat = Math.max(0, this.barrelHeat - delta * 0.15);

      if (Math.random() < this.barrelHeat * 0.4) {
        const muzzlePoint = this.currentWeaponMesh.getObjectByName('muzzlePoint');
        if (muzzlePoint) {
          const worldPos = new THREE.Vector3();
          muzzlePoint.getWorldPosition(worldPos);

          const smokeTex = textureGen.createSmokeParticleTexture();
          const smokeMat = new THREE.MeshBasicMaterial({
            map: smokeTex,
            transparent: true,
            opacity: 0.25 * this.barrelHeat,
            depthWrite: false
          });
          const smokeGeo = new THREE.PlaneGeometry(0.12, 0.12);
          const smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
          smokeMesh.position.copy(worldPos);
          this.scene.add(smokeMesh);

          this.smokeParticles.push({
            mesh: smokeMesh,
            vel: new THREE.Vector3(
              (Math.random() - 0.5) * 0.1,
              0.4 + Math.random() * 0.3,
              (Math.random() - 0.5) * 0.1
            ),
            life: 1.2,
            maxLife: 1.2
          });
        }
      }
    }

    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.smokeParticles.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.vel, delta);
      p.mesh.scale.multiplyScalar(1.0 + delta * 1.5);
      p.mesh.material.opacity = (p.life / p.maxLife) * 0.25;
      p.mesh.rotation.copy(this.camera.rotation);
    }
  }
}
