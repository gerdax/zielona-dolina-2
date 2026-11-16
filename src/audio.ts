import type { World } from "./simulation";
export class ValleyAudio {
  enabled = true;
  private ctx: AudioContext | undefined;
  private siegePlayed = new Map<string, number>();
  private siegeClock = -1;
  private boltClock = -1;
  private boltVoices = 0;
  private bolts = new Map<
    string,
    {
      time: number;
      shot: boolean;
      impact: boolean;
      x: number;
      z: number;
      hitX: number;
      hitZ: number;
    }
  >();
  private noise: AudioBuffer | undefined;
  private structureVoices = 0;
  private wagons = new Map<
    string,
    { x: number; z: number; time: number; distance: number; creak: number }
  >();
  updateWagons(
    w: Pick<World, "time" | "entities">,
    camera: { x: number; z: number; zoom: number },
  ) {
    for (const id of this.wagons.keys())
      if (!w.entities[id]) this.wagons.delete(id);
    let voices = 0;
    for (const e of Object.values(w.entities)) {
      if (e.kind !== "merchant" && e.kind !== "caravan") continue;
      const old = this.wagons.get(e.id);
      const state = {
        x: e.x,
        z: e.z,
        time: w.time,
        distance: old?.distance ?? 0,
        creak: old?.creak ?? w.time,
      };
      this.wagons.set(e.id, state);
      if (!old) continue;
      const dt = w.time - old.time,
        distance = Math.hypot(e.x - old.x, e.z - old.z);
      const range = Math.max(10, camera.zoom * 1.3),
        away = Math.hypot(e.x - camera.x, e.z - camera.z);
      if (
        dt <= 0 ||
        dt > 0.5 ||
        distance < 0.00001 ||
        distance > 2 ||
        away >= range ||
        !this.enabled ||
        (typeof document !== "undefined" && document.hidden)
      ) {
        state.distance = 0;
        state.creak = w.time;
        continue;
      }
      state.distance += distance;
      if (state.distance < 0.35) continue;
      state.distance %= 0.35;
      const creak = w.time - state.creak >= 1.3;
      if (creak) state.creak = w.time;
      if (voices++ >= 3) continue;
      this.wagon(
        0.45 * (1 - away / range),
        Math.max(-0.75, Math.min(0.75, (e.x - camera.x) / range)),
        creak,
      );
    }
  }
  wagon(volume: number, pan: number, creak: boolean) {
    if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
    const c = this.ctx,
      t = c.currentTime,
      out = c.createGain(),
      stereo = c.createStereoPanner();
    out.gain.value = volume * 0.16;
    stereo.pan.value = pan;
    out.connect(stereo);
    stereo.connect(c.destination);
    const duration = creak ? 0.22 : 0.09;
    let remaining = creak ? 3 : 2;
    for (let i = 0; i < (creak ? 3 : 2); i++) {
      const o = c.createOscillator(),
        gain = c.createGain(),
        at = t + (i === 1 ? 0.045 : 0);
      o.type = i === 2 ? "triangle" : "sine";
      o.frequency.setValueAtTime(i === 2 ? 480 : 210 - i * 40, at);
      o.frequency.exponentialRampToValueAtTime(
        i === 2 ? 220 : 65,
        at + (i === 2 ? 0.2 : 0.065),
      );
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(i === 2 ? 0.18 : 0.85, at + 0.004);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        at + (i === 2 ? 0.21 : 0.075),
      );
      o.connect(gain);
      gain.connect(out);
      o.start(at);
      o.stop(t + duration + 0.04);
      o.onended = () => {
        o.disconnect();
        gain.disconnect();
        if (--remaining === 0) {
          out.disconnect();
          stereo.disconnect();
        }
      };
    }
  }
  resetSiege() {
    this.siegePlayed.clear();
    this.siegeClock = -1;
    this.wagons.clear();
    this.bolts.clear();
    this.boltClock = -1;
  }
  updateSiege(
    w: Pick<World, "time" | "entities">,
    camera: { x: number; z: number; zoom: number },
  ) {
    this.updateBallista(w, camera);
    if (w.time < this.siegeClock) this.siegePlayed.clear();
    this.siegeClock = w.time;
    for (const id of this.siegePlayed.keys())
      if (!w.entities[id]) this.siegePlayed.delete(id);
    let voices = 0;
    for (const e of Object.values(w.entities)) {
      if (!["catapult", "ram"].includes(e.type) || !e.lastAttack) continue;
      const a = e.lastAttack,
        age = w.time - a.time,
        phase = e.type === "ram" ? 0.3 : 0.18;
      if (age < phase || this.siegePlayed.get(e.id) === a.time) continue;
      this.siegePlayed.set(e.id, a.time);
      const distance = Math.hypot(e.x - camera.x, e.z - camera.z),
        range = Math.max(10, camera.zoom * 1.3);
      if (
        age > phase + 0.35 ||
        distance > range ||
        !this.enabled ||
        (typeof document !== "undefined" && document.hidden) ||
        voices >= 6
      )
        continue;
      voices++;
      this.siege(
        e.type as "catapult" | "ram",
        0.65 * (1 - distance / range),
        Math.max(-0.75, Math.min(0.75, (e.x - camera.x) / range)),
      );
    }
  }
  updateBallista(
    w: Pick<World, "time" | "entities">,
    camera: { x: number; z: number; zoom: number },
  ) {
    if (w.time < this.boltClock) this.bolts.clear();
    this.boltClock = w.time;
    for (const e of Object.values(w.entities)) {
      const a = e.lastAttack;
      if (e.type !== "ballistaTower" || !a) continue;
      if (this.bolts.get(e.id)?.time === a.time || w.time - a.time > 1)
        continue;
      this.bolts.set(e.id, {
        time: a.time,
        shot: false,
        impact: false,
        x: e.x,
        z: e.z,
        hitX: a.x,
        hitZ: a.z,
      });
    }
    let voices = 0;
    for (const [id, b] of this.bolts) {
      const age = w.time - b.time;
      for (const [kind, phase] of [
        ["shot", 0],
        ["impact", 0.45],
      ] as const) {
        if (b[kind] || age < phase) continue;
        b[kind] = true;
        const x = kind === "shot" ? b.x : b.hitX,
          z = kind === "shot" ? b.z : b.hitZ;
        const range = Math.max(10, camera.zoom * 1.3),
          distance = Math.hypot(x - camera.x, z - camera.z);
        if (
          age - phase > 0.2 ||
          distance >= range ||
          !this.enabled ||
          (typeof document !== "undefined" && document.hidden) ||
          voices >= 6
        )
          continue;
        voices++;
        this.ballista(
          kind,
          0.65 * (1 - distance / range),
          Math.max(-0.75, Math.min(0.75, (x - camera.x) / range)),
        );
      }
      if (age > 1) this.bolts.delete(id);
    }
  }
  ballista(kind: "shot" | "impact", volume = 0.6, pan = 0) {
    if (
      !this.enabled ||
      !this.ctx ||
      this.ctx.state !== "running" ||
      this.boltVoices >= 10
    )
      return;
    this.boltVoices++;
    const c = this.ctx,
      t = c.currentTime,
      duration = kind === "shot" ? 0.24 : 0.17;
    const out = c.createGain(),
      stereo = c.createStereoPanner(),
      osc = c.createOscillator(),
      body = c.createGain();
    out.gain.value = Math.max(0, Math.min(1, volume)) * 0.17;
    stereo.pan.value = pan;
    out.connect(stereo);
    stereo.connect(c.destination);
    osc.type = kind === "shot" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(kind === "shot" ? 280 : 145, t);
    osc.frequency.exponentialRampToValueAtTime(
      kind === "shot" ? 65 : 48,
      t + duration,
    );
    body.gain.setValueAtTime(0.0001, t);
    body.gain.exponentialRampToValueAtTime(
      kind === "shot" ? 0.55 : 0.8,
      t + 0.004,
    );
    body.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(body);
    body.connect(out);
    osc.start(t);
    osc.stop(t + duration);
    this.noise ??= c.createBuffer(
      1,
      Math.ceil(c.sampleRate * 0.55),
      c.sampleRate,
    );
    if (!this.noiseFilled) {
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseFilled = true;
    }
    const noise = c.createBufferSource(),
      filter = c.createBiquadFilter(),
      gain = c.createGain();
    noise.buffer = this.noise;
    filter.type = kind === "shot" ? "bandpass" : "lowpass";
    filter.frequency.setValueAtTime(kind === "shot" ? 2100 : 1700, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + duration);
    filter.Q.value = kind === "shot" ? 2 : 0.7;
    gain.gain.setValueAtTime(kind === "shot" ? 0.7 : 0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    noise.start(t);
    noise.stop(t + duration);
    noise.onended = () => {
      noise.disconnect();
      filter.disconnect();
      gain.disconnect();
      osc.disconnect();
      body.disconnect();
      out.disconnect();
      stereo.disconnect();
      this.boltVoices--;
    };
  }
  fortification(
    kind: "crack" | "collapse",
    wood: boolean,
    position: { x: number; z: number },
    camera: { x: number; z: number; zoom: number },
  ) {
    if (
      !this.enabled ||
      !this.ctx ||
      this.ctx.state !== "running" ||
      (typeof document !== "undefined" && document.hidden)
    )
      return;
    const c = this.ctx,
      range = Math.max(10, camera.zoom * 1.3),
      distance = Math.hypot(position.x - camera.x, position.z - camera.z);
    if (distance >= range || this.structureVoices >= 8) return;
    this.structureVoices++;
    const out = c.createGain(),
      pan = c.createStereoPanner(),
      now = c.currentTime;
    out.gain.value =
      (1 - distance / range) * (kind === "collapse" ? 0.18 : 0.1);
    pan.pan.value = Math.max(
      -0.75,
      Math.min(0.75, (position.x - camera.x) / range),
    );
    out.connect(pan);
    pan.connect(c.destination);
    this.noise ??= c.createBuffer(
      1,
      Math.ceil(c.sampleRate * 0.55),
      c.sampleRate,
    );
    if (!this.noiseFilled) {
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseFilled = true;
    }
    const count = kind === "collapse" ? 3 : 1;
    let remaining = count;
    for (let i = 0; i < count; i++) {
      const at = now + i * 0.13,
        duration = kind === "collapse" ? 0.5 : wood ? 0.17 : 0.23;
      const source = c.createBufferSource(),
        filter = c.createBiquadFilter(),
        gain = c.createGain();
      source.buffer = this.noise;
      source.playbackRate.value = wood ? 1.15 - i * 0.13 : 0.85 - i * 0.1;
      filter.type = kind === "collapse" ? "lowpass" : "bandpass";
      filter.frequency.setValueAtTime(
        kind === "collapse" ? (wood ? 1200 : 750) : wood ? 1900 : 2700,
        at,
      );
      filter.frequency.exponentialRampToValueAtTime(
        kind === "collapse" ? 100 : 450,
        at + duration,
      );
      filter.Q.value = wood ? 1.6 : 0.7;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.8 / (i + 1), at + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      source.start(at);
      source.stop(at + duration);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
        if (--remaining === 0) {
          this.structureVoices--;
          out.disconnect();
          pan.disconnect();
        }
      };
    }
  }
  siege(kind: "catapult" | "ram", volume = 0.6, pan = 0) {
    if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
    const c = this.ctx,
      t = c.currentTime,
      out = c.createGain(),
      stereo = c.createStereoPanner();
    out.gain.value = Math.max(0, Math.min(1, volume)) * 0.22;
    stereo.pan.value = pan;
    out.connect(stereo);
    stereo.connect(c.destination);
    const duration = kind === "ram" ? 0.32 : 0.5;
    const low = c.createOscillator(),
      body = c.createGain();
    low.type = kind === "ram" ? "sine" : "triangle";
    low.frequency.setValueAtTime(kind === "ram" ? 95 : 165, t);
    low.frequency.exponentialRampToValueAtTime(
      kind === "ram" ? 32 : 48,
      t + duration * 0.7,
    );
    body.gain.setValueAtTime(0.0001, t);
    body.gain.exponentialRampToValueAtTime(
      kind === "ram" ? 0.8 : 0.4,
      t + 0.008,
    );
    body.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    low.connect(body);
    body.connect(out);
    low.start(t);
    low.stop(t + duration);
    this.noise ??= c.createBuffer(
      1,
      Math.ceil(c.sampleRate * 0.55),
      c.sampleRate,
    );
    const samples = this.noise.getChannelData(0);
    if (!this.noiseFilled) {
      for (let i = 0; i < samples.length; i++)
        samples[i] = Math.random() * 2 - 1;
      this.noiseFilled = true;
    }
    const source = c.createBufferSource(),
      filter = c.createBiquadFilter(),
      envelope = c.createGain();
    source.buffer = this.noise;
    filter.type = kind === "ram" ? "lowpass" : "bandpass";
    filter.frequency.setValueAtTime(kind === "ram" ? 1100 : 1900, t);
    filter.frequency.exponentialRampToValueAtTime(
      kind === "ram" ? 140 : 300,
      t + duration,
    );
    filter.Q.value = kind === "ram" ? 0.6 : 1.5;
    envelope.gain.setValueAtTime(0.7, t);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(out);
    source.start(t);
    source.stop(t + duration);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
      low.disconnect();
      body.disconnect();
      out.disconnect();
      stereo.disconnect();
    };
  }
  private noiseFilled = false;
  unlock() {
    if (!this.enabled) return;
    this.ctx ??= new AudioContext();
    void this.ctx.resume();
  }
  tone(kind: "select" | "ok" | "error" | "alarm" = "select") {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = kind === "alarm" ? "triangle" : "sine";
    o.frequency.setValueAtTime(
      kind === "error"
        ? 160
        : kind === "alarm"
          ? 440
          : kind === "ok"
            ? 620
            : 410,
      c.currentTime,
    );
    o.frequency.exponentialRampToValueAtTime(
      kind === "error"
        ? 100
        : kind === "alarm"
          ? 660
          : kind === "ok"
            ? 820
            : 530,
      c.currentTime + 0.12,
    );
    g.gain.setValueAtTime(0.025, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.2);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.22);
  }
}
