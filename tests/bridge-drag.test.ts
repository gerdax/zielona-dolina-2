import { describe, it, expect } from "vitest";
import {
  createWorld,
  getEntities,
  command,
  planBridge,
  isWalkable,
  findPath,
} from "../src/simulation";
import { connectedBridgeGroup } from "../src/bridge-groups";
import { validateSave } from "../src/save";
function scene() {
  const w = createWorld(),
    h = getEntities(w).find((e) => e.kind === "hero")!;
  h.x = 28;
  h.z = 20;
  w.entities = { [h.id]: h };
  w.resources = { wood: 1000, stone: 1000, food: 1000, gold: 1000, iron: 1000 };
  return { w, h };
}
describe("bank-to-bank bridge drag", () => {
  for (const reverse of [false, true])
    it(`fits river length and direction, reverse=${reverse}`, () => {
      const { w, h } = scene();
      const x = reverse ? 36 : 28,
        endX = reverse ? 28 : 36;
      const before = structuredClone(w);
      const plan = planBridge(
        w,
        "fixedBridge",
        { x, z: 20 },
        { x: endX, z: 20.4 },
      );
      expect(w).toEqual(before);
      expect(plan.ok).toBe(true);
      expect(plan.points).toHaveLength(3);
      expect(plan.cost).toEqual({ wood: 90, stone: 45 });
      expect(plan.rotation).toBe(reverse ? 2 : 0);
      expect(
        command(w, {
          type: "buildBridge",
          building: "fixedBridge",
          x,
          z: 20,
          endX,
          endZ: 20.4,
        }).ok,
      ).toBe(true);
      const bridges = getEntities(w).filter((e) => e.type === "fixedBridge");
      expect(bridges).toHaveLength(3);
      expect(connectedBridgeGroup(bridges, bridges[0])).toHaveLength(3);
      expect(w.resources.wood).toBe(before.resources.wood - 90);
      expect(findPath(w, w.entities[h.id], { x: 35, z: 20 })).not.toBeNull();
      expect(validateSave(JSON.parse(JSON.stringify(w)))).toEqual(w);
    });
  for (const base of ["ravine", "canal"])
    for (const reverse of [false, true])
      it(`fits vertical ${base}, reverse=${reverse}`, () => {
        const { w, h } = scene();
        h.x = 20;
        h.z = 18;
        for (const z of [20, 21, 22])
          expect(
            command(w, { type: "build", building: base, x: 20, z }).ok,
          ).toBe(true);
        const plan = planBridge(
          w,
          "stoneBridge",
          { x: 20, z: reverse ? 24 : 18 },
          { x: 20.2, z: reverse ? 18 : 24 },
        );
        expect(plan.ok).toBe(true);
        expect(plan.rotation).toBe(reverse ? 1 : 3);
        expect(plan.points).toHaveLength(3);
        expect(
          command(w, {
            type: "buildBridge",
            building: "stoneBridge",
            x: 20,
            z: reverse ? 24 : 18,
            endX: 20.2,
            endZ: reverse ? 18 : 24,
          }).ok,
        ).toBe(true);
        expect(isWalkable(w, 20, 21, w.entities[h.id])).toBe(true);
      });
  it("does not charge or build partial spans when blocked or underfunded", () => {
    for (const blocked of [false, true]) {
      const { w } = scene();
      if (blocked)
        w.entities.rock = {
          id: "rock",
          kind: "rock",
          type: "rock",
          label: "Rock",
          x: 32,
          z: 20,
          hp: 100,
          maxHp: 100,
          faction: "neutral",
        };
      else w.resources.wood = 31;
      const before = structuredClone(w);
      expect(
        command(w, {
          type: "buildBridge",
          building: "fixedBridge",
          x: 30,
          z: 20,
          endX: 34,
          endZ: 20,
        }).ok,
      ).toBe(false);
      expect(w.entities).toEqual(before.entities);
      expect(w.resources).toEqual(before.resources);
      expect(w.nextId).toBe(before.nextId);
    }
  });
  it("rejects water anchors, separated gaps and invalid coordinates", () => {
    const { w, h } = scene();
    h.x = 20;
    h.z = 20;
    expect(planBridge(w, "bridge", { x: 31, z: 20 }, { x: 34, z: 20 }).ok).toBe(
      false,
    );
    for (const x of [22, 24])
      command(w, { type: "build", building: "ravine", x, z: 20 });
    expect(planBridge(w, "bridge", { x: 21, z: 20 }, { x: 25, z: 20 }).ok).toBe(
      false,
    );
    expect(
      planBridge(w, "bridge", { x: NaN, z: 20 }, { x: 25, z: 20 }).ok,
    ).toBe(false);
  });
});
