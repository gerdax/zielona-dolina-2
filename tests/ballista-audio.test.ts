import { it, expect, vi } from "vitest";
import { ValleyAudio } from "../src/audio";
import { createWorld, getEntities } from "../src/simulation";
function scene() {
  const w = createWorld(),
    e = getEntities(w).find((e) => e.kind === "building")!;
  e.type = "ballistaTower";
  e.x = e.z = 20;
  e.lastAttack = { time: 10, targetId: "enemy", x: 25, z: 20 };
  w.entities = { [e.id]: e };
  w.time = 10;
  const a = new ValleyAudio(),
    play = vi.spyOn(a, "ballista").mockImplementation(() => {});
  return { w, e, a, play };
}
const camera = { x: 20, z: 20, zoom: 20 };
it("plays one launch and one impact at the bolt animation cues, even after tower destruction", () => {
  const { w, e, a, play } = scene();
  a.updateSiege(w, camera);
  a.updateSiege(w, camera);
  expect(play.mock.calls.map((c) => c[0])).toEqual(["shot"]);
  w.time = 10.44;
  a.updateSiege(w, camera);
  expect(play).toHaveBeenCalledTimes(1);
  delete w.entities[e.id];
  w.time = 10.451;
  a.updateSiege(w, camera);
  a.updateSiege(w, camera);
  expect(play.mock.calls.map((c) => c[0])).toEqual(["shot", "impact"]);
  expect(play.mock.calls[1][1]).toBeLessThan(play.mock.calls[0][1]!);
});
it("drops muted and distant sounds instead of replaying them later", () => {
  for (const reason of ["muted", "far"]) {
    const { w, a, play } = scene();
    a.enabled = reason !== "muted";
    const far = { x: 100, z: 100, zoom: 20 };
    a.updateSiege(w, reason === "far" ? far : camera);
    w.time = 10.46;
    a.updateSiege(w, reason === "far" ? far : camera);
    a.enabled = true;
    a.updateSiege(w, camera);
    expect(play).not.toHaveBeenCalled();
  }
});
it("ignores old launches and limits simultaneous volleys", () => {
  const { w, e, a, play } = scene();
  w.time = 12;
  a.updateSiege(w, camera);
  expect(play).not.toHaveBeenCalled();
  e.lastAttack!.time = 12;
  for (let i = 0; i < 12; i++)
    w.entities["tower" + i] = { ...e, id: "tower" + i };
  a.updateSiege(w, camera);
  expect(play).toHaveBeenCalledTimes(6);
  w.entities = {[e.id]:e};
  a.resetSiege();
  w.time = 11;
  e.lastAttack!.time = 11;
  a.updateSiege(w, camera);
  expect(play).toHaveBeenCalledTimes(7);
});
