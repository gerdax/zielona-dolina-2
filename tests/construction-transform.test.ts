import { describe, it, expect } from "vitest";
import {
  createWorld,
  command,
  getEntities,
  planConstructionMove,
} from "../src/simulation";
import { connectedConstruction, touching } from "../src/construction";
import { validateSave } from "../src/save";
function setup() {
  const w = createWorld(),
    h = getEntities(w).find((e) => e.kind === "hero")!;
  h.x = 20;
  h.z = 25;
  const a = {
    ...getEntities(w).find((e) => e.type === "warehouse")!,
    x: 20,
    z: 30,
    joined: true,
    links: ["wing"],
  };
  const b = {
    ...a,
    id: "wing",
    type: "house",
    label: "Skrzydło",
    x: 22.05,
    links: [a.id],
  };
  w.entities = { [h.id]: h, [a.id]: a, [b.id]: b };
  return { w, a, b, h };
}
describe("whole construction transformations", () => {
  it("moves and turns every wing atomically while preserving IDs, links, health and resources", () => {
    const { w, a, b } = setup(),
      resources = { ...w.resources };
    const ids = Object.keys(w.entities),
      health = [a.hp, b.hp];
    expect(planConstructionMove(w, a.id, 24, 35, 1).ok).toBe(true);
    expect(
      command(w, {
        type: "moveConstruction",
        actorId: a.id,
        x: 24,
        z: 35,
        rotation: 1,
      }).ok,
    ).toBe(true);
    expect([a.x, a.z, a.rotation]).toEqual([24, 35, 1]);
    expect(b.x).toBe(24);
    expect(b.z).toBeCloseTo(32.95);
    expect(b.rotation).toBe(1);
    expect(touching(a, b)).toBe(true);
    expect(Object.keys(w.entities)).toEqual(ids);
    expect([a.hp, b.hp]).toEqual(health);
    expect(w.resources).toEqual(resources);
    const loaded = validateSave(JSON.parse(JSON.stringify(w)));
    expect(
      connectedConstruction(getEntities(loaded), loaded.entities[a.id]).map(
        (e) => e.id,
      ),
    ).toEqual([a.id, b.id]);
  });
  it("restores the exact layout after four quarter turns", () => {
    const { w, a, b } = setup();
    const original = [a.x, a.z, b.x, b.z];
    for (let i = 0; i < 4; i++)
      expect(command(w, { type: "rotateConstruction", actorId: a.id }).ok).toBe(
        true,
      );
    expect([a.x, a.z, b.x, b.z]).toEqual(original);
    expect(a.rotation).toBe(0);
    expect(b.rotation).toBe(0);
  });
  it("rejects the entire move if a far wing hits an obstacle, an edge or water", () => {
    const { w, a, b } = setup();
    w.entities.obstacle = {
      ...a,
      id: "obstacle",
      kind: "rock",
      type: "rock",
      x: 26.05,
      z: 35,
    };
    const layout = JSON.stringify([a, b]);
    expect(planConstructionMove(w, a.id, 24, 35).ok).toBe(false);
    expect(
      command(w, { type: "moveConstruction", actorId: a.id, x: 24, z: 35 }).ok,
    ).toBe(false);
    expect(JSON.stringify([a, b])).toBe(layout);
    expect(
      command(w, { type: "moveConstruction", actorId: a.id, x: 61, z: 35 }).ok,
    ).toBe(false);
    expect(
      command(w, { type: "moveConstruction", actorId: a.id, x: 30, z: 35 }).ok,
    ).toBe(false);
    expect(JSON.stringify([a, b])).toBe(layout);
  });
  it("requires occupants to leave and ignores unrelated nearby buildings in the group", () => {
    const { w, a, b, h } = setup();
    const other = { ...a, id: "other", x: 20, z: 33, links: [] };
    w.entities.other = other;
    expect(connectedConstruction(getEntities(w), a).length).toBe(2);
    h.x = b.x;
    h.z = b.z;
    expect(command(w, { type: "rotateConstruction", actorId: a.id }).ok).toBe(
      false,
    );
    expect(a.rotation).toBeUndefined();
    expect(b.x).toBe(22.05);
  });
});
