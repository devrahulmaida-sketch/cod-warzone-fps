// AAA Map Builder: "OPERATION: WARZONE FORTRESS"
// Sprawling tactical military compound with watchtowers, shatterable glass, burning fires, and supply caches
import * as THREE from 'three';
import { textureGen } from './textures.js';
import { soundEngine } from './audio.js';

export class MapBuilder {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.explosiveBarrels = [];
    this.destructibleCrates = [];
    this.glassPanels = [];
    this.hangingLights = [];
    this.puddles = [];
    this.fireEmitters = [];
    this.spawnPoints = [];
  }

  buildMap() {
    this.createEnvironmentSkybox();
    this.createGround();
    this.createShippingContainers();
    this.createCommandHub();
    this.createSniperWatchtowers();
    this.createShatterableGlassWindows();
    this.createUndergroundTunnel();
    this.createArmoredVehicle();
    this.createBarricadesAndCover();
    this.createExplosiveBarrels();
    this.createDestructibleCrates();
    this.createTacticalLighting();

    return {
      colliders: this.colliders,
      explosiveBarrels: this.explosiveBarrels,
      destructibleCrates: this.destructibleCrates,
      glassPanels: this.glassPanels,
      hangingLights: this.hangingLights,
      puddles: this.puddles,
      spawnPoints: this.spawnPoints
    };
  }

  createEnvironmentSkybox() {
    const skyGeo = new THREE.SphereGeometry(600, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x0a1020) },
        bottomColor: { value: new THREE.Color(0xd46820) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    const mountainGeo = new THREE.CylinderGeometry(480, 520, 90, 32, 1, true);
    const mountainMat = new THREE.MeshBasicMaterial({ color: 0x060810, side: THREE.BackSide });
    const mountains = new THREE.Mesh(mountainGeo, mountainMat);
    mountains.position.y = 35;
    this.scene.add(mountains);
  }

  createGround() {
    const asphaltData = textureGen.createTacticalAsphalt();
    asphaltData.diffuse.repeat.set(24, 24);
    asphaltData.normal.repeat.set(24, 24);
    asphaltData.roughness.repeat.set(24, 24);

    const groundMat = new THREE.MeshStandardMaterial({
      map: asphaltData.diffuse,
      normalMap: asphaltData.normal,
      roughnessMap: asphaltData.roughness,
      roughness: 0.8,
      metalness: 0.15
    });

    const groundGeo = new THREE.PlaneGeometry(180, 180);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(-90, -1, -90),
      new THREE.Vector3(90, 0, 90)
    ));

    const concreteData = textureGen.createTacticalConcrete();
    concreteData.diffuse.repeat.set(8, 2);
    concreteData.normal.repeat.set(8, 2);

    const wallMat = new THREE.MeshStandardMaterial({
      map: concreteData.diffuse,
      normalMap: concreteData.normal,
      roughness: 0.85
    });

    const wallHeight = 9;
    const perimeterConfigs = [
      { x: 0, z: -90, w: 180, d: 2 },
      { x: 0, z: 90, w: 180, d: 2 },
      { x: -90, z: 0, w: 2, d: 180 },
      { x: 90, z: 0, w: 2, d: 180 }
    ];

    perimeterConfigs.forEach(cfg => {
      const wallGeo = new THREE.BoxGeometry(cfg.w, wallHeight, cfg.d);
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(cfg.x, wallHeight / 2, cfg.z);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      this.scene.add(wallMesh);
      this.colliders.push(new THREE.Box3().setFromObject(wallMesh));
    });
  }

  createShippingContainers() {
    const containerLayouts = [
      { x: -18, z: -12, rot: 0.1, color: 'navy' },
      { x: -18, z: -12, rot: 0.1, color: 'hazard_yellow', offsetY: 2.8 },
      { x: 14, z: -16, rot: 1.57, color: 'rust_red' },
      { x: -8, z: 22, rot: -0.4, color: 'olive' },
      { x: 24, z: 18, rot: 0.85, color: 'navy' },
      { x: 24, z: 18, rot: 0.85, color: 'rust_red', offsetY: 2.8 },
      { x: 0, z: -32, rot: 0, color: 'hazard_yellow' },
      { x: -32, z: 10, rot: 1.57, color: 'olive' },
      { x: 36, z: -8, rot: -1.2, color: 'navy' }
    ];

    containerLayouts.forEach(cfg => {
      const cData = textureGen.createShippingContainerTexture(cfg.color);
      const mat = new THREE.MeshStandardMaterial({
        map: cData.diffuse,
        normalMap: cData.normal,
        roughnessMap: cData.roughness,
        metalnessMap: cData.metalness,
        roughness: 0.45,
        metalness: 0.75
      });

      const containerWidth = 2.6;
      const containerHeight = 2.8;
      const containerLength = 6.8;

      const containerGeo = new THREE.BoxGeometry(containerWidth, containerHeight, containerLength);
      const containerMesh = new THREE.Mesh(containerGeo, mat);

      const yPos = (cfg.offsetY || 0) + containerHeight / 2;
      containerMesh.position.set(cfg.x, yPos, cfg.z);
      containerMesh.rotation.y = cfg.rot;
      containerMesh.castShadow = true;
      containerMesh.receiveShadow = true;

      this.scene.add(containerMesh);
      this.colliders.push(new THREE.Box3().setFromObject(containerMesh));

      if (cfg.offsetY) {
        this.spawnPoints.push(new THREE.Vector3(cfg.x, yPos + containerHeight / 2 + 1.0, cfg.z));
      }
    });
  }

  createCommandHub() {
    const concreteData = textureGen.createTacticalConcrete();
    const concreteMat = new THREE.MeshStandardMaterial({
      map: concreteData.diffuse,
      normalMap: concreteData.normal,
      roughness: 0.75
    });

    const darkMetalData = textureGen.createWeaponCamoTexture('matte_black');
    const metalMat = new THREE.MeshStandardMaterial({
      map: darkMetalData.diffuse,
      normalMap: darkMetalData.normal,
      roughness: 0.35,
      metalness: 0.9
    });

    const hubGroup = new THREE.Group();
    hubGroup.position.set(-35, 0, -35);

    const wall1Geo = new THREE.BoxGeometry(22, 6, 18);
    const wall1 = new THREE.Mesh(wall1Geo, concreteMat);
    wall1.position.set(0, 3, 0);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    hubGroup.add(wall1);

    const catwalkGeo = new THREE.BoxGeometry(26, 0.4, 22);
    const catwalk = new THREE.Mesh(catwalkGeo, metalMat);
    catwalk.position.set(0, 6, 0);
    catwalk.receiveShadow = true;
    hubGroup.add(catwalk);

    const numSteps = 16;
    for (let i = 0; i < numSteps; i++) {
      const stepGeo = new THREE.BoxGeometry(3.2, 0.38, 0.6);
      const step = new THREE.Mesh(stepGeo, metalMat);
      step.position.set(13.5, (i + 0.5) * 0.38, (i - 8) * 0.6);
      step.castShadow = true;
      hubGroup.add(step);
    }

    this.spawnPoints.push(new THREE.Vector3(-35, 7.2, -35));
    this.scene.add(hubGroup);
    this.colliders.push(new THREE.Box3().setFromObject(hubGroup));
  }

  // Tactical Sniper Watchtowers with climbable vantage points
  createSniperWatchtowers() {
    const towerPositions = [
      { x: 38, z: 38 },
      { x: -38, z: 38 }
    ];

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x22262a, metalness: 0.85, roughness: 0.3 });

    towerPositions.forEach(tp => {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(tp.x, 0, tp.y || tp.z);

      // 4 Steel Legs
      for (let i = 0; i < 4; i++) {
        const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 10, 8);
        const leg = new THREE.Mesh(legGeo, metalMat);
        leg.position.set((i % 2 === 0 ? 2 : -2), 5, (i < 2 ? 2 : -2));
        towerGroup.add(leg);
      }

      // Upper Sniper Platform
      const platGeo = new THREE.BoxGeometry(5.2, 0.4, 5.2);
      const plat = new THREE.Mesh(platGeo, metalMat);
      plat.position.set(0, 10, 0);
      towerGroup.add(plat);

      // Railing
      const railGeo = new THREE.BoxGeometry(5.4, 1.1, 0.1);
      const rail = new THREE.Mesh(railGeo, metalMat);
      rail.position.set(0, 10.6, 2.6);
      towerGroup.add(rail);

      this.scene.add(towerGroup);
      this.colliders.push(new THREE.Box3().setFromObject(towerGroup));
      this.spawnPoints.push(new THREE.Vector3(tp.x, 11.2, tp.z));
    });
  }

  // Shatterable Glass Windows
  createShatterableGlassWindows() {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.05,
      transmission: 0.95
    });

    const windowPositions = [
      { x: -35, y: 6.8, z: -24, w: 6, h: 2.5 },
      { x: -24, y: 6.8, z: -35, w: 2.5, h: 2.5 }
    ];

    windowPositions.forEach(wp => {
      const winGeo = new THREE.PlaneGeometry(wp.w, wp.h);
      const winMesh = new THREE.Mesh(winGeo, glassMat);
      winMesh.position.set(wp.x, wp.y, wp.z);
      winMesh.name = 'shatterable_glass';
      winMesh.userData = {
        isGlass: true,
        health: 20,
        shattered: false
      };
      this.scene.add(winMesh);
      this.glassPanels.push(winMesh);
    });
  }

  createUndergroundTunnel() {
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.6, metalness: 0.8 });
    const tunnelGroup = new THREE.Group();
    tunnelGroup.position.set(35, 0, 35);

    for (let i = 0; i < 4; i++) {
      const pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, 28, 12);
      const pipe = new THREE.Mesh(pipeGeo, darkMetal);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, 4.2 + i * 0.4, (i - 2) * 2.5);
      tunnelGroup.add(pipe);
    }

    const sirenGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8);
    const sirenMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
    const sirenMesh = new THREE.Mesh(sirenGeo, sirenMat);
    sirenMesh.position.set(0, 3.8, 0);
    tunnelGroup.add(sirenMesh);

    const redLight = new THREE.PointLight(0xff1100, 2.5, 18, 2);
    redLight.position.set(0, 3.5, 0);
    tunnelGroup.add(redLight);

    this.scene.add(tunnelGroup);
    this.spawnPoints.push(new THREE.Vector3(35, 1.0, 35));
  }

  createArmoredVehicle() {
    const vehGroup = new THREE.Group();
    vehGroup.position.set(8, 0, -4);
    vehGroup.rotation.y = -0.6;

    const armorMat = new THREE.MeshStandardMaterial({ color: 0x3d433b, roughness: 0.5, metalness: 0.7 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.95 });

    const hullGeo = new THREE.BoxGeometry(2.8, 1.4, 5.8);
    const hull = new THREE.Mesh(hullGeo, armorMat);
    hull.position.set(0, 1.2, 0);
    hull.castShadow = true;
    vehGroup.add(hull);

    const cabGeo = new THREE.BoxGeometry(2.4, 0.9, 3.2);
    const cab = new THREE.Mesh(cabGeo, armorMat);
    cab.position.set(0, 2.2, -0.4);
    vehGroup.add(cab);

    const turretGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.5, 8);
    const turret = new THREE.Mesh(turretGeo, armorMat);
    turret.position.set(0, 2.8, -0.2);
    vehGroup.add(turret);

    const gunGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);
    const gun = new THREE.Mesh(gunGeo, armorMat);
    gun.rotation.x = Math.PI / 2;
    gun.position.set(0, 2.9, -1.2);
    vehGroup.add(gun);

    const wheelPositions = [
      { x: 1.45, z: 1.8 },
      { x: -1.45, z: 1.8 },
      { x: 1.45, z: -1.8 },
      { x: -1.45, z: -1.8 }
    ];
    wheelPositions.forEach(wp => {
      const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.5, 16);
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp.x, 0.65, wp.z);
      wheel.castShadow = true;
      vehGroup.add(wheel);
    });

    this.scene.add(vehGroup);
    this.colliders.push(new THREE.Box3().setFromObject(vehGroup));
  }

  createBarricadesAndCover() {
    const concreteData = textureGen.createTacticalConcrete();
    const barrierMat = new THREE.MeshStandardMaterial({
      map: concreteData.diffuse,
      normalMap: concreteData.normal,
      roughness: 0.8
    });
    const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x96825c, roughness: 0.95 });

    const barrierPositions = [
      { x: 0, z: 6, rot: 0 },
      { x: -12, z: 8, rot: 0.8 },
      { x: 15, z: 2, rot: -0.4 },
      { x: -4, z: -18, rot: 1.57 },
      { x: 18, z: -28, rot: 0.2 }
    ];

    barrierPositions.forEach(bp => {
      const barrierGeo = new THREE.BoxGeometry(3.4, 1.1, 0.6);
      const barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrier.position.set(bp.x, 0.55, bp.z);
      barrier.rotation.y = bp.rot;
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      this.scene.add(barrier);
      this.colliders.push(new THREE.Box3().setFromObject(barrier));
    });

    const sandbagPositions = [
      { x: -14, z: -25 },
      { x: 12, z: 28 },
      { x: -28, z: -4 }
    ];

    sandbagPositions.forEach(sp => {
      const bagGeo = new THREE.BoxGeometry(2.4, 0.9, 1.2);
      const bag = new THREE.Mesh(bagGeo, sandbagMat);
      bag.position.set(sp.x, 0.45, sp.z);
      bag.castShadow = true;
      this.scene.add(bag);
      this.colliders.push(new THREE.Box3().setFromObject(bag));
      this.spawnPoints.push(new THREE.Vector3(sp.x + 1.5, 1.0, sp.z + 1.5));
    });
  }

  createExplosiveBarrels() {
    const barrelPositions = [
      { x: -6, z: -4 },
      { x: 16, z: -10 },
      { x: -22, z: 14 },
      { x: 8, z: 22 },
      { x: 26, z: -22 }
    ];

    barrelPositions.forEach(bp => {
      const barrelGroup = new THREE.Group();
      barrelGroup.position.set(bp.x, 0.65, bp.z);

      const barrelMat = new THREE.MeshStandardMaterial({
        color: 0xee2211,
        roughness: 0.4,
        metalness: 0.8
      });

      const barrelGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.3, 16);
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.castShadow = true;
      barrelGroup.add(barrel);

      const bandGeo = new THREE.CylinderGeometry(0.385, 0.385, 0.25, 16);
      const bandMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      barrelGroup.add(band);

      barrelGroup.userData = {
        isExplosive: true,
        health: 50,
        exploded: false,
        worldPos: new THREE.Vector3(bp.x, 0.65, bp.z)
      };

      this.scene.add(barrelGroup);
      this.explosiveBarrels.push(barrelGroup);
      this.colliders.push(new THREE.Box3().setFromObject(barrelGroup));
    });
  }

  createDestructibleCrates() {
    const cratePositions = [
      { x: -10, z: -6 },
      { x: 10, z: 8 },
      { x: -16, z: 24 },
      { x: 28, z: 4 }
    ];

    cratePositions.forEach(cp => {
      const crateMat = new THREE.MeshStandardMaterial({ color: 0x8a623a, roughness: 0.85 });
      const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(cp.x, 0.6, cp.z);
      crate.castShadow = true;

      crate.userData = {
        isCrate: true,
        health: 40,
        destroyed: false
      };

      this.scene.add(crate);
      this.destructibleCrates.push(crate);
      this.colliders.push(new THREE.Box3().setFromObject(crate));
    });
  }

  createTacticalLighting() {
    const sunLight = new THREE.DirectionalLight(0xffeedd, 2.2);
    sunLight.position.set(45, 65, 35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    sunLight.shadow.bias = -0.0004;
    this.scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x283850, 1.2);
    this.scene.add(ambientLight);

    const floodlightPositions = [
      { x: -40, y: 12, z: -40, target: { x: 0, y: 0, z: 0 } },
      { x: 40, y: 12, z: 40, target: { x: 0, y: 0, z: 0 } }
    ];

    floodlightPositions.forEach(fp => {
      const spot = new THREE.SpotLight(0xfff5dd, 4.0, 80, Math.PI / 4, 0.4, 1.5);
      spot.position.set(fp.x, fp.y, fp.z);
      spot.target.position.set(fp.target.x, fp.target.y, fp.target.z);
      this.scene.add(spot);
      this.scene.add(spot.target);
    });
  }
}
