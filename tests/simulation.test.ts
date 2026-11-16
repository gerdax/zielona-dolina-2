import { describe, it, expect } from "vitest";
import {
  createWorld,
  canBuild,
  command,
  step,
  findPath,
  getEntities,
  isWalkable,
  type World,
} from "../src/simulation";
const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 10; i++) step(w, 0.1);
};
const hero = (w: World) => getEntities(w).find((e) => e.kind === "hero")!;
describe("regional simulation", () => {
  it("round trips a save and preserves deterministic production", () => {
    const a = createWorld();
    expect(
      command(a, { type: "build", building: "farm", x: 20, z: 34 }).ok,
    ).toBe(true);
    const b = JSON.parse(JSON.stringify(a)) as World;
    run(a, 30);
    run(b, 30);
    expect(a.resources.food).toBeGreaterThan(110);
    expect(b).toEqual(a);
  });
  it("closed bridge blocks the only crossing and rejects inaccessible orders", () => {
    const w = createWorld(),
      h = hero(w);
    expect(findPath(w, h, { x: 40, z: 30 })).not.toBeNull();
    const b = getEntities(w).find((e) => e.type === "bridge" && e.x === 32)!;
    expect(command(w, { type: "toggle", targetId: b.id }).ok).toBe(true);
    run(w, 1);
    expect(findPath(w, h, { x: 40, z: 30 })).toBeNull();
    expect(command(w, { type: "move", ids: [h.id], x: 40, z: 30 }).ok).toBe(
      false,
    );
  });
  it("cannot close an occupied bridge", () => {
    const w = createWorld(),
      h = hero(w),
      b = getEntities(w).find((e) => e.type === "bridge" && e.x === 32)!;
    h.x = 32;
    h.z = 30;
    expect(command(w, { type: "toggle", targetId: b.id }).ok).toBe(true);
    run(w, 1);
    expect(b.open).toBe(true);
    expect(b.pendingClose).toBe(true);
  });
  it("mount follows the rider and dismount releases horse", () => {
    const w = createWorld(),
      h = hero(w),
      horse = getEntities(w).find((e) => e.kind === "horse")!;
    h.x = horse.x + 1;
    h.z = horse.z;
    expect(command(w, { type: "mount", targetId: horse.id }).ok).toBe(true);
    command(w, { type: "move", ids: [h.id], x: 20, z: 30 });
    run(w, 3);
    expect(horse.x).toBe(h.x);
    expect(command(w, { type: "dismount" }).ok).toBe(true);
    expect(horse.carriedBy).toBeUndefined();
  });
  it("recruits only through a live barracks and consumes resources once", () => {
    const w = createWorld();
    expect(command(w, { type: "recruit", unit: "archer" }).ok).toBe(false);
    expect(
      command(w, { type: "build", building: "barracks", x: 20, z: 34 }).ok,
    ).toBe(true);
    const food = w.resources.food;
    expect(command(w, { type: "recruit", unit: "archer" }).ok).toBe(true);
    expect(w.resources.food).toBe(food - 15);
    run(w, 11);
    expect(getEntities(w).filter((e) => e.kind === "archer")).toHaveLength(1);
    expect(w.recruitQueue).toHaveLength(0);
  });
  it("legacy paused saves keep simulating and invalid construction costs nothing", () => {
    const w = createWorld();
    expect(command(w, { type: "pause" }).ok).toBe(false);
    w.paused = true;
    step(w, 1);
    expect(w.time).toBeGreaterThan(0);
    expect(w.paused).toBe(false);
    const wood = w.resources.wood;
    expect(
      command(w, { type: "build", building: "house", x: 32, z: 32 }).ok,
    ).toBe(false);
    expect(w.resources.wood).toBe(wood);
    expect(isWalkable(w, 32, 32)).toBe(false);
  });
  it("trade pays on return rather than dispatch", () => {
    const w = createWorld();
    w.raidTimer = 10000;
    command(w, { type: "build", building: "market", x: 20, z: 34 });
    const gold = w.resources.gold;
    expect(command(w, { type: "trade" }).ok).toBe(true);
    expect(w.resources.gold).toBe(gold);
    run(w, 70);
    expect(w.resources.gold).toBe(gold + 35);
    expect(getEntities(w).filter((e) => e.kind === "caravan")).toHaveLength(0);
  });
  it("boarding uses the same hero and disembarks only onto land", () => {
    const w = createWorld(),
      h = hero(w);
    h.x = 29;
    h.z = 34;
    expect(
      command(w, { type: "build", building: "dock", x: 30, z: 34 }).ok,
    ).toBe(true);
    const boat = getEntities(w).find((e) => e.kind === "boat")!;
    expect(command(w, { type: "board", targetId: boat.id }).ok).toBe(true);
    run(w, 3); // Walk along the bank to the new berth.
    expect(h.carriedBy).toBe(boat.id);
    expect(command(w, { type: "move", ids: [boat.id], x: 32, z: 39 }).ok).toBe(
      true,
    );
    run(w, 4);
    expect(h.x).toBe(boat.x);
    expect(command(w, { type: "disembark", actorId: boat.id }).ok).toBe(true);
    expect(h.carriedBy).toBeUndefined();
    expect(isWalkable(w, h.x, h.z, h)).toBe(true);
  });
  it("archers approach, climb, and descend without replacing the entity", () => {
    const w = createWorld();
    command(w, { type: "build", building: "barracks", x: 20, z: 34 });
    command(w, { type: "recruit", unit: "archer" });
    run(w, 11);
    const a = getEntities(w).find((e) => e.kind === "archer")!,
      t = getEntities(w).find((e) => e.type === "tower")!;
    expect(
      command(w, { type: "garrison", actorId: a.id, targetId: t.id }).ok,
    ).toBe(true);
    run(w, 10);
    expect(a.garrisonId).toBe(t.id);
    expect(a.elevation).toBe(1);
    command(w, { type: "ungarrison", actorId: a.id });
    run(w, 2);
    expect(a.garrisonId).toBeUndefined();
    expect(a.elevation).toBe(0);
    expect(w.entities[a.id]).toBe(a);
  });
  it("hero death stops the simulation and requires loading", () => {
    const w = createWorld();
    hero(w).hp = 0;
    step(w, 0.1);
    expect(w.defeated).toBe(true);
    expect(w.paused).toBe(true);
    const time = w.time;
    step(w, 1);
    expect(w.time).toBe(time);
  });
});

describe("gameplay review regressions", () => {
  it("finishes the region through economy, trade, recruitment, battle, rebuilding and diplomacy", () => {
    const w = createWorld();
    w.raidTimer = 10000;
    const issue = (c: Parameters<typeof command>[1]) =>
      expect(
        command(w, c).ok,
        JSON.stringify(c) + " " + w.messages[0]?.text,
      ).toBe(true);
    issue({ type: "build", building: "quarry", x: 20, z: 36 });
    issue({ type: "build", building: "barracks", x: 20, z: 34 });
    issue({ type: "build", building: "market", x: 20, z: 38 });
    run(w, 160);
    for (let i = 0; i < 3; i++) issue({ type: "trade" });
    run(w, 140);
    for (let i = 0; i < 4; i++)
      issue({ type: "recruit", unit: "shieldbearer" });
    run(w, 45);
    const troops = getEntities(w)
      .filter((e) => e.kind === "soldier")
      .map((e) => e.id);
    issue({ type: "move", ids: troops, x: 41, z: 41 });
    run(w, 65);
    expect(w.objectives.banditsDefeated).toBe(true);
    expect(w.defeated).toBe(false);
    const ruin = getEntities(w).find((e) => e.regionalRuin)!;
    issue({ type: "rebuild", targetId: ruin.id });
    run(w, 60);
    expect(
      w.objectives.ruinsRestored,
      JSON.stringify({
        resources: w.resources,
        messages: w.messages.slice(0, 4),
        hero: hero(w),
      }),
    ).toBe(true);
    issue({ type: "alliance" });
    run(w, 90);
    issue({ type: "build", building: "castle", x: 18, z: 29 });
    run(w, 1);
    expect(w.victory).toBe(true);
  }, 20000);
  it("pending closure admits only units already on the bridge, then can be cancelled", () => {
    const w = createWorld(),
      h = hero(w),
      b = getEntities(w).find((e) => e.type === "bridge" && e.x === 32)!;
    h.x = 32;
    h.z = 30;
    command(w, { type: "toggle", targetId: b.id });
    const soldier = getEntities(w).find((e) => e.kind === "soldier")!;
    expect(findPath(w, soldier, { x: 40, z: 30 })).toBeNull();
    expect(findPath(w, h, { x: 35, z: 30 })).not.toBeNull();
    command(w, { type: "toggle", targetId: b.id });
    expect(b.pendingClose).toBe(false);
    expect(findPath(w, soldier, { x: 40, z: 30 })).not.toBeNull();
  });
  it("resumes an interrupted move after the bridge reopens", () => {
    const w = createWorld(),
      h = hero(w),
      b = getEntities(w).find((e) => e.type === "bridge" && e.x === 32)!;
    command(w, { type: "move", ids: [h.id], x: 40, z: 30 });
    command(w, { type: "toggle", targetId: b.id });
    run(w, 10);
    expect(h.x).toBeLessThan(31);
    command(w, { type: "toggle", targetId: b.id });
    run(w, 15);
    expect(h.x).toBe(40);
    expect(h.z).toBe(30);
  });
  it("releases workers and cancels training when buildings are destroyed", () => {
    const w = createWorld(),
      lumber = getEntities(w).find((e) => e.type === "lumber")!,
      worker = w.entities[lumber.workerId!]!;
    command(w, { type: "build", building: "barracks", x: 20, z: 34 });
    command(w, { type: "recruit", unit: "archer" });
    const barracks = getEntities(w).find((e) => e.type === "barracks")!;
    lumber.hp = 0;
    barracks.hp = 0;
    run(w, 1);
    expect(worker.workplaceId).toBeUndefined();
    expect(worker.order).toBeUndefined();
    expect(w.recruitQueue).toHaveLength(0);
    run(w, 12);
    expect(getEntities(w).filter((e) => e.kind === "archer")).toHaveLength(0);
  });
  it("enemy breaches fortifications when no path to its target remains", () => {
    const w = createWorld();
    w.raidTimer = 10000;
    const h = hero(w);
    h.x = 7;
    h.z = 7;
    const enemy = getEntities(w).find((e) => e.kind === "enemy")!;
    enemy.x = 7;
    enemy.z = 10;
    enemy.order = { type: "raid", targetId: h.id };
    for (let x = 6; x <= 8; x++)
      for (let z = 6; z <= 8; z++) {
        if (x === 7 && z === 7) continue;
        const id = "wall-test-" + x + "-" + z;
        w.entities[id] = {
          id,
          kind: "building",
          type: "wall",
          label: "Mur",
          x,
          z,
          hp: 200,
          maxHp: 200,
          faction: "player",
        };
      }
    run(w, 4);
    expect(
      getEntities(w).some((e) => e.id.startsWith("wall-test") && e.hp < 200),
    ).toBe(true);
  });
});

describe("secondary regional systems", () => {
  it("declaring war enables real conquest and preserves the town entity", () => {
    const w = createWorld();
    w.raidTimer = 10000;
    command(w, { type: "build", building: "barracks", x: 20, z: 34 });
    for (let i = 0; i < 4; i++)
      expect(command(w, { type: "recruit", unit: "soldier" }).ok).toBe(true);
    run(w, 45);
    const town = getEntities(w).find((e) => e.kind === "town")!;
    expect(command(w, { type: "declareWar", targetId: town.id }).ok).toBe(true);
    expect(town.faction).toBe("enemy");
    const troops = getEntities(w)
      .filter((e) => e.kind === "soldier")
      .map((e) => e.id);
    expect(
      command(w, { type: "attack", ids: troops, targetId: town.id }).ok,
    ).toBe(true);
    run(w, 80);
    expect(w.entities[town.id]).toBe(town);
    expect(town.relation).toBe("conquered");
    expect(town.faction).toBe("player");
  });
  it("auto gates admit friendly units but not a following enemy", () => {
    const w = createWorld(),
      gate = getEntities(w).find((e) => e.type === "gate")!,
      h = hero(w),
      enemy = getEntities(w).find((e) => e.kind === "enemy")!;
    gate.open = true;
    expect(isWalkable(w, gate.x, gate.z, h)).toBe(true);
    expect(isWalkable(w, gate.x, gate.z, enemy)).toBe(false);
    command(w, { type: "gateMode", targetId: gate.id });
    expect(gate.gateMode).toBe("manual");
    expect(isWalkable(w, gate.x, gate.z, enemy)).toBe(true);
  });
  it("planted trees mature and mounted heroes cannot gather", () => {
    const w = createWorld(),
      h = hero(w),
      horse = getEntities(w).find((e) => e.kind === "horse")!;
    expect(command(w, { type: "plant", x: 17, z: 28 }).ok).toBe(true);
    const tree = getEntities(w).find((e) => e.type === "sapling")!;
    run(w, 61);
    expect(tree.type).toBe("tree");
    expect(command(w, { type: "mount", targetId: horse.id }).ok).toBe(true);
    run(w, 5);
    expect(h.mountedOn).toBe(horse.id);
    expect(
      command(w, { type: "gather", ids: [h.id], targetId: tree.id }).ok,
    ).toBe(false);
  });
});

describe("patrols, escorts and civilian protection", () => {
  it("patrol returns to its origin after reaching its endpoint", () => {
    const w = createWorld(),
      s = getEntities(w).find((e) => e.kind === "soldier")!;
    expect(command(w, { type: "patrol", ids: [s.id], x: 25, z: 30 }).ok).toBe(
      true,
    );
    run(w, 3);
    expect(s.order?.phase).toBe("return");
    run(w, 3);
    expect(s.order?.phase).toBe("outbound");
    expect(s.x).toBeLessThan(25);
  });
  it("escort follows the same moving hero and keeps its assignment", () => {
    const w = createWorld(),
      s = getEntities(w).find((e) => e.kind === "soldier")!,
      h = hero(w);
    expect(command(w, { type: "escort", ids: [s.id], targetId: h.id }).ok).toBe(
      true,
    );
    command(w, { type: "move", ids: [h.id], x: 28, z: 30 });
    run(w, 10);
    expect(s.order?.type).toBe("escort");
    expect(s.order?.targetId).toBe(h.id);
    expect(Math.hypot(s.x - h.x, s.z - h.z)).toBeLessThanOrEqual(2.5);
  });
  it("alarm pauses production, preserves jobs, and resumes them after recall", () => {
    const w = createWorld();
    run(w, 10);
    const workers = getEntities(w).filter(
        (e) => e.kind === "worker" && e.workplaceId,
      ),
      jobs = workers.map((e) => e.workplaceId);
    command(w, { type: "alarm" });
    const resources = { ...w.resources };
    run(w, 20);
    expect(w.resources).toEqual(resources);
    expect(workers.map((e) => e.workplaceId)).toEqual(jobs);
    expect(workers.every((e) => e.shelter)).toBe(true);
    command(w, { type: "alarm" });
    run(w, 20);
    expect(w.resources.wood).toBeGreaterThan(resources.wood);
    expect(workers.map((e) => e.workplaceId)).toEqual(jobs);
  });
  it("cleans reciprocal attachments after a mounted horse or hero dies", () => {
    const w = createWorld(),
      h = hero(w),
      horse = getEntities(w).find((e) => e.kind === "horse")!;
    command(w, { type: "mount", targetId: horse.id });
    run(w, 5);
    expect(h.mountedOn).toBe(horse.id);
    horse.hp = 0;
    run(w, 1);
    expect(h.mountedOn).toBeUndefined();
    expect(w.entities[horse.id]).toBeUndefined();
    const w2 = createWorld(),
      h2 = hero(w2),
      horse2 = getEntities(w2).find((e) => e.kind === "horse")!;
    command(w2, { type: "mount", targetId: horse2.id });
    run(w2, 5);
    h2.hp = 0;
    step(w2, 0.1);
    expect(w2.defeated).toBe(true);
    expect(horse2.carriedBy).toBeUndefined();
    expect(h2.mountedOn).toBeUndefined();
  });
  it("warns sixty seconds before the first ten-minute raid", () => {
    const w = createWorld();
    expect(w.raidTimer).toBe(600);
    run(w, 541);
    expect(w.raidWarned).toBe(true);
    expect(w.messages.some((m) => m.text.includes("najazd za minutę"))).toBe(
      true,
    );
    expect(w.raidNumber).toBe(0);
    run(w, 60);
    expect(w.raidNumber).toBe(1);
    expect(w.raidTimer).toBeGreaterThan(718);
    expect(w.raidWarned).toBe(false);
  }, 20000);
});

describe("stop command", () => {
  it("releases a stopped worker and its workplace", () => {
    const w = createWorld();
    const building = getEntities(w).find((e) => e.type === "lumber")!;
    const worker = w.entities[building.workerId!]!;
    expect(command(w, { type: "stop", ids: [worker.id] }).ok).toBe(true);
    expect(worker.workplaceId).toBeUndefined();
    expect(building.workerId).toBeUndefined();
    expect(worker.order).toEqual({ type: "stay", phase: "hold" });
    const wood = w.resources.wood;
    run(w, 20);
    expect(w.resources.wood).toBe(wood);
  });
  it("releases an approaching archer's reservation and pending action", () => {
    const w = createWorld();
    command(w, { type: "build", building: "barracks", x: 20, z: 34 });
    command(w, { type: "recruit", unit: "archer" });
    run(w, 11);
    const archer = getEntities(w).find((e) => e.kind === "archer")!;
    const tower = getEntities(w).find((e) => e.type === "tower")!;
    command(w, { type: "garrison", actorId: archer.id, targetId: tower.id });
    expect(tower.occupantId).toBe(archer.id);
    command(w, { type: "stop", ids: [archer.id] });
    expect(tower.occupantId).toBeUndefined();
    expect(archer.garrisonTargetId).toBeUndefined();
    const position = { x: archer.x, z: archer.z };
    run(w, 5);
    expect({ x: archer.x, z: archer.z }).toEqual(position);
  });
  it("descends smoothly from a post before holding position", () => {
    const w = createWorld();
    command(w, { type: "build", building: "barracks", x: 20, z: 34 });
    command(w, { type: "recruit", unit: "archer" });
    run(w, 11);
    const archer = getEntities(w).find((e) => e.kind === "archer")!;
    const tower = getEntities(w).find((e) => e.type === "tower")!;
    command(w, { type: "garrison", actorId: archer.id, targetId: tower.id });
    run(w, 10);
    expect(archer.elevation).toBe(1);
    command(w, { type: "stop", ids: [archer.id] });
    expect(archer.elevation).toBe(1);
    expect(archer.garrisonId).toBe(tower.id);
    run(w, 0.5);
    expect(archer.elevation).toBeGreaterThan(0);
    expect(archer.elevation).toBeLessThan(1);
    run(w, 1);
    expect(archer.elevation).toBe(0);
    expect(archer.garrisonId).toBeUndefined();
    expect(tower.occupantId).toBeUndefined();
    expect(archer.order).toMatchObject({ type: "stay", phase: "hold" });
  });
  it("keeps rider and passenger attachments when movement is stopped", () => {
    const w = createWorld(),
      h = hero(w);
    const horse = getEntities(w).find((e) => e.kind === "horse")!;
    command(w, { type: "mount", targetId: horse.id });
    run(w, 5);
    command(w, { type: "stop", ids: [h.id, horse.id] });
    expect(h.mountedOn).toBe(horse.id);
    expect(horse.carriedBy).toBe(h.id);
    command(w, { type: "dismount" });
    command(w, { type: "move", ids: [h.id], x: 29, z: 34 });
    run(w, 15);
    command(w, { type: "build", building: "dock", x: 30, z: 34 });
    const boat = getEntities(w).find((e) => e.kind === "boat")!;
    command(w, { type: "board", targetId: boat.id });
    run(w, 3);
    command(w, { type: "stop", ids: [boat.id, h.id] });
    expect(h.carriedBy).toBe(boat.id);
    expect(boat.passengerId).toBe(h.id);
  });
});

describe("drawbridge water clearance", () => {
  it("blocks boats while lowered, permits raised passage, and refuses lowering onto a boat", () => {
    const w = createWorld(),
      h = hero(w);
    command(w, { type: "move", ids: [h.id], x: 29, z: 34 });
    run(w, 15);
    expect(
      command(w, { type: "build", building: "dock", x: 30, z: 34 }).ok,
    ).toBe(true);
    const boat = getEntities(w).find((e) => e.kind === "boat")!;
    const bridge = getEntities(w).find(
      (e) => e.type === "bridge" && e.x === 32,
    )!;
    expect(isWalkable(w, 32, 30, boat)).toBe(false);
    expect(findPath(w, boat, { x: 32, z: 27 })).toBeNull();
    expect(command(w, { type: "board", targetId: boat.id }).ok).toBe(true);
    run(w, 3);
    expect(isWalkable(w, 32, 30, h)).toBe(false);
    command(w, { type: "toggle", targetId: bridge.id });
    run(w, 1);
    expect(bridge.open).toBe(false);
    expect(findPath(w, boat, { x: 32, z: 27 })).not.toBeNull();
    expect(isWalkable(w, 32, 30, boat)).toBe(true);
    expect(isWalkable(w, 32, 30, h)).toBe(true);
    command(w, { type: "move", ids: [boat.id], x: 32, z: 30 });
    run(w, 3);
    const result = command(w, { type: "toggle", targetId: bridge.id });
    expect(result.ok).toBe(false);
    expect(result.message).toBe("Zaczekaj, łódź pod mostem");
    expect(bridge.open).toBe(false);
    expect(h.carriedBy).toBe(boat.id);
    command(w, { type: "move", ids: [boat.id], x: 32, z: 27 });
    run(w, 2);
    expect(command(w, { type: "toggle", targetId: bridge.id }).ok).toBe(true);
    expect(bridge.open).toBe(true);
  });
});

describe("complete construction catalog", () => {
  const funded = () => {
    const w = createWorld();
    w.resources = { wood: 1000, stone: 1000, food: 100, gold: 1000, iron: 100 };
    w.raidTimer = 10000;
    return w;
  };
  const build = (w: World, building: string, x: number, z: number) => {
    const r = command(w, { type: "build", building, x, z });
    expect(r.ok, r.message + " " + building).toBe(true);
    return getEntities(w).find(
      (e) => e.type === building && e.x === x && e.z === z,
    )!;
  };
  it("wells increase real agricultural production and a mill works beside a well", () => {
    const a = funded(),
      b = funded();
    build(a, "field", 20, 36);
    build(b, "field", 20, 36);
    build(b, "well", 21, 36);
    run(a, 45);
    run(b, 45);
    expect(b.resources.food).toBeGreaterThan(a.resources.food);
    build(b, "mill", 23, 36);
    const food = b.resources.food;
    run(b, 30);
    expect(b.resources.food).toBeGreaterThan(food);
    expect(
      getEntities(b).find((e) => e.type === "mill")?.workerId,
    ).toBeTruthy();
  });
  it("gold mines mint coins, trading posts consume wood, and foresters grow real trees", () => {
    const w = funded();
    const lumber = getEntities(w).find((e) => e.type === "lumber")!;
    command(w, { type: "stop", ids: [lumber.workerId!] });
    build(w, "goldMine", 20, 36);
    build(w, "tradingPost", 20, 38);
    build(w, "forester", 17, 38);
    const wood = w.resources.wood,
      gold = w.resources.gold;
    run(w, 85);
    expect(w.resources.gold).toBeGreaterThan(gold);
    expect(w.resources.wood).toBeLessThan(wood);
    expect(
      getEntities(w).some(
        (e) => e.kind === "tree" && e.growth !== undefined && e.type === "tree",
      ),
    ).toBe(true);
  });
  it("floods connected trenches, carries boats through canals, and spans them with fixed bridges", () => {
    const w = funded();
    const h = hero(w);
    command(w, { type: "move", ids: [h.id], x: 27, z: 34 });
    run(w, 8);
    build(w, "trench", 28, 34);
    expect(isWalkable(w, 28, 34, h)).toBe(false);
    build(w, "canal", 29, 34);
    build(w, "canal", 30, 34);
    command(w, { type: "move", ids: [h.id], x: 26, z: 34 });
    run(w, 1);
    build(w, "dock", 27, 34);
    const boat = getEntities(w).find((e) => e.kind === "boat")!;
    expect(isWalkable(w, 29, 34, boat)).toBe(true);
    expect(findPath(w, boat, { x: 31, z: 34 })).not.toBeNull();
    const bridge = build(w, "fixedBridge", 29, 34);
    expect(isWalkable(w, 29, 34, h)).toBe(true);
    expect(isWalkable(w, 29, 34, boat)).toBe(false);
    expect(command(w, { type: "toggle", targetId: bridge.id }).ok).toBe(false);
    expect(command(w, { type: "demolish", targetId: bridge.id }).ok).toBe(true);
    expect(isWalkable(w, 29, 34, boat)).toBe(true);
    expect(isWalkable(w, 29, 34, h)).toBe(false);
  });
  it("upgrades roads and replaces wooden palisades with operating gates", () => {
    const w = funded();
    build(w, "palisade", 20, 36);
    const gate = build(w, "woodGate", 20, 36);
    expect(gate.gateMode).toBe("manual");
    expect(isWalkable(w, 20, 36, hero(w))).toBe(true);
    command(w, { type: "toggle", targetId: gate.id });
    run(w, 1);
    expect(isWalkable(w, 20, 36, hero(w))).toBe(false);
    build(w, "road", 20, 38);
    build(w, "stoneRoad", 20, 38);
    expect(getEntities(w).filter((e) => e.x === 20 && e.z === 38)).toHaveLength(
      1,
    );
  });
  it("camel yards breed mountable animals and workshops create usable siege engines", () => {
    const w = funded();
    build(w, "camelYard", 20, 36);
    build(w, "siegeWorkshop", 20, 38);
    const food = w.resources.food;
    run(w, 61);
    const camel = getEntities(w).find((e) => e.type === "camel")!;
    expect(camel?.kind).toBe("horse");
    expect(command(w, { type: "mount", targetId: camel.id }).ok).toBe(true);
    run(w, 15);
    expect(hero(w).mountedOn).toBe(camel.id);
    expect(command(w, { type: "recruitEngine", engine: "catapult" }).ok).toBe(
      true,
    );
    const engine = getEntities(w).find((e) => e.type === "catapult")!;
    expect(engine.kind).toBe("soldier");
    expect(
      command(w, { type: "move", ids: [engine.id], x: 24, z: 38 }).ok,
    ).toBe(true);
    run(w, 4);
    expect(engine.x).toBe(24);
    expect(food).toBeGreaterThan(0);
  });
});

describe("read-only building preview", () => {
  const check = (
    w: World,
    type: string,
    x: number,
    z: number,
    expected: boolean,
  ) => {
    const before = JSON.stringify(w),
      preview = canBuild(w, type, x, z);
    expect(preview.ok, preview.message).toBe(expected);
    expect(JSON.stringify(w)).toBe(before);
    const copy = JSON.parse(before) as World,
      result = command(copy, { type: "build", building: type, x, z });
    expect(result.ok).toBe(preview.ok);
    if (!expected) {
      expect(result.message).toBe(preview.message);
      expect(copy.resources).toEqual(w.resources);
    }
  };
  it("matches empty, occupied and unaffordable placements without spending resources", () => {
    const w = createWorld();
    check(w, "house", 20, 34, true);
    check(w, "house", 14, 30, false);
    w.resources.wood = 0;
    check(w, "house", 20, 34, false);
  });
  it("recognizes road, gate and trench replacements", () => {
    const w = createWorld();
    command(w, { type: "build", building: "road", x: 20, z: 36 });
    check(w, "stoneRoad", 20, 36, true);
    command(w, { type: "build", building: "palisade", x: 20, z: 38 });
    check(w, "woodGate", 20, 38, true);
    command(w, { type: "build", building: "trench", x: 21, z: 38 });
    check(w, "fixedBridge", 21, 38, true);
    check(w, "house", 21, 38, false);
  });
  it("uses the same water and shoreline requirements as construction", () => {
    const w = createWorld();
    command(w, { type: "move", ids: [hero(w).id], x: 29, z: 34 });
    run(w, 10);
    check(w, "canal", 31, 34, true);
    check(w, "wall", 31, 34, true);
    check(w, "house", 31, 34, false);
    check(w, "dock", 30, 34, true);
    check(w, "dock", 25, 34, false);
    check(w, "mill", 20, 36, false);
    command(w, { type: "build", building: "well", x: 21, z: 36 });
    check(w, "mill", 20, 36, true);
  });
  it("rejects defeated worlds and invalid coordinates identically", () => {
    const w = createWorld();
    check(w, "house", NaN, 34, false);
    check(w, "house", 0, 34, false);
    w.defeated = true;
    check(w, "house", 20, 34, false);
  });
});

describe("connected drawbridge operations", () => {
  it("does not change bridge segments beyond a gap", () => {
    const w = createWorld();
    const left = getEntities(w).find((e) => e.type === "bridge" && e.x === 30)!;
    const missing = getEntities(w).find(
      (e) => e.type === "bridge" && e.x === 32,
    )!;
    delete w.entities[missing.id];
    command(w, { type: "toggle", targetId: left.id });
    run(w, 1);
    expect(
      getEntities(w)
        .filter((e) => e.type === "bridge" && e.x < 32)
        .every((e) => e.open === false),
    ).toBe(true);
    expect(
      getEntities(w)
        .filter((e) => e.type === "bridge" && e.x > 32)
        .every((e) => e.open === true),
    ).toBe(true);
  });
  it("waits for occupancy anywhere in a long connected bridge and closes atomically", () => {
    const w = createWorld(),
      h = hero(w),
      template = getEntities(w).find((e) => e.type === "bridge" && e.x === 30)!;
    for (let x = 35; x <= 39; x++) {
      const id = "extended-" + x;
      w.entities[id] = { ...template, id, x, z: 30 };
    }
    h.x = 39;
    h.z = 30;
    command(w, { type: "toggle", targetId: template.id });
    run(w, 1);
    const bridge = getEntities(w).filter((e) => e.type === "bridge");
    expect(bridge.every((e) => e.pendingClose && e.open)).toBe(true);
    expect(command(w, { type: "move", ids: [h.id], x: 40, z: 30 }).ok).toBe(
      true,
    );
    run(w, 2);
    expect(bridge.every((e) => !e.open && !e.pendingClose)).toBe(true);
  });
});
