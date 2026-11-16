import { it, expect } from "vitest";
import { BallistaImpacts } from "../src/ballista-impact";
function scene(type = "wall") {
  return {
    time: 10,
    entities: {
      tower: {
        id: "tower",
        kind: "building",
        type: "ballistaTower",
        x: 20,
        z: 20,
        lastAttack: { time: 10, targetId: "target", x: 25, z: 20 },
      },
      target: { id: "target", kind: "building", type, x: 25, z: 20 },
    },
  };
}
it("emits masonry dust and chips once when the bolt arrives", () => {
  const w = scene(),
    q = new BallistaImpacts();
  expect(q.update(w)).toEqual([]);
  w.time = 10.44;
  expect(q.update(w)).toEqual([]);
  w.time = 10.451;
  const impact = q.update(w);
  expect(impact).toHaveLength(1);
  expect(impact[0].wood).toBe(false);
  expect(impact[0].x).toBeLessThan(25);
  expect(q.update(w)).toEqual([]);
});
it("uses splinters for wooden gates and keeps pending impact after destruction", () => {
  const w = scene("woodGate"),
    q = new BallistaImpacts();
  q.update(w);
  w.entities = {
    ...w.entities,
    target: { ...w.entities.target, kind: "ruin", type: "ruin" },
  };
  w.time = 10.46;
  expect(q.update(w)[0].wood).toBe(true);
});
it("ignores units and missed old impacts", () => {
  for (const type of ["house", "tree", "soldier"]) {
    const w = scene(type),
      q = new BallistaImpacts();
    q.update(w);
    w.time = 10.5;
    expect(q.update(w)).toEqual([]);
  }
  const w = scene(),
    q = new BallistaImpacts();
  w.time = 12;
  expect(q.update(w)).toEqual([]);
});

it("provides a repeatable target in the test village without charging resources", async () => {
  const { createTestSettlement, startTestBoltImpact } =
    await import("../src/qa");
  const w = createTestSettlement(),
    tower = Object.values(w.entities).find((e) => e.type === "ballistaTower")!,
    resources = { ...w.resources };
  expect(startTestBoltImpact(w, tower.id).ok).toBe(true);
  expect(w.entities["test-bolt-target"].faction).toBe("enemy");
  expect(w.resources).toEqual(resources);
  expect(startTestBoltImpact(w, tower.id).ok).toBe(false);
});
