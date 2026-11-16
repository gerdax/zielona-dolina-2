import { it, expect } from "vitest";
import {
  createWorld,
  getEntities,
  command,
  step,
  type Entity,
} from "../src/simulation";
import { validateSave } from "../src/save";
function scene() {
  const w = createWorld(),
    h = getEntities(w).find((e) => e.kind === "hero")!,
    worker = getEntities(w).find((e) => e.kind === "worker")!;
  h.x = 10;
  h.z = 20;
  worker.x = 20;
  worker.z = 21;
  worker.order = undefined;
  worker.workplaceId = undefined;
  w.entities = { [h.id]: h, [worker.id]: worker };
  w.raidTimer = 1e8;
  w.nextMerchantAt = 1e8;
  w.resources = { wood: 300, stone: 300, food: 300, iron: 100, gold: 300 };
  const b = (type: string, x: number, z: number): Entity => {
    const e: Entity = {
      id: type,
      kind: "building",
      type,
      label: type,
      x,
      z,
      hp: 180,
      maxHp: 180,
      faction: "player",
    };
    w.entities[type] = e;
    return e;
  };
  const station = b("firehouse", 20, 20),
    house = b("house", 24, 20);
  return { w, worker, station, house, b };
}
function run(w: ReturnType<typeof createWorld>, seconds: number) {
  for (let i = 0; i < seconds * 10; i++) step(w, 0.1);
}
it("a staffed firehouse dispatches an existing worker and extinguishes a real fire", () => {
  const { w, worker, station, house } = scene();
  house.fire = 12;
  expect(
    command(w, { type: "assign", workerId: worker.id, buildingId: station.id })
      .ok,
  ).toBe(true);
  run(w, 12);
  expect(house.fire).toBe(0);
  expect(worker.x).toBeGreaterThan(20);
  expect(station.workerId).toBe(worker.id);
  expect(house.hp).toBeGreaterThan(100);
  expect(getEntities(w).filter((e) => e.kind === "worker")).toHaveLength(1);
});
it("a nearby well speeds extinguishing and distant or foreign fires stay unattended", () => {
  function trial(water: boolean) {
    const s = scene();
    s.house.x = 21;
    s.house.z = 21;
    s.house.fire = 12;
    if (water) s.b("well", 19, 20);
    command(s.w, {
      type: "assign",
      workerId: s.worker.id,
      buildingId: s.station.id,
    });
    run(s.w, 1);
    return s.house.fire!;
  }
  expect(trial(true)).toBeLessThan(trial(false));
  const { w, worker, station, house } = scene();
  house.x = 40;
  house.fire = 12;
  command(w, { type: "assign", workerId: worker.id, buildingId: station.id });
  run(w, 1);
  expect(worker.fireTargetId).toBeUndefined();
  expect(house.fire).toBeGreaterThan(11);
});
it("catapult hits ignite wooden buildings and fire state survives saving", () => {
  const { w, house } = scene();
  const engine: Entity = {
    id: "catapult",
    kind: "enemy",
    type: "catapult",
    label: "Katapulta",
    x: 26,
    z: 20,
    hp: 200,
    maxHp: 200,
    faction: "enemy",
    order: { type: "attack", targetId: house.id },
  };
  w.entities[engine.id] = engine;
  run(w, 0.1);
  expect(house.fire).toBeGreaterThan(0);
  expect(validateSave(JSON.parse(JSON.stringify(w))).entities.house.fire).toBe(
    house.fire,
  );
  delete w.entities[engine.id];
  house.hp = 1;
  run(w, 2);
  expect(house.kind).toBe("ruin");
  expect(house.fire).toBeUndefined();
});
