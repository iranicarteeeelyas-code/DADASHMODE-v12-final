# DADASHMODE · Broadcast Motion Graphics (BMG) — V8.0-f

Real-time, data-driven, template-driven broadcast graphics system built to the "Broadcast Motion Graphics Master Spec".

## Architecture (spec §2)
DATA/EVENTS (show engine V7, studio, rundown, JSON/remote) → BROADCAST EVENT BUS (`BMG.bus`, coalescing) → GRAPHIC STATE MACHINE
(`bmg-engine.js`) → TIMELINE / SEQUENCER (`bmg-core.js`) → ANIMATION PRIMITIVES + 40 PRESETS (`bmg-presets.js`) → RENDERER ADAPTERS
(Canvas2D `bmg-draw.js` · WebGL2 2D GPU `bmg-gpu.js` · three.js 3D `bmg-3d.js` · Lottie/Rive adapter slots) → COMPOSITOR (the recorded 1920×1080 stage canvas).

| file | role |
|---|---|
| js/bmg/bmg-core.js | motion design tokens, easing/spring/physics, PVW & PGM clocks, timeline engine, event bus, pools, perf monitor + 3-level degradation, reduced motion |
| js/bmg/bmg-draw.js | Canvas2D adapter: Persian kinetic typography (slice reveal, kashida), odometer/slot/flip numbers, panels, sweeps, glitch, safe areas, brands |
| js/bmg/bmg-gpu.js | WebGL2 instanced particles (confetti, sparks, coins…), energy field, wipes; Canvas2D fallback |
| js/bmg/bmg-presets.js | animation API (animate, timeline, sequence, parallel, stagger, spring, physics, motionPath, morph, counter, scramble, split, reveal, maskReveal, wipe, pop, settle, shake, impact, burst, particleBurst) + 40 presets of spec §12 |
| js/bmg/bmg-engine.js | versioned templates, typed schemas, instances, state machine, Preview/Program, slots, priority, queue, interrupt, rollback, rundown, bindings, JSON commands, perf overlay |
| js/bmg/bmg-templates.js | 20 Canvas/GPU templates (scorebug, lower third/OTS, player card, matchup, countdown, number reveal, progress/jackpot meter, leaderboard, winner reveal, celebration, stinger, ticker, bug, sponsor, alert, answer reveal, locked-in, point splash, segment intro, podium, GPU field) |
| js/bmg/bmg-3d.js | lazy three.js adapter + «3D Hero» (real extruded Persian text via marching squares, PBR, bloom, camera push/pull) |
| js/bmg/bmg-bridge.js | style switch classic ⇄ broadcast, V7 → graphics routing, live bindings, remote control, spec §4 catalogue |
| js/bmg/bmg-studio.js | «استودیو گرافیک پخش» tab: PVW/PGM monitors, data forms, controls, rundown, preset lab, tokens, diagnostics |

## States (spec §5)
idle → preroll → entering → live ⇄ updating / emphasis / alert → exiting → hidden (+ transitioning). Live updates never replay the entrance;
the template receives only the changed paths (e.g. `E.score`) and animates only them. One main timeline + fixed named tracks per instance.

## API (spec §9)
`BMG.engine.showGraphic(id,data,{template}) · updateGraphic · hideGraphic · takeLive · previewGraphic · interruptGraphic · queueGraphic · setGraphicState · trigger · rollback`
JSON: `BMG.engine.command({op:'show',id:'l3',template:'lowerThird',data:{title:'…'}})`, also via `postMessage({bmg:{…}})` or `BroadcastChannel('dadashmode-bmg')`.

## Adding a template
`BMG.registerTemplate({id,version,category,renderer,slot,layer,dataSchema,enter(tl,inst),exit(tl,inst),update(U,inst,changed,prev),draw(ctx,inst)})` —
build choreography only from `BMG.PRESETS` / tokens; no engine changes needed.

## Third-party dependencies and licences (spec §13, §17)
| dependency | version | licence | use |
|---|---|---|---|
| three.js (+ examples/jsm RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, BokehPass) | r185 | MIT | bundled as js/bmg/vendor/three-bmg.js (esbuild IIFE), lazy-loaded only for 3D |
| Fonts Vazirmatn, Estedad, Lalezar, Noto Kufi Arabic, Marhey | — | SIL OFL 1.1 | already shipped with the app |
No GPL code, no copied demo assets. Lottie / Rive are adapter slots only: their runtimes are NOT bundled (`BMG.registerRenderer`).
The older v5 3D bundle (js/p5-three.js) also contains three.js, so the browser prints "Multiple instances of Three.js" — harmless.

## Tests
`node tools/bmg-selftest.mjs` (39) · real-browser check with headless Chromium: all templates render, extruded 3D text works, no page errors.
