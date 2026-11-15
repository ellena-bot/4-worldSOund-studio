// Web Audio runtime. Graph:
//   layer → bus(world-scoped gain) → master → destination
//   emitter layer → panner → spatial bus
import "./layers";
import { getLayerFactory, getWorldAudio } from "./registry";
import { effectiveGain } from "./mix";
import { BUSES, type BusId, type EmitterSpec, type LayerInstance, type LayerSpec, type MixState, type Vec3, type WorldAudioProfile } from "./types";

interface ActiveWorld {
  profile: WorldAudioProfile;
  buses: Record<BusId, GainNode>;
  layers: LayerInstance[];
  emitters: Map<string, { panner: PannerNode; layer: LayerInstance }>;
}

export class AudioEngine {
  readonly ctx: AudioContext;
  private master: GainNode;
  private world: ActiveWorld | null = null;
  private mix: MixState;

  constructor(mix: MixState) {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.mix = mix;
  }

  resume() { return this.ctx.resume(); }

  async loadWorld(worldId: string) {
    const profile = getWorldAudio(worldId);
    if (!profile) throw new Error(`No audio profile registered for world "${worldId}"`);
    await this.unloadWorld();
    const fade = profile.fadeSeconds ?? 2;
    const now = this.ctx.currentTime;
    const buses = {} as Record<BusId, GainNode>;
    for (const b of BUSES) {
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(effectiveGain(this.mix, b, worldId, profile), now + fade);
      g.connect(this.master);
      buses[b] = g;
    }
    const w: ActiveWorld = { profile, buses, layers: [], emitters: new Map() };
    this.world = w;
    const add = async (spec: LayerSpec, bus: BusId) => {
      const l = await this.makeLayer(spec);
      if (this.world !== w) return l.stop(0);
      l.output.connect(buses[bus]);
      l.start(this.ctx.currentTime);
      w.layers.push(l);
    };
    await Promise.all([
      ...profile.music.map((s) => add(s, "music")),
      ...profile.ambient.map((s) => add(s, "ambient")),
      ...profile.emitters.map((e) => this.addEmitter(e)),
    ]);
  }

  async unloadWorld() {
    const w = this.world;
    if (!w) return;
    this.world = null;
    const fade = w.profile.fadeSeconds ?? 2;
    const t = this.ctx.currentTime;
    for (const g of Object.values(w.buses)) {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + fade);
    }
    [...w.layers, ...[...w.emitters.values()].map((e) => e.layer)].forEach((l) => l.stop(t + fade + 0.05));
    setTimeout(() => Object.values(w.buses).forEach((g) => g.disconnect()), (fade + 0.2) * 1000);
  }

  /** Runtime emitters, e.g. a drone that spawns. Works for profile emitters too. */
  async addEmitter(e: EmitterSpec) {
    const w = this.world;
    if (!w) return;
    const p = this.ctx.createPanner();
    p.panningModel = "HRTF";
    p.distanceModel = "inverse";
    p.refDistance = e.refDistance ?? 2;
    p.maxDistance = e.maxDistance ?? 60;
    p.rolloffFactor = e.rolloff ?? 1;
    this.place(p, e.position);
    const layer = await this.makeLayer(e.layer);
    if (this.world !== w) return layer.stop(0);
    layer.output.connect(p).connect(w.buses.spatial);
    layer.start(this.ctx.currentTime);
    w.emitters.set(e.id, { panner: p, layer });
  }
  moveEmitter(id: string, pos: Vec3) {
    const e = this.world?.emitters.get(id);
    if (e) this.place(e.panner, pos);
  }
  removeEmitter(id: string) {
    const e = this.world?.emitters.get(id);
    if (!e) return;
    e.layer.stop(this.ctx.currentTime);
    e.panner.disconnect();
    this.world!.emitters.delete(id);
  }

  /** Call from the game's single stepper with the camera pose. */
  setListener(pos: Vec3, forward: Vec3, up: Vec3 = [0, 1, 0]) {
    const l = this.ctx.listener;
    const t = this.ctx.currentTime;
    if (l.positionX) {
      l.positionX.setTargetAtTime(pos[0], t, 0.02); l.positionY.setTargetAtTime(pos[1], t, 0.02); l.positionZ.setTargetAtTime(pos[2], t, 0.02);
      l.forwardX.setTargetAtTime(forward[0], t, 0.02); l.forwardY.setTargetAtTime(forward[1], t, 0.02); l.forwardZ.setTargetAtTime(forward[2], t, 0.02);
      l.upX.value = up[0]; l.upY.value = up[1]; l.upZ.value = up[2];
    } else {
      l.setPosition(...pos); l.setOrientation(...forward, ...up);
    }
  }

  /** Apply a new mix (from UI); ramps every bus smoothly. */
  applyMix(mix: MixState) {
    this.mix = mix;
    const w = this.world;
    if (!w) return;
    const t = this.ctx.currentTime;
    for (const b of BUSES) w.buses[b].gain.setTargetAtTime(effectiveGain(mix, b, w.profile.worldId, w.profile), t, 0.05);
  }

  /** One-shot SFX on the sfx bus, optionally positioned. */
  async playOneShot(spec: LayerSpec, at?: Vec3, seconds = 1) {
    const w = this.world;
    if (!w) return;
    const l = await this.makeLayer(spec);
    let out: AudioNode = l.output;
    if (at) { const p = this.ctx.createPanner(); p.panningModel = "HRTF"; this.place(p, at); out = out.connect(p); }
    out.connect(w.buses.sfx);
    const t = this.ctx.currentTime;
    l.start(t); l.stop(t + seconds);
  }

  async dispose() { await this.unloadWorld(); await this.ctx.close(); }

  private makeLayer(spec: LayerSpec) {
    const f = getLayerFactory(spec.kind);
    if (!f) throw new Error(`Unknown audio layer kind "${spec.kind}"`);
    return Promise.resolve(f(this.ctx, spec));
  }
  private place(p: PannerNode, [x, y, z]: Vec3) {
    if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; }
    else p.setPosition(x, y, z);
  }
}
