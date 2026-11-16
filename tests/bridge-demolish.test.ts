import { describe, it, expect } from "vitest";
import { createWorld, command, getEntities } from "../src/simulation";
import { validateSave } from "../src/save";
function scene(channel = false) {
  const w = createWorld(),
    h = getEntities(w).find((e) => e.kind === "hero")!;
  w.entities = { [h.id]: h };
  h.x = 28;
  h.z = 20;
  w.resources = { wood: 1000, stone: 1000, food: 1000, gold: 1000, iron: 1000 };
  if (channel) {
    h.x = 20;
    for (const x of [22, 23, 24])
      command(w, { type: "build", building: "canal", x, z: 20 });
  }
  const r = command(w, {
    type: "buildBridge",
    building: "fixedBridge",
    x: channel ? 21 : 30,
    z: 20,
    endX: channel ? 25 : 34,
    endZ: 20,
  });
  expect(r.ok).toBe(true);
  return {
    w,
    h,
    bridges: getEntities(w).filter((e) => e.type === "fixedBridge"),
  };
}
describe("whole bridge demolition", () => {
  it("removes all segments from a middle click and refunds each once", () => {
    const { w, bridges } = scene(),
      before = { ...w.resources };
    expect(
      command(w, { type: "demolishBridge", targetId: bridges[1].id }).ok,
    ).toBe(true);
    expect(getEntities(w).filter((e) => e.type === "fixedBridge")).toHaveLength(
      0,
    );
    expect(w.resources.wood).toBe(before.wood + 45);
    expect(w.resources.stone).toBe(before.stone + 21);
    expect(
      command(w, { type: "demolishBridge", targetId: bridges[1].id }).ok,
    ).toBe(false);
    expect(w.resources.wood).toBe(before.wood + 45);
  });
  it("makes no partial changes when any segment is occupied", () => {
    const { w, h, bridges } = scene();
    w.entities[h.id].x = 33;
    const before = structuredClone(w);
    expect(
      command(w, { type: "demolishBridge", targetId: bridges[0].id }).ok,
    ).toBe(false);
    expect(w.entities).toEqual(before.entities);
    expect(w.resources).toEqual(before.resources);
  });
  it("restores channel beds and retains a valid save", () => {
    const { w, bridges } = scene(true);
    expect(
      command(w, { type: "demolishBridge", targetId: bridges[1].id }).ok,
    ).toBe(true);
    expect(getEntities(w).filter((e) => e.type === "canal")).toHaveLength(3);
    expect(validateSave(JSON.parse(JSON.stringify(w)))).toEqual(w);
  });
  it("leaves separate parallel bridges alone and rejects foreign segments atomically", () => {
    const { w, bridges } = scene();
    const other = { ...bridges[0], id: "other", z: 21, links: [] };
    w.entities.other = other;
    bridges[2].faction = "neutral";
    const before = structuredClone(w);
    expect(
      command(w, { type: "demolishBridge", targetId: bridges[0].id }).ok,
    ).toBe(false);
    expect(w.entities).toEqual(before.entities);
    bridges[2].faction = "player";
    expect(
      command(w, { type: "demolishBridge", targetId: bridges[0].id }).ok,
    ).toBe(true);
    expect(w.entities.other).toEqual(other);
  });
});
