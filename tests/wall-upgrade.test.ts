import { describe, it, expect } from "vitest";
import {
  createWorld,
  getEntities,
  command,
  wallUpgradeAvailable,
  connectedWallGroup,
  type Entity,
} from "../src/simulation";
import { validateSave } from "../src/save";
import { footprint } from "../src/construction";
function scene() {
  const w = createWorld(),
    h = getEntities(w).find((e) => e.kind === "hero")!,
    model = getEntities(w).find((e) => e.kind === "building")!;
  const parts: Entity[] = [
    {
      ...model,
      id: "p",
      type: "palisade",
      x: 20,
      z: 20,
      rotation: 1,
      hp: 32.5,
      maxHp: 65,
    },
    {
      ...model,
      id: "t",
      type: "tower",
      x: 21,
      z: 20,
      hp: 250,
      maxHp: 250,
      occupantId: "archer",
    },
    {
      ...model,
      id: "g",
      type: "woodGate",
      x: 21.825,
      z: 20,
      hp: 90,
      maxHp: 90,
      open: false,
      gateMode: "manual",
    },
    { ...model, id: "far", type: "palisade", x: 27, z: 20 },
    { ...model, id: "house", type: "house", x: 22, z: 23 },
  ];
  const archer: Entity = {
    ...h,
    id: "archer",
    kind: "archer",
    type: "archer",
    x: 21,
    z: 21,
    garrisonId: "t",
    elevation: 1,
  };
  w.entities = Object.fromEntries([h, ...parts, archer].map((e) => [e.id, e]));
  w.resources.stone = 100;
  return w;
}
describe("whole wall stone upgrade", () => {
  it("charges only stone, keeps IDs, joints, gate state, health ratio and stationed archer", () => {
    const w = scene(),
      ids = Object.keys(w.entities);
    w.entities.p.links = ["t"];
    const plan = wallUpgradeAvailable(w, "g");
    expect(plan.ok).toBe(true);
    expect(plan.cost).toEqual({ stone: 43 });
    const oldFootprint = footprint("palisade", 1);
    expect(command(w, { type: "upgradeWall", targetId: "g" }).ok).toBe(true);
    expect(Object.keys(w.entities)).toEqual(ids);
    expect(w.resources.stone).toBe(57);
    expect(w.entities.p.type).toBe("stoneRampart");
    expect(w.entities.p.hp).toBe(100);
    expect(footprint(w.entities.p.type, 1)).toEqual(oldFootprint);
    expect(w.entities.t.type).toBe("stoneTower");
    expect(w.entities.t.occupantId).toBe("archer");
    expect(w.entities.archer.garrisonId).toBe("t");
    expect(w.entities.g.type).toBe("gate");
    expect(w.entities.g.open).toBe(false);
    expect(w.entities.g.gateMode).toBe("manual");
    expect(w.entities.far.type).toBe("palisade");
    expect(w.entities.house.type).toBe("house");
    expect(connectedWallGroup(w, w.entities.p)).toHaveLength(3);
    expect(validateSave(JSON.parse(JSON.stringify(w)))).toEqual(w);
    expect(command(w, { type: "upgradeWall", targetId: "p" }).ok).toBe(false);
    expect(w.resources.stone).toBe(57);
  });
  it("does nothing when the full upgrade cannot be paid", () => {
    const w = scene();
    w.resources.stone = 42;
    const before = structuredClone(w);
    expect(command(w, { type: "upgradeWall", targetId: "p" }).ok).toBe(false);
    expect(w.entities).toEqual(before.entities);
    expect(w.resources).toEqual(before.resources);
  });
  it("waits for archers walking or climbing without changing any element", () => {
    for (const climbing of [true, false]) {
      const w = scene(),
        a = w.entities.archer;
      if (climbing) a.garrisonTargetId = "p";
      else
        a.wallWalk = {
          path: ["p", "t"],
          fromId: "p",
          toId: "t",
          destinationId: "t",
          progress: 0.5,
        };
      const before = structuredClone(w);
      expect(command(w, { type: "upgradeWall", targetId: "g" }).ok).toBe(false);
      expect(w.entities).toEqual(before.entities);
      expect(w.resources).toEqual(before.resources);
    }
  });
  it("retains the broad side connection of a snapped palisade", () => {
    const w = scene();
    w.entities.t.x = 20.92;
    w.entities.t.z = 20;
    w.entities.p.rotation = 0;
    delete w.entities.g;
    expect(connectedWallGroup(w, w.entities.p)).toHaveLength(2);
    command(w, { type: "upgradeWall", targetId: "p" });
    expect(connectedWallGroup(w, w.entities.p)).toHaveLength(2);
  });
});
