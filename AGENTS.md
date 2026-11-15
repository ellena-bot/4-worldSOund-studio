<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Audio lives in `src/audio/` (engine, mix math, layer-kind and world-profile registries). Worlds attach sound by calling `registerWorldAudio` from their own `worlds/<id>/audio.ts`; new sound types use `registerLayerKind`. Why: audio extends without editing world core or engine.
- Game runtime lives in `src/game/` — `sim/` holds pure movement rules (tested, no React/three imports), `scene/` the R3F components, `ui/` the HUD/overlays; world content is `src/worlds/<id>/scene.tsx` registered in `src/worlds/scenes.tsx`. Why: the runtime stays separate from the app UI and new worlds plug in without touching core code.
- First-person controller is a Rapier dynamic capsule driven by `src/game/sim/movement.ts`; yaw convention: forward at yaw 0 is -Z, forward = (-sin yaw, -cos yaw), right = (cos yaw, -sin yaw). Why: one written convention prevents inverted-controls regressions.
- Touch input lives in `src/game/touch.ts` as mutable module state written by `ui/TouchControls.tsx` and consumed by `Player.tsx` each frame; touch devices have no pointer lock, so `locked` in the game store is the source of truth for "player is in control" (never `document.pointerLockElement`). Why: touch-frequency updates must not re-render, and pointer lock is desktop-only.
- Each world owns its weather/particles (e.g. Snowfall, Rain) inside its own scene, not in GameRuntime. Why: worlds must not inherit each other's atmosphere.
- World scripts show story/feedback via `useGameStore.showNotice(title, body)`, rendered by the shared HUD. Why: one minimal notification surface for all worlds.
- Environmental stories live in each world's `story.tsx`; shared Inspectable records clues through StoryWorldContext and StoryZone handles localized discoveries/audio. The session-only journal store stays independent of runtime reset. Why: content expands without editing player or audio core, and discoveries survive world changes.
- E-key interactions use the module-level registry in `src/game/interact.ts`: reusable components (Door, Terminal, ControlPanel, LightSwitch, Inspectable) in `src/game/scene/interactables.tsx` self-register via `useInteractable`; `InteractionSystem` scans the registry each frame and publishes `activeId`/`prompt` to the store. Why: worlds add interactions without touching the player controller or the system.
- In dev, `window.__game` (set by `src/game/scene/Player.tsx`) exposes `teleport(x,y,z)`, `look(yaw,pitch)`, `position()`, `flags()` and `discoveries()` for scripted browser checks. Why: deterministic end-to-end verification without replaying input.
- SUBCONSCIOUS owns its layout/reaction rules, architecture, storytelling, and echo layer in `src/worlds/subconscious/`; walkable surfaces keep shared gravity, while impossible geometry is decorative and a shallow basin catches falls. Why: surreal exploration must not replace or destabilize the shared controller.
- ABYSS owns facility layout, boundary colliders, marine animation, encounter rules and audio in `src/worlds/abyss/`; its arrival contains the shared spawn and enclosure geometry follows `FACILITY`. Why: underwater content remains isolated without modifying shared movement or other worlds.
- ABYSS dev checks use `window.__abyss.encounter(seconds)`, `whale()` and `audio()` alongside `window.__game`. Why: rare encounters can be verified deterministically without waiting through slow software rendering.
- Portals are data in `src/game/portals.ts` (unique id, host world, destination, spawn, optional `requiresFlag`); worlds render them with `<PortalGate def>` from their story.tsx, and the fade transition lives in GameRuntime via the game store's `transition` state. Why: adding a portal never touches the runtime, router, or other worlds.
- Progression lives in `src/game/progress.ts` (zustand + pure reducers) over the adapter in `src/game/persistence.ts` (localStorage today); `useJournal` mirrors persisted discoveries, and menu completion % comes from `REGISTERED_DISCOVERIES` + portal counts, never invented numbers. Why: a cloud adapter can replace localStorage without touching gameplay code, and progress UI can never lie.
