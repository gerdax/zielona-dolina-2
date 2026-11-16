import { describe, it, expect } from "vitest";
import {
  createWorld,
  command,
  step,
  getEntities,
  isWalkable,
  findPath,
  threatDirection,
  type Entity,
} from "../src/simulation";
import { validateSave } from "../src/save";
function setup() {
  const w = createWorld(),
    h = getEntities(w).find((e) => e.kind === "hero")!,
    worker = getEntities(w).find((e) => e.kind === "worker")!,
    model = getEntities(w).find((e) => e.kind === "building")!;
  h.x = 20;
  h.z = 20;
  worker.x = 19;
  worker.z = 22;
  worker.order = undefined;
  worker.workplaceId = undefined;
  w.entities = { [h.id]: h, [worker.id]: worker };
  for (let i = 0; i < 3; i++)
    w.entities["store" + i] = {
      ...model,
      id: "store" + i,
      type: "warehouse",
      x: 3 + i * 3,
      z: 3,
    };
  w.resources = { wood: 1000, stone: 1000, food: 1000, gold: 1000, iron: 100 };
  w.raidTimer = 1e8;
  w.nextMerchantAt = 1e8;
  return { w, h, worker };
}
const run = (w: ReturnType<typeof createWorld>, seconds: number) => {
  for (let i = 0; i < seconds * 10; i++) step(w, 0.1);
};
function build(
  w: ReturnType<typeof createWorld>,
  building: string,
  x: number,
  z: number,
) {
  const r = command(w, { type: "build", building, x, z });
  expect(r.ok, r.message).toBe(true);
  return getEntities(w).find(
    (e) => e.type === building && e.x === x && e.z === z,
  )!;
}
describe("six new functional buildings", () => {
  it("water gate admits friendly boats, blocks hostile boats and pedestrians, and changes paths", () => {
    const { w, h } = setup();
    h.x = 30;
    h.z = 22;
    const gate = build(w, "waterGate", 32, 22);
    const own: Entity = {
        ...h,
        id: "own",
        kind: "boat",
        type: "boat",
        x: 32,
        z: 21,
      },
      enemy: Entity = { ...own, id: "enemy", faction: "enemy" };
    expect(isWalkable(w, 32, 22, own)).toBe(true);
    expect(isWalkable(w, 32, 22, enemy)).toBe(false);
    expect(isWalkable(w, 32, 22, h)).toBe(false);
    command(w, { type: "gateMode", targetId: gate.id });
    gate.open = false;
    expect(isWalkable(w, 32, 22, own)).toBe(false);
    command(w, { type: "toggle", targetId: gate.id });
    expect(isWalkable(w, 32, 22, enemy)).toBe(true);
    expect(findPath(w, own, { x: 32, z: 23 })).not.toBeNull();
    expect(
      command(w, { type: "build", building: "waterGate", x: 28, z: 22 }).ok,
    ).toBe(false);
  });
  it("stairs route an existing archer to a nearby post", () => {
    const { w, h } = setup();
    const archer: Entity = {
      ...h,
      id: "archer",
      kind: "archer",
      type: "archer",
      x: 20,
      z: 24,
    };
    w.entities.archer = archer;
    const wall = build(w, "wall", 22, 22),
      stairs = build(w, "wallStairs", 22, 23);
    expect(command(w, { type: "useStairs", targetId: stairs.id }).ok).toBe(
      true,
    );
    expect(archer.garrisonEntryId).toBe(stairs.id);
    run(w, 7);
    expect(archer.garrisonId).toBe(wall.id);
    expect(wall.occupantId).toBe(archer.id);
    expect(archer.elevation).toBe(1);
  });
  it("shipyard launches real vessels, boards troops and preserves everyone in saves and landing", () => {
    const { w, h } = setup();
    h.x = 29;
    h.z = 24;
    const yard = build(w, "shipyard", 30, 24);
    expect(
      command(w, {
        type: "buildBoat",
        buildingId: yard.id,
        vessel: "transportBoat",
      }).ok,
    ).toBe(true);
    const boat = getEntities(w).find((e) => e.type === "transportBoat")!;
    h.x = 30;
    h.z = 26;
    for (let i = 0; i < 3; i++)
      w.entities["soldier" + i] = {
        ...h,
        id: "soldier" + i,
        kind: i === 2 ? "archer" : "soldier",
        type: i === 2 ? "archer" : "soldier",
        x: 30,
        z: 25 + i,
      };
    const count = getEntities(w).length;
    expect(command(w, { type: "loadTroops", targetId: boat.id }).ok).toBe(true);
    expect(boat.passengerIds).toHaveLength(3);
    expect(
      command(w, { type: "board", actorId: h.id, targetId: boat.id }).ok,
    ).toBe(true);
    expect(
      validateSave(JSON.parse(JSON.stringify(w))).entities[boat.id]
        .passengerIds,
    ).toEqual(boat.passengerIds);
    expect(command(w, { type: "unloadTroops", targetId: boat.id }).ok).toBe(
      true,
    );
    expect(boat.passengerIds).toEqual([]);
    expect(getEntities(w).length).toBe(count);
    const troops = getEntities(w).filter((e) => e.id.startsWith("soldier"));
    expect(new Set(troops.map((e) => e.x + "," + e.z)).size).toBe(3);
    expect(troops.every((e) => !e.carriedBy)).toBe(true);
    expect(h.carriedBy).toBe(boat.id);
  });
  it("staffed repair workshop spends materials and repairs only living nearby fortifications", () => {
    const { w, worker } = setup(),
      shop = build(w, "repairWorkshop", 20, 22),
      wall = build(w, "wall", 22, 22);
    wall.hp = 50;
    expect(shop.workerId).toBe(worker.id);
    const wood = w.resources.wood,
      stone = w.resources.stone;
    run(w, 4.5);
    expect(wall.hp).toBe(70);
    expect(w.resources.wood).toBe(wood - 2);
    expect(w.resources.stone).toBe(stone - 1);
    w.resources.wood = 0;
    run(w, 4.5);
    expect(wall.hp).toBe(70);
  });
  it("shipyard worker repairs damaged boats using timber", () => {
    const { w, h, worker } = setup();
    h.x = 29;
    h.z = 24;
    worker.x = 29;
    worker.z = 24;
    const yard = build(w, "shipyard", 30, 24);
    command(w, { type: "buildBoat", buildingId: yard.id, vessel: "boat" });
    const boat = getEntities(w).find((e) => e.kind === "boat")!;
    boat.hp = 50;
    const wood = w.resources.wood;
    run(w, 4.5);
    expect(boat.hp).toBe(70);
    expect(w.resources.wood).toBe(wood - 2);
  });
  it("merchant post hires a real merchant and provides recovery", () => {
    const { w } = setup(),
      post = build(w, "merchantPost", 22, 20);
    expect(command(w, { type: "hireMerchant", buildingId: post.id }).ok).toBe(
      true,
    );
    const merchant = getEntities(w).find((e) => e.tradeRoute)!;
    expect(merchant.tradeRoute?.homeId).toBe(post.id);
    merchant.hp = 50;
    merchant.x = 22;
    merchant.z = 21;
    run(w, 2);
    expect(merchant.hp).toBeGreaterThan(50);
  });
  it("signal tower warns earlier and identifies directions", () => {
    const { w } = setup();
    build(w, "signalTower", 22, 20);
    w.raidTimer = 170;
    step(w, 0.1);
    expect(w.raidWarned).toBe(true);
    expect(w.messages.some((m) => m.text.includes("Wieża sygnałowa"))).toBe(
      true,
    );
    expect(w.raidDirection).toBeDefined();
    expect(threatDirection({ x: 0, z: 0 }, { x: 1, z: -1 })).toBe(
      "północny wschód",
    );
    expect(threatDirection({ x: 0, z: 0 }, { x: -1, z: 0 })).toBe("zachód");
  });
});

describe("expansion edge cases", () => {
  it("runs repeat trade from a merchant post using actual cargo and returns", () => {
    const { w, h } = setup(),
      post = build(w, "merchantPost", 22, 20);
    const town: Entity = {
      ...h,
      id: "town",
      kind: "town",
      type: "town",
      label: "Sąsiad",
      x: 26,
      z: 24,
      faction: "neutral",
      relation: "allied",
    };
    w.entities.town = town;
    command(w, { type: "hireMerchant", buildingId: post.id });
    const merchant = getEntities(w).find((e) => e.tradeRoute)!;
    expect(
      command(w, {
        type: "dispatchMerchant",
        actorId: merchant.id,
        targetId: town.id,
        resource: "wood",
        amount: 20,
        repeat: true,
      }).ok,
    ).toBe(true);
    run(w, 60);
    expect(merchant.tradeRoute!.trips).toBeGreaterThan(0);
    expect(merchant.tradeRoute!.repeat).toBe(true);
    expect(merchant.tradeRoute!.homeId).toBe(post.id);
  });
  it("does not charge for a boat when all available berths are occupied", () => {
    const { w, h } = setup();
    h.x = 29;
    h.z = 24;
    const yard = build(w, "shipyard", 30, 24);
    for (let i = 0; i < 8; i++)
      command(w, { type: "buildBoat", buildingId: yard.id, vessel: "boat" });
    const before = { ...w.resources };
    expect(
      command(w, { type: "buildBoat", buildingId: yard.id, vessel: "boat" }).ok,
    ).toBe(false);
    expect(w.resources).toEqual(before);
  });
  it("releases transported troops onto distinct safe ground after the hull is destroyed", () => {
    const { w, h } = setup();
    h.x = 29;
    h.z = 24;
    const yard = build(w, "shipyard", 30, 24);
    command(w, {
      type: "buildBoat",
      buildingId: yard.id,
      vessel: "transportBoat",
    });
    const boat = getEntities(w).find((e) => e.kind === "boat")!;
    for (let i = 0; i < 3; i++)
      w.entities["crew" + i] = {
        ...h,
        id: "crew" + i,
        kind: "soldier",
        type: "soldier",
        x: 30,
        z: 25 + i,
      };
    command(w, { type: "loadTroops", targetId: boat.id });
    expect(boat.passengerIds).toHaveLength(3);
    boat.hp = 0;
    step(w, 0.1);
    expect(w.entities[boat.id]).toBeUndefined();
    const troops = getEntities(w).filter((e) => e.id.startsWith("crew"));
    expect(troops).toHaveLength(3);
    expect(new Set(troops.map((e) => e.x + "," + e.z)).size).toBe(3);
    expect(troops.every((e) => !e.carriedBy)).toBe(true);
    expect(validateSave(JSON.parse(JSON.stringify(w)))).toEqual(w);
  });
});

describe("protection and safe water-gate closing", () => {
  it("merchant refuge reduces incoming damage without making the merchant invulnerable", () => {
    const { w, h } = setup(),
      post = build(w, "merchantPost", 22, 20);
    command(w, { type: "hireMerchant", buildingId: post.id });
    const merchant = getEntities(w).find((e) => e.tradeRoute)!;
    merchant.x = 22;
    merchant.z = 21;
    merchant.hp = 100;
    w.entities.foe = {
      ...h,
      id: "foe",
      kind: "enemy",
      type: "raider",
      faction: "enemy",
      x: 22,
      z: 22,
      order: { type: "attack", targetId: merchant.id },
    };
    step(w, 0.1);
    expect(merchant.hp).toBeLessThan(100);
    expect(merchant.hp).toBeGreaterThan(90);
  });
  it("waits for a boat already inside and prevents entry while closing", () => {
    const { w, h } = setup();
    h.x = 30;
    h.z = 22;
    const gate = build(w, "waterGate", 32, 22);
    const boat: Entity = {
      ...h,
      id: "boat",
      kind: "boat",
      type: "boat",
      x: 32,
      z: 22,
    };
    w.entities.boat = boat;
    gate.open = true;
    command(w, { type: "toggle", targetId: gate.id });
    expect(gate.pendingClose).toBe(true);
    step(w, 0.1);
    expect(gate.open).toBe(true);
    const outsider = { ...boat, id: "other", z: 21 };
    expect(isWalkable(w, 32, 22, outsider)).toBe(false);
    boat.z = 24;
    step(w, 0.1);
    expect(gate.open).toBe(false);
    expect(gate.pendingClose).toBe(false);
  });
});
