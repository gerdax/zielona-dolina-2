import { describe, it, expect } from "vitest";
import {
  createWorld,
  getEntities,
  command,
  connectedWallGroup,
  type Entity,
} from "../src/simulation";
function scene() {
  const w = createWorld(),
    h = getEntities(w).find((e) => e.kind === "hero")!,
    model = getEntities(w).find((e) => e.kind === "building")!;
  h.x = 10;
  h.z = 10;
  const parts: Entity[] = [
    { ...model, id: "wall1", type: "wall", x: 20, z: 20, rotation: 1 },
    { ...model, id: "wall2", type: "wall", x: 21, z: 20, rotation: 1 },
    { ...model, id: "tower", type: "stoneTower", x: 22, z: 20 },
    { ...model, id: "gate", type: "woodGate", x: 22.825, z: 20 },
    { ...model, id: "far", type: "wall", x: 28, z: 20, rotation: 1 },
    { ...model, id: "house", type: "house", x: 21, z: 23 },
  ];
  parts[1].links = ["house"];
  parts[5].links = ["wall2"];
  w.entities = Object.fromEntries([h, ...parts].map((e) => [e.id, e]));
  return { w, h, parts };
}
describe("whole fortification demolition", () => {
  it("follows touching walls, tower and gate without removing a linked house or distant wall", () => {
    const { w } = scene();
    const before = w.resources.stone;
    expect(
      connectedWallGroup(w, w.entities.wall2)
        .map((e) => e.id)
        .sort(),
    ).toEqual(["gate", "tower", "wall1", "wall2"]);
    expect(command(w, { type: "demolishWall", targetId: "wall2" }).ok).toBe(
      true,
    );
    expect(Object.keys(w.entities).sort()).toEqual(
      expect.arrayContaining(["house", "far"]),
    );
    for (const id of ["wall1", "wall2", "tower", "gate"])
      expect(w.entities[id]).toBeUndefined();
    expect(w.entities.house.links).toEqual([]);
    expect(w.resources.stone).toBeGreaterThan(before);
    const resources = { ...w.resources };
    expect(command(w, { type: "demolishWall", targetId: "wall2" }).ok).toBe(
      false,
    );
    expect(w.resources).toEqual(resources);
  });
  for (const state of ["stationed", "climbing", "walking", "ground"])
    it(`refuses entire demolition while ${state}`, () => {
      const { w, h } = scene();
      const archer: Entity = {
        ...h,
        id: "archer",
        kind: "archer",
        type: "archer",
        x: 22,
        z: 21,
      };
      if (state === "stationed") archer.garrisonId = "tower";
      if (state === "climbing") archer.garrisonTargetId = "tower";
      if (state === "walking")
        archer.wallWalk = {
          path: ["wall1", "wall2"],
          fromId: "wall1",
          toId: "wall2",
          destinationId: "wall2",
          progress: 0.3,
        };
      if (state === "ground") {
        archer.x = 23;
        archer.z = 20;
      }
      w.entities.archer = archer;
      const before = structuredClone(w);
      expect(command(w, { type: "demolishWall", targetId: "wall1" }).ok).toBe(
        false,
      );
      expect(w.entities).toEqual(before.entities);
      expect(w.resources).toEqual(before.resources);
    });
  it("does not remove foreign fortifications or accept a house as anchor", () => {
    const { w } = scene();
    w.entities.gate.faction = "neutral";
    expect(command(w, { type: "demolishWall", targetId: "house" }).ok).toBe(
      false,
    );
    expect(command(w, { type: "demolishWall", targetId: "wall1" }).ok).toBe(
      true,
    );
    expect(w.entities.gate).toBeDefined();
  });
});
