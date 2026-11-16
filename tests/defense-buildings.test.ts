import { it, expect } from "vitest";
import {
  createWorld,
  getEntities,
  command,
  step,
  postCapacity,
  isWalkable,
  type Entity,
} from "../src/simulation";
import { createTestSettlement } from "../src/qa";
import { validateSave } from "../src/save";
function setup() {
  const w = createWorld(),
    hero = getEntities(w).find((e) => e.kind === "hero")!;
  hero.x = 10;
  hero.z = 20;
  w.entities = { [hero.id]: hero };
  w.raidTimer = 1e8;
  w.nextMerchantAt = 1e8;
  const b = (type: string, x = 20, z = 20): Entity => {
    const e: Entity = {
      id: type,
      kind: "building",
      type,
      label: type,
      x,
      z,
      hp: 600,
      maxHp: 600,
      faction: "player",
      open: true,
    };
    w.entities[e.id] = e;
    return e;
  };
  return { w, b };
}
function run(w: ReturnType<typeof createWorld>, t: number) {
  for (let i = 0; i < t * 10; i++) step(w, 0.1);
}
it("bastion accepts exactly three archers and evacuates all when destroyed", () => {
  const { w, b } = setup(),
    post = b("bastion");
  for (let i = 0; i < 4; i++) {
    const e: Entity = {
      id: "a" + i,
      kind: "archer",
      type: "archer",
      label: "Łucznik",
      x: 18,
      z: 19 + i * 0.2,
      hp: 70,
      maxHp: 70,
      faction: "player",
    };
    w.entities[e.id] = e;
    expect(
      command(w, { type: "garrison", actorId: e.id, targetId: post.id }).ok,
    ).toBe(i < 3);
  }
  expect(postCapacity(w, post)).toBe(false);
  run(w, 3);
  expect(getEntities(w).filter((e) => e.garrisonId === post.id)).toHaveLength(
    3,
  );
  expect(validateSave(JSON.parse(JSON.stringify(w)))).toBeDefined();
  post.hp = 0;
  run(w, 0.1);
  expect(getEntities(w).filter((e) => e.garrisonId === post.id)).toHaveLength(
    0,
  );
});
it("ballista fires slowly and deals double damage to a ram", () => {
  const { w, b } = setup();
  b("ballistaTower");
  const ram: Entity = {
    id: "ram",
    kind: "enemy",
    type: "ram",
    label: "Taran",
    x: 27,
    z: 20,
    hp: 500,
    maxHp: 500,
    faction: "enemy",
  };
  w.entities.ram = ram;
  run(w, 0.1);
  expect(ram.hp).toBe(410);
  run(w, 1);
  expect(ram.hp).toBe(410);
  run(w, 2.2);
  expect(ram.hp).toBe(320);
});
it("traps hurt and slow only hostile units", () => {
  const { w, b } = setup();
  b("spikePit");
  const foe: Entity = {
    id: "foe",
    kind: "enemy",
    type: "bandit",
    label: "Wróg",
    x: 20,
    z: 20,
    hp: 100,
    maxHp: 100,
    faction: "enemy",
  };
  w.entities.foe = foe;
  const friendly: Entity = {
    ...foe,
    id: "friendly",
    kind: "soldier",
    faction: "player",
  };
  w.entities.friendly = friendly;
  step(w, 0.1);
  expect(foe.slowFactor).toBe(0.35);
  expect(foe.hp).toBeLessThan(100);
  expect(friendly.slowFactor).toBeUndefined();
});
it("rally assignment responds to alarm, and fort armory heals outside combat", () => {
  const { w, b } = setup(),
    rally = b("rallyPoint");
  b("fortressArmory", 22, 20);
  const u: Entity = {
    id: "defender",
    kind: "soldier",
    type: "shieldbearer",
    label: "Obrońca",
    x: 23,
    z: 21,
    hp: 70,
    maxHp: 140,
    faction: "player",
  };
  w.entities[u.id] = u;
  expect(command(w, { type: "assignRally", buildingId: rally.id }).ok).toBe(
    true,
  );
  command(w, { type: "alarm" });
  expect(u.order?.type).toBe("move");
  run(w, 8);
  expect(u.hp).toBeGreaterThan(70);
});
it("test settlement contains seven defenses and a three-archer bastion without duplication", () => {
  const w = createTestSettlement();
  for (const type of [
    "bastion",
    "ballistaTower",
    "spikePit",
    "chevaux",
    "fortifiedGate",
    "rallyPoint",
    "fortressArmory",
  ])
    expect(getEntities(w).some((e) => e.type === type)).toBe(true);
  const bastion = getEntities(w).find((e) => e.type === "bastion")!;
  expect(
    getEntities(w).filter((e) => e.garrisonTargetId === bastion.id),
  ).toHaveLength(3);
});

it("fortified gate can close its actual passage and open it again", () => {
  const { w, b } = setup(),
    gate = b("fortifiedGate");
  gate.gateMode = "manual";
  expect(command(w, { type: "toggle", targetId: gate.id }).ok).toBe(true);
  step(w, 0.1);
  expect(gate.open).toBe(false);
  expect(isWalkable(w, gate.x, gate.z)).toBe(false);
  expect(command(w, { type: "toggle", targetId: gate.id }).ok).toBe(true);
  expect(isWalkable(w, gate.x, gate.z)).toBe(true);
});
