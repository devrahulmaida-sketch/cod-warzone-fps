// AAA Call of Duty Player Controller & Physics Engine
// Features: Pointer Lock, Tac-Sprint, CoD Slide & Slide Cancel, Crouch/Prone Stances, RPG Ballistics, Minigun Fire, Armor Plating, Stim Shot, and Mantle
import * as THREE from 'three';
import { soundEngine } from './audio.js';

export class PlayerController {
  constructor(camera, domElement, viewmodel, weaponFactory, colliders) {
    this.camera = camera;
    this.domElement = domElement;
    this.viewmodel = viewmodel;
    this.weaponFactory = weaponFactory;
    this.colliders = colliders;

    this.speedWalk = 5.2;
    this.speedSprint = 8.5;
    this.speedTacSprint = 11.5;
    this.speedCrouch = 2.8;
    this.speedProne = 1.4;
    this.speedSlide = 13.8;

    this.position = new THREE.Vector3(0, 1.75, 12);
    this.velocity = new THREE.Vector3();
    this.camera.position.copy(this.position);

    this.isGrounded = true;
    this.isCrouched = false;
    this.isProne = false;
    this.isSprinting = false;
    this.isTacSprinting = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDir = new THREE.Vector3();

    this.maxHealth = 100;
    this.health = 100;
    this.maxArmor = 150;
    this.armor = 100;
    this.stamina = 100;
    this.healthRegenCooldown = 0;
    this.stimTimer = 0;

    this.targetCameraHeight = 1.75;
    this.currentCameraHeight = 1.75;

    this.yaw = 0;
    this.pitch = 0;
    this.sensitivity = 0.0022;
    this.isPointerLocked = false;

    this.keys = {};
    this.isFiring = false;
    this.isADS = false;
    this.fireTimer = 0;
    this.lastShiftTime = 0;

    this.inventory = [];
    this.currentSlot = 0;

    this.initWeapons();
    this.bindEvents();
  }

  initWeapons() {
    this.inventory = [
      this.weaponFactory.createM4A1(),
      this.weaponFactory.createMP5(),
      this.weaponFactory.createSniper(),
      this.weaponFactory.createShotgun(),
      this.weaponFactory.createRPG7(),
      this.weaponFactory.createMinigun(),
      this.weaponFactory.createDeagle(),
      this.weaponFactory.createKarambit()
    ];

    this.selectWeapon(0);
  }

  selectWeapon(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.inventory.length) return;
    this.currentSlot = slotIndex;
    this.viewmodel.equipWeapon(this.inventory[this.currentSlot]);
    soundEngine.playReloadStage('rack');
  }

  bindEvents() {
    this.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;

      const fovScale = this.isADS ? 0.6 : 1.0;
      this.yaw -= e.movementX * this.sensitivity * fovScale;
      this.pitch -= e.movementY * this.sensitivity * fovScale;
      this.pitch = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, this.pitch));

      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;

      this.viewmodel.mouseDelta.x += e.movementX;
      this.viewmodel.mouseDelta.y += e.movementY;
    });

    document.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked) return;
      if (e.button === 0) this.isFiring = true;
      if (e.button === 2) {
        this.isADS = true;
        this.viewmodel.isADS = true;
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isFiring = false;
      if (e.button === 2) {
        this.isADS = false;
        this.viewmodel.isADS = false;
      }
    });

    document.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Weapon Switching: Digits 1 to 8
      if (e.code === 'Digit1') this.selectWeapon(0);
      if (e.code === 'Digit2') this.selectWeapon(1);
      if (e.code === 'Digit3') this.selectWeapon(2);
      if (e.code === 'Digit4') this.selectWeapon(3);
      if (e.code === 'Digit5') this.selectWeapon(4);
      if (e.code === 'Digit6') this.selectWeapon(5);
      if (e.code === 'Digit7') this.selectWeapon(6);
      if (e.code === 'Digit8') this.selectWeapon(7);

      // Tactical Stim Shot: E
      if (e.code === 'KeyE') {
        this.useStimShot();
      }

      // Armor Plating: B
      if (e.code === 'KeyB') {
        this.insertArmorPlate();
      }

      // Reload: R
      if (e.code === 'KeyR') this.reloadCurrentWeapon();

      // Crouch / Slide: C
      if (e.code === 'KeyC') {
        if (this.isSprinting || this.isTacSprinting) {
          this.startSlide();
        } else {
          this.toggleCrouch();
        }
      }

      // Prone: X
      if (e.code === 'KeyX') this.toggleProne();

      // Jump / Slide Cancel: Space
      if (e.code === 'Space') {
        if (this.isSliding) {
          this.isSliding = false;
          this.viewmodel.isSliding = false;
        } else if (this.isGrounded) {
          this.jump();
        }
      }

      // Tactical Sprint double tap Shift
      if (e.code === 'ShiftLeft') {
        const now = performance.now();
        if (now - this.lastShiftTime < 300) {
          this.isTacSprinting = true;
          this.viewmodel.isTacSprinting = true;
        }
        this.lastShiftTime = now;
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'ShiftLeft') {
        this.isTacSprinting = false;
        this.viewmodel.isTacSprinting = false;
      }
    });
  }

  useStimShot() {
    soundEngine.playStimInject();
    this.health = this.maxHealth;
    this.stamina = 100;
    this.stimTimer = 6.0; // 6 seconds of unlimited sprint boost!
  }

  insertArmorPlate() {
    if (this.armor < this.maxArmor) {
      soundEngine.playArmorPlate();
      this.armor = Math.min(this.maxArmor, this.armor + 50);
    }
  }

  toggleCrouch() {
    this.isCrouched = !this.isCrouched;
    this.isProne = false;
    this.targetCameraHeight = this.isCrouched ? 1.1 : 1.75;
  }

  toggleProne() {
    this.isProne = !this.isProne;
    this.isCrouched = false;
    this.targetCameraHeight = this.isProne ? 0.45 : 1.75;
  }

  jump() {
    this.velocity.y = 5.4;
    this.isGrounded = false;
    this.isCrouched = false;
    this.isProne = false;
    this.targetCameraHeight = 1.75;
    soundEngine.playFootstep('concrete', true);
  }

  startSlide() {
    this.isSliding = true;
    this.viewmodel.isSliding = true;
    this.slideTimer = 0.85;
    this.slideDir.copy(this.velocity).normalize();
    this.targetCameraHeight = 0.95;
    soundEngine.playFootstep('concrete', true);
  }

  reloadCurrentWeapon() {
    const cur = this.viewmodel.currentWeaponData;
    if (!cur || cur.currentAmmo >= cur.magazineSize || cur.reserveAmmo <= 0) return;

    soundEngine.playReloadStage('out');
    setTimeout(() => soundEngine.playReloadStage('in'), 700);
    setTimeout(() => {
      soundEngine.playReloadStage('rack');
      const needed = cur.magazineSize - cur.currentAmmo;
      const actual = Math.min(needed, cur.reserveAmmo);
      cur.currentAmmo += actual;
      cur.reserveAmmo -= actual;
    }, 1400);
  }

  takeDamage(amount, sourcePos) {
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, amount);
      this.armor -= absorbed;
      amount -= absorbed;
    }
    this.health = Math.max(0, this.health - amount);
    this.healthRegenCooldown = 4.0;

    soundEngine.playHitmarker('body');

    if (this.health <= 0) {
      this.respawnPlayer();
    }
  }

  respawnPlayer() {
    this.health = this.maxHealth;
    this.armor = 100;
    this.position.set(0, 1.75, 15);
    this.camera.position.copy(this.position);
    this.velocity.set(0, 0, 0);
  }

  update(delta, onShootCallback) {
    const moveVector = new THREE.Vector3();
    if (this.keys['KeyW']) moveVector.z -= 1;
    if (this.keys['KeyS']) moveVector.z += 1;
    if (this.keys['KeyA']) moveVector.x -= 1;
    if (this.keys['KeyD']) moveVector.x += 1;

    const isMoving = moveVector.lengthSq() > 0;
    if (isMoving) moveVector.normalize();

    this.isSprinting = this.keys['ShiftLeft'] && this.keys['KeyW'] && !this.isADS && !this.isCrouched;
    this.viewmodel.isSprinting = this.isSprinting;

    let currentSpeed = this.speedWalk;
    if (this.stimTimer > 0) {
      this.stimTimer -= delta;
      currentSpeed = this.speedTacSprint * 1.15;
    } else if (this.isSliding) {
      currentSpeed = this.speedSlide;
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.viewmodel.isSliding = false;
        this.targetCameraHeight = 1.75;
      }
    } else if (this.isTacSprinting && this.stamina > 10) {
      currentSpeed = this.speedTacSprint;
      this.stamina -= delta * 18.0;
    } else if (this.isSprinting) {
      currentSpeed = this.speedSprint;
    } else if (this.isCrouched) {
      currentSpeed = this.speedCrouch;
    } else if (this.isProne) {
      currentSpeed = this.speedProne;
    }

    if (!this.isTacSprinting) {
      this.stamina = Math.min(100, this.stamina + delta * 25.0);
    }

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const worldMove = new THREE.Vector3()
      .addScaledVector(forward, -moveVector.z)
      .addScaledVector(right, moveVector.x);

    const damping = 12.0;
    this.velocity.x += (worldMove.x * currentSpeed - this.velocity.x) * damping * delta;
    this.velocity.z += (worldMove.z * currentSpeed - this.velocity.z) * damping * delta;

    const gravity = -18.0;
    if (!this.isGrounded) {
      this.velocity.y += gravity * delta;
    }

    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;
    this.position.y += this.velocity.y * delta;

    this.currentCameraHeight += (this.targetCameraHeight - this.currentCameraHeight) * delta * 10.0;
    this.camera.position.set(this.position.x, this.position.y - 1.75 + this.currentCameraHeight, this.position.z);

    if (this.position.y <= 1.75) {
      this.position.y = 1.75;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    for (let box of this.colliders) {
      const playerSphere = new THREE.Sphere(this.position, 0.4);
      if (box.intersectsSphere(playerSphere)) {
        const center = new THREE.Vector3();
        box.getCenter(center);
        const pushDir = new THREE.Vector3().subVectors(this.position, center);
        pushDir.y = 0;
        pushDir.normalize();
        this.position.addScaledVector(pushDir, 0.1);
      }
    }

    if (isMoving && this.isGrounded) {
      this.stepTimer = (this.stepTimer || 0) + delta * (this.isSprinting ? 2.8 : 1.8);
      if (this.stepTimer > 1.0) {
        this.stepTimer = 0;
        soundEngine.playFootstep('concrete', this.isSprinting);
      }
    }

    if (this.healthRegenCooldown > 0) {
      this.healthRegenCooldown -= delta;
    } else if (this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + delta * 20.0);
    }

    this.fireTimer -= delta;
    if (this.isFiring && this.fireTimer <= 0) {
      this.fireActiveWeapon(onShootCallback);
    }

    this.viewmodel.update(delta, this.velocity, isMoving, this.isGrounded);
  }

  fireActiveWeapon(onShootCallback) {
    const cur = this.viewmodel.currentWeaponData;
    if (!cur) return;

    if (cur.currentAmmo <= 0) {
      soundEngine.playReloadStage('out');
      this.fireTimer = 0.35;
      return;
    }

    cur.currentAmmo--;
    this.fireTimer = cur.fireRate;

    this.viewmodel.triggerShoot();

    if (cur.type === 'rpg') soundEngine.playRPGLaunch();
    else if (cur.type === 'minigun') soundEngine.playMinigunFire();
    else if (cur.type === 'sniper') soundEngine.playSniperFire();
    else if (cur.type === 'shotgun') soundEngine.playShotgunFire();
    else if (cur.type === 'smg') soundEngine.playSMGFire(this.weaponFactory.hasSilencer);
    else if (cur.type === 'pistol') soundEngine.playDeagleFire();
    else if (cur.type === 'melee') soundEngine.playMeleeSlash(false);
    else soundEngine.playM4Fire(this.weaponFactory.hasSilencer);

    this.pitch += cur.recoilPitch * (this.isADS ? 0.3 : 0.6);
    this.yaw += (Math.random() - 0.5) * cur.recoilYaw * 0.5;

    if (onShootCallback) {
      onShootCallback(cur);
    }
  }
}
