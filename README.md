# 🎮 CALL OF DUTY: WARZONE 3D // OPERATION: WARZONE FORTRESS
### Photorealistic AAA Graphics, Physics & Gunplay in Three.js & WebGL

A browser first-person shooter built from scratch with Three.js, custom GLSL post-processing shaders, procedural PBR texture synthesis, and the Web Audio API.

---

## 🌟 Upgraded Photorealistic Visuals & Graphics Pipeline

### 1. 🎨 2048x2048 Procedural PBR Texturing & Sobel Normal Maps (`textures.js`)
- **Photorealistic Military Concrete**: Multi-scale Fractal Brownian Motion (FBM), micro-cavity ambient occlusion, embedded aggregate pebbles, Sobel normal filtering with 4.5x depth strength, and painted tactical boundary hazard stripes.
- **Wet Tactical Asphalt with Fresnel Puddles**: Ultra-high gloss puddles with real-time Fresnel equation $R(\theta) = R_0 + (1 - R_0)(1 - \cos\theta)^5$, road aggregate normal maps, tire skid marks, and painted airfield chevrons.
- **Corrugated Military Shipping Containers**: 3D ribbed steel, oxidation rust maps, hazard diamonds, and military serial stencils.
- **Mastery Weapon Camouflages**:
  - **Damascus Wave**: Multi-wave contour interference pattern with iridescent blue, purple, and crimson color shifts.
  - **Mastery Gold**: High-metallic mirror finish with geometric laser-etched damascene.
  - **Tactical Carbon Fiber**: 2x2 twill weave pattern with anisotropic gloss highlights.
  - **Cerakote Matte Black**: Dark gunmetal cerakote with edge wear and scratches.

---

### 2. ⚡ Custom GLSL Post-Processing Pipeline (`shaders.js`)
- **ACES Filmic Tone Mapping**: Cinema-grade high-dynamic-range tone mapping capturing deep steel shadows and specular highlights.
- **Volumetric Godrays / Sunlight Crepuscular Rays**: Screen-space radial occlusion blur casting volumetric sunlight through windows and container gaps.
- **Dynamic Bokeh Depth of Field (DoF)**: Smooth autofocus on reticle/target when aiming down sights (ADS) with peripheral bokeh blur.
- **Radial Motion Blur**: Velocity-based radial blur during high-speed tactical sprinting, sliding, and fast mouse turns.
- **FLIR Thermal Vision / NVG Shader Mode (`T` Key)**: High-contrast false-color thermal vision highlighting enemy heat signatures and hot barrels with scanline overlays.
- **Atmospheric Lens Effects**: Peripheral chromatic aberration, tactical film grain, anamorphic lens flare highlights, vignette, and low-health blood heartbeat pulse.

---

### 3. 🎯 Viewmodel & Call of Duty Gunplay Physics (`viewmodel.js`, `weapons.js`)
- **Damped Harmonic Spring Recoil**: Damped harmonic oscillator modeling angular pitch kick, yaw jitter, roll torque, and linear rearward shoulder punch with exponential return curves.
- **Parallax Holographic Reticles**: 3D illuminated EOTech EXPS3 holographic circle-dot, red dots, and 8x tactical Mil-Dot reticles that remain aligned with the target.
- **Tactical Movement Stances**:
  - **Tactical Sprint**: Weapon held upright in the right hand with athletic footstep bobbing.
  - **Slide & Slide Canceling**: High-speed ground slide with camera tilt; press `Space` to instantly slide-cancel into standing stance.
  - **Crouch & Prone Stances**: Smooth camera height transitions between Standing (1.75m), Crouching (1.1m), and Prone (0.45m).
  - **Lissajous 8-Pattern Sway**: Weapon idle sway that steadies when holding breath.
  - **3D Physics Shell Casings**: Real brass casings ejecting with angular velocity and bouncing with metallic audio pings.
  - **Cherry-Red Barrel Heat & Smoke**: Wispy procedural particle smoke drifting from hot barrels.

---

### 4. 🤖 6 Enemy AI Combat Classes & Wave Survival (`aiSystem.js`)
- **Shadow Recon (Assault Rifle)**: Tactical burst fire, cover seeking, and grenade throwing.
- **Shadow Rusher (SMG)**: High-speed tactical sprint, strafing slide-ins, and rapid close-quarters fire.
- **Shadow Juggernaut Behemoth**: Armored behemoth (**450 HP + 200 Armor**) wielding a rotating 6-barrel Gatling minigun with ground-shaking suppression fire.
- **Shadow Sniper Overwatch**: High vantage marksmen perched on elevated watchtowers with active red laser sight beams.
- **Shadow Heavy Riot Shield Enforcer**: Frontal bulletproof ballistic shield with a polycarbonate viewport window; requires flanking or explosives.
- **Shadow Kamikaze Drone (Tickers)**: Quadcopter suicide drones with 4 spinning rotors and flashing red LEDs that divebomb the player.
- **3D Floating Enemy Healthbars & Floating Damage Numbers**: Segmented armor plates, health fill, and floating damage numbers (`38`, `76 CRIT`, `150 HEADSHOT`, `IMMUNE - SHIELD`).
- **Wave Survival Progression**: Escalating waves with squad compositions, Juggernaut Boss rounds, supply drops, and wave completion XP bonuses.
- **Blood Pooling Decals**: Dynamically expanding dark red blood pools beneath fallen hostiles.

---

### 5. 🔫 8-Weapon Arsenal & Tactical Equipment
1. **M4A1 Tactical Assault Rifle**: Rapid fire, laser accuracy, modular silencer, angled foregrip, PEQ-15 laser, and holographic sight.
2. **Lachmann Sub (MP5) SMG**: Blistering fire rate, curved 9mm magazine, folding stock, tight hipfire spread.
3. **MCPR-300 Heavy .50 BMG Sniper**: One-shot stopping power, 8x Mil-Dot illuminated scope, bolt-action cycling, scope shadow vignette, and breath-holding steady aim.
4. **Expedite 12 Tactical Shotgun**: 8-pellet buckshot spread physics, high close-quarters impact, and pump action slide.
5. **RPG-7 Heavy Rocket Launcher**: High-yield conical rocket with trailing smoke particles, flight ballistics, and multi-kill blast radius.
6. **M133 Juggernaut Minigun**: 6 rotating heavy barrels (**1200 RPM continuous fire**), dual spade grips, and screen-shaking muzzle blasts.
7. **.50 GS (Desert Eagle) Handgun**: Chrome slide, heavy recoil blowback, massive stopping power.
8. **Tactical Combat Karambit**: Damascus curved blade with high-speed slash and spin flourish animations.
9. **Tactical & Lethal Equipment**:
   - **Frag Grenade (`G`)**: Cookable timer, bounce physics, shrapnel explosion.
   - **Tactical Stim Shot (`E`)**: Adrenaline syringe injection restoring 100 HP & granting 6s unlimited tactical sprint.
   - **Armor Plating (`B`)**: Insert ceramic armor plates into ballistic vest (up to 3 plates = 150 armor).
   - **FLIR Thermal Optics Shader (`T`)**: Full-screen military thermal imaging false-color mode.

---

## ⌨️ Controls Reference

| Key | Action |
|---|---|
| **WASD** | Tactical Movement / Strafe |
| **Mouse Look** | Raw 1:1 Aiming (Pointer Lock) |
| **Left Click** | Fire Active Weapon |
| **Right Click** | Aim Down Sights (ADS Zoom) |
| **Shift** | Tactical Sprint |
| **C** | Slide (while sprinting) / Crouch |
| **X** | Prone Stance |
| **Space** | Jump / Vault / Slide Cancel |
| **1 - 8** | Select Weapon (AR, SMG, Sniper, Shotgun, RPG-7, Minigun, Pistol, Knife) |
| **R** | Tactical Reload |
| **E** | Tactical Stim Shot (Heal 100 HP + Sprint Boost) |
| **B** | Insert Armor Plates |
| **G / Q** | Lethal Frag Grenade / Stun Grenade |
| **T** | Toggle FLIR Thermal Optics / NVG |
| **V** | Quick Melee Strike |
| **4, 5, 6, 7** | Deploy Killstreaks (UAV, Airstrike, VTOL, Nuke) |
| **TAB** | Tactical Scoreboard |
| **ESC / M** | Open Gunsmith & Settings Menu |
