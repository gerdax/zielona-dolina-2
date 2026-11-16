import { buildingDefs } from "./content";
import { addonsFor, collectTaskGems } from "./addons";
import {
  createWorld,
  canBuild,
  command,
  isWalkable,
  findPath,
  refreshWater,
  getEntities,
  type World,
  type Entity,
} from "./simulation";
/** Development-only reproducible stress scene. Never saved into a campaign. */
export function createStressWorld(): World {
  const w = createWorld();
  w.raidTimer = 10000;
  for (const e of getEntities(w))
    if (["tree", "rock", "enemy"].includes(e.kind) && e.z > 34 && e.x < 31)
      delete w.entities[e.id];
  for (let i = 0; i < 100; i++) {
    const ally = i < 50,
      x = ally ? 14 + (i % 7) : 25 + ((i - 50) % 5),
      z = 38 + Math.floor((ally ? i : i - 50) / 7);
    const id = "stress-" + i;
    const e: Entity = {
      id,
      kind: ally ? (i % 3 ? "soldier" : "archer") : "enemy",
      type: ally ? "soldier" : "raider",
      label: ally ? "Strażnik" : "Najeźdźca",
      x,
      z,
      hp: 500,
      maxHp: 500,
      faction: ally ? "player" : "enemy",
    };
    w.entities[id] = e;
  }
  for (const e of getEntities(w).filter((e) => e.id.startsWith("stress-"))) {
    const target = getEntities(w).find(
      (t) => t.id.startsWith("stress-") && t.faction !== e.faction,
    )!;
    e.order = { type: "attack", targetId: target.id };
  }
  return w;
}

/** A playable workshop settlement, separate from the campaign save. */
export function createTestSettlement(): World {
  const w = createWorld();
  w.raidTimer = 3600;
  w.nextMerchantAt = 90;
  for (const e of getEntities(w))
    if (
      ["tree", "rock", "enemy"].includes(e.kind) &&
      e.x < 31 &&
      e.z >= 17 &&
      e.z <= 44
    )
      delete w.entities[e.id];
  const place = (type: string, x: number, z: number, rotation = 0) => {
    const d = buildingDefs[type],
      id = "test-" + w.nextId++;
    const e: Entity = {
      id,
      kind: "building",
      type,
      label: d.label,
      x,
      z,
      rotation,
      faction: "player",
      hp: d.hp,
      maxHp: d.hp,
      open: true,
      material: d.material,
    };
    if ((d.behavior || type) === "gate")
      e.gateMode = type === "woodGate" ? "manual" : "auto";
    w.entities[id] = e;
    return e;
  };
  for (const [type, x, z] of [
    ["barracks", 12, 32],
    ["forge", 10, 35],
    ["hospital", 19, 28],
    ["market", 19, 32],
    ["quarry", 9, 38],
    ["stable", 13, 39],
    ["camelYard", 17, 39],
    ["castle", 14, 26],
    ["house", 10, 27],
    ["house", 18, 25],
    ["warehouse", 8, 25],
    ["warehouse", 8, 29],
    ["warehouse", 8, 33],
    ["warehouse", 8, 41],
    ["warehouse", 11, 42],
    ["warehouse", 14, 43],
  ] as [string, number, number][])
    place(type, x, z);
  for (let x = 10; x <= 20; x++) place("palisade", x, 21, 1);
  place("tower", 9, 21);
  place("tower", 21, 21);
  // Side-snapped gate demonstrates upgrading a mixed connected fortification.
  place("woodGate", 21.825, 21);
  for (let z = 25; z <= 28; z++) place("wall", 25, z);
  place("stoneTower", 25, 29);
  for (let x = 27; x <= 30; x++) {
    const e = place("canal", x, 38);
    e.channel = true;
  }
  for (let z = 36; z <= 40; z++) {
    const e = place("ravine", 21, z);
    e.channel = true;
  }
  for (let x = 31; x <= 33; x++) place("stoneBridge", x, 38);
  for (let i = 0; i < 8; i++) {
    const id = "test-archer-" + i;
    const post =
      i < 3
        ? getEntities(w).find(
            (e) => e.type === "palisade" && e.x === 12 + i * 2 && e.z === 21,
          )
        : undefined;
    const a: Entity = {
      id,
      kind: "archer",
      type: "archer",
      label: "Łucznik " + (i + 1),
      x: post?.x ?? 17 + (i % 4),
      z: post?.z ?? 34 + Math.floor(i / 4),
      hp: 70,
      maxHp: 70,
      faction: "player",
    };
    if (post) {
      a.garrisonId = post.id;
      a.elevation = 1;
      post.occupantId = id;
    }
    w.entities[id] = a;
  }
  for (const [kind, x, z] of [
    ["soldier", 19, 35],
    ["shieldbearer", 20, 35],
    ["horse", 16, 37],
    ["horse", 17, 37],
  ] as const) {
    const id = "test-unit-" + w.nextId++;
    w.entities[id] = {
      id,
      kind: kind === "shieldbearer" ? "soldier" : kind,
      type: kind,
      label: kind === "horse" ? "Koń testowy" : "Straż osady",
      x,
      z,
      hp: 100,
      maxHp: 100,
      faction: "player",
    };
  }
  w.resources = { wood: 1500, stone: 1500, food: 1500, gold: 5000, iron: 300 };
  refreshWater(w);
  collectTaskGems(w);
  addonsFor(w).gems = 500;
  equipTestSettlement(w);
  return w;
}

/** Add the new workshop facilities once, without resetting an existing test village. */
export function equipTestSettlement(w: World): boolean {
  const supplies = !w.testSupplyGranted;
  if (supplies) {
    grantTestResources(w);
    w.testSupplyGranted = true;
  }
  if ((w.testExpansionVersion || 0) >= 4) return supplies;
  const resources = w.resources;
  w.resources = {
    wood: 100000,
    stone: 100000,
    food: 100000,
    gold: 100000,
    iron: 100000,
  };
  const spot = (
    at: { x: number; z: number },
    check: (x: number, z: number) => boolean,
    radius = 6,
  ) => {
    for (let r = 0; r <= radius; r++)
      for (let dx = -r; dx <= r; dx++)
        for (let dz = -r; dz <= r; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const x = Math.round(at.x) + dx,
            z = Math.round(at.z) + dz;
          if (check(x, z)) return { x, z };
        }
  };
  const empty = (x: number, z: number) =>
    isWalkable(w, x, z) &&
    !getEntities(w).some((e) => e.hp > 0 && Math.hypot(e.x - x, e.z - z) < 0.8);
  try {
    const specs: [string, number, number][] = [
      ["wallStairs", 16, 22],
      ["signalTower", 25, 19],
      ["repairWorkshop", 24, 31],
      ["merchantPost", 24, 35],
      ["shipyard", 30, 34],
      ["waterGate", 32, 36],
      ["firehouse", 23, 38],
      ["inn", 22, 42],
      ["granary", 18, 42],
      ["stable", 16, 38],
      ["well", 25, 39],
      ["mill", 27, 38],
      ["bastion", 19, 46],
      ["ballistaTower", 23, 46],
      ["fortifiedGate", 21, 46],
      ["spikePit", 24, 48],
      ["chevaux", 25, 48],
      ["rallyPoint", 20, 43],
      ["fortressArmory", 16, 45],
    ];
    const added = new Map<string, Entity>();
    for (const [type, x, z] of specs) {
      let building = getEntities(w).find(
        (e) =>
          e.kind === "building" &&
          e.faction === "player" &&
          e.type === type &&
          e.hp > 0,
      );
      if (!building) {
        const p = spot({ x, z }, (x, z) => canBuild(w, type, x, z).ok);
        if (!p) continue;
        const d = buildingDefs[type],
          id = "test-expanded-" + w.nextId++;
        building = {
          id,
          kind: "building",
          type,
          label: d.label,
          ...p,
          rotation: 0,
          faction: "player",
          hp: d.hp,
          maxHp: d.hp,
          material: d.material,
          open: true,
        };
        if (type === "waterGate") building.gateMode = "auto";
        w.entities[id] = building;
      }
      added.set(type, building);
    }
    for (const type of ["repairWorkshop", "shipyard", "firehouse"]) {
      const b = added.get(type);
      if (!b || b.workerId) continue;
      const p = spot(b, empty, 5);
      if (!p) continue;
      const label =
        type === "shipyard"
          ? "Szkutnik"
          : type === "firehouse"
            ? "Strażak testowy"
            : "Rzemieślnik napraw";
      const existing = getEntities(w).find(
        (e) => e.kind === "worker" && e.label === label && !e.workplaceId,
      );
      const id = existing?.id || "test-service-" + w.nextId++;
      if (!existing)
        w.entities[id] = {
          id,
          kind: "worker",
          type: "worker",
          label,
          ...p,
          hp: 60,
          maxHp: 60,
          faction: "player",
        };
      command(w, { type: "assign", workerId: id, buildingId: b.id });
    }
    const station = added.get("firehouse");
    if (station && !w.entities["test-fire-drill"]) {
      const p = spot(
        { x: station.x + 3, z: station.z },
        (x, z) =>
          Math.hypot(x - station.x, z - station.z) <= 7 &&
          canBuild(w, "house", x, z).ok,
      );
      if (p)
        w.entities["test-fire-drill"] = {
          id: "test-fire-drill",
          kind: "building",
          type: "house",
          label: "Chata ćwiczebna",
          ...p,
          faction: "player",
          hp: 200,
          maxHp: 200,
        };
    }
    const bastion = added.get("bastion"),
      rally = added.get("rallyPoint");
    for (let i = 0; i < 5; i++) {
      const id = "test-defense-unit-" + i;
      if (w.entities[id]) continue;
      const p = spot(bastion || { x: 20, z: 44 }, empty, 5);
      if (!p) continue;
      const archer = i < 3;
      w.entities[id] = {
        id,
        kind: archer ? "archer" : "soldier",
        type: archer ? "archer" : "shieldbearer",
        label: archer
          ? "Łucznik bastionu " + (i + 1)
          : "Obrońca punktu " + (i - 2),
        ...p,
        hp: archer ? 70 : 140,
        maxHp: archer ? 70 : 140,
        faction: "player",
        rallyId: rally?.id,
      };
      if (archer && bastion)
        command(w, { type: "garrison", actorId: id, targetId: bastion.id });
    }
    const post = added.get("merchantPost");
    if (post && !getEntities(w).some((e) => e.tradeRoute?.homeId === post.id))
      command(w, { type: "hireMerchant", buildingId: post.id });
    const yard = added.get("shipyard");
    let boat = getEntities(w).find(
      (e) => e.type === "transportBoat" && e.faction === "player" && e.hp > 0,
    );
    if (yard && !boat) {
      command(w, {
        type: "buildBoat",
        buildingId: yard.id,
        vessel: "transportBoat",
      });
      boat = getEntities(w).find(
        (e) => e.type === "transportBoat" && e.faction === "player" && e.hp > 0,
      );
    }
    if (boat)
      for (let i = 0; i < 3; i++) {
        const id = "test-expansion-crew-" + i;
        if (w.entities[id]) continue;
        const p = spot(
          boat,
          (x, z) => Math.hypot(x - boat!.x, z - boat!.z) <= 3 && empty(x, z),
          3,
        );
        if (!p) continue;
        w.entities[id] = {
          id,
          kind: "soldier",
          type: i === 2 ? "shieldbearer" : "soldier",
          label: "Załoga testowa " + (i + 1),
          ...p,
          hp: 100,
          maxHp: 100,
          faction: "player",
        };
      }
    if (
      added.size === specs.length &&
      ["repairWorkshop", "shipyard", "firehouse"].every(
        (type) => added.get(type)?.workerId,
      )
    )
      w.testExpansionVersion = w.entities["test-fire-drill"] ? 4 : 2;
    return added.size > 0;
  } finally {
    w.resources = resources;
  }
}

/** Repeatable drill changes only the dedicated training hut, never a player's building. */
export function startTestFire(w: World) {
  const hut = w.entities["test-fire-drill"];
  if (!hut) return { ok: false, message: "Brak chaty ćwiczebnej" };
  const station = getEntities(w).find(
    (e) =>
      e.type === "firehouse" &&
      e.hp > 0 &&
      e.faction === "player" &&
      Math.hypot(e.x - hut.x, e.z - hut.z) <= 10 &&
      w.entities[e.workerId || ""]?.workplaceId === e.id,
  );
  if (!station)
    return { ok: false, message: "Przydziel strażaka w pobliskiej remizie" };
  hut.kind = "building";
  hut.type = "house";
  hut.label = "Chata ćwiczebna";
  hut.faction = "player";
  hut.hp = hut.maxHp = 200;
  hut.fire = 12;
  return {
    ok: true,
    message: "Pożar ćwiczebny — strażak rusza do chaty",
    target: hut,
  };
}

export const testRaidEnemies = (w: World) =>
  getEntities(w).filter(
    (e) => e.id.startsWith("test-raid-") && e.faction === "enemy" && e.hp > 0,
  );
export function finishTestRaid(w: World, cancel = false) {
  if (w.testRaidAlarmWasOn === undefined) return false;
  if (!cancel && testRaidEnemies(w).length) return false;
  if (cancel) for (const e of testRaidEnemies(w)) delete w.entities[e.id];
  const restore = w.testRaidAlarmWasOn;
  delete w.testRaidAlarmWasOn;
  if (!restore && w.alarm) command(w, { type: "alarm" });
  return true;
}
export const testRaidLevels = {
  small: { label: "Mały", troops: 5, rams: 1, catapults: 0 },
  medium: { label: "Średni", troops: 12, rams: 2, catapults: 1 },
  large: { label: "Duży", troops: 24, rams: 4, catapults: 3 },
} as const;
export type TestRaidLevel = keyof typeof testRaidLevels;
export function startTestRaid(w: World, level: TestRaidLevel = "small") {
  const fail = (message: string) => ({
    ok: false,
    message,
    target: undefined as Entity | undefined,
  });
  if (!Object.hasOwn(testRaidLevels, level))
    return fail("Wybierz siłę najazdu");
  const wave = testRaidLevels[level];
  if (testRaidEnemies(w).length) return fail("Najazd ćwiczebny już trwa");
  if (w.defeated) return fail("Najpierw wczytaj osadę z żywym bohaterem");
  const owned = (type: string) =>
    getEntities(w).find(
      (e) =>
        e.kind === "building" &&
        e.type === type &&
        e.hp > 0 &&
        e.faction === "player",
    );
  const rally = owned("rallyPoint"),
    ballista = owned("ballistaTower"),
    pit = owned("spikePit"),
    obstacle = owned("chevaux");
  if (!rally || !ballista || !pit || !obstacle)
    return fail(
      "Potrzebne: punkt zbiórki, balista, wilcze doły i kozły obronne",
    );
  const enemies: Entity[] = [];
  for (let i = 0; i < wave.troops + wave.rams + wave.catapults; i++) {
    const type =
      i < wave.troops
        ? "trainingRaider"
        : i < wave.troops + wave.rams
          ? "ram"
          : "catapult";
    const hp = type === "ram" ? 600 : type === "catapult" ? 350 : 150;
    const e: Entity = {
      id: "test-raid-" + (w.nextId + i),
      kind: "enemy",
      type,
      label:
        type === "ram"
          ? "Taran ćwiczebny"
          : type === "catapult"
            ? "Katapulta ćwiczebna"
            : "Najeźdźca ćwiczebny " + (i + 1),
      x: 0,
      z: 0,
      hp,
      maxHp: hp,
      faction: "enemy",
    };
    let route: ReturnType<typeof findPath> = null;
    search: for (let r = 0; r <= 8; r++)
      for (let dx = -r; dx <= r; dx++)
        for (let dz = -r; dz <= r; dz++) {
          const x = Math.round(obstacle.x) + dx,
            z = Math.round(obstacle.z) + 6 + dz;
          if (
            !isWalkable(w, x, z, e) ||
            getEntities(w).some((u) => Math.hypot(u.x - x, u.z - z) < 0.8) ||
            enemies.some((u) => Math.hypot(u.x - x, u.z - z) < 0.8)
          )
            continue;
          e.x = x;
          e.z = z;
          const first = findPath(w, e, obstacle),
            second = findPath(w, { ...e, x: obstacle.x, z: obstacle.z }, pit),
            last = findPath(w, { ...e, x: pit.x, z: pit.z }, rally, true);
          if (first && second && last) {
            route = [...first, ...second, ...last];
            break search;
          }
        }
    if (!route)
      return fail("Brak dostępnej drogi przez pułapki do punktu zbiórki");
    e.order = { type: "raid", targetId: rally.id, path: route };
    enemies.push(e);
  }
  w.testDefenseBlueprints = structuredClone(
    getEntities(w).filter(
      (e) =>
        e.kind === "building" &&
        e.faction === "player" &&
        isTestDefense(e.type),
    ),
  );
  w.testDefenderBlueprints = structuredClone(
    getEntities(w).filter(
      (e) => e.id.startsWith("test-defense-unit-") && e.faction === "player",
    ),
  );
  w.testRaidAlarmWasOn = w.alarm;
  for (const e of enemies) w.entities[e.id] = e;
  w.nextId += enemies.length;
  // Only the dedicated test defenders are assigned automatically.
  for (const u of getEntities(w).filter(
    (e) => e.id.startsWith("test-defense-unit-") && e.faction === "player",
  ))
    u.rallyId = rally.id;
  if (!w.alarm) command(w, { type: "alarm" });
  else
    for (const u of getEntities(w).filter(
      (e) =>
        e.id.startsWith("test-defense-unit-") &&
        e.faction === "player" &&
        !e.garrisonId &&
        !e.garrisonTargetId,
    ))
      command(w, { type: "move", ids: [u.id], x: rally.x, z: rally.z });
  return {
    ok: true,
    message: `${wave.label} najazd: ${wave.troops} napastników, ${wave.rams} taranów, ${wave.catapults} katapult · alarm!`,
    target: ballista,
  };
}

export function grantTestResources(w: World) {
  for (const key of ["wood", "stone", "food", "gold", "iron"] as const)
    w.resources[key] += 100000;
  w.testResourceCapacity = Math.max(
    w.testResourceCapacity || 0,
    ...[
      w.resources.wood,
      w.resources.stone,
      w.resources.food,
      w.resources.iron,
    ],
  );
}

const isTestDefense = (type: string) =>
  buildingDefs[type]?.category === "obrona" ||
  ["wall", "gate", "tower", "barracks", "forge"].includes(
    buildingDefs[type]?.behavior || type,
  );
export function restoreTestDefenses(w: World) {
  if (testRaidEnemies(w).length)
    return { ok: false, message: "Najpierw zakończ najazd ćwiczebny" };
  const plans = new Map((w.testDefenseBlueprints || []).map((e) => [e.id, e]));
  for (const e of getEntities(w)) {
    const type = e.kind === "ruin" ? e.originalType : e.type;
    if (
      type &&
      isTestDefense(type) &&
      (e.faction === "player" || e.originalFaction === "player")
    )
      plans.set(e.id, {
        ...(plans.get(e.id) || e),
        type,
        kind: "building",
        faction: "player",
      });
  }
  for (const plan of plans.values()) {
    const current = w.entities[plan.id];
    if (current && current.faction === "enemy")
      return { ok: false, message: "Obrona jest zajęta przez wroga" };
    if (!current || current.kind === "ruin") {
      if (
        getEntities(w).some(
          (e) =>
            e.hp > 0 &&
            e.id !== plan.id &&
            !e.carriedBy &&
            !e.garrisonId &&
            Math.hypot(e.x - plan.x, e.z - plan.z) < 0.75,
        )
      )
        return {
          ok: false,
          message: "Zwolnij miejsce odbudowy: " + plan.label,
        };
    }
  }
  let repaired = 0,
    rebuilt = 0;
  for (const plan of plans.values()) {
    const current = w.entities[plan.id],
      wasRuined = !current || current.kind === "ruin";
    const b = current || structuredClone(plan);
    if (wasRuined) rebuilt++;
    else if (b.hp < b.maxHp || b.fire) repaired++;
    Object.assign(b, {
      kind: "building",
      type: plan.type,
      faction: "player",
      label: buildingDefs[plan.type].label,
      maxHp: buildingDefs[plan.type].hp,
      hp: buildingDefs[plan.type].hp,
      fire: undefined,
      siegeCollapse: undefined,
      lastHit: undefined,
      lastAttack: undefined,
      pendingClose: false,
    });
    if (wasRuined) {
      b.material = buildingDefs[plan.type].material;
      b.open = true;
      b.gateMode = plan.gateMode;
      b.links = plan.links;
    }
    w.entities[b.id] = b;
  }
  let defenders = 0;
  for (const plan of w.testDefenderBlueprints || []) {
    let u = w.entities[plan.id];
    if (!u) {
      let spot: { x: number; z: number } | undefined;
      search: for (let r = 1; r <= 8; r++)
        for (let dx = -r; dx <= r; dx++)
          for (let dz = -r; dz <= r; dz++) {
            const x = Math.round(plan.x) + dx,
              z = Math.round(plan.z) + dz;
            if (
              isWalkable(w, x, z) &&
              !getEntities(w).some(
                (e) => e.hp > 0 && Math.hypot(e.x - x, e.z - z) < 0.8,
              )
            ) {
              spot = { x, z };
              break search;
            }
          }
      if (!spot) continue;
      u = {
        ...structuredClone(plan),
        ...spot,
        garrisonId: undefined,
        garrisonTargetId: undefined,
        garrisonEntryId: undefined,
        wallWalk: undefined,
        elevation: 0,
        order: undefined,
        carriedBy: undefined,
      };
      w.entities[u.id] = u;
      defenders++;
      const post = w.entities[plan.garrisonId || plan.garrisonTargetId || ""];
      if (post && u.kind === "archer")
        command(w, { type: "garrison", actorId: u.id, targetId: post.id });
    }
    u.hp = u.maxHp;
    const post = w.entities[plan.garrisonId || plan.garrisonTargetId || ""];
    if (post && u.kind === "archer" && !u.garrisonId && !u.garrisonTargetId)
      command(w, { type: "garrison", actorId: u.id, targetId: post.id });
  }
  return {
    ok: true,
    message: `Obrona gotowa · naprawiono ${repaired}, odbudowano ${rebuilt}, przywrócono obrońców ${defenders}`,
  };
}

export function startTestBoltImpact(w: World, ballistaId: string) {
  const tower = w.entities[ballistaId];
  if (
    !tower ||
    tower.type !== "ballistaTower" ||
    tower.hp <= 0 ||
    tower.faction !== "player"
  )
    return { ok: false, message: "Wybierz własną balistę" };
  if (testRaidEnemies(w).length)
    return { ok: false, message: "Najpierw zakończ najazd ćwiczebny" };
  const previous = w.entities["test-bolt-target"];
  if (previous?.kind === "building" && previous.hp > 0)
    return { ok: false, message: "Cel ćwiczebny jest już ostrzeliwany" };
  let spot: { x: number; z: number } | undefined;
  search: for (let r = 4; r <= 7; r++)
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++) {
        if (
          Math.max(Math.abs(dx), Math.abs(dz)) !== r ||
          Math.hypot(dx, dz) > 8
        )
          continue;
        const x = Math.round(tower.x) + dx,
          z = Math.round(tower.z) + dz;
        if (canBuild(w, "wall", x, z).ok) {
          spot = { x, z };
          break search;
        }
      }
  if (!spot)
    return { ok: false, message: "Brak wolnego miejsca na cel ćwiczebny" };
  const hp = buildingDefs.wall.hp;
  w.entities["test-bolt-target"] = {
    id: "test-bolt-target",
    kind: "building",
    type: "wall",
    label: "Mur ćwiczebny",
    ...spot,
    hp,
    maxHp: hp,
    faction: "enemy",
    material: "stone",
  };
  return { ok: true, message: "Balista ostrzeliwuje mur ćwiczebny" };
}
