import { it, expect, vi } from "vitest";
import { ValleyAudio } from "../src/audio";
import { createWorld, getEntities } from "../src/simulation";
it("sounds only moving nearby wagons and drops stopped or muted travel", () => {
  const w = createWorld(),
    e = getEntities(w)[0];
  e.kind = "merchant";
  e.x = 20;
  e.z = 20;
  w.entities = { [e.id]: e };
  const a = new ValleyAudio(),
    play = vi.spyOn(a, "wagon").mockImplementation(() => {}),
    camera = { x: 20, z: 20, zoom: 20 };
  const tick = (distance: number) => {
    w.time += 0.2;
    e.z += distance;
    a.updateWagons(w, camera);
  };
  tick(0);
  tick(0);
  expect(play).not.toHaveBeenCalled();
  tick(0.4);
  expect(play).toHaveBeenCalledTimes(1);
  tick(0);
  expect(play).toHaveBeenCalledTimes(1);
  a.enabled = false;
  tick(0.4);
  a.enabled = true;
  tick(0);
  expect(play).toHaveBeenCalledTimes(1);
  e.x = 100;
  tick(0.4);
  expect(play).toHaveBeenCalledTimes(1);
  e.x = 20;
  for (let i = 0; i < 10; i++) tick(0.4);
  expect(play.mock.calls.some((call) => call[2])).toBe(true);
  const count = play.mock.calls.length;
  a.resetSiege();
  tick(0.4);
  expect(play).toHaveBeenCalledTimes(count);
});
