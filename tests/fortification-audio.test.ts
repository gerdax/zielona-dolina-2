import { describe, it, expect, vi } from "vitest";
import { ValleyAudio } from "../src/audio";
function setup() {
  const sources: {
      onended?: () => void;
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
    }[] = [],
    frequencies: number[] = [];
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn((v: number) => frequencies.push(v)),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const node = () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: param(),
    pan: param(),
    frequency: param(),
    Q: { value: 0 },
    playbackRate: { value: 1 },
    start: vi.fn(),
    stop: vi.fn(),
    onended: undefined as undefined | (() => void),
  });
  const c = {
    state: "running",
    sampleRate: 8000,
    currentTime: 10,
    destination: {},
    createGain: vi.fn(node),
    createStereoPanner: vi.fn(node),
    createBiquadFilter: vi.fn(node),
    createBufferSource: vi.fn(() => {
      const n = node();
      sources.push(n);
      return n;
    }),
    createBuffer: vi.fn(() => ({
      getChannelData: () => new Float32Array(4400),
    })),
  };
  const audio = new ValleyAudio();
  (audio as unknown as { ctx: AudioContext }).ctx =
    c as unknown as AudioContext;
  return { audio, c, sources, frequencies };
}
const camera = { x: 20, z: 20, zoom: 24 },
  at = { x: 20, z: 20 };
describe("fortification sound synthesis", () => {
  it("creates one crack transient and layered falling rubble", () => {
    const { audio, sources } = setup();
    audio.fortification("crack", false, at, camera);
    expect(sources).toHaveLength(1);
    expect(sources[0].start).toHaveBeenCalledWith(10);
    audio.fortification("collapse", false, at, camera);
    expect(sources).toHaveLength(4);
    expect(sources[3].start).toHaveBeenCalledWith(10.26);
    for (const source of sources) source.onended?.();
  });
  it("uses distinct filters for wooden and stone damage", () => {
    const wood = setup(),
      stone = setup();
    wood.audio.fortification("crack", true, at, camera);
    stone.audio.fortification("crack", false, at, camera);
    expect(wood.frequencies).toContain(1900);
    expect(stone.frequencies).toContain(2700);
  });
  it("respects mute, distance and active voice limits without queuing sounds", () => {
    const { audio, sources, c } = setup();
    audio.enabled = false;
    audio.fortification("collapse", false, at, camera);
    expect(sources).toHaveLength(0);
    audio.enabled = true;
    audio.fortification("collapse", false, { x: 200, z: 200 }, camera);
    expect(sources).toHaveLength(0);
    for (let i = 0; i < 12; i++)
      audio.fortification("collapse", true, at, camera);
    expect(sources).toHaveLength(24);
    for (const s of sources) s.onended?.();
    audio.fortification("crack", false, at, camera);
    expect(c.createBufferSource).toHaveBeenCalledTimes(25);
  });
});
