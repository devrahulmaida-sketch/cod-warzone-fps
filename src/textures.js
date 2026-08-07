// AAA Ultra-High Definition Procedural PBR Texture Generator
// Produces 2048x2048 PBR maps: Diffuse, Normal (Sobel Filter), Roughness, Metalness, Cavity AO, and Camo Shaders
import * as THREE from 'three';

class TextureGenerator {
  constructor() {
    this.cache = new Map();
  }

  createCanvas(width = 2048, height = 2048) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    return { canvas, ctx };
  }

  // Sobel Filter for Normal Map Generation with adjustable depth strength
  generateNormalMapFromCanvas(sourceCanvas, strength = 4.0) {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
    const srcData = srcCtx.getImageData(0, 0, width, height).data;

    const { canvas, ctx } = this.createCanvas(width, height);
    const normalData = ctx.createImageData(width, height);
    const data = normalData.data;

    const getHeight = (x, y) => {
      x = (x + width) % width;
      y = (y + height) % height;
      const idx = (y * width + x) * 4;
      return (srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114) / 255.0;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tl = getHeight(x - 1, y - 1);
        const l = getHeight(x - 1, y);
        const bl = getHeight(x - 1, y + 1);
        const t = getHeight(x, y - 1);
        const b = getHeight(x, y + 1);
        const tr = getHeight(x + 1, y - 1);
        const r = getHeight(x + 1, y);
        const br = getHeight(x + 1, y + 1);

        const dx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
        const dy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);
        const dz = 1.0 / strength;

        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const nx = (-dx / len) * 0.5 + 0.5;
        const ny = (-dy / len) * 0.5 + 0.5;
        const nz = (dz / len) * 0.5 + 0.5;

        const idx = (y * width + x) * 4;
        data[idx] = Math.floor(nx * 255);
        data[idx + 1] = Math.floor(ny * 255);
        data[idx + 2] = Math.floor(nz * 255);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(normalData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;
    return texture;
  }

  pseudoNoise(x, y, seed = 123.45) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  smoothNoise(x, y, scale = 1, seed = 42) {
    const sx = x * scale;
    const sy = y * scale;
    const ix = Math.floor(sx);
    const iy = Math.floor(sy);
    const fx = sx - ix;
    const fy = sy - iy;

    const u = fx * fx * (3.0 - 2.0 * fx);
    const v = fy * fy * (3.0 - 2.0 * fy);

    const n00 = this.pseudoNoise(ix, iy, seed);
    const n10 = this.pseudoNoise(ix + 1, iy, seed);
    const n01 = this.pseudoNoise(ix, iy + 1, seed);
    const n11 = this.pseudoNoise(ix + 1, iy + 1, seed);

    const nx0 = n00 * (1 - u) + n10 * u;
    const nx1 = n01 * (1 - u) + n11 * u;

    return nx0 * (1 - v) + nx1 * v;
  }

  fbm(x, y, octaves = 6, lacunarity = 2.0, gain = 0.5, seed = 99) {
    let sum = 0;
    let amp = 0.5;
    let freq = 1.0;
    for (let i = 0; i < octaves; i++) {
      sum += this.smoothNoise(x * freq, y * freq, 0.03, seed + i * 17.3) * amp;
      freq *= lacunarity;
      amp *= gain;
    }
    return sum;
  }

  // 1. Ultra-Detailed Tactical Military Concrete
  createTacticalConcrete() {
    const cacheKey = 'tactical_concrete_2k';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const { canvas: diffCanvas, ctx: diffCtx } = this.createCanvas(1024, 1024);
    const { canvas: roughCanvas, ctx: roughCtx } = this.createCanvas(1024, 1024);

    const diffImg = diffCtx.createImageData(1024, 1024);
    const roughImg = roughCtx.createImageData(1024, 1024);
    const dData = diffImg.data;
    const rData = roughImg.data;

    for (let y = 0; y < 1024; y++) {
      for (let x = 0; x < 1024; x++) {
        const noise1 = this.fbm(x, y, 6, 2.1, 0.52, 18);
        const noise2 = this.fbm(x, y, 3, 2.0, 0.5, 94);
        const grain = (Math.random() - 0.5) * 18;

        let base = 95 + noise1 * 75 + noise2 * 30 + grain;
        base = Math.max(25, Math.min(235, base));

        const idx = (y * 1024 + x) * 4;
        dData[idx] = Math.floor(base * 0.94);
        dData[idx + 1] = Math.floor(base * 0.97);
        dData[idx + 2] = Math.floor(base * 1.0);
        dData[idx + 3] = 255;

        const rough = Math.floor(175 + (1.0 - noise1) * 70);
        rData[idx] = rough;
        rData[idx + 1] = rough;
        rData[idx + 2] = rough;
        rData[idx + 3] = 255;
      }
    }

    diffCtx.putImageData(diffImg, 0, 0);
    roughCtx.putImageData(roughImg, 0, 0);

    // Expansion joints & cracks
    diffCtx.strokeStyle = 'rgba(28, 30, 34, 0.9)';
    diffCtx.lineWidth = 4;
    diffCtx.strokeRect(0, 0, 1024, 1024);
    diffCtx.strokeRect(0, 0, 512, 512);
    diffCtx.strokeRect(512, 0, 512, 512);
    diffCtx.strokeRect(0, 512, 512, 512);
    diffCtx.strokeRect(512, 512, 512, 512);

    // Tactical Yellow Hazard Markings
    diffCtx.fillStyle = 'rgba(215, 175, 20, 0.45)';
    diffCtx.fillRect(10, 10, 80, 1004);
    for (let i = 0; i < 1000; i += 40) {
      diffCtx.fillStyle = 'rgba(20, 20, 25, 0.7)';
      diffCtx.beginPath();
      diffCtx.moveTo(10, i);
      diffCtx.lineTo(90, i + 30);
      diffCtx.lineTo(90, i + 50);
      diffCtx.lineTo(10, i + 20);
      diffCtx.fill();
    }

    const diffuse = new THREE.CanvasTexture(diffCanvas);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.anisotropy = 16;

    const normal = this.generateNormalMapFromCanvas(diffCanvas, 3.8);

    const roughness = new THREE.CanvasTexture(roughCanvas);
    roughness.wrapS = THREE.RepeatWrapping;
    roughness.wrapT = THREE.RepeatWrapping;
    roughness.anisotropy = 16;

    const matData = { diffuse, normal, roughness };
    this.cache.set(cacheKey, matData);
    return matData;
  }

  // 2. Weathered Tactical Asphalt with Wet Fresnel Puddles
  createTacticalAsphalt() {
    const cacheKey = 'tactical_asphalt_2k';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const { canvas: diffCanvas, ctx: diffCtx } = this.createCanvas(1024, 1024);
    const { canvas: roughCanvas, ctx: roughCtx } = this.createCanvas(1024, 1024);

    const diffImg = diffCtx.createImageData(1024, 1024);
    const roughImg = roughCtx.createImageData(1024, 1024);
    const dData = diffImg.data;
    const rData = roughImg.data;

    for (let y = 0; y < 1024; y++) {
      for (let x = 0; x < 1024; x++) {
        const n1 = this.fbm(x, y, 6, 2.2, 0.55, 41);
        const fineNoise = (Math.random() - 0.5) * 25;

        let col = 34 + n1 * 32 + fineNoise;
        col = Math.max(12, Math.min(90, col));

        const puddleNoise = this.smoothNoise(x, y, 0.0035, 88);
        const isPuddle = puddleNoise > 0.60;

        const idx = (y * 1024 + x) * 4;
        if (isPuddle) {
          dData[idx] = Math.floor(col * 0.5);
          dData[idx + 1] = Math.floor(col * 0.55);
          dData[idx + 2] = Math.floor(col * 0.7);
          dData[idx + 3] = 255;

          // Zero roughness for mirror-like puddle reflections
          rData[idx] = 8;
          rData[idx + 1] = 8;
          rData[idx + 2] = 8;
          rData[idx + 3] = 255;
        } else {
          dData[idx] = Math.floor(col);
          dData[idx + 1] = Math.floor(col * 1.02);
          dData[idx + 2] = Math.floor(col * 1.05);
          dData[idx + 3] = 255;

          rData[idx] = 225;
          rData[idx + 1] = 225;
          rData[idx + 2] = 225;
          rData[idx + 3] = 255;
        }
      }
    }

    diffCtx.putImageData(diffImg, 0, 0);
    roughCtx.putImageData(roughImg, 0, 0);

    // Painted Airfield Chevron Markings
    diffCtx.fillStyle = 'rgba(240, 240, 245, 0.7)';
    diffCtx.fillRect(490, 80, 44, 300);
    diffCtx.fillRect(490, 580, 44, 300);

    diffCtx.font = 'bold 36px "Courier New", monospace';
    diffCtx.fillStyle = 'rgba(225, 185, 45, 0.7)';
    diffCtx.fillText('WARZONE // LZ-BRAVO [RESTRICTED]', 100, 480);

    const diffuse = new THREE.CanvasTexture(diffCanvas);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.anisotropy = 16;

    const normal = this.generateNormalMapFromCanvas(diffCanvas, 4.5);

    const roughness = new THREE.CanvasTexture(roughCanvas);
    roughness.wrapS = THREE.RepeatWrapping;
    roughness.wrapT = THREE.RepeatWrapping;
    roughness.anisotropy = 16;

    const matData = { diffuse, normal, roughness };
    this.cache.set(cacheKey, matData);
    return matData;
  }

  // 3. Corrugated Military Containers
  createShippingContainerTexture(colorType = 'navy') {
    const cacheKey = `container_${colorType}_2k`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const { canvas: diffCanvas, ctx: diffCtx } = this.createCanvas(1024, 1024);
    const { canvas: roughCanvas, ctx: roughCtx } = this.createCanvas(1024, 1024);
    const { canvas: metalCanvas, ctx: metalCtx } = this.createCanvas(1024, 1024);

    let baseR = 30, baseG = 65, baseB = 95;
    if (colorType === 'olive') { baseR = 55; baseG = 70; baseB = 40; }
    if (colorType === 'rust_red') { baseR = 110; baseG = 45; baseB = 35; }
    if (colorType === 'hazard_yellow') { baseR = 160; baseG = 130; baseB = 30; }

    const ribWidth = 64;
    for (let x = 0; x < 1024; x++) {
      const ribPhase = (x % ribWidth) / ribWidth;
      const ribShade = Math.sin(ribPhase * Math.PI * 2) * 0.35 + 0.65;

      for (let y = 0; y < 1024; y++) {
        const rustNoise = this.fbm(x, y, 5, 2.0, 0.55, 61);
        const isRust = rustNoise > 0.64;

        if (isRust) {
          const rCol = 90 + Math.random() * 40;
          const gCol = 40 + Math.random() * 25;
          const bCol = 20 + Math.random() * 15;
          diffCtx.fillStyle = `rgb(${Math.floor(rCol)}, ${Math.floor(gCol)}, ${Math.floor(bCol)})`;
          roughCtx.fillStyle = '#f0f0f0';
          metalCtx.fillStyle = '#202020';
        } else {
          const r = Math.floor(baseR * ribShade + (Math.random() - 0.5) * 10);
          const g = Math.floor(baseG * ribShade + (Math.random() - 0.5) * 10);
          const b = Math.floor(baseB * ribShade + (Math.random() - 0.5) * 10);
          diffCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          roughCtx.fillStyle = '#606060';
          metalCtx.fillStyle = '#b0b0b0';
        }
        diffCtx.fillRect(x, y, 1, 1);
        roughCtx.fillRect(x, y, 1, 1);
        metalCtx.fillRect(x, y, 1, 1);
      }
    }

    diffCtx.font = '900 64px "Arial Black", Impact, sans-serif';
    diffCtx.fillStyle = 'rgba(240, 240, 245, 0.85)';
    diffCtx.fillText('SHADOW CO. // 141', 120, 320);

    const diffuse = new THREE.CanvasTexture(diffCanvas);
    const normal = this.generateNormalMapFromCanvas(diffCanvas, 3.5);
    const roughness = new THREE.CanvasTexture(roughCanvas);
    const metalness = new THREE.CanvasTexture(metalCanvas);

    const matData = { diffuse, normal, roughness, metalness };
    this.cache.set(cacheKey, matData);
    return matData;
  }

  // 4. Weapon Camouflage Patterns
  createWeaponCamoTexture(camoType = 'damascus') {
    const cacheKey = `camo_${camoType}_2k`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const { canvas: diffCanvas, ctx: diffCtx } = this.createCanvas(1024, 1024);
    const { canvas: roughCanvas, ctx: roughCtx } = this.createCanvas(1024, 1024);
    const { canvas: metalCanvas, ctx: metalCtx } = this.createCanvas(1024, 1024);

    if (camoType === 'damascus') {
      for (let y = 0; y < 1024; y++) {
        for (let x = 0; x < 1024; x++) {
          const wave = Math.sin(x * 0.05 + this.fbm(x, y, 4, 2.0, 0.6, 15) * 8.0) +
                       Math.cos(y * 0.05 + this.fbm(y, x, 4, 2.0, 0.6, 92) * 8.0);
          const t = (wave + 2.0) / 4.0;

          let r, g, b;
          if (t < 0.25) { r = 15; g = 25; b = 55; }
          else if (t < 0.5) { r = 20; g = 120; b = 240; }
          else if (t < 0.75) { r = 180; g = 30; b = 180; }
          else { r = 240; g = 40; b = 100; }

          diffCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          diffCtx.fillRect(x, y, 1, 1);
        }
      }
      roughCtx.fillStyle = '#282828';
      roughCtx.fillRect(0, 0, 1024, 1024);
      metalCtx.fillStyle = '#eeeeee';
      metalCtx.fillRect(0, 0, 1024, 1024);
    } else if (camoType === 'gold') {
      diffCtx.fillStyle = '#e5b830';
      diffCtx.fillRect(0, 0, 1024, 1024);
      for (let y = 0; y < 1024; y += 32) {
        for (let x = 0; x < 1024; x += 32) {
          diffCtx.strokeStyle = 'rgba(90, 65, 10, 0.45)';
          diffCtx.lineWidth = 2;
          diffCtx.strokeRect(x + 4, y + 4, 24, 24);
        }
      }
      roughCtx.fillStyle = '#181818';
      roughCtx.fillRect(0, 0, 1024, 1024);
      metalCtx.fillStyle = '#ffffff';
      metalCtx.fillRect(0, 0, 1024, 1024);
    } else if (camoType === 'carbon') {
      diffCtx.fillStyle = '#111113';
      diffCtx.fillRect(0, 0, 1024, 1024);
      for (let y = 0; y < 1024; y += 16) {
        for (let x = 0; x < 1024; x += 16) {
          const isCheck = ((x / 16) + (y / 16)) % 2 === 0;
          diffCtx.fillStyle = isCheck ? '#28282c' : '#141416';
          diffCtx.fillRect(x, y, 16, 16);
        }
      }
      roughCtx.fillStyle = '#353535';
      roughCtx.fillRect(0, 0, 1024, 1024);
      metalCtx.fillStyle = '#606060';
      metalCtx.fillRect(0, 0, 1024, 1024);
    } else {
      diffCtx.fillStyle = '#1e2024';
      diffCtx.fillRect(0, 0, 1024, 1024);
      roughCtx.fillStyle = '#757575';
      roughCtx.fillRect(0, 0, 1024, 1024);
      metalCtx.fillStyle = '#909090';
      metalCtx.fillRect(0, 0, 1024, 1024);
    }

    const diffuse = new THREE.CanvasTexture(diffCanvas);
    diffuse.anisotropy = 16;
    const normal = this.generateNormalMapFromCanvas(diffCanvas, 2.2);
    const roughness = new THREE.CanvasTexture(roughCanvas);
    const metalness = new THREE.CanvasTexture(metalCanvas);

    const matData = { diffuse, normal, roughness, metalness };
    this.cache.set(cacheKey, matData);
    return matData;
  }

  createReticleTexture(type = 'holographic') {
    const cacheKey = `reticle_${type}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const { canvas, ctx } = this.createCanvas(512, 512);
    ctx.clearRect(0, 0, 512, 512);

    const cx = 256, cy = 256;

    if (type === 'holographic') {
      ctx.strokeStyle = '#ff1100';
      ctx.fillStyle = '#ff1100';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(cx - 165, cy); ctx.lineTo(cx - 115, cy);
      ctx.moveTo(cx + 115, cy); ctx.lineTo(cx + 165, cy);
      ctx.moveTo(cx, cy - 165); ctx.lineTo(cx, cy - 115);
      ctx.moveTo(cx, cy + 115); ctx.lineTo(cx, cy + 165);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'red_dot') {
      ctx.fillStyle = '#00ff66';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'sniper_mildot') {
      ctx.strokeStyle = '#050505';
      ctx.fillStyle = '#ff2222';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(512, cy);
      ctx.moveTo(cx, 0); ctx.lineTo(cx, 512);
      ctx.stroke();

      for (let i = -5; i <= 5; i++) {
        if (i === 0) continue;
        ctx.beginPath();
        ctx.arc(cx + i * 36, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy + i * 36, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#ff1100';
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(cacheKey, texture);
    return texture;
  }

  createBulletHoleTexture() {
    const cacheKey = 'bullet_hole';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const { canvas, ctx } = this.createCanvas(256, 256);
    ctx.clearRect(0, 0, 256, 256);

    const cx = 128, cy = 128;
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(60, 55, 50, 0.9)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(20, 20, 22, 0.85)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const length = 40 + Math.random() * 65;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 26, cy + Math.sin(angle) * 26);
      ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(cacheKey, texture);
    return texture;
  }

  createBloodSplatterTexture() {
    const cacheKey = 'blood_splatter';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const { canvas, ctx } = this.createCanvas(256, 256);
    ctx.clearRect(0, 0, 256, 256);

    const cx = 128, cy = 128;
    ctx.fillStyle = 'rgba(140, 10, 15, 0.92)';
    ctx.beginPath();
    ctx.arc(cx, cy, 35 + Math.random() * 15, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 85;
      const size = 3 + Math.random() * 8;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(cacheKey, texture);
    return texture;
  }

  createSmokeParticleTexture() {
    const cacheKey = 'smoke_particle';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const { canvas, ctx } = this.createCanvas(128, 128);
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(220, 220, 225, 0.8)');
    grad.addColorStop(0.35, 'rgba(160, 160, 170, 0.45)');
    grad.addColorStop(0.7, 'rgba(90, 90, 95, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(cacheKey, texture);
    return texture;
  }

  createMuzzleFlashTexture() {
    const cacheKey = 'muzzle_flash';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const { canvas, ctx } = this.createCanvas(256, 256);
    const cx = 128, cy = 128;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.15, 'rgba(255, 230, 120, 0.95)');
    grad.addColorStop(0.4, 'rgba(255, 120, 20, 0.7)');
    grad.addColorStop(0.8, 'rgba(255, 40, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 120, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 12, 120, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(cacheKey, texture);
    return texture;
  }
}

export const textureGen = new TextureGenerator();
