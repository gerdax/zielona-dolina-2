import { describe, it, expect } from "vitest";
import { damageStage, collapsePose } from "../src/fortification-damage";
import { createWorld, getEntities, step, type Entity } from "../src/simulation";
import { validateSave } from "../src/save";
describe("damaged fortifications", () => {
  it("uses stable health stages and removes damage after repair", () => {
    expect([100, 75, 45, 20].map((hp) => damageStage(hp, 100))).toEqual([
      0, 1, 2, 3,
    ]);
    expect(damageStage(100, 100)).toBe(0);
  });
  it("settles a collapsing model into rubble within a bounded interval", () => {
    expect(collapsePose(0).sink).toBe(0);
    expect(collapsePose(0.4).sink).toBeGreaterThan(0);
    expect(collapsePose(0.85).done).toBe(true);
    expect(collapsePose(2).scale).toBeGreaterThan(0);
  });
  for (const type of ["ram", "catapult", "ballistaTower", "soldier"])
    it(`records destruction caused by ${type} without changing damage or identity`, () => {
      const w = createWorld(),
        h = getEntities(w).find((e) => e.kind === "hero")!;
      const a: Entity = {
        ...h,
        id: "attacker",
        kind: "soldier",
        type,
        x: 20,
        z: 20,
        order: { type: "attack", targetId: "wall" },
      };
      const wall: Entity = {
        ...h,
        id: "wall",
        kind: "building",
        type: "wall",
        faction: "enemy",
        hp: 5,
        maxHp: 200,
        x: 20,
        z: 21,
      };
      w.entities = { [h.id]: h, attacker: a, wall };
      w.raidTimer = 1e8;
      step(w, 0.1);
      expect(w.entities.wall.kind).toBe("ruin");
      expect(w.entities.wall.originalType).toBe("wall");
      if (type === "soldier") expect(wall.siegeCollapse).toBeUndefined();
      else expect(wall.siegeCollapse?.by).toBe(type);
      const loaded = validateSave(JSON.parse(JSON.stringify(w)));
      expect(loaded.entities.wall.siegeCollapse).toEqual(wall.siegeCollapse);
    });
});
