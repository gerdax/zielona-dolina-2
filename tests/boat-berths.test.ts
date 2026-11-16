import { describe, it, expect } from "vitest";
import {
  createWorld,
  getEntities,
  command,
  repairBoatBerths,
  terrainAt,
  type Entity,
} from "../src/simulation";
function scene() {
  const w = createWorld(),
    h = getEntities(w).find((e) => e.kind === "hero")!;
  h.x = 28;
  h.z = 24;
  w.entities = { [h.id]: h };
  w.resources.wood = 1000;
  w.resources.stone = 1000;
  return { w, h };
}
describe("boat berths", () => {
  it("launches beside the landing on water within boarding reach", () => {
    const { w, h } = scene();
    expect(
      command(w, { type: "build", building: "dock", x: 30, z: 24, rotation: 0 })
        .ok,
    ).toBe(true);
    const boat = getEntities(w).find((e) => e.kind === "boat")!;
    expect(boat).toBeDefined();
    expect(terrainAt(w, boat.x, boat.z)).toBe("water");
    expect(Math.abs(boat.z - 24)).toBeGreaterThanOrEqual(2);
    h.x = 30;
    h.z = 26;
    expect(
      command(w, { type: "board", actorId: h.id, targetId: boat.id }).ok,
    ).toBe(true);
  });
  it("repairs old overlapping boats once without changing identity or passenger count", () => {
    const { w, h } = scene();
    command(w, { type: "build", building: "dock", x: 30, z: 24 });
    const boat = getEntities(w).find((e) => e.kind === "boat")!;
    boat.x = 31;
    boat.z = 24;
    boat.passengerId = h.id;
    h.carriedBy = boat.id;
    const ids = Object.keys(w.entities);
    repairBoatBerths(w);
    expect(boat.z).not.toBe(24);
    expect(h.x).toBe(boat.x);
    expect(h.z).toBe(boat.z);
    expect(Object.keys(w.entities)).toEqual(ids);
    const p = { x: boat.x, z: boat.z };
    repairBoatBerths(w);
    expect({ x: boat.x, z: boat.z }).toEqual(p);
  });
  it("does not move a boat under player orders", () => {
    const { w } = scene();
    command(w, { type: "build", building: "dock", x: 30, z: 24 });
    const boat = getEntities(w).find((e) => e.kind === "boat")!;
    boat.x = 31;
    boat.z = 24;
    boat.order = {
      type: "move",
      x: 32,
      z: 26,
      path: [
        { x: 31, z: 25 },
        { x: 32, z: 26 },
      ],
    };
    repairBoatBerths(w);
    expect(boat.z).toBe(24);
  });
  it("chooses the other side when the first berth is occupied", () => {
    const { w } = scene();
    command(w, { type: "build", building: "dock", x: 30, z: 24 });
    const first = getEntities(w).find((e) => e.kind === "boat")!;
    const other: Entity = { ...first, id: "other", x: 31, z: 24 };
    w.entities.other = other;
    repairBoatBerths(w);
    expect(other.z).not.toBe(first.z);
  });
});
