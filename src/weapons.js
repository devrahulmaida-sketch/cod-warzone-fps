// AAA Procedural 3D Weapon Models & Rigging for Three.js
// Features: M4A1 AR, MP5 SMG, MCPR-300 .50 Sniper, Expedite Shotgun, .50 GS Deagle, RPG-7 Rocket Launcher, M133 Minigun, and Combat Karambit
import * as THREE from 'three';
import { textureGen } from './textures.js';

export class WeaponFactory {
  constructor() {
    this.camoType = 'damascus';
    this.opticType = 'holographic';
    this.hasSilencer = false;
    this.laserEnabled = true;
  }

  setCamo(camo) {
    this.camoType = camo;
  }

  setOptic(optic) {
    this.opticType = optic;
  }

  createWeaponMaterial(customColor = null) {
    const camoData = textureGen.createWeaponCamoTexture(this.camoType);
    const mat = new THREE.MeshStandardMaterial({
      map: camoData.diffuse,
      normalMap: camoData.normal,
      roughnessMap: camoData.roughness,
      metalnessMap: camoData.metalness,
      roughness: 0.35,
      metalness: 0.85,
      color: customColor ? new THREE.Color(customColor) : new THREE.Color(0xffffff)
    });
    return mat;
  }

  createDarkMetalMaterial() {
    const camoData = textureGen.createWeaponCamoTexture('matte_black');
    return new THREE.MeshStandardMaterial({
      map: camoData.diffuse,
      normalMap: camoData.normal,
      roughnessMap: camoData.roughness,
      metalnessMap: camoData.metalness,
      roughness: 0.6,
      metalness: 0.7,
      color: new THREE.Color(0x222428)
    });
  }

  createGoldTrimMaterial() {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xe5b830),
      roughness: 0.2,
      metalness: 0.95
    });
  }

  // 1. M4A1 Tactical Assault Rifle
  createM4A1() {
    const group = new THREE.Group();
    group.name = 'M4A1';

    const weaponMat = this.createWeaponMaterial();
    const darkMetal = this.createDarkMetalMaterial();
    const goldTrim = this.createGoldTrimMaterial();

    const lowerGeo = new THREE.BoxGeometry(0.045, 0.08, 0.22);
    const lower = new THREE.Mesh(lowerGeo, weaponMat);
    lower.position.set(0, -0.02, -0.05);
    group.add(lower);

    const upperGeo = new THREE.BoxGeometry(0.048, 0.065, 0.25);
    const upper = new THREE.Mesh(upperGeo, weaponMat);
    upper.position.set(0, 0.045, -0.08);
    group.add(upper);

    const railGeo = new THREE.BoxGeometry(0.032, 0.015, 0.32);
    const rail = new THREE.Mesh(railGeo, darkMetal);
    rail.position.set(0, 0.082, -0.1);
    group.add(rail);

    const handguardGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.28, 8);
    const handguard = new THREE.Mesh(handguardGeo, weaponMat);
    handguard.rotation.x = Math.PI / 2;
    handguard.position.set(0, 0.035, -0.36);
    group.add(handguard);

    const barrelGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.42, 16);
    const barrel = new THREE.Mesh(barrelGeo, darkMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.035, -0.45);
    group.add(barrel);

    if (this.hasSilencer) {
      const silencerGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.18, 16);
      const silencer = new THREE.Mesh(silencerGeo, darkMetal);
      silencer.rotation.x = Math.PI / 2;
      silencer.position.set(0, 0.035, -0.72);
      group.add(silencer);
    } else {
      const muzzleGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.07, 8);
      const muzzle = new THREE.Mesh(muzzleGeo, goldTrim);
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.set(0, 0.035, -0.68);
      group.add(muzzle);
    }

    const muzzlePoint = new THREE.Object3D();
    muzzlePoint.position.set(0, 0.035, this.hasSilencer ? -0.82 : -0.73);
    muzzlePoint.name = 'muzzlePoint';
    group.add(muzzlePoint);

    const magGeo = new THREE.BoxGeometry(0.034, 0.2, 0.08);
    const mag = new THREE.Mesh(magGeo, darkMetal);
    mag.position.set(0, -0.13, -0.07);
    mag.rotation.x = -0.15;
    mag.name = 'magazine';
    group.add(mag);

    const gripGeo = new THREE.BoxGeometry(0.036, 0.13, 0.055);
    const grip = new THREE.Mesh(gripGeo, darkMetal);
    grip.position.set(0, -0.1, 0.04);
    grip.rotation.x = 0.35;
    group.add(grip);

    const tubeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.2, 12);
    const tube = new THREE.Mesh(tubeGeo, darkMetal);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, 0.04, 0.14);
    group.add(tube);

    const stockGeo = new THREE.BoxGeometry(0.042, 0.12, 0.15);
    const stock = new THREE.Mesh(stockGeo, weaponMat);
    stock.position.set(0, 0.01, 0.22);
    group.add(stock);

    const foregripGeo = new THREE.BoxGeometry(0.03, 0.08, 0.04);
    const foregrip = new THREE.Mesh(foregripGeo, darkMetal);
    foregrip.position.set(0, -0.035, -0.32);
    foregrip.rotation.x = -0.25;
    group.add(foregrip);

    if (this.laserEnabled) {
      const peqGeo = new THREE.BoxGeometry(0.04, 0.024, 0.08);
      const peq = new THREE.Mesh(peqGeo, darkMetal);
      peq.position.set(0.032, 0.065, -0.35);
      group.add(peq);

      const laserGeo = new THREE.CylinderGeometry(0.0015, 0.0015, 25, 6);
      const laserMat = new THREE.MeshBasicMaterial({ color: 0x00ff66, transparent: true, opacity: 0.65 });
      const laserBeam = new THREE.Mesh(laserGeo, laserMat);
      laserBeam.rotation.x = Math.PI / 2;
      laserBeam.position.set(0.032, 0.065, -12.5);
      laserBeam.name = 'laserBeam';
      group.add(laserBeam);
    }

    this.attachOptic(group, 0, 0.095, -0.08);

    const boltGeo = new THREE.BoxGeometry(0.02, 0.02, 0.06);
    const bolt = new THREE.Mesh(boltGeo, goldTrim);
    bolt.position.set(0.024, 0.048, -0.06);
    bolt.name = 'bolt';
    group.add(bolt);

    group.userData = {
      name: 'M4A1 Tactical',
      type: 'ar',
      fireRate: 0.095,
      damage: 38,
      headshotMult: 2.2,
      magazineSize: 30,
      reserveAmmo: 180,
      currentAmmo: 30,
      reloadTime: 2.1,
      spread: 0.012,
      recoilPitch: 0.035,
      recoilYaw: 0.015,
      recoilZ: 0.05,
      adsFov: 60,
      adsOffset: new THREE.Vector3(0, -0.098, 0.18),
      hipOffset: new THREE.Vector3(0.18, -0.16, -0.35)
    };

    return group;
  }

  // 2. Lachmann Sub MP5 SMG
  createMP5() {
    const group = new THREE.Group();
    group.name = 'MP5';

    const weaponMat = this.createWeaponMaterial();
    const darkMetal = this.createDarkMetalMaterial();

    const bodyGeo = new THREE.BoxGeometry(0.04, 0.07, 0.28);
    const body = new THREE.Mesh(bodyGeo, weaponMat);
    body.position.set(0, 0, -0.05);
    group.add(body);

    const forendGeo = new THREE.CylinderGeometry(0.028, 0.03, 0.16, 12);
    const forend = new THREE.Mesh(forendGeo, darkMetal);
    forend.rotation.x = Math.PI / 2;
    forend.position.set(0, -0.005, -0.24);
    group.add(forend);

    const silencerGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.22, 16);
    const silencer = new THREE.Mesh(silencerGeo, darkMetal);
    silencer.rotation.x = Math.PI / 2;
    silencer.position.set(0, 0.01, -0.42);
    group.add(silencer);

    const magGeo = new THREE.BoxGeometry(0.026, 0.18, 0.045);
    const mag = new THREE.Mesh(magGeo, darkMetal);
    mag.position.set(0, -0.11, -0.1);
    mag.rotation.x = 0.25;
    mag.name = 'magazine';
    group.add(mag);

    const gripGeo = new THREE.BoxGeometry(0.034, 0.12, 0.05);
    const grip = new THREE.Mesh(gripGeo, darkMetal);
    grip.position.set(0, -0.08, 0.04);
    grip.rotation.x = 0.38;
    group.add(grip);

    const stockGeo = new THREE.BoxGeometry(0.038, 0.08, 0.18);
    const stock = new THREE.Mesh(stockGeo, darkMetal);
    stock.position.set(0, -0.01, 0.16);
    group.add(stock);

    const muzzlePoint = new THREE.Object3D();
    muzzlePoint.position.set(0, 0.01, -0.54);
    muzzlePoint.name = 'muzzlePoint';
    group.add(muzzlePoint);

    this.attachOptic(group, 0, 0.048, -0.06);

    group.userData = {
      name: 'Lachmann Sub (MP5)',
      type: 'smg',
      fireRate: 0.072,
      damage: 28,
      headshotMult: 1.9,
      magazineSize: 30,
      reserveAmmo: 210,
      currentAmmo: 30,
      reloadTime: 1.7,
      spread: 0.022,
      recoilPitch: 0.025,
      recoilYaw: 0.02,
      recoilZ: 0.038,
      adsFov: 65,
      adsOffset: new THREE.Vector3(0, -0.058, 0.18),
      hipOffset: new THREE.Vector3(0.16, -0.15, -0.32)
    };

    return group;
  }

  // 3. MCPR-300 Heavy .50 Sniper
  createSniper() {
    const group = new THREE.Group();
    group.name = 'MCPR_Sniper';

    const weaponMat = this.createWeaponMaterial();
    const darkMetal = this.createDarkMetalMaterial();
    const goldTrim = this.createGoldTrimMaterial();

    const chassisGeo = new THREE.BoxGeometry(0.052, 0.09, 0.42);
    const chassis = new THREE.Mesh(chassisGeo, weaponMat);
    chassis.position.set(0, 0, -0.08);
    group.add(chassis);

    const barrelGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.72, 16);
    const barrel = new THREE.Mesh(barrelGeo, darkMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.025, -0.62);
    group.add(barrel);

    const brakeGeo = new THREE.BoxGeometry(0.042, 0.036, 0.12);
    const brake = new THREE.Mesh(brakeGeo, goldTrim);
    brake.position.set(0, 0.025, -1.02);
    group.add(brake);

    const muzzlePoint = new THREE.Object3D();
    muzzlePoint.position.set(0, 0.025, -1.09);
    muzzlePoint.name = 'muzzlePoint';
    group.add(muzzlePoint);

    const magGeo = new THREE.BoxGeometry(0.04, 0.16, 0.1);
    const mag = new THREE.Mesh(magGeo, darkMetal);
    mag.position.set(0, -0.11, -0.12);
    mag.name = 'magazine';
    group.add(mag);

    const gripGeo = new THREE.BoxGeometry(0.036, 0.14, 0.06);
    const grip = new THREE.Mesh(gripGeo, darkMetal);
    grip.position.set(0, -0.09, 0.08);
    grip.rotation.x = 0.32;
    group.add(grip);

    const stockGeo = new THREE.BoxGeometry(0.048, 0.14, 0.28);
    const stock = new THREE.Mesh(stockGeo, weaponMat);
    stock.position.set(0, 0.01, 0.28);
    group.add(stock);

    this.attachOptic(group, 0, 0.085, -0.12, 'sniper_mildot');

    group.userData = {
      name: 'MCPR-300 .50 BMG Sniper',
      type: 'sniper',
      fireRate: 1.1,
      damage: 160,
      headshotMult: 3.0,
      magazineSize: 5,
      reserveAmmo: 30,
      currentAmmo: 5,
      reloadTime: 2.8,
      spread: 0.001,
      recoilPitch: 0.12,
      recoilYaw: 0.025,
      recoilZ: 0.14,
      adsFov: 24,
      adsOffset: new THREE.Vector3(0, -0.098, 0.22),
      hipOffset: new THREE.Vector3(0.2, -0.18, -0.38)
    };

    return group;
  }

  // 4. Expedite 12 Shotgun
  createShotgun() {
    const group = new THREE.Group();
    group.name = 'Expedite_Shotgun';

    const weaponMat = this.createWeaponMaterial();
    const darkMetal = this.createDarkMetalMaterial();

    const bodyGeo = new THREE.BoxGeometry(0.048, 0.08, 0.32);
    const body = new THREE.Mesh(bodyGeo, weaponMat);
    body.position.set(0, 0, -0.06);
    group.add(body);

    const topBarrelGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.52, 16);
    const topBarrel = new THREE.Mesh(topBarrelGeo, darkMetal);
    topBarrel.rotation.x = Math.PI / 2;
    topBarrel.position.set(0, 0.025, -0.44);
    group.add(topBarrel);

    const magTubeGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.48, 16);
    const magTube = new THREE.Mesh(magTubeGeo, darkMetal);
    magTube.rotation.x = Math.PI / 2;
    magTube.position.set(0, -0.012, -0.42);
    group.add(magTube);

    const pumpGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.18, 12);
    const pump = new THREE.Mesh(pumpGeo, darkMetal);
    pump.rotation.x = Math.PI / 2;
    pump.position.set(0, -0.012, -0.36);
    pump.name = 'shotgunPump';
    group.add(pump);

    const stockGeo = new THREE.BoxGeometry(0.044, 0.12, 0.24);
    const stock = new THREE.Mesh(stockGeo, weaponMat);
    stock.position.set(0, -0.02, 0.2);
    group.add(stock);

    const muzzlePoint = new THREE.Object3D();
    muzzlePoint.position.set(0, 0.025, -0.71);
    muzzlePoint.name = 'muzzlePoint';
    group.add(muzzlePoint);

    this.attachOptic(group, 0, 0.052, -0.08, 'red_dot');

    group.userData = {
      name: 'Expedite 12 Tactical Shotgun',
      type: 'shotgun',
      fireRate: 0.55,
      pellets: 8,
      damage: 24,
      headshotMult: 1.6,
      magazineSize: 8,
      reserveAmmo: 48,
      currentAmmo: 8,
      reloadTime: 2.6,
      spread: 0.055,
      recoilPitch: 0.09,
      recoilYaw: 0.03,
      recoilZ: 0.1,
      adsFov: 70,
      adsOffset: new THREE.Vector3(0, -0.062, 0.18),
      hipOffset: new THREE.Vector3(0.18, -0.16, -0.34)
    };

    return group;
  }

  // 5. RPG-7 Heavy Rocket Launcher
  createRPG7() {
    const group = new THREE.Group();
    group.name = 'RPG7_Launcher';

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x824925, roughness: 0.8 });
    const darkMetal = this.createDarkMetalMaterial();
    const warheadMat = new THREE.MeshStandardMaterial({ color: 0x4a5d3f, roughness: 0.4, metalness: 0.7 });

    // Main Tube
    const tubeGeo = new THREE.CylinderGeometry(0.025, 0.032, 0.75, 16);
    const tube = new THREE.Mesh(tubeGeo, darkMetal);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, 0, -0.15);
    group.add(tube);

    // Wooden Heat Shield Wrap
    const shieldGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.32, 16);
    const shield = new THREE.Mesh(shieldGeo, woodMat);
    shield.rotation.x = Math.PI / 2;
    shield.position.set(0, 0, -0.12);
    group.add(shield);

    // Conical Warhead at front
    const warheadGeo = new THREE.ConeGeometry(0.065, 0.22, 16);
    const warhead = new THREE.Mesh(warheadGeo, warheadMat);
    warhead.rotation.x = -Math.PI / 2;
    warhead.position.set(0, 0, -0.62);
    warhead.name = 'rpgRocket';
    group.add(warhead);

    // Grip & Trigger
    const gripGeo = new THREE.BoxGeometry(0.03, 0.13, 0.045);
    const grip = new THREE.Mesh(gripGeo, woodMat);
    grip.position.set(0, -0.09, 0.02);
    grip.rotation.x = 0.3;
    group.add(grip);

    // Rear exhaust cone
    const coneGeo = new THREE.ConeGeometry(0.055, 0.18, 16);
    const cone = new THREE.Mesh(coneGeo, darkMetal);
    cone.rotation.x = Math.PI / 2;
    cone.position.set(0, 0, 0.3);
    group.add(cone);

    const muzzlePoint = new THREE.Object3D();
    muzzlePoint.position.set(0, 0, -0.75);
    muzzlePoint.name = 'muzzlePoint';
    group.add(muzzlePoint);

    group.userData = {
      name: 'RPG-7 Rocket Launcher',
      type: 'rpg',
      fireRate: 2.2,
      damage: 280, // Heavy multi-kill area damage
      splashRadius: 10.0,
      headshotMult: 1.0,
      magazineSize: 1,
      reserveAmmo: 6,
      currentAmmo: 1,
      reloadTime: 3.2,
      spread: 0.005,
      recoilPitch: 0.15,
      recoilYaw: 0.04,
      recoilZ: 0.18,
      adsFov: 75,
      adsOffset: new THREE.Vector3(0, -0.045, 0.2),
      hipOffset: new THREE.Vector3(0.22, -0.16, -0.32)
    };

    return group;
  }

  // 6. M133 Heavy Minigun (6 Rotating Barrels)
  createMinigun() {
    const group = new THREE.Group();
    group.name = 'Minigun_M133';

    const weaponMat = this.createWeaponMaterial();
    const darkMetal = this.createDarkMetalMaterial();
    const goldTrim = this.createGoldTrimMaterial();

    // Motor Housing
    const motorGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 16);
    const motor = new THREE.Mesh(motorGeo, weaponMat);
    motor.rotation.x = Math.PI / 2;
    motor.position.set(0, 0, 0);
    group.add(motor);

    // Rotating Barrel Cluster
    const barrelCluster = new THREE.Group();
    barrelCluster.name = 'barrelCluster';

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const bGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.65, 12);
      const b = new THREE.Mesh(bGeo, darkMetal);
      b.rotation.x = Math.PI / 2;
      b.position.set(Math.cos(angle) * 0.045, Math.sin(angle) * 0.045, -0.48);
      barrelCluster.add(b);
    }

    // Circular Barrel Clamps
    const clampGeo = new THREE.TorusGeometry(0.048, 0.008, 8, 24);
    const clamp1 = new THREE.Mesh(clampGeo, goldTrim);
    clamp1.position.set(0, 0, -0.35);
    barrelCluster.add(clamp1);
    const clamp2 = new THREE.Mesh(clampGeo, goldTrim);
    clamp2.position.set(0, 0, -0.72);
    barrelCluster.add(clamp2);

    group.add(barrelCluster);

    // Top Spade Handle
    const handleGeo = new THREE.BoxGeometry(0.04, 0.12, 0.16);
    const handle = new THREE.Mesh(handleGeo, darkMetal);
    handle.position.set(0, 0.12, 0.05);
    group.add(handle);

    const muzzlePoint = new THREE.Object3D();
    muzzlePoint.position.set(0, 0, -0.85);
    muzzlePoint.name = 'muzzlePoint';
    group.add(muzzlePoint);

    group.userData = {
      name: 'M133 Juggernaut Minigun',
      type: 'minigun',
      fireRate: 0.05, // 1200 RPM!
      damage: 32,
      headshotMult: 2.0,
      magazineSize: 150,
      reserveAmmo: 450,
      currentAmmo: 150,
      reloadTime: 4.5,
      spread: 0.035,
      recoilPitch: 0.02,
      recoilYaw: 0.015,
      recoilZ: 0.04,
      adsFov: 75,
      adsOffset: new THREE.Vector3(0, -0.06, 0.15),
      hipOffset: new THREE.Vector3(0.24, -0.18, -0.4)
    };

    return group;
  }

  // 7. Desert Eagle .50 GS Handgun
  createDeagle() {
    const group = new THREE.Group();
    group.name = 'Deagle_50GS';

    const goldMat = this.createGoldTrimMaterial();
    const darkMetal = this.createDarkMetalMaterial();

    const frameGeo = new THREE.BoxGeometry(0.034, 0.06, 0.18);
    const frame = new THREE.Mesh(frameGeo, darkMetal);
    frame.position.set(0, 0, -0.02);
    group.add(frame);

    const slideGeo = new THREE.BoxGeometry(0.038, 0.045, 0.22);
    const slide = new THREE.Mesh(slideGeo, goldMat);
    slide.position.set(0, 0.035, -0.04);
    slide.name = 'slide';
    group.add(slide);

    const gripGeo = new THREE.BoxGeometry(0.032, 0.12, 0.055);
    const grip = new THREE.Mesh(gripGeo, darkMetal);
    grip.position.set(0, -0.07, 0.04);
    grip.rotation.x = 0.35;
    group.add(grip);

    const muzzlePoint = new THREE.Object3D();
    muzzlePoint.position.set(0, 0.035, -0.16);
    muzzlePoint.name = 'muzzlePoint';
    group.add(muzzlePoint);

    group.userData = {
      name: '.50 GS Hand Cannon',
      type: 'pistol',
      fireRate: 0.25,
      damage: 75,
      headshotMult: 2.5,
      magazineSize: 7,
      reserveAmmo: 42,
      currentAmmo: 7,
      reloadTime: 1.4,
      spread: 0.015,
      recoilPitch: 0.07,
      recoilYaw: 0.02,
      recoilZ: 0.06,
      adsFov: 72,
      adsOffset: new THREE.Vector3(0, -0.045, 0.22),
      hipOffset: new THREE.Vector3(0.14, -0.12, -0.28)
    };

    return group;
  }

  // 8. Tactical Karambit Blade
  createKarambit() {
    const group = new THREE.Group();
    group.name = 'Karambit';

    const bladeData = textureGen.createWeaponCamoTexture('damascus');
    const bladeMat = new THREE.MeshStandardMaterial({
      map: bladeData.diffuse,
      normalMap: bladeData.normal,
      roughness: 0.2,
      metalness: 0.95
    });
    const gripMat = this.createDarkMetalMaterial();

    const handleGeo = new THREE.BoxGeometry(0.025, 0.11, 0.04);
    const handle = new THREE.Mesh(handleGeo, gripMat);
    handle.position.set(0, 0, 0);
    group.add(handle);

    const ringGeo = new THREE.TorusGeometry(0.018, 0.005, 8, 24);
    const ring = new THREE.Mesh(ringGeo, gripMat);
    ring.position.set(0, -0.065, 0);
    group.add(ring);

    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.quadraticCurveTo(0.03, 0.08, 0.09, 0.12);
    bladeShape.quadraticCurveTo(0.05, 0.06, 0.01, 0.01);
    bladeShape.closePath();

    const extrudeSettings = { depth: 0.005, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002 };
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(-0.0025, 0.04, 0);
    blade.rotation.z = -0.3;
    group.add(blade);

    group.userData = {
      name: 'Combat Karambit',
      type: 'melee',
      fireRate: 0.45,
      damage: 130,
      headshotMult: 1.0,
      magazineSize: 1,
      reserveAmmo: 1,
      currentAmmo: 1,
      reloadTime: 0.1,
      spread: 0,
      recoilPitch: 0.02,
      recoilYaw: 0.04,
      recoilZ: 0.05,
      adsFov: 80,
      adsOffset: new THREE.Vector3(0, -0.05, 0.2),
      hipOffset: new THREE.Vector3(0.18, -0.16, -0.28)
    };

    return group;
  }

  attachOptic(weaponGroup, x, y, z, forcedType = null) {
    const opticChoice = forcedType || this.opticType;
    if (opticChoice === 'iron_sights') return;

    const darkMetal = this.createDarkMetalMaterial();
    const opticGroup = new THREE.Group();
    opticGroup.position.set(x, y, z);
    opticGroup.name = 'opticSight';

    if (opticChoice === 'sniper_mildot') {
      const tubeGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.22, 16);
      const tube = new THREE.Mesh(tubeGeo, darkMetal);
      tube.rotation.x = Math.PI / 2;
      opticGroup.add(tube);

      const bellGeo = new THREE.CylinderGeometry(0.034, 0.026, 0.06, 16);
      const bell = new THREE.Mesh(bellGeo, darkMetal);
      bell.rotation.x = Math.PI / 2;
      bell.position.set(0, 0, -0.12);
      opticGroup.add(bell);

      const reticleTex = textureGen.createReticleTexture('sniper_mildot');
      const reticleMat = new THREE.MeshBasicMaterial({
        map: reticleTex,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      });
      const lensGeo = new THREE.PlaneGeometry(0.048, 0.048);
      const lens = new THREE.Mesh(lensGeo, reticleMat);
      lens.position.set(0, 0, 0.08);
      lens.name = 'reticleLens';
      opticGroup.add(lens);
    } else {
      const hoodGeo = new THREE.BoxGeometry(0.044, 0.048, 0.085);
      const hood = new THREE.Mesh(hoodGeo, darkMetal);
      opticGroup.add(hood);

      const glassGeo = new THREE.PlaneGeometry(0.034, 0.034);
      const reticleTex = textureGen.createReticleTexture(opticChoice === 'red_dot' ? 'red_dot' : 'holographic');
      const reticleMat = new THREE.MeshBasicMaterial({
        map: reticleTex,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const reticlePlane = new THREE.Mesh(glassGeo, reticleMat);
      reticlePlane.position.set(0, 0.005, 0.02);
      reticlePlane.name = 'reticleLens';
      opticGroup.add(reticlePlane);

      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.25,
        roughness: 0.05,
        transmission: 0.9
      });
      const glassFront = new THREE.Mesh(glassGeo, glassMat);
      glassFront.position.set(0, 0.005, -0.04);
      opticGroup.add(glassFront);
    }

    weaponGroup.add(opticGroup);
  }
}

export const weaponFactory = new WeaponFactory();
