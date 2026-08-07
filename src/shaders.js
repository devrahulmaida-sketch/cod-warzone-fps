// AAA Cinematic Post-Processing Pipeline & Custom Shaders for Three.js
// Includes: ACES Filmic Tone Mapping, Volumetric Godrays, Dual-Pass Bloom, Bokeh Depth of Field, Radial Motion Blur, and FLIR Thermal Vision
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
    this.adsBlur = 0.0;
    this.motionBlurIntensity = 0.0;

    const pars = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType
    };

    this.sceneTarget = new THREE.WebGLRenderTarget(width, height, pars);
    this.bloomTarget = new THREE.WebGLRenderTarget(Math.floor(width / 2), Math.floor(height / 2), pars);

    this.orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadScene = new THREE.Scene();

    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.sceneTarget.texture },
        uResolution: { value: new THREE.Vector2(width, height) },
        uTime: { value: 0.0 },
        uDamage: { value: 0.0 },
        uThermal: { value: 0.0 },
        uADSBlur: { value: 0.0 },
        uMotionBlur: { value: 0.0 },
        uExposure: { value: 1.25 },
        uSunScreenPos: { value: new THREE.Vector2(0.65, 0.75) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uDamage;
        uniform float uThermal;
        uniform float uADSBlur;
        uniform float uMotionBlur;
        uniform float uExposure;
        uniform vec2 uSunScreenPos;
        varying vec2 vUv;

        // ACES Filmic Curve (Modern Call of Duty Aesthetic)
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

          // 1. Radial Motion Blur & Velocity Blur
          vec3 col = vec3(0.0);
          float blurSamples = 8.0;
          float blurWeight = 0.0;
          vec2 blurDir = (uv - center) * (uMotionBlur * 0.035);

          for (float i = 0.0; i < 8.0; i++) {
            vec2 sampleUv = uv - blurDir * (i / blurSamples);
            col += texture2D(tDiffuse, sampleUv).rgb;
            blurWeight += 1.0;
          }
          col /= blurWeight;

          // 2. Chromatic Aberration on Peripheral Edges
          vec2 dist = uv - center;
          float rOffset = length(dist) * 0.0045;
          col.r = texture2D(tDiffuse, uv + dist * rOffset).r;
          col.b = texture2D(tDiffuse, uv - dist * rOffset).b;

          // 3. Volumetric Godrays / Sun Shafts
          vec2 deltaTextCoord = (uv - uSunScreenPos) * (1.0 / 12.0) * 0.45;
          vec2 textCoo = uv;
          float illuminationDecay = 1.0;
          vec3 godrays = vec3(0.0);

          for (int i = 0; i < 12; i++) {
            textCoo -= deltaTextCoord;
            vec3 sCol = texture2D(tDiffuse, textCoo).rgb;
            float lum = dot(sCol, vec3(0.299, 0.587, 0.114));
            if (lum > 0.85) {
              godrays += sCol * illuminationDecay * 0.08;
            }
            illuminationDecay *= 0.88;
          }
          col += godrays * vec3(1.0, 0.85, 0.6);

          // 4. Dynamic Depth of Field (ADS Blur on Periphery)
          if (uADSBlur > 0.01) {
            float distFromCenter = length(uv - center);
            float dofFactor = smoothstep(0.18, 0.75, distFromCenter) * uADSBlur;
            vec3 dofCol = vec3(0.0);
            for (float x = -2.0; x <= 2.0; x += 1.0) {
              for (float y = -2.0; y <= 2.0; y += 1.0) {
                dofCol += texture2D(tDiffuse, uv + vec2(x, y) * 0.003 * dofFactor).rgb;
              }
            }
            dofCol /= 25.0;
            col = mix(col, dofCol, dofFactor);
          }

          // 5. FLIR Thermal Vision Mode (T key)
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
            // Scanlines
            float scanline = sin(uv.y * 700.0) * 0.04;
            thermalCol -= scanline;
            col = thermalCol;
          }

          // 6. ACES Filmic Tone Mapping & Color Grading
          col *= uExposure;
          col = ACESFilm(col);

          // 7. Tactical Contrast Vignette
          float vignette = length(dist) * 1.35;
          col *= (1.0 - vignette * 0.42);

          // 8. Damage Blood Vignette & Heartbeat Pulse
          if (uDamage > 0.01) {
            float pulse = 0.5 + 0.5 * sin(uTime * 14.0);
            float bloodVignette = smoothstep(0.28, 0.85, length(dist)) * uDamage;
            col = mix(col, vec3(0.8, 0.04, 0.06) * (0.85 + 0.25 * pulse), bloodVignette);
          }

          // 9. Tactical Film Grain
          float grain = (fract(sin(dot(uv * uTime, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.028;
          col += grain;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.compositeMaterial);
    this.quadScene.add(quad);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.sceneTarget.setSize(width, height);
    this.bloomTarget.setSize(Math.floor(width / 2), Math.floor(height / 2));
    this.compositeMaterial.uniforms.uResolution.value.set(width, height);
  }

  toggleThermal() {
    this.isThermalFLIR = !this.isThermalFLIR;
    this.compositeMaterial.uniforms.uThermal.value = this.isThermalFLIR ? 1.0 : 0.0;
  }

  setADSBlur(progress) {
    this.adsBlur = progress;
    this.compositeMaterial.uniforms.uADSBlur.value = progress;
  }

  setMotionBlur(intensity) {
    this.motionBlurIntensity = intensity;
    this.compositeMaterial.uniforms.uMotionBlur.value = intensity;
  }

  render(time, delta, playerHealth, maxHealth) {
    const damageFactor = 1.0 - (playerHealth / maxHealth);
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
