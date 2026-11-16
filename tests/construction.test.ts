import { describe, it, expect } from "vitest";
import {
  createWorld,
  command,
  getEntities,
  canBuild,
  isWalkable,
} from "../src/simulation";
import { connectedBridgeGroup } from "../src/bridge-groups";
import {
  attachmentPoints,
  snapCandidates,
  touching,
  footprint,
} from "../src/construction";
import { validateSave } from "../src/save";

describe("construction orientation and complexes", () => {
  it("groups rotated bridge decks along their local axis without crossing gaps", () => {
    const a = { id: "a", type: "bridge", x: 20, z: 20, rotation: 1 };
    const b = { ...a, id: "b", z: 19 };
    const c = { ...a, id: "c", z: 17 };
    const perpendicular = { ...a, id: "d", x: 21 };
    expect(
      connectedBridgeGroup([a, b, c, perpendicular], b).map((e) => e.id),
    ).toEqual(["a", "b"]);
    expect(connectedBridgeGroup([a, b, c], c)).toEqual([c]);
  });
  it("preserves orientation and reciprocal building links through save and disconnect", () => {
    const w = createWorld();
    w.resources.wood = 10000;
    w.resources.stone = 10000;
    expect(
      command(w, {
        type: "build",
        building: "house",
        x: 20,
        z: 34,
        rotation: 1,
      }).ok,
    ).toBe(true);
    expect(
      command(w, {
        type: "build",
        building: "warehouse",
        x: 23,
        z: 34,
        rotation: 3,
      }).ok,
    ).toBe(true);
    const a = getEntities(w).find(
      (e) => e.x === 20 && e.z === 34 && e.kind === "building",
    )!;
    const b = getEntities(w).find(
      (e) => e.x === 23 && e.z === 34 && e.kind === "building",
    )!;
    expect(
      command(w, { type: "connect", actorId: a.id, targetId: b.id }).ok,
    ).toBe(true);
    expect(
      command(w, { type: "connect", actorId: a.id, targetId: b.id }).ok,
    ).toBe(false);
    expect(
      command(w, { type: "connect", actorId: a.id, targetId: a.id }).ok,
    ).toBe(false);
    expect(touching(a, b)).toBe(true);
    expect(a.joined && b.joined).toBe(true);
    const loaded = validateSave(JSON.parse(JSON.stringify(w)));
    expect(loaded.entities[a.id].rotation).toBe(1);
    expect(loaded.entities[b.id].rotation).toBe(3);
    expect(loaded.entities[a.id].links).toEqual([b.id]);
    expect(loaded.entities[b.id].links).toEqual([a.id]);
    expect(command(loaded, { type: "disconnect", actorId: a.id }).ok).toBe(
      true,
    );
    expect(loaded.entities[b.id].links).toEqual([]);
  });
  it("rejects distant and foreign complex links and unsafe occupied rotation", () => {
    const w = createWorld();
    const own = getEntities(w).find(
      (e) => e.kind === "building" && e.faction === "player",
    )!;
    const foreign = getEntities(w).find(
      (e) => e.kind === "building" && e.faction === "neutral",
    )!;
    expect(
      command(w, { type: "connect", actorId: own.id, targetId: foreign.id }).ok,
    ).toBe(false);
    const distant = { ...own, id: "distant", x: 60, z: 60 };
    w.entities[distant.id] = distant;
    expect(
      command(w, { type: "connect", actorId: own.id, targetId: distant.id }).ok,
    ).toBe(false);
    const unit = getEntities(w).find((e) => e.kind === "worker")!;
    unit.x = own.x;
    unit.z = own.z;
    expect(command(w, { type: "rotate", actorId: own.id }).ok).toBe(false);
    unit.x = 60;
    unit.z = 50;
    for (const e of getEntities(w))
      if (e.kind !== "building" && Math.hypot(e.x - own.x, e.z - own.z) < 1.2) {
        e.x = 55;
        e.z = 55;
      }
    expect(command(w, { type: "rotate", actorId: own.id }).ok).toBe(true);
    expect(own.rotation).toBe(1);
  });
});

describe("physical building snapping", () => {
  it("snaps walls exactly, preserves the joint in a save, and blocks its real footprint", () => {
    const w = createWorld();
    const h = getEntities(w).find((e) => e.kind === "hero")!;
    h.x = 20;
    h.z = 26;
    const base = {
      ...getEntities(w).find(
        (e) => e.kind === "building" && e.type === "warehouse",
      )!,
      x: 20,
      z: 30,
    };
    w.entities = { [h.id]: h, [base.id]: base };
    const spot = snapCandidates(getEntities(w), "house", 0, 22.1, 30)[0];
    expect(spot.x).toBeCloseTo(22.05);
    expect(
      canBuild(w, "house", spot.x, spot.z, { attachTo: base.id, rotation: 0 })
        .ok,
    ).toBe(true);
    const before = w.resources.wood;
    expect(
      command(w, { type: "build", building: "house", ...spot, rotation: 0 }).ok,
    ).toBe(true);
    const built = getEntities(w).find(
      (e) => e.kind === "building" && e.id !== base.id,
    )!;
    expect(touching(built, base)).toBe(true);
    expect(w.resources.wood).toBe(before - 30);
    expect(isWalkable(w, 22, 30)).toBe(false);
    const loaded = validateSave(JSON.parse(JSON.stringify(w)));
    expect(touching(loaded.entities[built.id], loaded.entities[base.id])).toBe(
      true,
    );
    expect(canBuild(w, "house", 22, 30).ok).toBe(false);
    expect(command(w, { type: "rotate", actorId: built.id }).ok).toBe(false);
  });
  it("uses rotated dimensions and refuses intersecting or non-touching placement", () => {
    const w = createWorld();
    const h = getEntities(w).find((e) => e.kind === "hero")!;
    h.x = 20;
    h.z = 25;
    const base = {
      ...getEntities(w).find(
        (e) => e.kind === "building" && e.type === "warehouse",
      )!,
      x: 20,
      z: 30,
      rotation: 1,
    };
    w.entities = { [h.id]: h, [base.id]: base };
    expect(footprint(base.type, 1).width).toBe(1.6);
    const spot = attachmentPoints("warehouse", 1, base)[0];
    expect(spot.x).toBeCloseTo(21.6);
    expect(
      canBuild(w, "warehouse", spot.x, spot.z, {
        attachTo: base.id,
        rotation: 1,
      }).ok,
    ).toBe(true);
    expect(
      canBuild(w, "warehouse", spot.x - 0.2, spot.z, {
        attachTo: base.id,
        rotation: 1,
      }).ok,
    ).toBe(false);
    expect(
      canBuild(w, "warehouse", spot.x + 0.2, spot.z, {
        attachTo: base.id,
        rotation: 1,
      }).ok,
    ).toBe(false);
  });
});
