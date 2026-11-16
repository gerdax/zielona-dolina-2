import { describe, it, expect } from "vitest";
import {
  createWorld,
  getEntities,
  command,
  wallRepairAvailable,
  type Entity,
} from "../src/simulation";
import { validateSave } from "../src/save";
function scene() {
  const w = createWorld(),
    h = getEntities(w).find((e) => e.kind === "hero")!,
    model = getEntities(w).find((e) => e.kind === "building")!;
  const parts: Entity[] = [
    {
      ...model,
      id: "wall1",
      type: "wall",
      x: 20,
      z: 20,
      rotation: 1,
      hp: 200,
      maxHp: 200,
    },
    {
      ...model,
      id: "wall2",
      type: "palisade",
      x: 21,
      z: 20,
      rotation: 1,
      hp: 15,
      maxHp: 65,
    },
    {
      ...model,
      id: "tower",
      type: "stoneTower",
      x: 22,
      z: 20,
      hp: 100,
      maxHp: 350,
      occupantId: "a",
    },
    {
      ...model,
      id: "gate",
      type: "woodGate",
      x: 22.825,
      z: 20,
      hp: 30,
      maxHp: 90,
      open: false,
      gateMode: "manual",
    },
    { ...model, id: "far", type: "wall", x: 28, z: 20, hp: 10, maxHp: 200 },
    { ...model, id: "house", type: "house", x: 20, z: 23, hp: 10, maxHp: 120 },
  ];
  w.entities = Object.fromEntries([h, ...parts].map((e) => [e.id, e]));
  w.resources.wood = 100;
  w.resources.stone = 100;
  return w;
}
describe("repair connected fortifications", () => {
  it("shows aggregate cost from a healthy anchor and repairs walls, gate and occupied tower", () => {
    const w = scene(),
      ids = Object.keys(w.entities),
      plan = wallRepairAvailable(w, "wall1");
    expect(plan.ok).toBe(true);
    expect(plan.cost).toEqual({ wood: 45, stone: 30 });
    expect(plan.parts.sort()).toEqual(["gate", "tower", "wall2"]);
    expect(command(w, { type: "repairWall", targetId: "wall1" }).ok).toBe(true);
    for (const id of ["wall1", "wall2", "tower", "gate"])
      expect(w.entities[id].hp).toBe(w.entities[id].maxHp);
    expect(w.resources.wood).toBe(55);
    expect(w.resources.stone).toBe(70);
    expect(Object.keys(w.entities)).toEqual(ids);
    expect(w.entities.gate.open).toBe(false);
    expect(w.entities.gate.gateMode).toBe("manual");
    expect(w.entities.tower.occupantId).toBe("a");
    expect(w.entities.far.hp).toBe(10);
    expect(w.entities.house.hp).toBe(10);
    // Remove synthetic occupancy before testing a complete save's reference validation.
    delete w.entities.tower.occupantId;
    expect(validateSave(JSON.parse(JSON.stringify(w)))).toEqual(w);
  });
  it("does not partially repair or charge when materials cannot pay the total", () => {
    const w = scene();
    w.resources.stone = 29;
    const before = structuredClone(w);
    expect(command(w, { type: "repairWall", targetId: "gate" }).ok).toBe(false);
    expect(w.entities).toEqual(before.entities);
    expect(w.resources).toEqual(before.resources);
  });
  it("never charges twice and refuses unrelated anchors", () => {
    const w = scene();
    command(w, { type: "repairWall", targetId: "wall1" });
    const before = { ...w.resources };
    expect(command(w, { type: "repairWall", targetId: "tower" }).ok).toBe(
      false,
    );
    expect(w.resources).toEqual(before);
    expect(command(w, { type: "repairWall", targetId: "house" }).ok).toBe(
      false,
    );
  });
  it("leaves foreign parts and ruins unchanged", () => {
    const w = scene();
    w.entities.gate.faction = "enemy";
    w.entities.far.kind = "ruin";
    w.entities.far.type = "ruin";
    expect(command(w, { type: "repairWall", targetId: "wall1" }).ok).toBe(true);
    expect(w.entities.gate.hp).toBe(30);
    expect(w.entities.far.kind).toBe("ruin");
    expect(w.resources.wood).toBe(70);
  });
});
