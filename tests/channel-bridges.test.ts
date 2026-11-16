import { describe, it, expect } from "vitest";
import {
  createWorld,
  command,
  canBuild,
  getEntities,
  isWalkable,
  findPath,
} from "../src/simulation";
import { validateSave } from "../src/save";
function scene() {
  const w = createWorld();
  const h = getEntities(w).find((e) => e.kind === "hero")!;
  w.entities = { [h.id]: h };
  h.x = 20;
  h.z = 20;
  w.resources = { wood: 1000, stone: 1000, gold: 1000, food: 1000, iron: 1000 };
  return { w, h };
}
describe("bridges over excavated terrain", () => {
  for (const base of ["ravine", "canal", "trench"])
    for (const type of ["fixedBridge", "stoneBridge", "bridge"]) {
      it(`spans ${base} with ${type}, restores it after save and demolition`, () => {
        const { w, h } = scene();
        expect(
          command(w, { type: "build", building: base, x: 22, z: 20 }).ok,
        ).toBe(true);
        const gap = getEntities(w).find((e) => e.type === base)!;
        // A snapped/joined excavation must also accept a bridge on its own cell.
        gap.joined = true;
        expect(isWalkable(w, 22, 20, h)).toBe(false);
        expect(canBuild(w, type, 22, 20).ok).toBe(true);
        expect(
          command(w, { type: "build", building: type, x: 22, z: 20 }).ok,
        ).toBe(true);
        const b = getEntities(w).find((e) => e.type === type)!;
        expect(b.bridgeBase).toBe(base);
        expect(isWalkable(w, 22, 20, h)).toBe(true);
        expect(findPath(w, h, { x: 22, z: 20 })).not.toBeNull();
        const loaded = validateSave(JSON.parse(JSON.stringify(w)));
        expect(command(loaded, { type: "demolish", targetId: b.id }).ok).toBe(
          true,
        );
        expect(loaded.entities[b.id].type).toBe(base);
        expect(isWalkable(loaded, 22, 20, loaded.entities[h.id])).toBe(false);
      });
    }
  it("preserves flooded channel and physical neighbors when bridging", () => {
    const { w, h } = scene();
    h.x = 28;
    h.z = 20;
    for (const x of [29, 30])
      expect(
        command(w, { type: "build", building: "canal", x, z: 20 }).ok,
      ).toBe(true);
    const a = getEntities(w).find((e) => e.x === 29)!,
      b = getEntities(w).find((e) => e.x === 30)!;
    a.joined = b.joined = true;
    a.links = [b.id];
    b.links = [a.id];
    expect(
      command(w, { type: "build", building: "fixedBridge", x: 29, z: 20 }).ok,
    ).toBe(true);
    const bridge = getEntities(w).find((e) => e.type === "fixedBridge")!;
    expect(b.links).toContain(bridge.id);
    expect(b.links).not.toContain(a.id);
    expect(w.floodedTiles).toContain("29,20");
  });
});
