# MASTER SPECIFICATION — PROFESSIONAL BROADCAST MOTION GRAPHICS SYSTEM

Build the animation/graphics subsystem as a professional real-time broadcast motion graphics system, not as a collection of generic UI animations.

## 1. Target terminology

Use these exact industry terms as the conceptual target:

- Real-Time Data-Driven Broadcast Motion Graphics
- Broadcast Motion Design
- Broadcast Graphics / On-Air Graphics
- Game Show Broadcast Graphics
- Sports Broadcast Graphics
- Real-Time 2D/3D Broadcast Graphics
- Data-Driven Graphics / Data-Driven Animation
- Character Generator (CG) / Graphics System
- Template-Driven Broadcast Graphics
- Broadcast Graphics Control / Rundown / Playout
- Kinetic Typography
- Procedural Motion Graphics
- Real-Time Motion Graphics
- Motion Graphics Design System
- State-Driven Broadcast Animation
- Transition Logic
- Live Data Visualization
- 2D GPU Graphics / 3D GPU Graphics

Do NOT interpret "professional animation" as simply adding fades, bounces, or CSS transitions.

## 2. Core architectural model

Implement the system in separate layers:

DATA/EVENTS
    ↓
BROADCAST EVENT BUS
    ↓
GRAPHIC STATE MACHINE
    ↓
TIMELINE / SEQUENCER
    ↓
ANIMATION PRIMITIVES
    ↓
RENDERER ADAPTER
    ├── DOM/SVG/CSS
    ├── PixiJS 2D
    ├── Three.js 3D
    ├── Rive
    ├── Lottie / dotLottie
    └── native/vector renderer where required
    ↓
COMPOSITOR / OUTPUT

Also support:
CONTROL PANEL → PREVIEW / LIVE
RUNDOWN → GRAPHIC TRIGGERS
DATA SOURCE → LIVE UPDATES
REMOTE CONTROL → STATE CHANGES

Animation code must NOT be tightly coupled to the UI component tree.

## 3. Motion vocabulary — implement as reusable primitives

### Timing and easing
- ease-in
- ease-out
- ease-in-out
- cubic-bezier
- custom easing curves
- linear
- steps
- back / overshoot
- elastic
- bounce
- spring
- mass-spring-damper
- inertia
- momentum
- deceleration
- acceleration
- anticipation
- follow-through
- settle / settling
- velocity continuity
- acceleration continuity
- temporal staggering
- delay
- hold
- pause
- time remapping
- procedural timing

### Spatial motion
- slide
- push
- pull
- wipe
- reveal
- mask reveal
- clip-path reveal
- crop reveal
- scale-in
- scale-out
- pop
- overscale
- settle-back
- rotate
- pivot
- tilt
- skew
- flip
- orbit
- dolly
- parallax
- camera push
- camera pull
- arc motion
- motion path
- follow path
- path offset
- morph
- shape morph
- line draw / trim-path
- trail motion
- directional motion
- radial motion
- circular motion

### Typography / kinetic text
- kinetic typography
- text reveal
- character reveal
- word reveal
- line reveal
- tracking animation
- kerning animation
- scramble text
- character substitution
- odometer text
- number roll
- slot-machine number reveal
- flip-clock transition
- split text
- masked text
- counter animation
- digit-by-digit transition
- variable font animation
- text morphing
- type-on / type-off

### Visual effects
- glow
- bloom
- light sweep
- specular sweep
- gradient sweep
- rim light
- drop shadow
- soft shadow
- inner shadow
- blur
- directional blur
- motion blur
- gaussian blur
- displacement
- turbulence
- noise
- chromatic aberration
- scanlines
- film grain
- vignette
- lens flare
- flare streak
- refraction
- reflection
- glass
- acrylic
- frosted glass
- holographic effect
- scan reveal
- digital glitch
- RGB split
- distortion
- shockwave
- radial burst
- flash
- impact ring
- energy streak
- particle burst
- sparks
- dust
- smoke-like procedural particles
- confetti

### Procedural / generative motion
- procedural animation
- seeded randomness
- noise-driven motion
- shader-driven animation
- particle systems
- instancing
- cloners / replicators
- effectors / fields
- procedural gradients
- procedural shapes
- procedural patterns
- procedural typography
- audio-reactive animation
- data-reactive animation
- physics-driven animation
- collision-driven animation
- parameterized animation
- generative transitions

### 3D motion / rendering
- 3D transforms
- extruded text
- bevel
- 3D typography
- PBR materials
- metallic material
- glossy material
- roughness
- fresnel
- environment reflections
- reflection mapping
- refraction
- depth layers
- perspective camera
- orthographic camera
- camera parallax
- camera orbit
- camera dolly
- depth of field
- volumetric light
- fog
- emissive materials
- post-processing
- bloom
- tone mapping
- HDR
- GPU instancing
- shader effects
- custom vertex shaders
- custom fragment shaders

## 4. Broadcast-specific graphic components

Treat these as first-class templates/components:

### General broadcast
- Lower Third
- Name Strap
- Over-the-Shoulder (OTS)
- Fullscreen Graphic
- Side Panel
- Information Panel
- Bug / Watermark
- Sponsor Bug
- Ticker / Crawl
- Scrolling Crawl
- Callout
- Annotation
- Location Strap
- Quote Card
- Headline Card
- Breaking/Alert Graphic
- Segment Intro
- Segment Outro
- Bumper
- Stinger
- Transition
- Wipe Transition
- DVE-style Transition
- Sponsor Sting
- Station/Show ID

### Competition / game-show graphics
- Contestant Card
- Player Card
- Team Card
- Matchup / Head-to-Head
- Question Reveal
- Answer Reveal
- Correct Answer Reveal
- Wrong Answer Reveal
- Locked-In State
- Countdown
- Buzzer / Timer
- Score Change
- Score Increment
- Score Decrement
- Streak
- Multiplier
- Progress Meter
- Round Indicator
- Stage Indicator
- Jackpot Meter
- Bonus Meter
- Lifeline
- Audience Poll
- Elimination Graphic
- Danger/Safe State
- Finalist Reveal
- Top-N Reveal
- Ranking Change
- Winner Reveal
- Runner-Up Reveal
- Podium
- Confetti Celebration
- Celebration Fullscreen
- Dramatic Suspense Reveal

### Sports / esports graphics
- Scorebug
- Game Clock
- Period/Quarter Indicator
- Team Score
- Player Lower Third
- Player Intro
- Starting Lineup
- Roster
- Head-to-Head
- Matchup
- Standings
- Leaderboard
- Rank Change
- Position Change
- Stat Comparison
- Live Stats
- Player Stats
- Team Stats
- Goal/Point Splash
- Replay Bug
- Replay Transition
- Three Stars / Top Players
- Period Summary
- Match Summary
- Next Event
- Coming Up
- Power-Play / Advantage Timer
- Penalty Box
- Shot Counter
- Race Order
- Lap Counter
- Sector/Lap Time
- Telemetry
- Map/Track Overlay
- Ticker
- Sponsor Integration

## 5. Broadcast behaviors that must exist

Implement proper stateful broadcast behavior:

- idle
- pre-roll
- entering
- visible/live
- updating
- emphasis
- alert
- transitioning
- exiting
- hidden

A live data update must not replay the entire entrance animation unless explicitly requested.

Examples:
- Score changes should animate only the changed score.
- Rank changes should animate the moved item.
- Timer changes should not rebuild the whole scene.
- Player data can update while the graphic remains on-air.
- A new state should interrupt/queue animations gracefully.
- Entrance and exit choreography must be deterministic.
- Animation cancellation must be safe.
- Re-triggering must not create duplicate timelines/listeners.
- Rapid events must be coalesced where appropriate.

## 6. Motion-design quality rules

The visual language must feel broadcast-professional:

- purposeful anticipation
- strong but controlled acceleration
- velocity continuity
- overshoot used intentionally
- subtle settling
- consistent timing hierarchy
- hierarchy between primary and secondary elements
- coordinated group choreography
- staggered reveals
- depth/parallax where justified
- micro-motion instead of constant movement
- visual rhythm
- clear visual focal point
- restrained glow
- restrained blur
- restrained particles
- no random "template-looking" effects
- no excessive bouncing
- no arbitrary animation per component
- no cheap generic fade-only transitions

Create a centralized Motion Design Token System:
- duration tokens
- easing tokens
- spring tokens
- stagger tokens
- blur tokens
- elevation/shadow tokens
- opacity tokens
- scale tokens
- emphasis tokens

Do not hardcode these values independently inside each component.

## 7. Performance requirements

Primary target: smooth real-time playback.

- Target 60 FPS where the platform permits.
- Have graceful degradation to 30 FPS.
- Avoid unnecessary React/UI re-renders.
- Prefer transform/opacity for DOM motion.
- Use GPU rendering for large numbers of 2D objects.
- Use instancing where appropriate in 3D.
- Avoid creating/destroying large numbers of objects every frame.
- Reuse buffers/textures/geometry.
- Use object pooling for particles.
- Use OffscreenCanvas where beneficial.
- Use Web Workers for non-render-critical computation.
- Keep rendering and data processing separated.
- Avoid layout thrashing.
- Avoid forced synchronous DOM measurement every frame.
- Measure actual frame time and expose diagnostics.
- Provide a performance/debug overlay.
- Add reduced-motion accessibility support without breaking the broadcast mode.

## 8. Renderer strategy

Use the lightest renderer appropriate to the graphic.

DOM/SVG/CSS:
- lower thirds
- text-heavy graphics
- basic panels
- responsive UI-like graphics

PixiJS:
- particle-heavy 2D
- many sprites
- filters
- GPU-accelerated 2D
- dynamic scoreboards
- complex 2D transitions

Three.js:
- real 3D scenes
- 3D typography
- camera movement
- materials
- particles in 3D
- procedural geometry
- shaders

Rive:
- interactive vector motion
- state-machine-driven assets
- reusable animated UI/graphic assets

Lottie/dotLottie:
- designer-authored vector animation playback
- reusable 2D animation assets

ThorVG:
- lightweight/native/WASM vector rendering and Lottie/SVG workloads where appropriate.

Do not force every graphic into Three.js.

## 9. Broadcast control architecture

Implement concepts inspired by professional broadcast systems:

- Preview vs Live
- Rundown
- Graphic Templates
- Graphic Instances
- Data Schema
- Scene States
- Transition Logic
- Remote Control
- Live Data Binding
- Trigger Actions
- Cue/Take
- Animation Cue
- Priority
- Interrupt
- Queue
- Rollback
- Versioned templates
- Safe-area configuration
- Output resolution
- Frame-rate configuration

Expose a clean API such as:

showGraphic(id, data)
updateGraphic(id, data)
hideGraphic(id)
takeLive(id)
previewGraphic(id, data)
interruptGraphic(id)
queueGraphic(id, data)
setGraphicState(id, state)
trigger(id, action)

## 10. Data-driven template model

Use typed schemas.

Example conceptual model:

GraphicTemplate {
  id,
  version,
  category,
  renderer,
  safeArea,
  dataSchema,
  assets,
  states,
  transitions,
  motionTokens,
  accessibility,
  performanceProfile
}

GraphicInstance {
  templateId,
  instanceId,
  data,
  state,
  priority,
  createdAt,
  currentTransition
}

The data layer must be independent from the rendering layer.

## 11. Animation engine requirements

Create a reusable animation API rather than scattered animations.

Minimum capabilities:

animate(property, from, to, timing)
timeline()
sequence()
parallel()
stagger()
spring()
physics()
motionPath()
morph()
counter()
scrambleText()
splitText()
reveal()
maskReveal()
wipe()
pop()
settle()
shake()
impact()
burst()
particleBurst()

Timelines must support:
- play
- pause
- resume
- reverse
- seek
- progress
- cancel
- kill
- restart
- timeScale
- callbacks
- labels
- nesting
- sequencing
- interruption
- state-aware transitions

## 12. Required animation presets

Create reusable professional presets:

- Broadcast Slide In
- Broadcast Slide Out
- Lower Third Build-On
- Lower Third Build-Off
- OTS Reveal
- Scorebug Build
- Score Increment
- Score Decrement
- Number Roll
- Number Pop
- Rank Up
- Rank Down
- Leaderboard Reorder
- Player Card Reveal
- Team Card Reveal
- Matchup Reveal
- Winner Reveal
- Podium Reveal
- Goal/Point Splash
- Countdown Start
- Countdown Tick
- Alert Pulse
- Sponsor Sting
- Ticker Start
- Ticker Stop
- Stinger Transition
- Fullscreen Takeover
- Fullscreen Exit
- Impact Burst
- Confetti Celebration
- Suspense Reveal
- Dramatic Number Reveal
- 3D Hero Reveal
- Camera Push
- Camera Pull
- Parallax Reveal
- Light Sweep
- Glass Reveal
- Glitch Reveal
- Particle Burst

## 13. Library/repository research policy

Before adding a dependency, inspect:
1. repository activity
2. release status
3. current documentation
4. license
5. transitive dependencies
6. whether demo assets are separately licensed
7. whether fonts/models/textures are separately licensed
8. whether the library is actually suitable for redistribution in a commercial product

Do not equate GitHub stars with legal permission or technical suitability.

Prefer MIT/BSD/Apache-compatible dependencies when they satisfy the requirement.

Important:
- NodeCG: MIT; broadcast graphics framework/control architecture.
- OGraf repository: MIT; EBU open specification for HTML-based live-TV/post-production graphics. OGraf v1 Graphics spec was published 2025-09-17 and Server API spec 2026-08-13; the project states v1 is stable and production ready.
- SPX-GC: MIT; broadcast graphics control for live productions using HTML graphics and integrations such as CasparCG/OBS/vMix.
- TiXL: MIT; open-source real-time motion graphics/procedural toolkit; useful as a reference for real-time procedural techniques.
- ThorVG: MIT; production-ready C++ vector graphics engine with SVG/Lottie, masks, compositing, effects and hierarchical scene management.
- Three.js: MIT; 3D WebGL/WebGPU ecosystem.
- PixiJS: MIT; GPU-oriented 2D renderer with WebGL/WebGPU support.
- Lottie Web: MIT; runtime for After Effects-exported Lottie animations.
- dotLottie Web: MIT; modern Lottie runtime with state machines, events and modern rendering paths.
- Rive runtimes: MIT; interactive vector runtime/state machines.
- Motion: MIT; modern animation/spring system for React/JavaScript.
- mo.js: MIT; motion graphics toolbelt for web.

CasparCG:
- Professional broadcast playout/graphics software.
- Licensed GPLv3 or later.
- Treat it as an external integration/renderer option unless the product's license architecture explicitly permits the required use.

GSAP:
- It is free for commercial use under the current Standard "No Charge" GSAP License, including plugins formerly restricted.
- Do NOT describe GSAP as MIT/open-source.
- The current license explicitly defines a prohibited-use category involving tools that allow users to build visual animations without code in a way that competes with Webflow's visual animation-building capabilities.
- If this product itself is a visual animation builder/editor, flag GSAP for legal review before making it foundational.
- AI-generated GSAP code is explicitly permitted by the current FAQ, but that does not remove the product-use restrictions.

## 14. High-end references versus runtime dependencies

Use these as reference architectures/style targets, not automatically as embedded dependencies:

- Unreal Engine Motion Design / Sports Broadcast Motion Design
- Unreal broadcast samples with Rundown, Transition Logic, Cloners/Effectors, Remote Control, Material Designer and data tables
- Vizrt/Viz Artist real-time 2D/3D/AR broadcast graphics
- Professional sports broadcast graphics systems
- Professional game-show broadcast graphics systems

Do not copy proprietary design assets, templates, logos, fonts, models or source code merely because they are visible in a reference.

## 15. Engineering anti-patterns

Do NOT:
- implement everything with generic CSS transitions
- animate by setting hundreds of independent React states every frame
- put timing constants inside every component
- replay full entrance animations for every data update
- make every graphic a 3D scene
- add glow/bounce/blur just to make it "look professional"
- use random animation styles across the product
- depend on undocumented private APIs
- copy code from a repository without verifying its license
- copy demo assets without verifying asset rights
- introduce a GPL dependency into proprietary core code without reviewing the implications
- use heavy rendering where a lighter renderer is sufficient
- ignore frame-time profiling

## 16. Required visual output

The final implementation must be capable of producing:

1. Clean modern lower thirds
2. Premium scorebug
3. Animated leaderboard
4. Rank-change animation
5. Player/contestant card
6. Head-to-head/matchup graphic
7. Countdown
8. Dynamic number reveal
9. Progress/rank meter
10. Fullscreen winner reveal
11. Celebration/particle burst
12. Professional stinger transition
13. Sponsor integration
14. Ticker
15. 2D GPU graphic
16. 3D hero graphic
17. Live-data update without visual reset

## 17. Acceptance criteria

Before considering the implementation complete:

- Every animation is reusable.
- Every graphic is state-driven.
- Data updates are independent of visual components.
- Preview and Live are separated.
- Animations can be interrupted safely.
- No duplicate animation timelines accumulate.
- Performance instrumentation exists.
- 60 FPS is the default target where feasible.
- Renderer choice is explicit.
- Motion tokens are centralized.
- The system can add new graphic templates without rewriting the animation engine.
- A new graphic can be driven by live JSON/event data.
- Templates can support different themes/brands without rewriting motion logic.
- All third-party dependencies and licenses are documented.
- Demo assets are not silently treated as open-source code.
- The system remains maintainable by future AI coding agents.

## 18. AI coding workflow

Before writing a large amount of code:
1. Inspect the existing project architecture.
2. Identify the current rendering stack.
3. Identify whether the app is React/web/native/desktop.
4. Reuse existing dependencies when appropriate.
5. Propose the smallest architecture that supports the required broadcast features.
6. Search current official documentation and current repositories when a dependency/version is uncertain.
7. Prefer maintained repositories.
8. Verify the actual license from the repository/license page.
9. Implement incrementally.
10. Test every animation in real time.
11. Profile frame time.
12. Do not rewrite unrelated parts of the application.

When choosing between libraries, decide by capability and licensing, not GitHub star count alone.

## 19. Final instruction to the coding AI

Do not give me generic animation examples.

Implement a coherent PROFESSIONAL REAL-TIME DATA-DRIVEN BROADCAST MOTION GRAPHICS SYSTEM.

The goal is to reproduce the structural and motion principles used in high-end TV competition, sports and esports broadcast graphics:
- strong timing
- choreography
- hierarchy
- live data binding
- state machines
- reusable templates
- preview/live control
- professional transitions
- 2D GPU graphics
- 3D graphics where justified
- procedural effects
- deterministic timing
- performance instrumentation

First inspect the current codebase and adapt this specification to the existing stack. Then implement the system in modular phases without destroying working functionality.
