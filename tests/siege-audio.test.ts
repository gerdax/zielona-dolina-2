import { describe, it, expect, vi } from "vitest";
import { ValleyAudio } from "../src/audio";
import { createWorld, getEntities } from "../src/simulation";
const camera = { x: 20, z: 20, zoom: 24 };
function scene(type = "catapult") {
  const w = createWorld(),
    e = getEntities(w).find((e) => e.kind === "soldier")!;
  w.entities = { [e.id]: e };
  e.type = type;
  e.x = 20;
  e.z = 20;
  e.lastAttack = { time: 10, targetId: "target", x: 20, z: 25 };
  w.time = 10;
  const a = new ValleyAudio(),
    play = vi.spyOn(a, "siege").mockImplementation(() => {});
  return { w, e, a, play };
}
describe("siege attack sound timing", () => {
  for (const [type, phase] of [
    ["catapult", 0.18],
    ["ram", 0.3],
  ] as const)
    it(`plays ${type} once at its animation cue`, () => {
      const { w, a, play, e } = scene(type);
      w.time = 10 + phase - 0.01;
      a.updateSiege(w, camera);
      expect(play).not.toHaveBeenCalled();
      w.time = 10 + phase + 0.001;
      a.updateSiege(w, camera);
      a.updateSiege(w, camera);
      expect(play).toHaveBeenCalledTimes(1);
      expect(play.mock.calls[0][0]).toBe(type);
      e.lastAttack!.time = 11;
      w.time = 11 + phase + 0.01;
      a.updateSiege(w, camera);
      expect(play).toHaveBeenCalledTimes(2);
    });
  it("does not queue muted, old or distant attacks for later playback", () => {
    for (const reason of ["muted", "old", "far"]) {
      const { w, a, e, play } = scene();
      w.time = reason === "old" ? 15 : 10.2;
      if (reason === "muted") a.enabled = false;
      if (reason === "far") e.x = 100;
      a.updateSiege(w, camera);
      expect(play).not.toHaveBeenCalled();
      a.enabled = true;
      e.x = 20;
      w.time = 15;
      a.updateSiege(w, camera);
      expect(play).not.toHaveBeenCalled();
    }
  });
  it("plays nothing without an attack and limits simultaneous sounds", () => {
    const { w, e, a, play } = scene();
    delete e.lastAttack;
    w.time = 10.2;
    a.updateSiege(w, camera);
    expect(play).not.toHaveBeenCalled();
    for (let i = 0; i < 10; i++)
      w.entities["engine" + i] = {
        ...e,
        id: "engine" + i,
        lastAttack: { time: 10, targetId: "t", x: 20, z: 25 },
      };
    a.updateSiege(w, camera);
    expect(play).toHaveBeenCalledTimes(6);
  });
});
