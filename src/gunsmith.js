// AAA Call of Duty Gunsmith & Loadout Customization Interface
// Allows live weapon camo changes, optic swapping, muzzle attachments, and graphics/controls configuration
import { soundEngine } from './audio.js';

export class GunsmithUI {
  constructor(domRoot, weaponFactory, playerController, renderer, camera) {
    this.root = domRoot;
    this.weaponFactory = weaponFactory;
    this.player = playerController;
    this.renderer = renderer;
    this.camera = camera;
    this.isOpen = false;

    this.createMenuDom();
    this.bindEvents();
  }

  createMenuDom() {
    const modal = document.createElement('div');
    modal.id = 'gunsmith-modal';
    modal.className = 'modal-hidden';
    modal.innerHTML = `
      <div id="gunsmith-container">
        <!-- Header -->
        <div id="gunsmith-header">
          <div id="gunsmith-title">GUNSMITH // TASK FORCE 141 LOADOUT</div>
          <button id="gunsmith-close-btn">DEPLOY [ESC]</button>
        </div>

        <!-- Main Body -->
        <div id="gunsmith-body">
          <!-- Left: Weapon Customizer Tabs -->
          <div id="gunsmith-left-panel">
            <div class="panel-section-title">CAMOUFLAGE MASTERY</div>
            <div class="camo-grid">
              <button class="camo-btn active" data-camo="damascus">DAMASCUS WAVE</button>
              <button class="camo-btn" data-camo="gold">MASTERY GOLD</button>
              <button class="camo-btn" data-camo="carbon">CARBON FIBER</button>
              <button class="camo-btn" data-camo="matte_black">CERAKOTE BLACK</button>
            </div>

            <div class="panel-section-title">OPTIC ATTACHMENTS</div>
            <div class="attachment-list">
              <button class="optic-btn active" data-optic="holographic">EOTech EXPS3 Holographic</button>
              <button class="optic-btn" data-optic="red_dot">Aimpoint Micro Red Dot</button>
              <button class="optic-btn" data-optic="sniper_mildot">8x Tactical Mil-Dot Scope</button>
              <button class="optic-btn" data-optic="iron_sights">Standard Iron Sights</button>
            </div>

            <div class="panel-section-title">TACTICAL MUZZLE & LASER</div>
            <div class="toggle-group">
              <label class="switch-label">
                <input type="checkbox" id="toggle-silencer">
                <span class="slider"></span>
                Tactical Suppressor
              </label>
              <label class="switch-label">
                <input type="checkbox" id="toggle-laser" checked>
                <span class="slider"></span>
                PEQ-15 Green Tactical Laser
              </label>
            </div>
          </div>

          <!-- Right: Graphics & Audio Settings -->
          <div id="gunsmith-right-panel">
            <div class="panel-section-title">GRAPHICS & POST-PROCESSING</div>
            
            <div class="setting-slider-group">
              <div class="setting-label">Field of View (FOV): <span id="fov-val">90</span>°</div>
              <input type="range" id="slider-fov" min="60" max="110" value="90">
            </div>

            <div class="setting-slider-group">
              <div class="setting-label">Mouse Sensitivity: <span id="sens-val">2.2</span></div>
              <input type="range" id="slider-sens" min="5" max="60" value="22">
            </div>

            <div class="setting-slider-group">
              <div class="setting-label">Master SFX Volume: <span id="vol-val">100</span>%</div>
              <input type="range" id="slider-vol" min="0" max="100" value="100">
            </div>

            <div class="panel-section-title">KEYBIND CONTROLS</div>
            <div class="keybind-grid">
              <div class="key-row"><span class="key-badge">WASD</span> Movement</div>
              <div class="key-row"><span class="key-badge">SHIFT</span> Tactical Sprint</div>
              <div class="key-row"><span class="key-badge">C</span> Slide / Crouch</div>
              <div class="key-row"><span class="key-badge">SPACE</span> Jump / Mantle</div>
              <div class="key-row"><span class="key-badge">RIGHT CLICK</span> ADS Scope Zoom</div>
              <div class="key-row"><span class="key-badge">1 - 6</span> Weapon Select</div>
              <div class="key-row"><span class="key-badge">R</span> Tactical Reload</div>
              <div class="key-row"><span class="key-badge">4, 5, 6, 7</span> Killstreaks</div>
              <div class="key-row"><span class="key-badge">ESC / M</span> Gunsmith Menu</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.root.appendChild(modal);
    this.modalEl = modal;
  }

  bindEvents() {
    // Esc / M Toggle
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyM') {
        this.toggle();
      }
    });

    document.getElementById('gunsmith-close-btn').addEventListener('click', () => {
      this.close();
    });

    // Camo Selector
    const camoBtns = this.modalEl.querySelectorAll('.camo-btn');
    camoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        camoBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const camo = btn.dataset.camo;
        this.weaponFactory.setCamo(camo);
        this.player.initWeapons(); // Rebuild active weapon meshes
        soundEngine.playReloadStage('rack');
      });
    });

    // Optic Selector
    const opticBtns = this.modalEl.querySelectorAll('.optic-btn');
    opticBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        opticBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const optic = btn.dataset.optic;
        this.weaponFactory.setOptic(optic);
        this.player.initWeapons();
        soundEngine.playReloadStage('in');
      });
    });

    // Silencer Toggle
    document.getElementById('toggle-silencer').addEventListener('change', (e) => {
      this.weaponFactory.hasSilencer = e.target.checked;
      this.player.initWeapons();
      soundEngine.playReloadStage('out');
    });

    // Laser Toggle
    document.getElementById('toggle-laser').addEventListener('change', (e) => {
      this.weaponFactory.laserEnabled = e.target.checked;
      this.player.initWeapons();
    });

    // FOV Slider
    const fovSlider = document.getElementById('slider-fov');
    const fovVal = document.getElementById('fov-val');
    fovSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      fovVal.innerText = val;
      this.camera.fov = val;
      this.camera.updateProjectionMatrix();
    });

    // Sensitivity Slider
    const sensSlider = document.getElementById('slider-sens');
    const sensVal = document.getElementById('sens-val');
    sensSlider.addEventListener('input', (e) => {
      const val = (parseInt(e.target.value) / 10).toFixed(1);
      sensVal.innerText = val;
      this.player.sensitivity = (parseInt(e.target.value) / 10000);
    });

    // Volume Slider
    const volSlider = document.getElementById('slider-vol');
    const volVal = document.getElementById('vol-val');
    volSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      volVal.innerText = val;
      soundEngine.setVolume(val / 100, (val / 100) * 0.4);
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.modalEl.className = 'modal-visible';
    if (document.exitPointerLock) document.exitPointerLock();
    soundEngine.playReloadStage('out');
  }

  close() {
    this.isOpen = false;
    this.modalEl.className = 'modal-hidden';
    const canvas = document.getElementById('webgl-canvas');
    if (canvas && canvas.requestPointerLock) canvas.requestPointerLock();
    soundEngine.playReloadStage('rack');
  }
}
