# Immersive Worlds — Roadmap

- [x] Modular audio architecture (engine, buses, world profiles, mixer)
- [x] App architecture: world registry, cinematic selection screen, game runtime shell
- [x] White Silence vertical slice: FPS camera + WASD, run/jump, gravity + collision, snowy night environment, snowfall, E-key interactable
- [x] Verified movement / camera / physics (11 unit tests + scripted browser run: enter, walk, interact)
- [x] World 01 The Revolution: city, drones + searchlights, checkpoint, HQ override, underground archive, rain, own soundscape
- [x] Player movement upgrade: smooth accel/decel, blended walk-sprint, air momentum (shared controller, both worlds)
- [x] Phase 2 interaction system: registry + reusable Door/Terminal/ControlPanel/LightSwitch/Inspectable; entrances+clues (White Silence), gate+terminals (Revolution) — 32 unit tests + scripted browser run of all 13 interactions
- [x] Phase 3: world-specific clues, proximity events, accessible caretaker room and resistance hideout, session journal (J), localized discovery audio — browser verified clues, door/ramp traversal, session retention and shutdown; automated tests
- [x] Phase 5 SUBCONSCIOUS: five connected zones, safe walkways/basin, reactive architecture, E-key memories and sanctuary, independent echo audio; 43 tests passed; desktop/phone render + motion checked; browser verified all zones, memories, doors, sanctuary traversal, fall/jump recovery, audio signal and existing-world entry. Real-device smoothness and listening remain unverified.
- [x] Phase 6 ABYSS: five connected enclosed zones, panoramic glass, procedural marine motion and rare whale encounter with recorded CC0 call, research clearance + emergency circuit + concealed archive, positional zone audio. 49 tests passed; browser verified menu entry, tunnel, research/specimen discoveries, whale, both door walk-throughs, hidden evidence/journal, glass collision and entry into the other three worlds. Desktop/phone scene render checked. Real-device sound and frame rate remain unverified; marine assets are procedural because CC0 model downloads were blocked.
- [x] Phase 7: hidden dimensional portals (one per world, E-activated, gated by discovery conditions), cinematic fade transitions with destination spawn, centralized progression (visited worlds, exploration time, unique discoveries, safe positions), localStorage persistence behind an adapter (cloud-migratable), journal with timestamps + locked entries, menu world-progress UI with real completion %, reset with confirmation. 64 tests passed.
- [ ] Auth + profiles (Lovable Cloud) — needed before real multiplayer and cloud save sync
- [ ] Multiplayer networking (Colyseus-ready net adapter) — after auth; never fake with static avatars
