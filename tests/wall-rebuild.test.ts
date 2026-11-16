import { describe, it, expect } from "vitest";
import {
  createWorld,
  getEntities,
  command,
  wallRebuildAvailable,
  step,
  type Entity,
} from "../src/simulation";
import { validateSave } from "../src/save";
function scene() {
  const w = createWorld(),
    h = getEntities(w).find((e) => e.kind === "hero")!,
    model = getEntities(w).find((e) => e.kind === "building")!;
  h.x = 19;
  h.z = 18;
  const ruin = (id: string, type: string, x: number): Entity => ({
    ...model,
    id,
    kind: "ruin",
    type: "ruin",
    originalType: type,
    originalFaction: "player",
    faction: "neutral",
    x,
    z: 20,
    hp: 100,
    maxHp: 100,
  });
  w.entities = Object.fromEntries(
    [
      h,
      {
        ...model,
        id: "anchor",
        type: "wall",
        x: 20,
        z: 20,
        rotation: 1,
        hp: 200,
        maxHp: 200,
      },
      { ...ruin("palisade", "palisade", 21), rotation: 1 },
      ruin("tower", "stoneTower", 22),
      ruin("gate", "woodGate", 22.825),
      ruin("far", "wall", 28),
      ruin("house", "house", 20),
    ].map((e) => [e.id, e]),
  );
  w.entities.house.z = 24;
  w.resources.wood = 500;
  w.resources.stone = 500;
  w.raidTimer = 1e8;
  return { w, h };
}
describe("whole destroyed fortification rebuild", () => {
  it("shows the total and restores original types in place from a surviving anchor", () => {
    const { w } = scene(),
      ids = Object.keys(w.entities),
      plan = wallRebuildAvailable(w, "anchor");
    expect(plan.ok).toBe(true);
    expect(plan.cost).toEqual({ wood: 180, stone: 150 });
    expect(command(w, { type: "rebuildWall", targetId: "anchor" }).ok).toBe(
      true,
    );
    expect(w.entities.palisade.type).toBe("palisade");
    expect(w.entities.tower.type).toBe("stoneTower");
    expect(w.entities.gate.type).toBe("woodGate");
    for (const id of ["palisade", "tower", "gate"])
      expect(w.entities[id].hp).toBe(w.entities[id].maxHp);
    expect(w.entities.anchor.hp).toBe(200);
    expect(w.entities.far.kind).toBe("ruin");
    expect(w.entities.house.kind).toBe("ruin");
    expect(Object.keys(w.entities)).toEqual(ids);
    expect(w.resources.wood).toBe(320);
    expect(w.resources.stone).toBe(350);
    expect(w.entities.gate.open).toBe(true);
    expect(validateSave(JSON.parse(JSON.stringify(w)))).toEqual(w);
    const resources = { ...w.resources };
    expect(command(w, { type: "rebuildWall", targetId: "anchor" }).ok).toBe(
      false,
    );
    expect(w.resources).toEqual(resources);
  });
  it("blocks the whole operation for missing supplies, nearby foes or occupied ruins", () => {
    for (const reason of ["resources", "enemy", "occupied"]) {
      const { w, h } = scene();
      if (reason === "resources") w.resources.stone = 149;
      else
        w.entities.extra = {
          ...h,
          id: "extra",
          kind: reason === "enemy" ? "enemy" : "worker",
          faction: reason === "enemy" ? "enemy" : "player",
          x: 22,
          z: 20,
        };
      const before = structuredClone(w);
      expect(command(w, { type: "rebuildWall", targetId: "palisade" }).ok).toBe(
        false,
      );
      expect(w.entities).toEqual(before.entities);
      expect(w.resources).toEqual(before.resources);
    }
  });
  it("does not claim known foreign ruins; legacy unmarked ruins remain usable", () => {
    const { w } = scene();
    w.entities.gate.originalFaction = "enemy";
    delete w.entities.palisade.originalFaction;
    expect(wallRebuildAvailable(w, "palisade").cost).toEqual({
      wood: 120,
      stone: 100,
    });
    command(w, { type: "rebuildWall", targetId: "palisade" });
    expect(w.entities.gate.kind).toBe("ruin");
  });
  it("walks the hero to the site with one click, paying only when rebuilding", () => {
    const { w, h } = scene();
    h.x = 10;
    h.z = 20;
    w.entities.store = {
      ...w.entities.anchor,
      id: "store",
      type: "warehouse",
      x: 2,
      z: 2,
    };
    expect(command(w, { type: "rebuildWall", targetId: "anchor" }).ok).toBe(
      true,
    );
    expect(h.pendingAction?.type).toBe("rebuildWall");
    expect(w.resources.wood).toBe(500);
    for (let i = 0; i < 150; i++) step(w, 0.1);
    expect(w.entities.gate.kind).toBe("building");
    expect(w.resources.wood).toBe(320);
  });
});
