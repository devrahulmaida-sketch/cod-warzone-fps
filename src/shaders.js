// AAA Ultra-High Performance Post-Processing & Custom GLSL Shaders
// Fast, lightweight, zero GPU lag, calibrated tone mapping (never over-exposes or turns black)
import * as THREE from 'three';

export class PostProcessingPipeline {
  constructor(renderer, scene, camera, width, height) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.width = width;
    this.height = height;

    this.isThermalFLIR = false;
    this.damageVignette = 0.0;
    this.stimGlow = 0.0;

    const pars = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    };

    this.sceneTarget = new THREE.WebGLRenderTarget(width, height, pars);
    this.orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this.quadScene = new THREE.Scene();

    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.sceneTarget.texture },
        uResolution: { value: new THREE.Vector2(width, height) },
        uTime: { value: 0.0 },
        uDamage: { value: 0.0 },
        uStim: { value: 0.0 },
        uThermal: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uDamage;
        uniform float uStim;
        uniform float uThermal;
        varying vec2 vUv;

        // Fast ACES Filmic Tone Mapping Curve
        vec3 ACESFilm(vec3 x) {
          float a = 2.51;
          float b = 0.03;
          float c = 2.43;
          float d = 0.59;
          float e = 0.14;
          return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
        }

        void main() {
          vec2 uv = vUv;
          vec2 center = vec2(0.5);
          vec2 dist = uv - center;

          // 1. Base Scene Sample
          vec4 sceneSample = texture2D(tDiffuse, uv);
          vec3 col = sceneSample.rgb;

          // 2. Subtle Edge Chromatic Aberration
          float rOffset = length(dist) * 0.0025;
          col.r = texture2D(tDiffuse, uv + dist * rOffset).r;
          col.b = texture2D(tDiffuse, uv - dist * rOffset).b;

          // 3. FLIR Thermal Vision Mode (T Key)
          if (uThermal > 0.5) {
            float lum = dot(col, vec3(0.299, 0.587, 0.114));
            vec3 thermalCol = vec3(0.0);
            if (lum < 0.25) {
              thermalCol = mix(vec3(0.02, 0.05, 0.15), vec3(0.08, 0.35, 0.55), lum / 0.25);
            } else if (lum < 0.65) {
              thermalCol = mix(vec3(0.08, 0.35, 0.55), vec3(0.95, 0.38, 0.05), (lum - 0.25) / 0.4);
            } else {
              thermalCol = mix(vec3(0.95, 0.38, 0.05), vec3(1.0, 1.0, 1.0), (lum - 0.65) / 0.35);
            }
            float scanline = sin(uv.y * 500.0) * 0.03;
            thermalCol -= scanline;
            col = thermalCol;
          }

          // 4. Tone Mapping & Contrast
          col = ACESFilm(col);

          // 5. Tactical Screen Vignette
          float vignette = length(dist) * 1.25;
          col *= (1.0 - vignette * 0.35);

          // 6. Tactical Stim Adrenaline Glow (Cyan screen border)
          if (uStim > 0.01) {
            float stimEdge = smoothstep(0.35, 0.85, length(dist)) * uStim;
            col = mix(col, vec3(0.0, 0.85, 0.75), stimEdge * 0.5);
          }

          // 7. Damage Blood Pulse
          if (uDamage > 0.01) {
            float pulse = 0.5 + 0.5 * sin(uTime * 12.0);
            float bloodVignette = smoothstep(0.25, 0.85, length(dist)) * uDamage;
            col = mix(col, vec3(0.75, 0.03, 0.05) * (0.8 + 0.2 * pulse), bloodVignette * 0.75);
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.compositeMaterial);
    quad.frustumCulled = false;
    this.quadScene.add(quad);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.sceneTarget.setSize(width, height);
    this.compositeMaterial.uniforms.uResolution.value.set(width, height);
  }

  toggleThermal() {
    this.isThermalFLIR = !this.isThermalFLIR;
    this.compositeMaterial.uniforms.uThermal.value = this.isThermalFLIR ? 1.0 : 0.0;
  }

  setStim(value) {
    this.stimGlow = value;
    this.compositeMaterial.uniforms.uStim.value = value;
  }

  render(time, delta, playerHealth, maxHealth) {
    const damageFactor = Math.max(0.0, 1.0 - (playerHealth / maxHealth));
    this.damageVignette += (damageFactor - this.damageVignette) * delta * 5.0;

    this.compositeMaterial.uniforms.uTime.value = time;
    this.compositeMaterial.uniforms.uDamage.value = this.damageVignette;

    // 1. Render Scene to Off-screen Target
    this.renderer.setRenderTarget(this.sceneTarget);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    // 2. Render Post-Processing Pass to Screen
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.quadScene, this.orthoCam);
  }
}
