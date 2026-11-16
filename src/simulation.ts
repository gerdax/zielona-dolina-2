import {
  postYaw,
  wallPath,
  wallConnected,
  isWallPost,
  type WallWalk,
} from "./wall-navigation";
import { villageRoadTiles, roadKey } from "./village-roads";
import {
  addonsFor,
  instantAddons,
  type InstantAddonId,
  collectGems,
  collectTaskGems,
  collectRaidGems,
  startRaidReward,
  trackRaidDeath,
  progressFor,
  starterPacks,
  outfits,
  dogCoats,
  bannerColors,
  bannerEmblems,
  type AddonState,
  type Appearance,
} from "./addons";
import {
  merchantOffers,
  merchantHireCost,
  exportPrice,
  exportRates,
  type MerchantRoute,
  type MerchantVisit,
  type TradeResource,
} from "./merchants";
import {
  footprint,
  overlaps,
  covers,
  touching,
  attachmentPoints,
  connectedConstruction,
  transformConstruction,
} from "./construction";
import { connectedBridgeGroup } from "./bridge-groups";
import {
  buildingDefs,
  boatCosts,
  unitCosts,
  engineCosts,
  type Resources,
} from "./content";
export type Faction = "player" | "neutral" | "enemy";
export type EntityKind =
  | "hero"
  | "worker"
  | "soldier"
  | "archer"
  | "dog"
  | "horse"
  | "boat"
  | "enemy"
  | "building"
  | "tree"
  | "rock"
  | "ruin"
  | "town"
  | "caravan"
  | "merchant";
export interface Point {
  x: number;
  z: number;
}
export interface Order {
  type:
    | "move"
    | "attack"
    | "gather"
    | "work"
    | "follow"
    | "stay"
    | "trade"
    | "raid"
    | "patrol"
    | "escort";
  targetId?: string;
  x?: number;
  z?: number;
  path?: Point[];
  timer?: number;
  phase?: string;
  retry?: number;
  destinationId?: string;
  startX?: number;
  startZ?: number;
}
export interface Entity extends Point {
  id: string;
  kind: EntityKind;
  type: string;
  label: string;
  hp: number;
  maxHp: number;
  faction: Faction;
  rotation?: number;
  links?: string[];
  joined?: boolean;
  merchant?: MerchantVisit;
  tradeRoute?: MerchantRoute;
  order?: Order;
  open?: boolean;
  workerId?: string;
  workplaceId?: string;
  cooldown?: number;
  innReadyAt?: number;
  fire?: number;
  fireTargetId?: string;
  slowUntil?: number;
  slowFactor?: number;
  rallyId?: string;
  progress?: number;
  pendingAction?: { type: string; targetId: string };
  mountedOn?: string;
  carriedBy?: string;
  passengerId?: string;
  passengerIds?: string[];
  garrisonEntryId?: string;
  garrisonId?: string;
  wallWalk?: WallWalk;
  occupantId?: string;
  elevation?: number;
  garrisonTargetId?: string;
  descending?: boolean;
  pendingClose?: boolean;
  originalType?: string;
  originalFaction?: Faction;
  regionalRuin?: boolean;
  gateMode?: "auto" | "manual";
  relation?: "neutral" | "allied" | "hostile" | "conquered";
  stock?: number;
  alertCooldown?: number;
  growth?: number;
  shelter?: boolean;
  channel?: boolean;
  bridgeBase?: "trench" | "canal" | "ravine";
  bornAt?: string;
  material?: "wood" | "stone";
  lightRadius?: number;
  lastHit?: number;
  lastDamageKind?: string;
  siegeCollapse?: { time: number; by: "ram" | "catapult" | "ballistaTower" };
  lastAttack?: { time: number; targetId: string; x: number; z: number };
}
export interface World {
  version: 1;
  size: number;
  seed: number;
  testExpansionVersion?: number;
  testDefenseBlueprints?: Entity[];
  testDefenderBlueprints?: Entity[];
  testSupplyGranted?: boolean;
  testResourceCapacity?: number;
  testRaidAlarmWasOn?: boolean;
  addons?: AddonState;
  floodedTiles?: string[];
  removedRoads?: string[];
  nextMerchantAt?: number;
  merchantVisits?: number;
  time: number;
  accumulator: number;
  paused: boolean;
  alarm: boolean;
  raidWarned: boolean;
  raidDirection?: string;
  speed: number;
  entities: Record<string, Entity>;
  resources: Resources;
  nextId: number;
  messages: { time: number; text: string }[];
  victory: boolean;
  defeated: boolean;
  weaponLevel: number;
  objectives: { ruinsRestored: boolean; banditsDefeated: boolean };
  raidTimer: number;
  raidNumber: number;
  recruitQueue: {
    unit: "soldier" | "archer" | "shieldbearer";
    remaining: number;
    buildingId: string;
  }[];
}
export type Command = {
  type: string;
  ids?: string[];
  x?: number;
  z?: number;
  targetId?: string;
  endX?: number;
  endZ?: number;
  actorId?: string;
  workerId?: string;
  buildingId?: string;
  building?: string;
  vessel?: "boat" | "transportBoat";
  rotation?: number;
  attachTo?: string;
  resource?: TradeResource;
  side?: "buy" | "sell";
  addonId?: keyof typeof starterPacks;
  instantId?: InstantAddonId;
  purchaseId?: string;
  deferEffect?: boolean;
  appearanceField?: keyof Appearance;
  appearanceValue?: string;
  amount?: number;
  repeat?: boolean;
  unit?: "soldier" | "archer" | "shieldbearer";
  value?: number;
  engine?: "ram" | "catapult";
};
export interface CommandResult {
  ok: boolean;
  message: string;
}
export const getEntities = (w: World) => Object.values(w.entities);
function add(
  w: World,
  kind: EntityKind,
  type: string,
  label: string,
  x: number,
  z: number,
  faction: Faction = "player",
  hp = 100,
): Entity {
  const id = type + "-" + w.nextId++;
  return (w.entities[id] = {
    id,
    kind,
    type,
    label,
    x,
    z,
    faction,
    hp,
    maxHp: hp,
  });
}
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
const at = (a: Point, x: number, z: number) =>
  Math.round(a.x) === x && Math.round(a.z) === z;
const mobile = (e: Entity) =>
  !["building", "tree", "rock", "ruin", "town"].includes(e.kind);
function announce(w: World, text: string) {
  w.messages.unshift({ time: w.time, text });
  w.messages = w.messages.slice(0, 20);
}
export function createWorld(): World {
  const w: World = {
    version: 1,
    size: 64,
    seed: 872,
    time: 0,
    accumulator: 0,
    paused: false,
    alarm: false,
    raidWarned: false,
    speed: 1,
    entities: {},
    resources: { wood: 160, stone: 100, food: 110, gold: 70, iron: 0 },
    nextId: 1,
    messages: [],
    victory: false,
    defeated: false,
    weaponLevel: 0,
    objectives: { ruinsRestored: false, banditsDefeated: false },
    raidTimer: 600,
    raidNumber: 0,
    recruitQueue: [],
  };
  add(w, "building", "hall", "Dom założyciela", 14, 30, "player", 400);
  add(w, "hero", "hero", "Założyciel", 16, 30, "player", 150);
  for (let i = 0; i < 4; i++)
    add(
      w,
      "worker",
      "worker",
      "Osadnik " + (i + 1),
      16 + (i % 2),
      32 + Math.floor(i / 2),
      "player",
      60,
    );
  add(w, "soldier", "soldier", "Strażnik", 19, 30, "player", 100);
  const dog = add(w, "dog", "dog", "Reks", 17, 31, "player", 60);
  dog.order = {
    type: "follow",
    targetId: getEntities(w).find((e) => e.kind === "hero")!.id,
  };
  add(w, "horse", "horse", "Kasztan", 13, 33, "player", 100);
  for (let x = 30; x <= 34; x++) {
    const b = add(w, "building", "bridge", "Stary most", x, 30, "neutral", 220);
    b.open = true;
  }
  const town = add(w, "town", "town", "Brzeźnica", 47, 22, "neutral", 400);
  town.relation = "neutral";
  const second = add(
    w,
    "town",
    "town",
    "Kamienny Bród",
    48,
    12,
    "neutral",
    400,
  );
  second.relation = "neutral";
  const starters: [string, number, number][] = [
    ["house", 12, 28],
    ["lumber", 10, 31],
    ["farm", 18, 35],
    ["warehouse", 14, 35],
    ["tower", 22, 28],
    ["gate", 22, 30],
  ];
  for (const [type, x, z] of starters) {
    const d = buildingDefs[type],
      b = add(w, "building", type, d.label, x, z, "player", d.hp);
    b.open = true;
    if (type === "gate") b.gateMode = "auto";
  }
  const workers = getEntities(w).filter((e) => e.kind === "worker");
  let assigned = 0;
  for (const b of getEntities(w).filter((e) => buildingDefs[e.type]?.worker))
    assign(w, workers[assigned++], b);
  add(
    w,
    "ruin",
    "ruin",
    "Ruiny strażnicy",
    47,
    45,
    "neutral",
    180,
  ).regionalRuin = true;
  for (let i = 0; i < 4; i++) {
    const e = add(
      w,
      "enemy",
      "bandit",
      "Bandyta",
      43 + (i % 2),
      41 + Math.floor(i / 2),
      "enemy",
      75,
    );
    e.order = { type: "stay" };
  }
  for (let x = 4; x < 60; x += 3)
    for (let z = 4; z < 60; z += 3) {
      if (
        (x * 17 + z * 13) % 11 > 5 ||
        Math.abs(x - 32) < 5 ||
        distance({ x, z }, { x: 16, z: 30 }) < 7 ||
        distance({ x, z }, { x: 47, z: 22 }) < 5 ||
        distance({ x, z }, { x: 44, z: 43 }) < 6 ||
        z === 31
      )
        continue;
      add(
        w,
        (x + z) % 5 === 0 ? "rock" : "tree",
        (x + z) % 5 === 0 ? "rock" : "tree",
        (x + z) % 5 === 0 ? "Skała" : "Drzewo",
        x,
        z,
        "neutral",
        30,
      );
    }
  announce(
    w,
    "Witaj w Zielonej Dolinie. Rozwiń osadę, sprzymierz Brzeźnicę i odbuduj strażnicę.",
  );
  addonsFor(w);
  return w;
}
export function kindOf(e: Entity): string {
  return buildingDefs[e.type]?.behavior || e.type;
}
const waterCache = new WeakMap<
  World,
  { source: string[] | undefined; tiles: Set<string> }
>();
function waterTiles(w: World) {
  let cached = waterCache.get(w);
  if (!cached || cached.source !== w.floodedTiles) {
    cached = { source: w.floodedTiles, tiles: new Set(w.floodedTiles || []) };
    waterCache.set(w, cached);
  }
  return cached.tiles;
}
export function refreshWater(w: World) {
  const channels = new Map(
    getEntities(w)
      .filter(
        (e) => ["trench", "canal", "ravine"].includes(e.type) || e.channel,
      )
      .map((e) => [Math.round(e.x) + "," + Math.round(e.z), e]),
  );
  const wet = new Set<string>(),
    queue: Entity[] = [];
  for (const [key, e] of channels)
    if (
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx]) => e.x + dx >= 31 && e.x + dx <= 33)
    ) {
      wet.add(key);
      queue.push(e);
    }
  for (let i = 0; i < queue.length; i++) {
    const e = queue[i];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const key = e.x + dx + "," + (e.z + dz);
      const next = channels.get(key);
      if (next && !wet.has(key)) {
        wet.add(key);
        queue.push(next);
      }
    }
  }
  w.floodedTiles = [...wet];
}
function passableBuilding(e: Entity) {
  return !!buildingDefs[e.type]?.passable || kindOf(e) === "road";
}
export function terrainAt(
  w: World,
  x: number,
  z: number,
): "grass" | "water" | "sand" {
  if (
    (x >= 31 && x <= 33) ||
    waterTiles(w).has(Math.round(x) + "," + Math.round(z))
  )
    return "water";
  if (x === 30 || x === 34) return "sand";
  return "grass";
}
function enteringAllowed(w: World, b: Entity, e?: Entity): boolean {
  if (b.pendingClose) {
    if (!e) return false;
    const inside =
      kindOf(b) === "bridge"
        ? connectedBridgeGroup(getEntities(w), b).some((v) =>
            at(e, Math.round(v.x), Math.round(v.z)),
          )
        : at(e, Math.round(b.x), Math.round(b.z));
    if (!inside) return false;
  }
  if (kindOf(b) === "gate" || b.type === "waterGate")
    return b.gateMode === "auto"
      ? e?.faction === "player" || e?.type === "merchant"
      : !!b.open;
  return !!b.open;
}
function blocking(w: World, x: number, z: number, e?: Entity) {
  return getEntities(w).find(
    (b) =>
      b.id !== e?.id &&
      (b.joined && b.kind === "building" ? covers(b, x, z) : at(b, x, z)) &&
      (b.kind === "tree" ||
        b.kind === "rock" ||
        b.kind === "town" ||
        b.kind === "ruin" ||
        (b.kind === "building" &&
          !["road", "bridge"].includes(kindOf(b)) &&
          !passableBuilding(b) &&
          !(kindOf(b) === "gate" && enteringAllowed(w, b, e)))),
  );
}
function onLanding(dock: Entity, p: Point, margin = 0) {
  const yaw = ((dock.rotation || 0) * Math.PI) / 2,
    dx = p.x - dock.x,
    dz = p.z - dock.z;
  const x = dx * Math.cos(yaw) - dz * Math.sin(yaw),
    z = dx * Math.sin(yaw) + dz * Math.cos(yaw);
  return x > 0.65 - margin && x < 3.5 + margin && Math.abs(z) < 0.85 + margin;
}
export function boatBerth(
  w: World,
  dock: Entity,
  boat?: Entity,
): Point | undefined {
  const yaw = ((dock.rotation || 0) * Math.PI) / 2;
  for (const [x, z] of [
    [1, 2],
    [1, -2],
    [2, 2],
    [2, -2],
    [4.5, 0],
    [-2, 0],
  ]) {
    const p = {
      x: dock.x + x * Math.cos(yaw) + z * Math.sin(yaw),
      z: dock.z - x * Math.sin(yaw) + z * Math.cos(yaw),
    };
    if (
      isWalkable(w, p.x, p.z, boat || ({ kind: "boat" } as Entity)) &&
      !getEntities(w).some(
        (e) => e.id !== boat?.id && mobile(e) && distance(e, p) < 1,
      ) &&
      !getEntities(w).some(
        (e) =>
          e.kind === "building" &&
          ["dock", "port", "shipyard"].includes(e.type) &&
          onLanding(e, p, 0.6),
      )
    )
      return p;
  }
}
/** Move only idle, overlapping legacy boats to a clear berth, retaining passengers and identity. */
export function repairBoatBerths(w: World) {
  for (const boat of getEntities(w).filter(
    (e) =>
      e.kind === "boat" && e.hp > 0 && (!e.order || e.order.type === "stay"),
  )) {
    const dock = getEntities(w).find(
      (e) =>
        e.kind === "building" &&
        ["dock", "port", "shipyard"].includes(e.type) &&
        onLanding(e, boat, 0.5),
    );
    if (!dock) continue;
    const p = boatBerth(w, dock, boat);
    if (p) {
      Object.assign(boat, p);
      if (boat.passengerId && w.entities[boat.passengerId])
        Object.assign(w.entities[boat.passengerId], p);
      for (const id of boat.passengerIds || [])
        if (w.entities[id]) Object.assign(w.entities[id], p);
    }
  }
}

export function isWalkable(
  w: World,
  x: number,
  z: number,
  e?: Entity,
): boolean {
  x = Math.round(x);
  z = Math.round(z);
  if (x < 1 || z < 1 || x > w.size - 2 || z > w.size - 2) return false;
  const water = terrainAt(w, x, z) === "water";
  if (
    e?.kind === "boat" ||
    (!!e?.carriedBy && w.entities[e.carriedBy]?.kind === "boat")
  )
    return (
      water &&
      !getEntities(w).some(
        (b) =>
          b.kind === "building" &&
          at(b, x, z) &&
          (b.type === "waterGate"
            ? !enteringAllowed(w, b, e)
            : kindOf(b) === "gate"
              ? !b.open
              : kindOf(b) === "bridge"
                ? !!b.open
                : !["trench", "canal", "ravine"].includes(b.type) &&
                  !passableBuilding(b)),
      )
    );
  const bridge = getEntities(w).find(
    (b) => kindOf(b) === "bridge" && at(b, x, z),
  );
  if (bridge && !enteringAllowed(w, bridge, e)) return false;
  const gateCrossing = getEntities(w).find(
    (b) => kindOf(b) === "gate" && at(b, x, z) && enteringAllowed(w, b, e),
  );
  if (water && !bridge && !gateCrossing) return false;
  return !blocking(w, x, z, e);
}
export function findPath(
  w: World,
  e: Entity,
  target: Point,
  adjacent = false,
  breach = false,
): Point[] | null {
  const sx = Math.round(e.x),
    sz = Math.round(e.z),
    tx = Math.round(target.x),
    tz = Math.round(target.z);
  const key = (x: number, z: number) => x + z * w.size;
  const naval =
    e.kind === "boat" ||
    (!!e.carriedBy && w.entities[e.carriedBy]?.kind === "boat");
  const walk = new Uint8Array(w.size * w.size);
  for (let z = 1; z < w.size - 1; z++)
    for (let x = 1; x < w.size - 1; x++)
      walk[key(x, z)] =
        terrainAt(w, x, z) === "water"
          ? e.kind === "boat" ||
            (!!e.carriedBy && w.entities[e.carriedBy]?.kind === "boat")
            ? 1
            : 0
          : e.kind === "boat" ||
              (!!e.carriedBy && w.entities[e.carriedBy]?.kind === "boat")
            ? 0
            : 1;
  for (const b of getEntities(w)) {
    const x = Math.round(b.x),
      z = Math.round(b.z);
    if (b.type === "waterGate")
      walk[key(x, z)] =
        naval && terrainAt(w, x, z) === "water" && enteringAllowed(w, b, e)
          ? 1
          : 0;
    if (kindOf(b) === "bridge")
      walk[key(x, z)] = naval
        ? terrainAt(w, x, z) === "water" && !b.open
          ? 1
          : 0
        : enteringAllowed(w, b, e)
          ? 1
          : 0;
    if (kindOf(b) === "gate" && !naval && enteringAllowed(w, b, e))
      walk[key(x, z)] = 1;
    if (
      b.id !== e.id &&
      (b.kind === "tree" ||
        b.kind === "rock" ||
        b.kind === "town" ||
        b.kind === "ruin" ||
        (b.kind === "building" &&
          !["road", "bridge"].includes(kindOf(b)) &&
          !passableBuilding(b) &&
          !(naval && b.type === "waterGate") &&
          !(kindOf(b) === "gate" && enteringAllowed(w, b, e))))
    )
      walk[key(x, z)] =
        naval &&
        ["trench", "canal", "ravine"].includes(b.type) &&
        terrainAt(w, x, z) === "water"
          ? 1
          : breach && b.kind === "building" && b.faction === "player"
            ? 1
            : 0;
  }
  for (const b of getEntities(w))
    if (
      b.joined &&
      b.kind === "building" &&
      !passableBuilding(b) &&
      !["gate", "bridge"].includes(kindOf(b)) &&
      b.type !== "waterGate"
    ) {
      const f = footprint(b.type, b.rotation);
      for (
        let zz = Math.max(1, Math.floor(b.z - f.depth / 2));
        zz <= Math.min(w.size - 2, Math.ceil(b.z + f.depth / 2));
        zz++
      )
        for (
          let xx = Math.max(1, Math.floor(b.x - f.width / 2));
          xx <= Math.min(w.size - 2, Math.ceil(b.x + f.width / 2));
          xx++
        )
          if (covers(b, xx, zz))
            walk[key(xx, zz)] = breach && b.faction === "player" ? 1 : 0;
    }
  const queue = [{ x: sx, z: sz }],
    parents = new Map<number, number>();
  parents.set(key(sx, sz), -1);
  let end = -1;
  for (let n = 0; n < queue.length; n++) {
    const p = queue[n];
    if (
      adjacent
        ? Math.abs(p.x - tx) + Math.abs(p.z - tz) <= 1
        : p.x === tx && p.z === tz
    ) {
      end = key(p.x, p.z);
      break;
    }
    for (const [dx, dz] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const x = p.x + dx,
        z = p.z + dz,
        k = key(x, z);
      if (
        x < 1 ||
        z < 1 ||
        x > w.size - 2 ||
        z > w.size - 2 ||
        parents.has(k) ||
        !walk[k]
      )
        continue;
      parents.set(k, key(p.x, p.z));
      queue.push({ x, z });
    }
  }
  if (end < 0) return null;
  const path: Point[] = [];
  for (let k = end; parents.get(k) !== -1; k = parents.get(k)!) {
    path.push({ x: k % w.size, z: Math.floor(k / w.size) });
  }
  return path.reverse();
}
function canPay(w: World, cost: Partial<Resources>) {
  return Object.entries(cost).every(
    ([k, v]) => w.resources[k as keyof Resources] >= v,
  );
}
function pay(w: World, cost: Partial<Resources>) {
  for (const [k, v] of Object.entries(cost))
    w.resources[k as keyof Resources] -= v;
}
function result(w: World, ok: boolean, message: string): CommandResult {
  if (message) announce(w, message);
  return { ok, message };
}
function nearbyFree(w: World, p: Point, e?: Entity, avoidUnits = false) {
  for (let r = 1; r < 6; r++)
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++)
        if (
          isWalkable(w, Math.round(p.x) + dx, Math.round(p.z) + dz, e) &&
          (!avoidUnits ||
            !getEntities(w).some(
              (v) =>
                mobile(v) &&
                !v.carriedBy &&
                v.hp > 0 &&
                distance(v, {
                  x: Math.round(p.x) + dx,
                  z: Math.round(p.z) + dz,
                }) < 0.7,
            ))
        )
          return { x: Math.round(p.x) + dx, z: Math.round(p.z) + dz };
  return null;
}
function cancelWallWalk(w: World, e: Entity) {
  if (e.wallWalk) {
    const destination = w.entities[e.wallWalk.destinationId];
    if (destination?.occupantId === e.id && destination.id !== e.garrisonId)
      destination.occupantId = undefined;
    e.wallWalk = undefined;
  }
}
function detach(w: World, e: Entity) {
  cancelWallWalk(w, e);
  if (e.garrisonTargetId) {
    const b = w.entities[e.garrisonTargetId];
    if (b?.occupantId === e.id) b.occupantId = undefined;
    e.garrisonTargetId = undefined;
    e.garrisonEntryId = undefined;
  }
  e.elevation = 0;
  if (e.workplaceId) {
    const b = w.entities[e.workplaceId];
    if (b) b.workerId = undefined;
    e.workplaceId = undefined;
  }
  if (e.garrisonId) {
    const b = w.entities[e.garrisonId];
    if (b?.occupantId === e.id) b.occupantId = undefined;
    e.garrisonId = undefined;
  }
}
function buildContext(w: World, building: string, x: number, z: number) {
  const d = buildingDefs[building];
  const existing = getEntities(w).find(
    (e) => e.kind === "building" && at(e, x, z),
  );
  const behavior = d.behavior || building;
  const replacing =
    existing &&
    ((behavior === "bridge" &&
      ["trench", "canal", "ravine"].includes(existing.type)) ||
      (behavior === "gate" && kindOf(existing) === "wall") ||
      (building === "stoneRoad" && existing.type === "road"));
  const adjacentWater = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].find(([dx, dz]) => terrainAt(w, x + dx, z + dz) === "water");
  return { d, existing, behavior, replacing, adjacentWater };
}
function joinTouching(w: World, b: Entity) {
  b.joined = true;
  for (const neighbor of getEntities(w))
    if (
      neighbor.id !== b.id &&
      neighbor.kind === "building" &&
      neighbor.hp > 0 &&
      neighbor.faction === b.faction &&
      touching(b, neighbor)
    ) {
      neighbor.joined = true;
      b.links = [...new Set([...(b.links || []), neighbor.id])];
      neighbor.links = [...new Set([...(neighbor.links || []), b.id])];
    }
}
function attachmentError(
  w: World,
  candidate: Entity | { type: string; x: number; z: number; rotation?: number },
  target: Entity,
  ignoreId?: string,
): string | undefined {
  if (
    target.kind !== "building" ||
    target.faction !== "player" ||
    target.hp <= 0
  )
    return "Wskaż własną budowlę";
  if (!touching(candidate, target)) return "Dosuń budowlę do krawędzi sąsiada";
  const f = footprint(candidate.type, candidate.rotation);
  if (
    candidate.x - f.width / 2 < 1 ||
    candidate.z - f.depth / 2 < 1 ||
    candidate.x + f.width / 2 > 62 ||
    candidate.z + f.depth / 2 > 62
  )
    return "Poza mapą";
  for (const e of getEntities(w)) {
    if (e.id === ignoreId || e.hp <= 0) continue;
    if (e.kind === "building" && overlaps(candidate, e))
      return "Budowle nachodzą na siebie";
    if (
      ["tree", "rock", "town", "ruin"].includes(e.kind) &&
      covers(candidate, e.x, e.z)
    )
      return "Usuń przeszkodę przy ścianie";
    if (
      mobile(e) &&
      !["dog", "horse"].includes(e.kind) &&
      covers(candidate, e.x, e.z)
    )
      return "Najpierw zwolnij miejsce przy ścianie";
  }
  if (
    !["bridge", "gate", "wall", "canal", "trench", "waterGate"].includes(
      buildingDefs[candidate.type]?.behavior || candidate.type,
    )
  )
    for (
      let z = candidate.z - f.depth / 2 + 0.05;
      z < candidate.z + f.depth / 2;
      z += 0.4
    )
      for (
        let x = candidate.x - f.width / 2 + 0.05;
        x < candidate.x + f.width / 2;
        x += 0.4
      )
        if (terrainAt(w, x, z) === "water")
          return "Konstrukcja wymaga suchego terenu";
}
export function canBuild(
  w: World,
  building: string,
  x: number,
  z: number,
  placement: { rotation?: number; attachTo?: string } = {},
): CommandResult {
  const fail = (message: string): CommandResult => ({ ok: false, message });
  if (w.defeated) return fail("Bohater poległ. Wczytaj zapis.");
  const d = buildingDefs[building];
  if (
    !d ||
    !Number.isFinite(x) ||
    !Number.isFinite(z) ||
    (!placement.attachTo && (!Number.isInteger(x) || !Number.isInteger(z)))
  )
    return fail("Wybierz budowlę i pole");
  if (x < 1 || z < 1 || x > 62 || z > 62) return fail("Poza mapą");
  if (placement.attachTo) {
    const target = w.entities[placement.attachTo];
    if (!target) return fail("Budowla sąsiada już nie istnieje");
    const error = attachmentError(
      w,
      { type: building, x, z, rotation: placement.rotation },
      target,
    );
    if (error) return fail(error);
  }
  const { existing, behavior, replacing, adjacentWater } = buildContext(
    w,
    building,
    x,
    z,
  );
  if (
    getEntities(w).some(
      (e) =>
        at(e, x, z) &&
        e.kind !== "dog" &&
        e.kind !== "horse" &&
        !(replacing && e.id === existing?.id),
    )
  )
    return fail("Pole zajęte");
  if (
    !placement.attachTo &&
    getEntities(w).some(
      (e) =>
        e.kind === "building" &&
        e.joined &&
        !(replacing && e.id === existing?.id) &&
        overlaps({ type: building, x, z, rotation: placement.rotation }, e),
    )
  )
    return fail("Pole zajęte przez konstrukcję");
  if (!canPay(w, d.cost)) return fail("Brakuje surowców");
  if (
    !getEntities(w).some(
      (e) =>
        e.faction === "player" &&
        ["hero", "worker", "building"].includes(e.kind) &&
        distance(e, { x, z }) <= 9,
    )
  )
    return fail("Buduj w pobliżu własnej osady lub bohatera");
  const water = terrainAt(w, x, z) === "water";
  if (
    water &&
    !["bridge", "gate", "wall", "canal", "trench", "waterGate"].includes(
      behavior!,
    )
  )
    return fail("Na wodzie buduj przeprawy lub umocnienia");
  if (behavior === "bridge" && !water && x !== 30 && x !== 34 && !replacing)
    return fail("Most wymaga brzegu, wody lub wykopu");
  if (building === "waterGate" && !water)
    return fail("Brama wodna wymaga rzeki lub zalanego kanału");
  if (building === "shipyard" && !adjacentWater)
    return fail("Stocznia wymaga brzegu wody");
  if (building === "dock" && !adjacentWater)
    return fail("Przystań wymaga brzegu wody");
  if (
    building === "dock" &&
    !boatBerth(w, {
      id: "proposed-dock",
      kind: "building",
      type: "dock",
      label: d.label,
      x,
      z,
      rotation:
        placement.rotation ??
        (adjacentWater![0] === 1
          ? 0
          : adjacentWater![0] === -1
            ? 2
            : adjacentWater![1] === 1
              ? 3
              : 1),
      faction: "player",
      hp: d.hp,
      maxHp: d.hp,
    })
  )
    return fail("Brak wolnej wody do cumowania obok pomostu");
  if (
    building === "mill" &&
    !getEntities(w).some(
      (e) => e.type === "well" && distance(e, { x, z }) <= 4,
    ) &&
    !Array.from({ length: 9 }, (_, i) => ({
      x: x + (i % 3) - 1,
      z: z + Math.floor(i / 3) - 1,
    })).some((p) => terrainAt(w, p.x, p.z) === "water")
  )
    return fail("Młyn wymaga wody w sąsiedztwie lub studni do 4 pól");
  return { ok: true, message: "Możesz zbudować: " + d.label };
}

export function planConstructionMove(
  w: World,
  actorId: string,
  x: number,
  z: number,
  turns = 0,
): CommandResult & { members: Entity[] } {
  const anchor = w.entities[actorId];
  const fail = (message: string, members: Entity[] = []) => ({
    ok: false,
    message,
    members,
  });
  if (
    !anchor ||
    anchor.kind !== "building" ||
    anchor.faction !== "player" ||
    anchor.hp <= 0
  )
    return fail("Wybierz własną konstrukcję");
  if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isInteger(turns))
    return fail("Wskaż miejsce na mapie");
  const original = connectedConstruction(getEntities(w), anchor);
  const members = transformConstruction(original, anchor, x, z, turns),
    ids = new Set(original.map((e) => e.id));
  if (w.defeated) return fail("Bohater poległ. Wczytaj zapis.", members);
  if (
    original.some(
      (b) =>
        b.pendingClose ||
        getEntities(w).some(
          (e) => e.garrisonId === b.id || (mobile(e) && covers(b, e.x, e.z)),
        ),
    )
  )
    return fail("Najpierw opróżnij całą konstrukcję", members);
  const outside = getEntities(w).filter((e) => !ids.has(e.id) && e.hp > 0);
  for (const b of members) {
    const f = footprint(b.type, b.rotation),
      family = kindOf(b);
    if (
      b.x - f.width / 2 < 1 ||
      b.z - f.depth / 2 < 1 ||
      b.x + f.width / 2 > 62 ||
      b.z + f.depth / 2 > 62
    )
      return fail("Cała konstrukcja musi mieścić się na mapie", members);
    for (const e of outside) {
      if (e.kind === "building" && overlaps(b, e))
        return fail("Konstrukcja nachodzi na inną budowlę", members);
      if (
        ["tree", "rock", "ruin", "town"].includes(e.kind) &&
        covers(b, e.x, e.z)
      )
        return fail("Przeszkoda pod częścią konstrukcji", members);
      if (mobile(e) && covers(b, e.x, e.z))
        return fail("Jednostka zajmuje miejsce ustawienia", members);
    }
    if (
      family === "bridge" &&
      terrainAt(w, b.x, b.z) !== "water" &&
      Math.abs(b.x - 30) > 0.01 &&
      Math.abs(b.x - 34) > 0.01
    )
      return fail("Każdy odcinek mostu wymaga wody lub brzegu", members);
    if (
      ["dock", "shipyard"].includes(family) &&
      ![
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dz]) => terrainAt(w, b.x + dx, b.z + dz) === "water")
    )
      return fail("Przystań musi pozostać przy wodzie", members);
    if (
      !["bridge", "wall", "gate", "canal", "trench", "waterGate"].includes(
        family,
      )
    ) {
      for (let zz = b.z - f.depth / 2 + 0.05; zz < b.z + f.depth / 2; zz += 0.4)
        for (
          let xx = b.x - f.width / 2 + 0.05;
          xx < b.x + f.width / 2;
          xx += 0.4
        )
          if (terrainAt(w, xx, zz) === "water")
            return fail("Cała konstrukcja wymaga suchego terenu", members);
    }
  }
  return { ok: true, message: "Ustaw całą konstrukcję", members };
}

function routeHome(w: World, e: Entity): Entity | undefined {
  const r = e.tradeRoute!;
  let home: Entity | undefined = w.entities[r.homeId];
  if (
    !home ||
    home.kind !== "building" ||
    home.faction !== "player" ||
    home.hp <= 0
  ) {
    home =
      getEntities(w).find(
        (b) => kindOf(b) === "market" && b.faction === "player" && b.hp > 0,
      ) ||
      getEntities(w).find(
        (b) => b.kind === "building" && b.faction === "player" && b.hp > 0,
      );
    if (home) r.homeId = home.id;
  }
  return home;
}
function routeMove(w: World, e: Entity, destination: Entity): boolean {
  const path = findPath(w, e, destination, true);
  e.order = {
    type: "move",
    x: destination.x,
    z: destination.z,
    path: path || [],
  };
  e.tradeRoute!.retryAt = w.time + 3;
  return path !== null;
}
function updateOwnedMerchants(w: World) {
  for (const e of getEntities(w)) {
    const r = e.tradeRoute;
    if (!r || e.hp <= 0) continue;
    const home = routeHome(w, e),
      town = w.entities[r.targetId || ""];
    if (!home) {
      e.order = undefined;
      r.phase = "waiting";
      r.reason = "Brak osady do rozładunku";
      continue;
    }
    if (
      r.phase === "outbound" &&
      (!town ||
        town.kind !== "town" ||
        town.relation === "hostile" ||
        town.hp <= 0)
    ) {
      r.phase = "returning";
      r.repeat = false;
      r.reason = "Droga handlowa zamknięta przez wojnę";
      routeMove(w, e, home);
    }
    if (r.phase === "outbound" && town && distance(e, town) < 2) {
      const amount = r.cargo[r.resource];
      r.cargo[r.resource] = 0;
      r.cargo.gold += exportPrice(
        r.resource,
        amount,
        town.relation === "allied",
      );
      r.trips++;
      r.phase = "returning";
      r.reason = undefined;
      routeMove(w, e, home);
    }
    if (r.phase === "returning" && distance(e, home) < 2) {
      if (r.cargo.gold > 0) progressFor(w).tradeReturns++;
      w.resources.gold += r.cargo.gold;
      r.cargo.gold = 0;
      const capacity = storageCapacity(w);
      for (const k of ["wood", "stone", "food", "iron"] as const) {
        const n = Math.min(
          r.cargo[k],
          Math.max(
            0,
            (k === "food" ? storageCapacity(w, "food") : capacity) -
              w.resources[k],
          ),
        );
        w.resources[k] += n;
        r.cargo[k] -= n;
      }
      if (Object.values(r.cargo).some((n) => n > 0)) {
        r.reason = "Brak miejsca na rozładunek";
        e.order = undefined;
        continue;
      }
      r.phase = r.repeat ? "loading" : "idle";
      r.reason = undefined;
      e.order = undefined;
      r.retryAt = w.time + (home.type === "merchantPost" ? 1 : 2);
    }
    if (["loading", "waiting"].includes(r.phase) && w.time >= r.retryAt) {
      if (distance(e, home) >= 2) {
        r.phase = "returning";
        routeMove(w, e, home);
        continue;
      }
      if (!town || town.kind !== "town" || town.relation === "hostile") {
        r.phase = "waiting";
        r.reason = "Brak pokojowej osady docelowej";
        r.retryAt = w.time + 3;
        continue;
      }
      if (w.resources[r.resource] < r.amount) {
        r.phase = "waiting";
        r.reason = "Czeka na towar w magazynie";
        r.retryAt = w.time + 3;
        continue;
      }
      const path = findPath(w, e, town, true);
      if (!path) {
        r.phase = "waiting";
        r.reason = "Droga do osady zablokowana";
        r.retryAt = w.time + 3;
        continue;
      }
      w.resources[r.resource] -= r.amount;
      r.cargo[r.resource] += r.amount;
      r.phase = "outbound";
      r.reason = undefined;
      r.retryAt = w.time + 3;
      e.order = { type: "move", x: town.x, z: town.z, path };
    }
    if (
      ["outbound", "returning"].includes(r.phase) &&
      !e.order?.path?.length &&
      w.time >= r.retryAt
    ) {
      const destination = r.phase === "returning" ? home : town;
      if (destination) {
        const reachable = routeMove(w, e, destination);
        r.reason = reachable ? undefined : "Przejście zablokowane · czeka";
      }
    }
  }
}

export function merchantTradeAvailable(
  w: World,
  e: Entity | undefined,
  resource: TradeResource,
  side: "buy" | "sell",
): CommandResult {
  const fail = (message: string) => ({ ok: false, message });
  if (w.defeated) return fail("Bohater poległ. Wczytaj zapis.");
  const visit = e?.merchant,
    offer = merchantOffers[resource];
  if (
    !e ||
    e.hp <= 0 ||
    e.type !== "merchant" ||
    !visit ||
    visit.phase !== "trading" ||
    w.time >= visit.until
  )
    return fail("Kupiec nie prowadzi teraz handlu");
  if (!offer || !["buy", "sell"].includes(side)) return fail("Wybierz towar");
  if (side === "buy") {
    if (visit.stock[resource] < offer.amount) return fail("Towar wyprzedany");
    if (w.resources.gold < offer.buy) return fail("Brakuje monet");
    if (w.resources[resource] + offer.amount > storageCapacity(w, resource))
      return fail("Brak miejsca w magazynach");
  } else {
    if (w.resources[resource] < offer.amount) return fail("Brakuje towaru");
    if (visit.stock.gold < offer.sell) return fail("Kupiec nie ma dość monet");
  }
  return { ok: true, message: "Możesz handlować" };
}
function updateMerchants(w: World) {
  const visitors = getEntities(w).filter(
    (e) => e.type === "merchant" && e.merchant && e.hp > 0,
  );
  for (const e of visitors) {
    const v = e.merchant!;
    if (v.phase === "arriving" && distance(e, v.destination) < 0.4) {
      v.phase = "trading";
      v.until = w.time + 120;
      e.order = undefined;
      announce(w, e.label + " czeka przy osadzie. Kliknij wóz, aby handlować.");
    }
    if (
      v.phase === "trading" &&
      (w.time >= v.until ||
        getEntities(w).some((t) => t.faction === "enemy" && distance(t, e) < 6))
    ) {
      v.phase = "leaving";
      v.retryAt = 0;
      e.order = {
        type: "move",
        x: v.home.x,
        z: v.home.z,
        path: findPath(w, e, v.home) || [],
      };
      announce(w, e.label + " kończy handel i odjeżdża.");
    }
    if (v.phase === "leaving" && distance(e, v.home) < 0.4) {
      delete w.entities[e.id];
      continue;
    }
    if (
      v.phase !== "trading" &&
      !e.order?.path?.length &&
      w.time >= v.retryAt
    ) {
      const destination = v.phase === "leaving" ? v.home : v.destination;
      e.order = {
        type: "move",
        x: destination.x,
        z: destination.z,
        path: findPath(w, e, destination) || [],
      };
      v.retryAt = w.time + 3;
    }
  }
  if (visitors.length || w.time < (w.nextMerchantAt ?? 0)) return;
  w.nextMerchantAt = w.time + 240;
  const base =
    getEntities(w).find(
      (e) => kindOf(e) === "market" && e.faction === "player",
    ) ||
    getEntities(w).find((e) => e.kind === "building" && e.faction === "player");
  if (!base) return;
  const probe = {
    ...base,
    kind: "merchant" as const,
    type: "merchant",
    id: "merchant-probe",
    faction: "neutral" as const,
  };
  const stops = [
    [3, -2],
    [3, 0],
    [0, -3],
    [-3, 0],
    [0, 3],
    [-3, -2],
  ].map(([dx, dz]) => ({
    x: Math.round(base.x + dx),
    z: Math.round(base.z + dz),
  }));
  const homes = [
    [base.x - 7, base.z],
    [base.x + 6, base.z - 3],
    [base.x, base.z - 7],
  ].map(([x, z]) => ({ x: Math.round(x), z: Math.round(z) }));
  let route: { home: Point; destination: Point; path: Point[] } | undefined;
  for (const destination of stops) {
    if (!isWalkable(w, destination.x, destination.z, probe)) continue;
    for (const home of homes) {
      if (!isWalkable(w, home.x, home.z, probe)) continue;
      const path = findPath(w, { ...probe, ...home }, destination);
      if (path) {
        route = { home, destination, path };
        break;
      }
    }
    if (route) break;
  }
  if (!route) {
    w.nextMerchantAt = w.time + 30;
    return;
  }
  const names = ["Dobromir", "Mira", "Radomir"],
    index = w.merchantVisits ?? 0;
  const e = add(
    w,
    "merchant",
    "merchant",
    "Kupiec " + names[index % names.length],
    route.home.x,
    route.home.z,
    "neutral",
    120,
  );
  e.merchant = {
    phase: "arriving",
    stock: { wood: 120, stone: 80, food: 160, iron: 30, gold: 180 },
    until: 0,
    home: route.home,
    destination: route.destination,
    retryAt: w.time + 3,
  };
  e.order = {
    type: "move",
    x: route.destination.x,
    z: route.destination.z,
    path: route.path,
  };
  w.merchantVisits = index + 1;
  announce(w, "Wędrowny kupiec zmierza do osady.");
}

type ImmediatePlan = CommandResult & { spots: Point[]; targets: Entity[] };
function planInstantAddon(
  w: World,
  id: InstantAddonId,
  paid = false,
): ImmediatePlan {
  const fail = (message: string): ImmediatePlan => ({
    ok: false,
    message,
    spots: [],
    targets: [],
  });
  if (!Object.hasOwn(instantAddons, id)) return fail("Wybierz dodatek");
  if (w.defeated) return fail("Najpierw wczytaj wyprawę z żywym bohaterem");
  const offer = instantAddons[id],
    a = addonsFor(w);
  if (!paid && a.gems < offer.price) return fail("Za mało klejnotów");
  if ("resources" in offer) {
    for (const [key, n] of Object.entries(offer.resources))
      if (
        key !== "gold" &&
        w.resources[key as keyof Resources] + n >
          storageCapacity(w, key as keyof Resources)
      )
        return fail(
          "Brak miejsca w magazynach: " +
            (
              {
                wood: "drewno",
                stone: "kamień",
                food: "żywność",
                iron: "żelazo",
                gold: "monety",
              } as Record<string, string>
            )[key],
        );
  }
  let spots: Point[] = [],
    targets: Entity[] = [];
  if ("spawn" in offer) {
    const base =
      getEntities(w).find(
        (e) =>
          e.kind === "building" &&
          e.faction === "player" &&
          e.hp > 0 &&
          (e.type === "hall" || kindOf(e) === "castle"),
      ) ||
      getEntities(w).find(
        (e) => e.kind === "building" && e.faction === "player" && e.hp > 0,
      ) ||
      getEntities(w).find((e) => e.kind === "hero" && e.hp > 0);
    if (!base) return fail("Brak miejsca dostawy w osadzie");
    const entities = getEntities(w);
    for (let r = 1; r <= 6 && spots.length < offer.spawn.count; r++)
      for (let dx = -r; dx <= r && spots.length < offer.spawn.count; dx++)
        for (let dz = -r; dz <= r && spots.length < offer.spawn.count; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const p = { x: Math.round(base.x) + dx, z: Math.round(base.z) + dz };
          if (
            !isWalkable(w, p.x, p.z) ||
            spots.some((v) => distance(v, p) < 0.8) ||
            entities.some(
              (e) =>
                e.hp > 0 &&
                (mobile(e)
                  ? distance(e, p) < 0.8
                  : e.kind === "building" &&
                    !buildingDefs[e.type]?.passable &&
                    !["gate", "road", "bridge"].includes(kindOf(e)) &&
                    covers(e, p.x, p.z)),
            )
          )
            continue;
          spots.push(p);
        }
    if (spots.length < offer.spawn.count)
      return fail("Zwolnij miejsce przy osadzie na cały pakiet");
  }
  if ("restore" in offer) {
    targets = getEntities(w).filter(
      (e) =>
        e.faction === "player" &&
        e.hp > 0 &&
        e.hp < e.maxHp &&
        (offer.restore === "buildings" ? e.kind === "building" : mobile(e)),
    );
    if (!targets.length)
      return fail(
        offer.restore === "buildings"
          ? "Wszystkie budowle są sprawne"
          : "Wszystkie jednostki są zdrowe",
      );
  }
  return {
    ok: true,
    message: "Gotowe do użycia w obecnej osadzie",
    spots,
    targets,
  };
}
export function instantAddonAvailable(
  w: World,
  id: InstantAddonId,
): CommandResult {
  const p = planInstantAddon(w, id);
  return { ok: p.ok, message: p.message };
}
export function claimInstantPurchase(
  w: World,
  purchaseId: string,
): CommandResult {
  const a = addonsFor(w),
    purchase = a.instantPurchases?.[purchaseId];
  if (!purchase) return { ok: false, message: "Nie znaleziono zakupu" };
  if (purchase.status !== "pending")
    return { ok: false, message: "Ten zakup został już rozliczony" };
  const plan = planInstantAddon(w, purchase.addonId, true);
  if (!plan.ok) {
    a.gems += purchase.price;
    purchase.status = "refunded";
    return { ok: false, message: plan.message + " · klejnoty zwrócone" };
  }
  const offer = instantAddons[purchase.addonId];
  if ("resources" in offer)
    for (const [key, n] of Object.entries(offer.resources))
      w.resources[key as keyof Resources] += n;
  if ("spawn" in offer)
    for (const p of plan.spots) {
      const label =
        offer.spawn.type === "archer"
          ? "Łucznik posiłków"
          : offer.spawn.type === "worker"
            ? "Nowy osadnik"
            : offer.spawn.type === "camel"
              ? "Wielbłąd juczny"
              : "Koń podróżny";
      add(
        w,
        offer.spawn.kind,
        offer.spawn.type,
        label,
        p.x,
        p.z,
        "player",
        offer.spawn.hp,
      );
    }
  if ("restore" in offer)
    for (const e of plan.targets)
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.5);
  purchase.status = "complete";
  return { ok: true, message: offer.name + " · dodatek wykorzystany" };
}
export function settleInstantPurchases(w: World) {
  for (const [id, p] of Object.entries(addonsFor(w).instantPurchases || {}))
    if (p.status === "pending") claimInstantPurchase(w, id);
}

export function applyStarterBonuses(w: World) {
  const a = addonsFor(w);
  if (a.starterApplied) return false;
  if (a.packs.village) {
    for (const type of [
      "house",
      "house",
      "house",
      "lumber",
      "quarry",
      "farm",
      "field",
      "field",
    ]) {
      let spot: Point | undefined;
      for (let z = 22; z <= 40 && !spot; z += 3)
        for (let x = 7; x <= 25; x += 3) {
          const candidate = { type, x, z };
          if (
            getEntities(w).some(
              (e) =>
                (e.kind === "building" && overlaps(candidate, e, 0.2)) ||
                (mobile(e) && covers(candidate, e.x, e.z)),
            )
          )
            continue;
          spot = { x, z };
          break;
        }
      if (!spot) return false;
      for (const e of getEntities(w))
        if (
          ["tree", "rock"].includes(e.kind) &&
          covers({ type, ...spot }, e.x, e.z)
        )
          delete w.entities[e.id];
      const b = add(
        w,
        "building",
        type,
        buildingDefs[type].label,
        spot.x,
        spot.z,
        "player",
        buildingDefs[type].hp,
      );
      b.joined = true;
      if (type === "house")
        for (let i = 0; i < 2; i++) {
          const p = nearbyFree(w, b);
          if (p) add(w, "worker", "worker", "Osadnik", p.x, p.z, "player", 60);
        }
    }
  }
  if (a.packs.soldiers)
    for (let i = 0; i < 3; i++) {
      const p = nearbyFree(w, { x: 18, z: 30 });
      if (p)
        add(
          w,
          "soldier",
          "soldier",
          "Strażnik wyprawy",
          p.x,
          p.z,
          "player",
          100,
        );
    }
  a.starterApplied = true;
  return true;
}
export function createNextExpedition(previous: World): World {
  if (
    Object.values(addonsFor(previous).instantPurchases || {}).some(
      (p) => p.status === "pending",
    )
  )
    throw Error("Poczekaj na zakończenie zakupu");
  const next = createWorld(),
    old = addonsFor(previous);
  next.addons = {
    ...structuredClone(old),
    rewards: {},
    progress: { tradeReturns: 0 },
    raids: {},
    instantPurchases: {},
    instantSequence: 0,
    starterApplied: false,
  };
  const dog = getEntities(next).find((e) => e.kind === "dog");
  if (dog) dog.label = old.appearance.dogName;
  if (!applyStarterBonuses(next))
    throw Error("Brak miejsca na pakiet startowy");
  return next;
}

export function canRemoveRoad(w: World, x: number, z: number): CommandResult {
  if (!Number.isInteger(x) || !Number.isInteger(z))
    return { ok: false, message: "Wskaż odcinek ścieżki" };
  const road = getEntities(w).find(
    (e) => e.kind === "building" && kindOf(e) === "road" && at(e, x, z),
  );
  if (road)
    return {
      ok: road.faction === "player",
      message:
        road.faction === "player"
          ? "Usuń odcinek ścieżki"
          : "To nie Twoja droga",
    };
  return villageRoadTiles.has(roadKey(x, z)) &&
    !w.removedRoads?.includes(roadKey(x, z))
    ? { ok: true, message: "Usuń odcinek ścieżki" }
    : { ok: false, message: "Tu nie ma ścieżki" };
}
function updateWallWalk(w: World, e: Entity, dt: number) {
  const walk = e.wallWalk;
  if (!walk) return;
  const from = w.entities[walk.fromId],
    to = w.entities[walk.toId];
  if (!from || !to || !wallConnected(from, to, getEntities(w))) {
    cancelWallWalk(w, e);
    e.order = undefined;
    if (!from || !isWallPost(from)) {
      detach(w, e);
      const p = nearbyFree(w, e, e);
      if (p) Object.assign(e, p);
    } else {
      e.x = from.x;
      e.z = from.z;
    }
    return;
  }
  if (
    to.occupantId &&
    to.occupantId !== e.id &&
    (to.type !== "bastion" ||
      getEntities(w).filter(
        (u) =>
          u.id !== e.id &&
          (u.garrisonId === to.id ||
            u.garrisonTargetId === to.id ||
            u.wallWalk?.destinationId === to.id),
      ).length >= 3)
  )
    return;
  walk.progress = Math.min(
    1,
    walk.progress + (dt * 1.5) / Math.max(0.3, distance(from, to)),
  );
  e.x = from.x + (to.x - from.x) * walk.progress;
  e.z = from.z + (to.z - from.z) * walk.progress;
  e.elevation = 1;
  if (walk.progress < 1) return;
  if (from.occupantId === e.id) from.occupantId = undefined;
  e.garrisonId = to.id;
  to.occupantId = e.id;
  const index = walk.path.indexOf(to.id);
  if (
    to.id === walk.destinationId ||
    index === walk.path.length - 1 ||
    walk.stopAfterStep
  ) {
    const descend = walk.descendAfterStep;
    cancelWallWalk(w, e);
    if (descend) {
      const exit = nearbyFree(w, to, e);
      if (exit) {
        e.x = exit.x;
        e.z = exit.z;
        e.descending = true;
      }
    }
    return;
  }
  walk.fromId = to.id;
  walk.toId = walk.path[index + 1];
  walk.progress = 0;
}

/** Cardinal, bank-to-bank crossing. Validation runs on a copy: never charge for a partial bridge. */
export function planBridge(
  w: World,
  building: string,
  start: Point,
  end: Point,
) {
  const points: Point[] = [];
  const total: Partial<Resources> = {};
  let rotation = 0;
  const fail = (message: string) => ({
    ok: false,
    message,
    points,
    rotation,
    cost: total,
    draft: undefined as World | undefined,
  });
  if (
    ![start.x, start.z, end.x, end.z].every(Number.isFinite) ||
    (buildingDefs[building]?.behavior || building) !== "bridge"
  )
    return fail("Wybierz most i dwa brzegi");
  const x = Math.round(start.x),
    z = Math.round(start.z);
  const dx = Math.round(end.x) - x,
    dz = Math.round(end.z) - z;
  const horizontal = Math.abs(dx) >= Math.abs(dz);
  const length = Math.abs(horizontal ? dx : dz);
  if (length < 2 || length > 61) return fail("Przeciągnij od brzegu do brzegu");
  const direction = Math.sign(horizontal ? dx : dz);
  rotation = horizontal ? (direction > 0 ? 0 : 2) : direction > 0 ? 3 : 1;
  const line = Array.from({ length: length + 1 }, (_, i) => ({
    x: x + (horizontal ? i * direction : 0),
    z: z + (horizontal ? 0 : i * direction),
  }));
  if (line.some((p) => p.x < 1 || p.z < 1 || p.x > 62 || p.z > 62))
    return fail("Poza mapą");
  const gap = (p: Point) =>
    terrainAt(w, p.x, p.z) === "water" ||
    getEntities(w).some(
      (e) =>
        e.kind === "building" &&
        at(e, p.x, p.z) &&
        ["trench", "canal", "ravine"].includes(e.type),
    );
  // Snap both anchors to the same grid axis; banks themselves need no deck segment.
  for (const p of line.slice(1, -1)) if (gap(p)) points.push(p);
  if (gap(line[0]) || gap(line.at(-1)!))
    return fail("Początek i koniec muszą być na brzegu");
  const first = line.findIndex(gap),
    last = line.length - 1 - [...line].reverse().findIndex(gap);
  if (!points.length || points.length !== last - first + 1)
    return fail("Przeciągnij przez jeden ciągły przekop lub rzekę");
  for (const [key, value] of Object.entries(buildingDefs[building].cost))
    total[key as keyof Resources] = value * points.length;
  if (!canPay(w, total)) return fail("Brakuje surowców na cały most");
  for (const bank of [line[first - 1], line[last + 1]])
    if (!isWalkable(w, bank.x, bank.z))
      return fail("Zwolnij dojście na obu brzegach");
  const draft = structuredClone(w);
  const ids: string[] = [];
  for (const p of points) {
    const result = command(draft, { type: "build", building, ...p, rotation });
    if (!result.ok) return fail(result.message);
    const b = getEntities(draft).find(
      (e) => e.kind === "building" && e.type === building && at(e, p.x, p.z),
    )!;
    ids.push(b.id);
  }
  for (let i = 0; i < ids.length; i++) {
    const b = draft.entities[ids[i]];
    b.joined = true;
    b.links = [
      ...new Set([
        ...(b.links || []),
        ...ids.filter((_, j) => Math.abs(i - j) === 1),
      ]),
    ];
  }
  return {
    ok: true,
    message: "Gotowa przeprawa",
    points,
    rotation,
    cost: total,
    draft,
  };
}

export function connectedWallGroup(w: World, target: Entity) {
  const forts = getEntities(w).filter(
    (e) =>
      e.kind === "building" &&
      e.hp > 0 &&
      e.faction === target.faction &&
      ["wall", "gate", "tower"].includes(kindOf(e)),
  );
  if (!forts.includes(target)) return [];
  const group = [target],
    seen = new Set([target.id]);
  const shape = (e: Entity) => ({
    ...e,
    rotation:
      e.rotation ??
      (kindOf(e) === "wall"
        ? Math.round(postYaw(e, forts) / (Math.PI / 2))
        : 0),
  });
  for (let i = 0; i < group.length; i++)
    for (const e of forts) {
      if (seen.has(e.id)) continue;
      const a = group[i],
        aa = shape(a),
        bb = shape(e);
      if (
        touching(aa, bb) ||
        wallConnected(a, e, forts) ||
        ((kindOf(a) === "gate" || kindOf(e) === "gate") && overlaps(aa, bb))
      ) {
        seen.add(e.id);
        group.push(e);
      }
    }
  return group;
}

export function connectedRebuildGroup(w: World, target: Entity) {
  const entities = { ...w.entities };
  for (const e of getEntities(w))
    if (
      e.kind === "ruin" &&
      e.originalType &&
      ["wall", "gate", "tower"].includes(
        buildingDefs[e.originalType]?.behavior || e.originalType,
      ) &&
      (!e.originalFaction || e.originalFaction === "player") &&
      !e.regionalRuin
    )
      entities[e.id] = {
        ...e,
        kind: "building",
        type: e.originalType,
        faction: "player",
      };
  const proxy = { ...w, entities };
  return connectedWallGroup(proxy, entities[target.id]).map(
    (e) => w.entities[e.id],
  );
}
export function wallRebuildAvailable(w: World, targetId: string) {
  const target = w.entities[targetId],
    cost: Partial<Resources> = {},
    parts: string[] = [];
  const fail = (message: string) => ({ ok: false, message, cost, parts });
  if (!target) return fail("Wskaż zniszczoną fortyfikację");
  const group = connectedRebuildGroup(w, target);
  parts.push(...group.filter((e) => e.kind === "ruin").map((e) => e.id));
  cost.wood = 60 * parts.length;
  cost.stone = 50 * parts.length;
  if (!parts.length) return fail("Brak ruin do odbudowy w tej fortyfikacji");
  const h = getEntities(w).find(
    (e) => e.kind === "hero" && e.hp > 0 && e.faction === "player",
  );
  if (!h) return fail("Brak bohatera");
  if (
    getEntities(w).some(
      (e) =>
        e.faction === "enemy" &&
        e.hp > 0 &&
        parts.some((id) => distance(e, w.entities[id]) < 8),
    )
  )
    return fail("Najpierw zabezpiecz całą fortyfikację");
  if (
    getEntities(w).some(
      (e) =>
        mobile(e) &&
        !e.carriedBy &&
        parts.some((id) =>
          covers(
            { ...w.entities[id], type: w.entities[id].originalType! },
            e.x,
            e.z,
          ),
        ),
    )
  )
    return fail("Najpierw zwolnij miejsca odbudowy");
  if (!canPay(w, cost)) return fail("Brakuje surowców na całą odbudowę");
  return {
    ok: true,
    message: "Odbuduj " + parts.length + " elementów",
    cost,
    parts,
  };
}

export function wallRepairAvailable(w: World, targetId: string) {
  const target = w.entities[targetId];
  const empty = { parts: [] as string[], cost: {} as Partial<Resources> };
  if (
    !target ||
    target.kind !== "building" ||
    target.faction !== "player" ||
    target.hp <= 0 ||
    !["wall", "gate", "tower"].includes(kindOf(target))
  )
    return {
      ...empty,
      ok: false,
      message: "Wskaż własny mur, bramę lub wieżę",
    };
  const parts = connectedWallGroup(w, target)
    .filter((e) => e.hp < e.maxHp)
    .map((e) => e.id);
  const cost = { wood: 15 * parts.length, stone: 10 * parts.length };
  if (!parts.length)
    return {
      parts,
      cost,
      ok: false,
      message: "Cała fortyfikacja jest sprawna",
    };
  return {
    parts,
    cost,
    ok: canPay(w, cost),
    message: canPay(w, cost)
      ? "Napraw " + parts.length + " elementów"
      : "Brakuje surowców na całą naprawę",
  };
}

export function wallUpgradeAvailable(w: World, targetId: string) {
  const target = w.entities[targetId],
    cost: Partial<Resources> = { stone: 0 };
  const fail = (message: string) => ({
    ok: false,
    message,
    cost,
    parts: [] as { id: string; type: string }[],
  });
  if (
    !target ||
    target.faction !== "player" ||
    target.kind !== "building" ||
    !["wall", "gate", "tower"].includes(kindOf(target))
  )
    return fail("Wskaż własny mur");
  const group = connectedWallGroup(w, target);
  const parts = group.flatMap((e) => {
    const type = (
      {
        palisade: "stoneRampart",
        woodGate: "gate",
        friendlyGate: "gate",
        tower: "stoneTower",
      } as Record<string, string>
    )[e.type];
    return type ? [{ id: e.id, type }] : [];
  });
  if (!parts.length) return fail("Cały mur jest już kamienny");
  for (const p of parts)
    cost.stone! += Math.max(
      0,
      (buildingDefs[p.type].cost.stone || 0) -
        (buildingDefs[w.entities[p.id].type].cost.stone || 0),
    );
  const ids = new Set(group.map((e) => e.id));
  if (
    getEntities(w).some(
      (e) =>
        e.wallWalk?.path.some((id) => ids.has(id)) ||
        ids.has(e.garrisonTargetId || "") ||
        (e.descending && ids.has(e.garrisonId || "")),
    )
  )
    return {
      ok: false,
      message: "Zaczekaj, aż łucznicy zakończą przejście",
      cost,
      parts,
    };
  return {
    ok: canPay(w, cost),
    message: canPay(w, cost)
      ? "Ulepsz cały mur"
      : "Brakuje kamienia na cały mur",
    cost,
    parts,
  };
}

export function storageCapacity(w: World, resource: keyof Resources = "wood") {
  const owned = getEntities(w).filter(
    (e) => e.kind === "building" && e.faction === "player" && e.hp > 0,
  );
  return Math.max(
    w.testResourceCapacity || 0,
    400 +
      owned.filter((e) => ["warehouse", "keep"].includes(e.type)).length * 300 +
      (resource === "food"
        ? owned.filter((e) => e.type === "granary").length * 500
        : 0),
  );
}

export function postCapacity(w: World, b: Entity) {
  return (
    getEntities(w).filter(
      (e) =>
        e.hp > 0 &&
        (e.garrisonId === b.id ||
          e.garrisonTargetId === b.id ||
          e.wallWalk?.destinationId === b.id),
    ).length < (b.type === "bastion" ? 3 : 1)
  );
}
function rallyDefenders(w: World) {
  for (const u of getEntities(w).filter(
    (e) =>
      e.rallyId &&
      e.hp > 0 &&
      e.faction === "player" &&
      !e.garrisonId &&
      !e.garrisonTargetId,
  )) {
    const point = w.entities[u.rallyId!];
    if (!point || point.kind !== "building" || point.hp <= 0) continue;
    const post =
      u.kind === "archer"
        ? getEntities(w)
            .filter(
              (b) =>
                isWallPost(b) &&
                b.faction === "player" &&
                distance(b, point) <= 8 &&
                postCapacity(w, b),
            )
            .sort((a, b) => distance(a, point) - distance(b, point))[0]
        : undefined;
    if (
      post &&
      command(w, { type: "garrison", actorId: u.id, targetId: post.id }).ok
    )
      continue;
    const p = nearbyFree(w, point, u, true);
    if (p) command(w, { type: "move", ids: [u.id], x: p.x, z: p.z });
  }
}
export function command(w: World, c: Command): CommandResult {
  const target = c.targetId ? w.entities[c.targetId] : undefined;
  const actor =
    w.entities[c.actorId || ""] ||
    getEntities(w).find((e) => e.kind === "hero");
  const fail = (s: string) => result(w, false, s);
  const ok = (s: string) => result(w, true, s);
  if (
    w.defeated &&
    ![
      "pause",
      "buyAddon",
      "appearance",
      "cancelInstantAddon",
      "claimInstantAddon",
    ].includes(c.type)
  )
    return fail("Bohater poległ. Wczytaj zapis.");
  if (c.type === "buyInstantAddon") {
    const id = c.instantId;
    if (!id || !Object.hasOwn(instantAddons, id))
      return fail("Wybierz dodatek");
    const a = addonsFor(w),
      purchaseId = c.purchaseId || `instant:${(a.instantSequence || 0) + 1}`;
    if (a.instantPurchases?.[purchaseId])
      return fail("Ten zakup został już rozliczony");
    const available = planInstantAddon(w, id);
    if (!available.ok) return fail(available.message);
    a.gems -= instantAddons[id].price;
    a.instantSequence = (a.instantSequence || 0) + 1;
    (a.instantPurchases ??= {})[purchaseId] = {
      addonId: id,
      price: instantAddons[id].price,
      time: w.time,
      status: "pending",
    };
    if (c.deferEffect) return ok("Zapisywanie zakupu");
    const r = claimInstantPurchase(w, purchaseId);
    return r.ok ? ok(r.message) : fail(r.message);
  }
  if (c.type === "claimInstantAddon" || c.type === "cancelInstantAddon") {
    const a = addonsFor(w),
      purchase = a.instantPurchases?.[c.purchaseId || ""];
    if (c.type === "cancelInstantAddon") {
      if (!purchase || purchase.status !== "pending")
        return fail("Ten zakup został już rozliczony");
      a.gems += purchase.price;
      purchase.status = "refunded";
      return ok("Klejnoty zwrócone");
    }
    const r = claimInstantPurchase(w, c.purchaseId || "");
    return r.ok ? ok(r.message) : fail(r.message);
  }
  if (c.type === "buyAddon") {
    const a = addonsFor(w),
      id = c.addonId;
    if (!id || !Object.hasOwn(starterPacks, id)) return fail("Wybierz dodatek");
    if (a.packs[id]) return fail("Ten pakiet jest już kupiony");
    if (a.gems < starterPacks[id].price) return fail("Za mało klejnotów");
    a.gems -= starterPacks[id].price;
    a.packs[id] = true;
    return ok("Pakiet kupiony · zadziała na nowej wyprawie");
  }
  if (c.type === "appearance") {
    const a = addonsFor(w).appearance,
      field = c.appearanceField;
    if (!field) return fail("Wybierz wygląd");
    const value = c.appearanceValue || "";
    if (field === "dogName") {
      const name = value.trim().slice(0, 20);
      if (!name) return fail("Wpisz imię psa");
      a.dogName = name;
      for (const e of getEntities(w))
        if (e.kind === "dog" && e.faction === "player") e.label = name;
    } else {
      const choices = {
        outfit: outfits,
        dogColor: dogCoats,
        bannerColor: bannerColors,
        bannerEmblem: bannerEmblems,
      };
      if (
        !Object.hasOwn(choices, field) ||
        !Object.hasOwn(choices[field], value)
      )
        return fail("Wybierz dostępny wygląd");
      Object.assign(a, { [field]: value });
    }
    return ok("Wygląd zapisany");
  }
  if (c.type === "stop") {
    const units = [...new Set(c.ids || [actor?.id || ""])]
      .map((id) => w.entities[id])
      .filter((e) => e && e.faction === "player" && mobile(e));
    if (!units.length) return fail("Zaznacz własną jednostkę");
    for (const unit of units) {
      if (unit.wallWalk) {
        unit.wallWalk.stopAfterStep = true;
        unit.order = { type: "stay", phase: "hold" };
        continue;
      }
      cancelWallWalk(w, unit);
      unit.pendingAction = undefined;
      unit.order = { type: "stay", phase: "hold" };
      if (
        unit.garrisonId ||
        (unit.garrisonTargetId && (unit.elevation || 0) > 0)
      ) {
        // Keep the visual post and reservation until the descent finishes.
        unit.garrisonId ||= unit.garrisonTargetId;
        unit.garrisonTargetId = undefined;
        unit.descending = true;
      } else {
        detach(w, unit);
        unit.descending = false;
      }
    }
    return ok("Jednostki zatrzymane; oczekujące rozkazy anulowane");
  }
  if (c.type === "upgrade") {
    if (
      !getEntities(w).some((e) => e.type === "forge" && e.faction === "player")
    )
      return fail("Zbuduj kuźnię");
    if (w.weaponLevel >= 3) return fail("Uzbrojenie na najwyższym poziomie");
    if (!canPay(w, { iron: 20, gold: 30 }))
      return fail("Potrzeba 20 żelaza i 30 monet");
    pay(w, { iron: 20, gold: 30 });
    w.weaponLevel++;
    return ok("Uzbrojenie ulepszone");
  }
  if (c.type === "pause") {
    w.paused = false;
    return fail("Gra działa w czasie rzeczywistym — pauza została wyłączona");
  }
  if (c.type === "speed") {
    if (![1, 2, 3].includes(c.value || 0)) return fail("Nieprawidłowe tempo");
    w.speed = c.value!;
    return ok("Tempo ×" + w.speed);
  }
  if (c.type === "alarm") {
    w.alarm = !w.alarm;
    const hall = getEntities(w).find(
      (e) => e.faction === "player" && ["hall", "castle"].includes(kindOf(e)),
    );
    for (const worker of getEntities(w).filter((e) => e.kind === "worker")) {
      worker.shelter = w.alarm;
      if (w.alarm && hall) {
        const p = nearbyFree(w, hall, worker);
        if (p)
          worker.order = {
            type: "move",
            x: p.x,
            z: p.z,
            path: findPath(w, worker, p) || [],
          };
      } else {
        const job = w.entities[worker.workplaceId || ""];
        worker.order =
          job?.kind === "building"
            ? {
                type: "work",
                targetId: job.id,
                path: findPath(w, worker, job, true) || [],
              }
            : undefined;
      }
    }
    if (w.alarm) rallyDefenders(w);
    return ok(
      w.alarm
        ? "Alarm: mieszkańcy chronią się przy siedzibie"
        : "Alarm odwołany: mieszkańcy wracają do pracy",
    );
  }
  if (c.type === "patrol" || c.type === "escort") {
    const units = (c.ids || [])
      .map((id) => w.entities[id])
      .filter(
        (e) =>
          e &&
          e.faction === "player" &&
          ["soldier", "archer"].includes(e.kind) &&
          !e.carriedBy,
      );
    if (!units.length) return fail("Zaznacz żołnierzy");
    if (
      c.type === "escort" &&
      (!target ||
        !["caravan", "merchant", "hero"].includes(target.kind) ||
        target.faction !== "player")
    )
      return fail("Wskaż własną karawanę lub bohatera");
    const destination = target || { x: c.x!, z: c.z! };
    if (!Number.isFinite(destination.x) || !Number.isFinite(destination.z))
      return fail("Wskaż koniec patrolu");
    let count = 0;
    for (const e of units) {
      const path = findPath(w, e, destination, c.type === "escort");
      if (!path) continue;
      detach(w, e);
      e.order = {
        type: c.type,
        targetId: target?.id,
        x: destination.x,
        z: destination.z,
        startX: e.x,
        startZ: e.z,
        phase: "outbound",
        path,
      };
      count++;
    }
    return count
      ? ok(
          c.type === "patrol"
            ? "Patrol między początkiem a wskazanym punktem"
            : "Eskorta podąża za celem i osłania go",
        )
      : fail("Brak drogi");
  }
  if (["move", "attack", "gather"].includes(c.type)) {
    const units = (c.ids || [actor?.id || ""])
      .map((id) => w.entities[id])
      .filter((e) => e && e.faction === "player" && mobile(e) && !e.carriedBy);
    if (!units.length) return fail("Zaznacz własną jednostkę");
    const p = target || { x: c.x!, z: c.z! };
    if (!Number.isFinite(p.x) || !Number.isFinite(p.z))
      return fail("Wskaż cel");
    if (c.type === "attack" && target?.faction !== "enemy")
      return fail("Można atakować wroga");
    if (c.type === "gather" && units.some((e) => e.mountedOn))
      return fail("Zsiądź z wierzchowca przed pracą");
    if (c.type === "gather" && !["tree", "rock"].includes(target?.kind || ""))
      return fail("Wskaż drzewo lub skałę");
    let count = 0;
    for (const e of units) {
      if (c.type === "gather" && !["hero", "worker"].includes(e.kind)) continue;
      const path = findPath(w, e, p, !!target && c.type !== "move");
      if (!path) continue;
      if (e.garrisonId) {
        if (e.wallWalk) {
          e.wallWalk.stopAfterStep = true;
          e.wallWalk.descendAfterStep = true;
        } else e.descending = true;
      } else detach(w, e);
      e.pendingAction = undefined;
      e.order = {
        type: c.type as Order["type"],
        x: p.x,
        z: p.z,
        targetId: target?.id,
        path,
      };
      count++;
    }
    return count
      ? ok("Rozkaz przyjęty przez " + count + " jednostek")
      : fail("Brak dostępnej drogi do celu");
  }
  if (["moveConstruction", "rotateConstruction"].includes(c.type)) {
    const anchor = w.entities[c.actorId || c.targetId || ""];
    if (!anchor) return fail("Wybierz konstrukcję");
    const plan = planConstructionMove(
      w,
      anchor.id,
      c.type === "rotateConstruction" ? anchor.x : c.x!,
      c.type === "rotateConstruction" ? anchor.z : c.z!,
      c.type === "rotateConstruction" ? 1 : (c.rotation ?? 0),
    );
    if (!plan.ok) return fail(plan.message);
    for (const moved of plan.members) {
      const e = w.entities[moved.id];
      e.x = moved.x;
      e.z = moved.z;
      e.rotation = moved.rotation;
      e.joined = plan.members.length > 1 || e.joined;
    }
    if (plan.members.some((e) => e.channel)) refreshWater(w);
    for (const e of plan.members)
      if (e.workerId && w.entities[e.workerId])
        assign(w, w.entities[e.workerId], w.entities[e.id]);
    return ok(
      c.type === "rotateConstruction"
        ? "Obrócono całą konstrukcję"
        : "Przesunięto całą konstrukcję",
    );
  }
  if (["rotate", "connect", "disconnect"].includes(c.type)) {
    const b = c.actorId ? w.entities[c.actorId] : target;
    if (!b || b.kind !== "building" || b.faction !== "player")
      return fail("Wybierz własną budowlę");
    if (c.type === "rotate") {
      if (
        kindOf(b) === "bridge" &&
        connectedBridgeGroup(getEntities(w), b).length > 1
      )
        return fail("Obróć odcinek przed połączeniem mostu");
      if (
        b.pendingClose ||
        getEntities(w).some(
          (e) =>
            e.id !== b.id &&
            (e.garrisonId === b.id || (mobile(e) && distance(e, b) < 1.2)),
        )
      )
        return fail("Najpierw opróżnij budowlę i jej otoczenie");
      if (
        b.joined &&
        b.links?.some((id) => w.entities[id] && touching(b, w.entities[id]))
      )
        return fail("Odłącz budowlę przed obrotem");
      b.rotation = ((b.rotation ?? 0) + 1) % 4;
      return ok("Obrócono budowlę");
    }
    if (c.type === "disconnect") {
      for (const e of getEntities(w))
        if (e.links) e.links = e.links.filter((id) => id !== b.id);
      b.links = [];
      return ok("Odłączono budowlę");
    }
    if (
      !target ||
      target.id === b.id ||
      target.kind !== "building" ||
      target.faction !== "player"
    )
      return fail("Wskaż inną własną budowlę");
    if (distance(b, target) > 4.1)
      return fail("Połącz budowle oddalone najwyżej o 4 pola");
    if (b.joined && b.links?.includes(target.id) && touching(b, target))
      return fail("Budowle są już połączone");
    if (
      b.joined &&
      b.links?.some((id) => w.entities[id] && touching(b, w.entities[id]))
    )
      return fail("Odłącz budowlę przed dosunięciem do innej konstrukcji");
    if (
      b.pendingClose ||
      getEntities(w).some(
        (e) => e.garrisonId === b.id || (mobile(e) && distance(e, b) < 1.2),
      )
    )
      return fail("Najpierw opróżnij budowlę i jej otoczenie");
    if (
      kindOf(b) === "bridge" &&
      connectedBridgeGroup(getEntities(w), b).length > 1
    )
      return fail("Nie można przesuwać odcinka połączonego mostu");
    const candidates = attachmentPoints(b.type, b.rotation ?? 0, target).sort(
      (a, c) => distance(a, b) - distance(c, b),
    );
    const spot = candidates.find(
      (p) => !attachmentError(w, { ...b, ...p }, target, b.id),
    );
    if (!spot) return fail("Brak wolnej ściany — zwolnij miejsce przy budowli");
    b.x = spot.x;
    b.z = spot.z;
    b.joined = true;
    target.joined = true;
    if (b.channel) refreshWater(w);
    if (b.workerId && w.entities[b.workerId])
      assign(w, w.entities[b.workerId], b);
    // Legacy path links do not count as physical joints.
    for (const other of getEntities(w))
      if (other.links) other.links = other.links.filter((id) => id !== b.id);
    b.links = [];
    b.links = [...(b.links || []), target.id];
    target.links = [...(target.links || []), b.id];
    joinTouching(w, b);
    return ok("Połączono budowle");
  }
  if (c.type === "buildBridge") {
    const plan = planBridge(
      w,
      c.building || "",
      { x: c.x!, z: c.z! },
      { x: c.endX!, z: c.endZ! },
    );
    if (!plan.ok || !plan.draft) return fail(plan.message);
    Object.assign(w, plan.draft);
    return ok("Zbudowano cały most · " + plan.points.length + " odcinków");
  }
  if (c.type === "build") {
    const building = c.building || "",
      x = c.x!,
      z = c.z!;
    const check = canBuild(w, building, x, z, {
      rotation: c.rotation,
      attachTo: c.attachTo,
    });
    if (!check.ok) return fail(check.message);
    const { d, existing, behavior, replacing, adjacentWater } = buildContext(
      w,
      building,
      x,
      z,
    );
    pay(w, d.cost);
    if (replacing) delete w.entities[existing!.id];
    const b = add(w, "building", c.building!, d.label, x, z, "player", d.hp);
    b.open = true;
    if (replacing && existing?.links?.length) {
      b.joined = existing.joined;
      b.links = [...existing.links];
      for (const other of getEntities(w))
        if (other.links?.includes(existing.id))
          other.links = other.links.map((id) =>
            id === existing.id ? b.id : id,
          );
    }
    if (behavior === "bridge" && replacing && existing)
      b.bridgeBase = existing.type as Entity["bridgeBase"];
    if (c.rotation !== undefined)
      b.rotation = ((Math.round(c.rotation) % 4) + 4) % 4;
    if (c.attachTo) {
      const neighbor = w.entities[c.attachTo];
      b.joined = true;
      neighbor.joined = true;
      b.links = [neighbor.id];
      neighbor.links = [...new Set([...(neighbor.links || []), b.id])];
      joinTouching(w, b);
    }
    b.material = d.material;
    b.lightRadius = d.lightRadius;
    if (behavior === "gate" || b.type === "waterGate")
      b.gateMode = b.type === "woodGate" ? "manual" : "auto";
    if (
      ["trench", "canal", "ravine"].includes(b.type) ||
      (replacing && existing?.channel) ||
      (replacing && ["trench", "canal", "ravine"].includes(existing!.type))
    ) {
      b.channel = true;
      refreshWater(w);
    }
    if (b.type === "house")
      for (let i = 0; i < 2; i++) {
        const p = nearbyFree(w, b);
        if (p) add(w, "worker", "worker", "Osadnik", p.x, p.z, "player", 60);
      }
    if (b.type === "stable") {
      const p = nearbyFree(w, b);
      if (p) add(w, "horse", "horse", "Koń", p.x, p.z, "player", 100);
    }
    if (b.type === "dock") {
      if (c.rotation === undefined)
        b.rotation =
          adjacentWater![0] === 1
            ? 0
            : adjacentWater![0] === -1
              ? 2
              : adjacentWater![1] === 1
                ? 3
                : 1;
      const berth = boatBerth(w, b);
      if (berth)
        add(w, "boat", "boat", "Łódź rzeczna", berth.x, berth.z, "player", 140);
    }
    if (d.worker) {
      const worker = getEntities(w).find(
        (e) =>
          e.kind === "worker" && !e.workplaceId && !!findPath(w, e, b, true),
      );
      if (worker) assign(w, worker, b);
    }
    return ok("Zbudowano: " + d.label);
  }
  if (c.type === "assign") {
    const worker = w.entities[c.workerId || ""],
      b = w.entities[c.buildingId || ""];
    if (
      !worker ||
      worker.kind !== "worker" ||
      !b ||
      !buildingDefs[b.type]?.worker ||
      b.faction !== "player"
    )
      return fail("Wybierz pracownika i zakład");
    if (b.workerId && b.workerId !== worker.id)
      return fail("Stanowisko zajęte");
    if (!findPath(w, worker, b, true)) return fail("Brak drogi do pracy");
    assign(w, worker, b);
    return ok("Pracownik przydzielony");
  }
  if (c.type === "buildBoat") {
    const yard = w.entities[c.buildingId || c.targetId || ""],
      vessel = c.vessel || "boat";
    if (
      !yard ||
      yard.type !== "shipyard" ||
      yard.kind !== "building" ||
      yard.faction !== "player"
    )
      return fail("Wskaż własną stocznię");
    if (!Object.hasOwn(boatCosts, vessel))
      return fail("Wybierz jednostkę pływającą");
    const p = boatBerth(w, yard);
    if (!p) return fail("Zwolnij wodę przy stoczni");
    if (!canPay(w, boatCosts[vessel]))
      return fail("Brakuje surowców na statek");
    pay(w, boatCosts[vessel]);
    add(
      w,
      "boat",
      vessel,
      vessel === "boat" ? "Łódź rzeczna" : "Transportowiec",
      p.x,
      p.z,
      "player",
      vessel === "boat" ? 140 : 260,
    );
    return ok("Statek zwodowany");
  }
  if (c.type === "loadTroops" || c.type === "unloadTroops") {
    const boat = target?.kind === "boat" ? target : actor;
    if (
      !boat ||
      boat.kind !== "boat" ||
      boat.type !== "transportBoat" ||
      boat.faction !== "player"
    )
      return fail("Wskaż własny transportowiec");
    const ids = boat.passengerIds || [];
    if (c.type === "loadTroops") {
      const troops = getEntities(w)
        .filter(
          (e) =>
            e.faction === "player" &&
            ["soldier", "archer", "worker"].includes(e.kind) &&
            !["ram", "catapult"].includes(e.type) &&
            e.hp > 0 &&
            !e.carriedBy &&
            !e.garrisonId &&
            !e.garrisonTargetId &&
            !e.mountedOn &&
            distance(e, boat) <= 3,
        )
        .sort((a, b) => distance(a, boat) - distance(b, boat))
        .slice(0, 3 - ids.length);
      if (!troops.length)
        return fail(
          ids.length >= 3
            ? "Transportowiec pełny"
            : "Podejdź oddziałem do transportowca",
        );
      for (const e of troops) {
        detach(w, e);
        e.carriedBy = boat.id;
        e.order = undefined;
        e.x = boat.x;
        e.z = boat.z;
        ids.push(e.id);
      }
      boat.passengerIds = ids;
      return ok("Zaokrętowano " + troops.length + " pasażerów");
    }
    if (!ids.length) return fail("Brak pasażerów do wysadzenia");
    const spots: Point[] = [];
    for (let dx = -3; dx <= 3; dx++)
      for (let dz = -3; dz <= 3; dz++) {
        const p = { x: Math.round(boat.x) + dx, z: Math.round(boat.z) + dz };
        if (
          distance(p, boat) <= 3 &&
          isWalkable(w, p.x, p.z) &&
          !getEntities(w).some(
            (e) => mobile(e) && !e.carriedBy && distance(e, p) < 0.6,
          )
        )
          spots.push(p);
      }
    if (spots.length < ids.length)
      return fail("Podpłyń do wolnego brzegu dla wszystkich pasażerów");
    ids.forEach((id, i) => {
      const e = w.entities[id];
      if (e) {
        e.carriedBy = undefined;
        e.order = undefined;
        Object.assign(e, spots[i]);
      }
    });
    boat.passengerIds = [];
    return ok("Oddział wysiadł na brzeg");
  }
  if (c.type === "useStairs") {
    if (!target || target.type !== "wallStairs" || target.faction !== "player")
      return fail("Wskaż własne schody");
    const archer = getEntities(w)
      .filter(
        (e) =>
          e.kind === "archer" &&
          e.faction === "player" &&
          !e.garrisonId &&
          !e.carriedBy,
      )
      .sort((a, b) => distance(a, target) - distance(b, target))[0];
    const post = getEntities(w).find(
      (e) =>
        e.kind === "building" &&
        e.faction === "player" &&
        ["wall", "tower"].includes(kindOf(e)) &&
        !e.occupantId &&
        distance(e, target) <= 1.7,
    );
    if (!archer || !post)
      return fail("Potrzebny łucznik i wolny mur lub wieża przy schodach");
    return command(w, {
      type: "garrison",
      actorId: archer.id,
      targetId: post.id,
    });
  }
  if (c.type === "recruitEngine") {
    const type = c.engine;
    if (!type || !(type in engineCosts))
      return fail("Wybierz taran lub katapultę");
    const b = c.buildingId
      ? w.entities[c.buildingId]
      : getEntities(w).find(
          (e) => e.type === "siegeWorkshop" && e.faction === "player",
        );
    if (
      !b ||
      b.kind !== "building" ||
      b.type !== "siegeWorkshop" ||
      b.faction !== "player" ||
      b.hp <= 0
    )
      return fail("Zbuduj warsztat oblężniczy");
    if (!canPay(w, engineCosts[type]))
      return fail("Brakuje surowców na machinę");
    const p = Array.from({ length: 121 }, (_, i) => ({
      x: Math.round(b.x) + (i % 11) - 5,
      z: Math.round(b.z) + Math.floor(i / 11) - 5,
    }))
      .filter(
        (p) =>
          isWalkable(w, p.x, p.z) &&
          !getEntities(w).some((e) => mobile(e) && distance(e, p) < 0.8),
      )
      .sort((a, c) => distance(a, b) - distance(c, b))[0];
    if (!p) return fail("Brak miejsca przy warsztacie");
    pay(w, engineCosts[type]);
    add(
      w,
      "soldier",
      type,
      type === "ram" ? "Taran" : "Katapulta",
      p.x,
      p.z,
      "player",
      type === "ram" ? 240 : 140,
    );
    return ok("Machina gotowa: " + type);
  }
  if (c.type === "recruit") {
    const unit = c.unit || "soldier",
      b = getEntities(w)
        .filter((e) => kindOf(e) === "barracks" && e.faction === "player")
        .sort(
          (a, b) =>
            Number(b.type === "barracks") - Number(a.type === "barracks"),
        )[0];
    if (!b) return fail("Zbuduj koszary");
    if (!(unit in unitCosts) || !canPay(w, unitCosts[unit]))
      return fail("Brakuje surowców");
    if (w.recruitQueue.length >= 5) return fail("Kolejka pełna");
    pay(w, unitCosts[unit]);
    w.recruitQueue.push({
      unit,
      remaining: b.type === "barracks" ? 7.5 : 10,
      buildingId: b.id,
    });
    return ok("Rozpoczęto szkolenie");
  }
  if (c.type === "gateMode") {
    if (target?.type === "friendlyGate")
      return fail("Ta brama zawsze przepuszcza tylko swoich");
    if (
      !target ||
      (kindOf(target) !== "gate" && target.type !== "waterGate") ||
      target.faction !== "player"
    )
      return fail("Wskaż własną bramę");
    target.gateMode = target.gateMode === "auto" ? "manual" : "auto";
    target.pendingClose = false;
    return ok(
      target.gateMode === "auto"
        ? "Brama automatyczna dla swoich"
        : "Brama obsługiwana ręcznie",
    );
  }
  if (c.type === "toggle") {
    if (target && buildingDefs[target.type]?.fixed)
      return fail("To stała przeprawa — nie można jej podnieść");
    if (target?.type === "friendlyGate")
      return fail("Ta brama działa automatycznie dla swoich");
    if (
      !target ||
      !["gate", "bridge", "waterGate"].includes(kindOf(target)) ||
      target.faction === "enemy"
    )
      return fail("Wskaż bramę lub most");
    if (target.pendingClose) {
      const group =
        kindOf(target) === "bridge"
          ? connectedBridgeGroup(getEntities(w), target)
          : [target];
      for (const b of group) b.pendingClose = false;
      return ok("Anulowano zamykanie przejścia");
    }
    if (kindOf(target) === "gate" || target.type === "waterGate") {
      target.gateMode = "manual";
      target.pendingClose = !!target.open;
      if (!target.open) target.open = true;
      return ok(
        target.pendingClose
          ? "Brama zamknie się po zwolnieniu przejścia"
          : "Brama otwarta",
      );
    }
    const group = connectedBridgeGroup(getEntities(w), target);
    if (target.open) {
      for (const b of group) b.pendingClose = true;
      return ok("Most zostanie podniesiony po opuszczeniu przeprawy");
    }
    if (
      getEntities(w).some(
        (e) =>
          e.kind === "boat" &&
          group.some((b) => at(e, Math.round(b.x), Math.round(b.z))),
      )
    )
      return fail("Zaczekaj, łódź pod mostem");
    for (const b of group) {
      b.open = true;
      b.pendingClose = false;
    }
    return ok("Most opuszczony");
  }

  if (c.type === "assignRally") {
    const b = w.entities[c.buildingId || ""];
    if (
      !b ||
      b.type !== "rallyPoint" ||
      b.kind !== "building" ||
      b.faction !== "player" ||
      b.hp <= 0
    )
      return fail("Wybierz własny punkt zbiórki");
    const units = getEntities(w).filter(
      (e) =>
        e.faction === "player" &&
        e.hp > 0 &&
        ["soldier", "archer"].includes(e.kind) &&
        !["ram", "catapult"].includes(e.type) &&
        !e.garrisonId &&
        !e.garrisonTargetId &&
        !e.carriedBy,
    );
    for (const u of units) u.rallyId = b.id;
    if (w.alarm) rallyDefenders(w);
    return ok("Przypisano obrońców: " + units.length);
  }
  if (["buyHorse", "innDelivery"].includes(c.type)) {
    const b = w.entities[c.buildingId || c.targetId || ""];
    if (
      !b ||
      b.kind !== "building" ||
      b.faction !== "player" ||
      b.hp <= 0 ||
      b.type !== (c.type === "buyHorse" ? "stable" : "inn")
    )
      return fail("Wybierz własną działającą budowlę");
    if (c.type === "buyHorse") {
      if (!canPay(w, { gold: 25, food: 20 }))
        return fail("Koń kosztuje 25 monet i 20 żywności");
      const p = nearbyFree(w, b);
      if (!p) return fail("Zwolnij wyjście ze stajni");
      pay(w, { gold: 25, food: 20 });
      add(w, "horse", "horse", "Koń ze stajni", p.x, p.z, "player", 100);
      return ok("Koń czeka przy stajni");
    }
    if ((b.innReadyAt || 0) > w.time)
      return fail(
        "Nowe zlecenie za " + Math.ceil(b.innReadyAt! - w.time) + " s",
      );
    if (w.resources.food < 30) return fail("Dostawa wymaga 30 żywności");
    w.resources.food -= 30;
    w.resources.gold += 25;
    b.innReadyAt = w.time + 90;
    return ok("Dostawa do zajazdu: +25 monet");
  }

  if (c.type === "hireMerchant") {
    const market = w.entities[c.buildingId || c.targetId || ""];
    if (
      !market ||
      kindOf(market) !== "market" ||
      market.faction !== "player" ||
      market.kind !== "building" ||
      market.hp <= 0
    )
      return fail("Zatrudnij kupca w swoim targu");
    if (!canPay(w, merchantHireCost))
      return fail("Kupiec kosztuje 30 monet i 20 drewna");
    const p = nearbyFree(w, market, undefined, true);
    if (!p) return fail("Zwolnij wyjście z targu");
    pay(w, merchantHireCost);
    const e = add(
      w,
      "merchant",
      "playerMerchant",
      "Kupiec osady",
      p.x,
      p.z,
      "player",
      120,
    );
    e.tradeRoute = {
      homeId: market.id,
      resource: "wood",
      amount: 20,
      repeat: false,
      phase: "idle",
      cargo: { wood: 0, stone: 0, food: 0, iron: 0, gold: 0 },
      retryAt: 0,
      trips: 0,
    };
    return ok("Zatrudniono kupca · wybierz ładunek i osadę");
  }
  if (
    ["dispatchMerchant", "stopMerchantRoute", "recallMerchant"].includes(c.type)
  ) {
    const e = w.entities[c.actorId || ""],
      r = e?.tradeRoute;
    if (!e || e.faction !== "player" || !r || e.hp <= 0)
      return fail("Wybierz własnego kupca");
    if (c.type === "stopMerchantRoute") {
      r.repeat = false;
      if (["loading", "waiting"].includes(r.phase)) {
        r.phase = "idle";
        r.reason = undefined;
        e.order = undefined;
      }
      return ok("Stała trasa wyłączona · kupiec dokończy bieżący kurs");
    }
    if (c.type === "recallMerchant") {
      const home = routeHome(w, e);
      if (!home) return fail("Brak osady do powrotu");
      r.repeat = false;
      r.phase = "returning";
      r.reason = undefined;
      routeMove(w, e, home);
      return ok("Kupiec wraca z ładunkiem");
    }
    if (
      !["idle", "waiting"].includes(r.phase) ||
      Object.values(r.cargo).some((n) => n > 0)
    )
      return fail("Poczekaj na powrót i rozładunek kupca");
    const town = w.entities[c.targetId || ""];
    if (
      !town ||
      town.kind !== "town" ||
      town.relation === "hostile" ||
      town.hp <= 0
    )
      return fail("Wybierz pokojową osadę");
    if (
      !c.resource ||
      !Object.hasOwn(exportRates, c.resource) ||
      !Number.isInteger(c.amount) ||
      c.amount! < 1 ||
      c.amount! > 100 ||
      typeof c.repeat !== "boolean"
    )
      return fail("Wybierz ładunek od 1 do 100 sztuk");
    r.targetId = town.id;
    r.resource = c.resource;
    r.amount = c.amount!;
    r.repeat = c.repeat;
    r.phase = "loading";
    r.reason = undefined;
    r.retryAt = w.time;
    updateOwnedMerchants(w);
    return ok(
      r.repeat
        ? "Stała trasa handlowa uruchomiona"
        : "Kupiec przygotowuje wyprawę",
    );
  }
  if (c.type === "merchantTrade") {
    const check = merchantTradeAvailable(w, target, c.resource!, c.side!);
    if (!check.ok) return fail(check.message);
    const v = target!.merchant!,
      resource = c.resource!,
      offer = merchantOffers[resource];
    if (c.side === "buy") {
      w.resources.gold -= offer.buy;
      v.stock.gold += offer.buy;
      w.resources[resource] += offer.amount;
      v.stock[resource] -= offer.amount;
    } else {
      w.resources.gold += offer.sell;
      v.stock.gold -= offer.sell;
      w.resources[resource] -= offer.amount;
      v.stock[resource] += offer.amount;
    }
    return ok(c.side === "buy" ? "Kupiono towar" : "Sprzedano towar");
  }
  if (c.type === "trade") {
    const town =
      target?.kind === "town"
        ? target
        : getEntities(w).find((e) => e.kind === "town");
    const market = getEntities(w).find(
      (e) => kindOf(e) === "market" && e.faction === "player",
    );
    if (!town || town.relation === "hostile" || !market)
      return fail("Potrzebny targ i pokojowy sąsiad");
    if (w.resources.wood < 20) return fail("Karawana wymaga 20 drewna");
    const p = nearbyFree(w, market);
    if (!p) return fail("Brak wyjścia z targu");
    const ghost = { ...market, ...p };
    const path = findPath(w, ghost, town, true);
    if (!path) return fail("Droga handlowa zablokowana");
    w.resources.wood -= 20;
    const cart = add(
      w,
      "caravan",
      "caravan",
      "Karawana",
      p.x,
      p.z,
      "player",
      90,
    );
    cart.order = {
      type: "trade",
      targetId: town.id,
      x: market.x,
      z: market.z,
      path,
      phase: "outbound",
    };
    return ok("Karawana wyrusza z 20 drewna; wróci z 35 monetami");
  }
  if (c.type === "alliance") {
    const town =
      target?.kind === "town"
        ? target
        : getEntities(w).find((e) => e.kind === "town");
    if (!town || town.relation !== "neutral")
      return fail("Sojusz wymaga pokojowej, niezależnej osady");
    if (!canPay(w, { gold: 45, food: 25 }))
      return fail("Sojusz kosztuje 45 monet i 25 żywności");
    pay(w, { gold: 45, food: 25 });
    town.relation = "allied";
    return ok(town.label + " dołącza do przymierza");
  }
  if (c.type === "declareWar" || c.type === "capture") {
    if (
      !target ||
      target.kind !== "town" ||
      target.relation === "conquered" ||
      target.relation === "hostile"
    )
      return fail("Wskaż niezależną osadę");
    target.relation = "hostile";
    target.faction = "enemy";
    for (let i = 0; i < 3; i++) {
      const p = nearbyFree(w, target);
      if (p)
        add(
          w,
          "enemy",
          "townGuard",
          "Straż osady",
          p.x + i * 0.3,
          p.z,
          "enemy",
          85,
        );
    }
    return ok(
      "Wojna z " +
        target.label +
        ". Pokonaj straż i przełam obronę osady, aby ją przyłączyć.",
    );
  }
  if (c.type === "plant") {
    if (
      !actor ||
      actor.mountedOn ||
      !Number.isInteger(c.x) ||
      !Number.isInteger(c.z)
    )
      return fail("Bohater pieszo może sadzić drzewa");
    const p = { x: c.x!, z: c.z! };
    if (
      distance(actor, p) > 6 ||
      terrainAt(w, p.x, p.z) === "water" ||
      getEntities(w).some((e) => at(e, p.x, p.z)) ||
      !isWalkable(w, p.x, p.z)
    )
      return fail("Wskaż wolną ziemię do 6 pól od bohatera");
    if (w.resources.food < 3) return fail("Sadzonka kosztuje 3 żywności");
    w.resources.food -= 3;
    const tree = add(w, "tree", "sapling", "Sadzonka", p.x, p.z, "neutral", 10);
    tree.growth = 0;
    return ok("Zasadzono drzewo; dorośnie za 60 sekund");
  }
  if (c.type === "raid") {
    if (w.raidTimer < 1) return fail("Najazd już nadchodzi");
    w.raidTimer = 0;
    return ok("Zwiadowcy zwabili oddział najeźdźców");
  }
  if (c.type === "removeRoad") {
    const x = c.x!,
      z = c.z!,
      check = canRemoveRoad(w, x, z);
    if (!check.ok) return fail(check.message);
    const road = getEntities(w).find(
      (e) => e.kind === "building" && kindOf(e) === "road" && at(e, x, z),
    );
    if (road) return command(w, { type: "demolish", targetId: road.id });
    w.removedRoads = [...new Set([...(w.removedRoads || []), roadKey(x, z)])];
    return ok("Usunięto ścieżkę");
  }
  if (c.type === "upgradeWall") {
    const plan = wallUpgradeAvailable(w, c.targetId || "");
    if (!plan.ok) return fail(plan.message);
    pay(w, plan.cost);
    for (const p of plan.parts) {
      const b = w.entities[p.id],
        def = buildingDefs[p.type],
        ratio = b.hp / b.maxHp;
      b.type = p.type;
      b.label = def.label;
      b.maxHp = def.hp;
      b.hp = Math.max(1, def.hp * ratio);
      b.material = "stone";
    }
    return ok("Ulepszono cały mur · " + plan.parts.length + " elementów");
  }
  if (c.type === "demolishWall") {
    if (
      !target ||
      target.kind !== "building" ||
      target.faction !== "player" ||
      !["wall", "gate", "tower"].includes(kindOf(target))
    )
      return fail("Wskaż własny mur, bramę lub wieżę");
    const group = connectedWallGroup(w, target),
      ids = new Set(group.map((e) => e.id));
    if (
      getEntities(w).some(
        (e) =>
          ids.has(e.garrisonId || "") ||
          ids.has(e.garrisonTargetId || "") ||
          e.wallWalk?.path.some((id) => ids.has(id)),
      ) ||
      group.some((e) => e.occupantId)
    )
      return fail("Najpierw sprowadź łuczników z całego muru");
    const draft = structuredClone(w);
    for (const b of group) {
      const check = command(draft, { type: "demolish", targetId: b.id });
      if (!check.ok) return fail(check.message);
    }
    for (const b of getEntities(draft))
      if (b.links) b.links = b.links.filter((id) => !ids.has(id));
    Object.assign(w, draft);
    return ok(
      "Rozebrano cały mur · " +
        group.length +
        " elementów; odzyskano połowę materiałów",
    );
  }
  if (c.type === "demolishBridge") {
    if (
      !target ||
      target.kind !== "building" ||
      kindOf(target) !== "bridge" ||
      target.faction !== "player"
    )
      return fail("Wskaż własny most");
    const group = connectedBridgeGroup(
      getEntities(w).filter((e) => e.kind === "building" && e.hp > 0),
      target,
    );
    const draft = structuredClone(w);
    for (const b of group) {
      const check = command(draft, { type: "demolish", targetId: b.id });
      if (!check.ok)
        return fail(
          check.message === "Najpierw opróżnij pole"
            ? "Najpierw opróżnij cały most"
            : check.message,
        );
    }
    const removed = new Set(
      group.filter((b) => !draft.entities[b.id]).map((b) => b.id),
    );
    for (const b of getEntities(draft))
      if (b.links) b.links = b.links.filter((id) => !removed.has(id));
    Object.assign(w, draft);
    return ok(
      "Rozebrano cały most · " +
        group.length +
        " odcinków; odzyskano połowę materiałów",
    );
  }
  if (c.type === "demolish") {
    if (!target || target.kind !== "building" || target.faction !== "player")
      return fail("Wskaż własną budowlę");
    if (getEntities(w).some((e) => e.wallWalk?.path.includes(target.id)))
      return fail("Zaczekaj, łucznik przechodzi po konstrukcji");
    if (
      kindOf(target) !== "road" &&
      getEntities(w).some(
        (e) => mobile(e) && at(e, Math.round(target.x), Math.round(target.z)),
      )
    )
      return fail("Najpierw opróżnij pole");
    if (
      kindOf(target) === "road" &&
      villageRoadTiles.has(roadKey(target.x, target.z))
    )
      w.removedRoads = [
        ...new Set([...(w.removedRoads || []), roadKey(target.x, target.z)]),
      ];
    const def = buildingDefs[target.type];
    if (!def) return fail("Nie można rozebrać początkowej siedziby");
    if (target.workerId) {
      const worker = w.entities[target.workerId];
      if (worker) {
        detach(w, worker);
        worker.order = undefined;
      }
    }
    if (target.occupantId) {
      const unit = w.entities[target.occupantId];
      if (unit) {
        detach(w, unit);
        unit.order = { type: "stay" };
      }
    }
    for (const [key, value] of Object.entries(def.cost))
      w.resources[key as keyof Resources] += Math.floor(value * 0.5);
    for (const q of w.recruitQueue.filter((q) => q.buildingId === target.id))
      for (const [key, value] of Object.entries(unitCosts[q.unit]))
        w.resources[key as keyof Resources] += value;
    w.recruitQueue = w.recruitQueue.filter((q) => q.buildingId !== target.id);
    if (target.channel && kindOf(target) === "bridge") {
      target.type = target.bridgeBase || "trench";
      target.label = buildingDefs[target.type].label;
      target.bridgeBase = undefined;
      target.hp = target.maxHp = 100;
      target.open = undefined;
    } else delete w.entities[target.id];
    refreshWater(w);
    return ok("Rozebrano budowlę; odzyskano połowę materiałów");
  }
  if (c.type === "rebuildWall") {
    const plan = wallRebuildAvailable(w, c.targetId || "");
    if (!plan.ok) return fail(plan.message);
    const h = getEntities(w).find(
      (e) => e.kind === "hero" && e.faction === "player" && e.hp > 0,
    )!;
    if (distance(h, target!) > 4) {
      const path = findPath(w, h, target!, true);
      if (!path) return fail("Brak drogi do fortyfikacji");
      detach(w, h);
      h.pendingAction = { type: "rebuildWall", targetId: target!.id };
      h.order = {
        type: "move",
        path,
        x: target!.x,
        z: target!.z,
        targetId: target!.id,
      };
      return ok("Bohater podchodzi do odbudowy");
    }
    pay(w, plan.cost);
    for (const id of plan.parts) {
      const b = w.entities[id],
        def = buildingDefs[b.originalType!];
      b.kind = "building";
      b.type = b.originalType!;
      b.label = def.label;
      b.faction = "player";
      b.hp = b.maxHp = def.hp;
      b.material = def.material;
      b.siegeCollapse = undefined;
      b.occupantId = undefined;
      if (kindOf(b) === "gate") {
        b.open = true;
        b.pendingClose = false;
        b.gateMode ??= b.type === "woodGate" ? "manual" : "auto";
      }
    }
    return ok(
      "Odbudowano całą fortyfikację · " + plan.parts.length + " elementów",
    );
  }
  if (c.type === "repairWall") {
    const plan = wallRepairAvailable(w, c.targetId || "");
    if (!plan.ok) return fail(plan.message);
    pay(w, plan.cost);
    for (const id of plan.parts) w.entities[id].hp = w.entities[id].maxHp;
    return ok(
      "Naprawiono całą fortyfikację · " + plan.parts.length + " elementów",
    );
  }
  if (c.type === "repair") {
    if (
      !target ||
      target.faction !== "player" ||
      target.kind !== "building" ||
      target.hp === target.maxHp
    )
      return fail("Wskaż uszkodzoną budowlę");
    if (!canPay(w, { wood: 15, stone: 10 }))
      return fail("Naprawa kosztuje 15 drewna i 10 kamienia");
    pay(w, { wood: 15, stone: 10 });
    target.hp = target.maxHp;
    return ok("Budowla naprawiona");
  }
  if (
    ["mount", "board", "rebuild"].includes(c.type) &&
    actor &&
    target &&
    distance(actor, target) > (c.type === "rebuild" ? 4 : 2.5)
  ) {
    const path = findPath(w, actor, target, true);
    if (!path) return fail("Brak drogi do celu");
    detach(w, actor);
    actor.pendingAction = { type: c.type, targetId: target.id };
    actor.order = {
      type: "move",
      path,
      x: target.x,
      z: target.z,
      targetId: target.id,
    };
    return ok("Bohater podchodzi do celu");
  }
  if (c.type === "rebuild") {
    if (!target || target.kind !== "ruin") return fail("Wskaż ruiny");
    if (
      getEntities(w).some(
        (e) => e.faction === "enemy" && distance(e, target) < 8,
      )
    )
      return fail("Najpierw zabezpiecz ruiny");
    if (!actor || distance(actor, target) > 4)
      return fail("Podejdź bohaterem do ruin");
    if (!canPay(w, { wood: 60, stone: 50 }))
      return fail("Odbudowa: 60 drewna, 50 kamienia");
    pay(w, { wood: 60, stone: 50 });
    target.siegeCollapse = undefined;
    target.kind = "building";
    target.type = target.originalType || "tower";
    target.label = buildingDefs[target.type]?.label || "Odbudowana siedziba";
    target.faction = "player";
    target.hp = target.maxHp = buildingDefs[target.type]?.hp || 400;
    if (target.regionalRuin) w.objectives.ruinsRestored = true;
    return ok("Strażnica odbudowana");
  }
  if (!actor) return fail("Brak bohatera");
  if (c.type === "mount") {
    if (actor.kind !== "hero")
      return fail("Tylko bohater może dosiąść wierzchowca");
    if (
      !target ||
      target.kind !== "horse" ||
      distance(actor, target) > 2.5 ||
      actor.mountedOn ||
      actor.carriedBy
    )
      return fail("Podejdź do wolnego wierzchowca");
    if (target.carriedBy) return fail("Wierzchowiec jest zajęty");
    actor.mountedOn = target.id;
    target.carriedBy = actor.id;
    return ok("Bohater dosiada wierzchowca");
  }
  if (c.type === "dismount") {
    const horse = w.entities[actor.mountedOn || ""];
    if (!horse) return fail("Bohater nie jedzie na wierzchowcu");
    const p = nearbyFree(w, actor);
    if (!p) return fail("Brak miejsca na zejście");
    horse.carriedBy = undefined;
    Object.assign(horse, p);
    actor.mountedOn = undefined;
    return ok("Bohater zsiadł z wierzchowca");
  }
  if (c.type === "board") {
    if (actor.kind !== "hero") return fail("Ta łódź przewozi bohatera");
    if (
      !target ||
      target.kind !== "boat" ||
      target.passengerId ||
      distance(actor, target) > 3 ||
      actor.mountedOn ||
      actor.carriedBy
    )
      return fail("Podejdź pieszo do wolnej łodzi");
    actor.carriedBy = target.id;
    target.passengerId = actor.id;
    actor.order = undefined;
    actor.x = target.x;
    actor.z = target.z;
    return ok("Bohater na pokładzie — steruj łodzią");
  }
  if (c.type === "disembark") {
    const boat =
      actor.kind === "boat" ? actor : w.entities[actor.carriedBy || ""];
    const hero = boat && w.entities[boat.passengerId || ""];
    if (!boat || !hero) return fail("Łódź nie ma pasażera");
    let p: Point | null = null;
    for (let dx = -2; dx <= 2; dx++)
      for (let dz = -2; dz <= 2; dz++) {
        const q = { x: Math.round(boat.x) + dx, z: Math.round(boat.z) + dz };
        if (
          distance(q, boat) <= 2.1 &&
          terrainAt(w, q.x, q.z) !== "water" &&
          isWalkable(w, q.x, q.z, { ...hero, carriedBy: undefined })
        )
          p = q;
      }
    if (!p) return fail("Podpłyń do dostępnego brzegu");
    hero.carriedBy = undefined;
    boat.passengerId = undefined;
    Object.assign(hero, p);
    return ok("Bohater wysiadł na brzeg");
  }
  if (c.type === "follow" || c.type === "stay") {
    const dog =
      target?.kind === "dog"
        ? target
        : getEntities(w).find((e) => e.kind === "dog");
    if (!dog) return fail("Nie ma psa");
    dog.order =
      c.type === "follow"
        ? { type: "follow", targetId: actor.id }
        : { type: "stay" };
    return ok(
      c.type === "follow"
        ? "Pies idzie za bohaterem"
        : "Pies zostaje na miejscu",
    );
  }
  if (c.type === "garrison") {
    if (
      actor.kind !== "archer" ||
      !target ||
      !["wall", "tower"].includes(kindOf(target)) ||
      target.faction !== "player" ||
      !postCapacity(w, target)
    )
      return fail("Wskaż łucznika i wolny mur lub wieżę");
    if (actor.garrisonId && (actor.elevation ?? 0) >= 1 && !actor.descending) {
      const path = wallPath(getEntities(w), actor.garrisonId, target.id);
      if (!path) return fail("Brak połączenia na murach");
      if (path.length < 2) return ok("Łucznik jest na tym stanowisku");
      const active = actor.wallWalk;
      const rest =
        active && active.progress > 0
          ? wallPath(getEntities(w), active.toId, target.id)
          : undefined;
      if (active && active.progress > 0 && !rest)
        return fail("Brak połączenia na murach");
      cancelWallWalk(w, actor);
      target.occupantId ??= actor.id;
      actor.wallWalk =
        active && rest
          ? {
              ...active,
              path: [active.fromId, ...rest],
              destinationId: target.id,
              stopAfterStep: false,
              descendAfterStep: false,
            }
          : {
              path,
              destinationId: target.id,
              fromId: path[0],
              toId: path[1],
              progress: 0,
            };
      actor.order = undefined;
      return ok("Łucznik przechodzi po murach");
    }
    const stairs = getEntities(w)
      .filter(
        (e) =>
          e.type === "wallStairs" &&
          e.faction === "player" &&
          distance(e, target) <= 1.7,
      )
      .sort((a, b) => distance(actor, a) - distance(actor, b))
      .find((e) => findPath(w, actor, e, true));
    const path = findPath(w, actor, stairs || target, true);
    if (!path) return fail("Brak drogi do muru");
    detach(w, actor);
    actor.garrisonTargetId = target.id;
    actor.garrisonEntryId = stairs?.id;
    target.occupantId ??= actor.id;
    actor.order = {
      type: "move",
      path,
      x: target.x,
      z: target.z,
      targetId: target.id,
    };
    return ok("Łucznik zmierza na stanowisko");
  }

  if (c.type === "ungarrison") {
    if (actor.wallWalk) {
      actor.wallWalk.stopAfterStep = true;
      actor.wallWalk.descendAfterStep = true;
      return ok("Łucznik zejdzie po dojściu do podestu");
    }
    cancelWallWalk(w, actor);
    if (actor.garrisonTargetId && !actor.garrisonId) {
      detach(w, actor);
      actor.order = undefined;
      return ok("Anulowano zajmowanie stanowiska");
    }
    if (!actor.garrisonId && !actor.garrisonTargetId)
      return fail("Jednostka nie jest na murze");
    if (actor.garrisonId) {
      const p = nearbyFree(w, w.entities[actor.garrisonId] || actor, actor);
      if (!p) return fail("Zejście zablokowane");
      actor.x = p.x;
      actor.z = p.z;
    }
    actor.descending = true;
    actor.garrisonTargetId = undefined;
    return ok("Łucznik schodzi z muru");
  }

  if (c.type === "interact") {
    if (target?.kind === "horse")
      return command(w, {
        type: "mount",
        actorId: actor.id,
        targetId: target.id,
      });
    if (target?.kind === "boat")
      return command(w, {
        type: "board",
        actorId: actor.id,
        targetId: target.id,
      });
    if (target?.kind === "ruin")
      return command(w, {
        type: "rebuild",
        actorId: actor.id,
        targetId: target.id,
      });
    if (target && ["gate", "bridge", "waterGate"].includes(kindOf(target)))
      return command(w, { type: "toggle", targetId: target.id });
    if (target && ["tree", "rock"].includes(target.kind))
      return command(w, {
        type: "gather",
        ids: [actor.id],
        targetId: target.id,
      });
    return fail("Wybierz rozkaz dla tego obiektu");
  }
  return fail("Nieznany rozkaz");
}
function assign(w: World, e: Entity, b: Entity) {
  detach(w, e);
  e.workplaceId = b.id;
  b.workerId = e.id;
  if (!w.alarm)
    e.order = {
      type: "work",
      targetId: b.id,
      path: findPath(w, e, b, true) || [],
    };
}
function moveAlong(w: World, e: Entity, dt: number) {
  const o = e.order;
  if (!o?.path?.length) return;
  const onRoad = getEntities(w).some(
    (b) => kindOf(b) === "road" && at(b, Math.round(e.x), Math.round(e.z)),
  );
  let budget =
    ((e.slowUntil || 0) > w.time ? e.slowFactor || 1 : 1) *
    dt *
    (onRoad
      ? getEntities(w).some(
          (b) =>
            b.type === "stoneRoad" && at(b, Math.round(e.x), Math.round(e.z)),
        )
        ? 1.8
        : 1.5
      : 1) *
    (["caravan", "merchant"].includes(e.kind)
      ? 2
      : e.kind === "boat"
        ? 3
        : e.mountedOn
          ? 5
          : 2.5);
  while (budget > 0 && o.path.length) {
    const p = o.path[0];
    if (!isWalkable(w, p.x, p.z, e)) {
      o.path = [];
      o.retry = 1;
      return;
    }
    const d = distance(e, p);
    if (d <= budget) {
      e.x = p.x;
      e.z = p.z;
      o.path.shift();
      budget -= d;
    } else {
      e.x += ((p.x - e.x) / d) * budget;
      e.z += ((p.z - e.z) / d) * budget;
      budget = 0;
    }
  }
}
function hit(
  w: World,
  e: Entity,
  target: Entity,
  dt: number,
  range: number,
  damage: number,
) {
  e.cooldown = Math.max(0, (e.cooldown || 0) - dt);
  if (distance(e, target) <= range && e.cooldown <= 0) {
    target.hp -=
      damage *
      (e.faction === "player" ? 1 + w.weaponLevel * 0.2 : 1) *
      (target.type === "shieldbearer" ? 0.65 : 1) *
      (target.tradeRoute &&
      getEntities(w).some(
        (p) =>
          p.type === "merchantPost" &&
          p.faction === target.faction &&
          p.hp > 0 &&
          distance(p, target) <= 4,
      )
        ? 0.5
        : 1) *
      (target.faction === "player" &&
      ["soldier", "archer"].includes(target.kind) &&
      getEntities(w).some(
        (b) =>
          b.hp > 0 &&
          b.faction === "player" &&
          (b.type === "armory" ||
            (b.type === "fortressArmory" && distance(b, target) <= 6)),
      )
        ? getEntities(w).some(
            (b) => b.type === "armory" && b.hp > 0 && b.faction === "player",
          )
          ? 0.8
          : 0.85
        : 1);
    if (
      e.type === "catapult" &&
      target.kind === "building" &&
      target.hp > 0 &&
      (buildingDefs[target.type]?.material === "wood" ||
        [
          "house",
          "warehouse",
          "granary",
          "inn",
          "stable",
          "lumber",
          "lumbermill",
          "farm",
          "market",
          "firehouse",
          "merchantPost",
          "siegeWorkshop",
        ].includes(target.type))
    ) {
      if (!target.fire) announce(w, "Pożar: " + target.label);
      target.fire = 12;
    }
    target.lastHit = w.time;
    target.lastDamageKind = e.type;
    if (["ram", "catapult", "ballistaTower"].includes(e.type))
      e.lastAttack = {
        time: w.time,
        targetId: target.id,
        x: target.x,
        z: target.z,
      };
    e.cooldown = e.type === "ballistaTower" ? 3 : 1;
  }
}
export function threatDirection(from: Point, to: Point) {
  const sectors = [
    "wschód",
    "południowy wschód",
    "południe",
    "południowy zachód",
    "zachód",
    "północny zachód",
    "północ",
    "północny wschód",
  ];
  return sectors[
    (Math.round(Math.atan2(to.z - from.z, to.x - from.x) / (Math.PI / 4)) + 8) %
      8
  ];
}
function tick(w: World, dt: number) {
  repairBoatBerths(w);
  w.time += dt;
  collectRaidGems(w);
  progressFor(w);
  updateMerchants(w);
  updateOwnedMerchants(w);
  for (const merchant of getEntities(w).filter((e) => e.tradeRoute && e.hp > 0))
    if (
      getEntities(w).some(
        (p) =>
          p.type === "merchantPost" &&
          p.faction === "player" &&
          p.hp > 0 &&
          distance(p, merchant) <= 4,
      )
    )
      merchant.hp = Math.min(merchant.maxHp, merchant.hp + dt * 2);
  for (const tower of getEntities(w).filter(
    (e) => e.type === "signalTower" && e.faction === "player" && e.hp > 0,
  )) {
    tower.alertCooldown = Math.max(0, (tower.alertCooldown || 0) - dt);
    const enemy = getEntities(w).find(
      (e) => e.faction === "enemy" && e.hp > 0 && distance(e, tower) <= 14,
    );
    if (enemy && !tower.alertCooldown) {
      announce(
        w,
        "Wieża sygnałowa: wróg " +
          (enemy.x >= tower.x ? "na wschodzie" : "na zachodzie") +
          (enemy.z < tower.z ? ", od północy" : ", od południa"),
      );
      tower.alertCooldown = 30;
    }
  }

  for (const b of getEntities(w)) {
    if (b.pendingClose) {
      const group =
        kindOf(b) === "bridge" ? connectedBridgeGroup(getEntities(w), b) : [b];
      if (
        !getEntities(w).some(
          (e) =>
            mobile(e) &&
            !e.carriedBy &&
            group.some((v) => at(e, Math.round(v.x), Math.round(v.z))),
        )
      )
        for (const v of group) {
          v.open = false;
          v.pendingClose = false;
        }
    }
    if (
      (kindOf(b) === "gate" || b.type === "waterGate") &&
      b.gateMode === "auto"
    )
      b.open = getEntities(w).some(
        (e) => e.faction === "player" && mobile(e) && distance(e, b) < 2.5,
      );
  }
  w.raidTimer -= dt;
  const signal = getEntities(w).some(
    (e) => e.type === "signalTower" && e.faction === "player" && e.hp > 0,
  );
  if (w.raidTimer <= (signal ? 180 : 60) && !w.raidWarned) {
    w.raidWarned = true;
    const home = getEntities(w).find(
      (e) =>
        e.faction === "player" && (e.type === "hall" || kindOf(e) === "castle"),
    );
    w.raidDirection = threatDirection(home || { x: 14, z: 30 }, {
      x: 27,
      z: 25,
    });
    announce(
      w,
      signal
        ? "Wieża sygnałowa: najazd za " +
            Math.ceil(w.raidTimer) +
            " s · " +
            w.raidDirection
        : "Zwiadowcy ostrzegają: najazd za minutę. Przygotuj obronę i alarm mieszkańców.",
    );
  }
  if (w.raidTimer <= 0) {
    w.raidNumber++;
    w.raidTimer = 720;
    w.raidWarned = false;
    const origin = getEntities(w).find(
      (e) => e.type === "hall" || kindOf(e) === "castle",
    );
    if (origin) {
      const invaders: string[] = [];
      for (let i = 0; i < Math.min(3 + w.raidNumber, 8); i++) {
        const e = add(
          w,
          "enemy",
          "raider",
          "Najeźdźca",
          27,
          25 + i,
          "enemy",
          65,
        );
        e.order = { type: "raid", targetId: origin.id };
        invaders.push(e.id);
      }
      startRaidReward(w, w.raidNumber, origin.id, invaders);
      announce(w, "Najazd! Wrogowie zbliżają się od północnego wschodu.");
    }
  }
  const q = w.recruitQueue[0];
  if (q) {
    q.remaining -= dt;
    if (q.remaining <= 0) {
      const b = w.entities[q.buildingId];
      if (b?.kind === "building" && kindOf(b) === "barracks" && b.hp > 0) {
        const p = nearbyFree(w, b);
        if (p) {
          add(
            w,
            q.unit === "shieldbearer" ? "soldier" : q.unit,
            q.unit,
            q.unit === "archer"
              ? "Łucznik"
              : q.unit === "shieldbearer"
                ? "Tarczownik"
                : "Piechur",
            p.x,
            p.z,
            "player",
            q.unit === "archer" ? 70 : q.unit === "shieldbearer" ? 180 : 110,
          );
          w.recruitQueue.shift();
          announce(w, "Jednostka gotowa");
        }
      } else {
        w.recruitQueue.shift();
        announce(w, "Szkolenie przerwane: koszary zniszczone");
      }
    }
  }
  for (const yard of getEntities(w).filter(
    (e) => e.type === "camelYard" && e.faction === "player",
  )) {
    yard.progress = (yard.progress || 0) + dt;
    if (
      yard.progress >= 60 &&
      w.resources.food >= 10 &&
      getEntities(w).filter((e) => e.bornAt === yard.id).length < 3
    ) {
      const p = nearbyFree(w, yard);
      if (p) {
        w.resources.food -= 10;
        yard.progress = 0;
        const camel = add(
          w,
          "horse",
          "camel",
          "Wielbłąd",
          p.x,
          p.z,
          "player",
          140,
        );
        camel.bornAt = yard.id;
      }
    }
  }
  for (const unit of getEntities(w))
    if (
      ["soldier", "archer"].includes(unit.kind) &&
      unit.faction === "player" &&
      unit.hp > 0 &&
      w.time - (unit.lastHit || 0) > 6 &&
      getEntities(w).some(
        (b) =>
          b.type === "barracks" &&
          b.faction === "player" &&
          distance(b, unit) <= 4,
      )
    )
      unit.hp = Math.min(unit.maxHp, unit.hp + dt * 1.5);
  const defenses = getEntities(w).filter(
    (b) => b.kind === "building" && b.hp > 0,
  );
  for (const u of getEntities(w).filter((e) => e.hp > 0 && mobile(e))) {
    const traps = defenses.filter(
      (b) =>
        ["spikePit", "chevaux"].includes(b.type) &&
        b.faction !== u.faction &&
        u.faction !== "neutral" &&
        b.faction !== "neutral" &&
        distance(b, u) < 0.8,
    );
    if (traps.length) {
      const heavy =
        !!u.mountedOn || ["cavalry", "ram", "horse"].includes(u.type);
      u.slowUntil = w.time + 0.2;
      u.slowFactor = traps.some((b) => b.type === "spikePit")
        ? 0.35
        : heavy
          ? 0.2
          : 0.5;
      u.hp -=
        dt * (traps.some((b) => b.type === "spikePit") ? 5 : heavy ? 8 : 0);
    }
    if (
      ["soldier", "archer", "hero"].includes(u.kind) &&
      w.time - (u.lastHit || 0) > 6 &&
      defenses.some(
        (b) =>
          b.type === "fortressArmory" &&
          b.faction === u.faction &&
          distance(b, u) <= 6,
      )
    )
      u.hp = Math.min(u.maxHp, u.hp + dt * 2);
  }
  for (const b of getEntities(w))
    if (b.kind === "building" && b.hp > 0 && (b.fire || 0) > 0) {
      b.hp -= 1.5 * dt;
      b.fire = Math.max(0, b.fire! - dt * 0.2);
    }
  for (const e of getEntities(w)) {
    if (e.hp <= 0 || e.carriedBy) continue;
    if (
      e.pendingAction &&
      !e.order?.path?.length &&
      w.entities[e.pendingAction.targetId] &&
      distance(e, w.entities[e.pendingAction.targetId]) <=
        (["rebuild", "rebuildWall"].includes(e.pendingAction.type) ? 4 : 2.5)
    ) {
      const action = e.pendingAction;
      e.pendingAction = undefined;
      command(w, {
        type: action.type,
        actorId: e.id,
        targetId: action.targetId,
      });
    }
    const firehouse = w.entities[e.workplaceId || ""];
    if (
      e.kind === "worker" &&
      e.order?.type === "work" &&
      firehouse?.type === "firehouse" &&
      firehouse.hp > 0 &&
      firehouse.faction === e.faction &&
      firehouse.workerId === e.id
    ) {
      const fire = getEntities(w)
        .filter(
          (b) =>
            b.kind === "building" &&
            b.hp > 0 &&
            b.faction === e.faction &&
            (b.fire || 0) > 0 &&
            distance(b, firehouse) <= 10,
        )
        .sort((a, b) => distance(a, e) - distance(b, e))
        .find((b) => distance(e, b) <= 1.8 || !!findPath(w, e, b, true));
      const destination = fire || firehouse;
      if (e.fireTargetId !== fire?.id || !e.order.path?.length)
        e.order.path = findPath(w, e, destination, true) || [];
      e.fireTargetId = fire?.id;
      if (fire && distance(e, fire) <= 1.8) {
        e.order.path = [];
        const water = getEntities(w).some(
          (b) =>
            b.type === "well" &&
            b.faction === e.faction &&
            b.hp > 0 &&
            distance(b, firehouse) <= 6,
        );
        fire.fire = Math.max(0, fire.fire! - dt * (water ? 6 : 3));
      } else if (distance(e, destination) > 1.5) moveAlong(w, e, dt);
      continue;
    }
    e.fireTargetId = undefined;
    updateWallWalk(w, e, dt);
    if (e.garrisonTargetId) {
      const b = w.entities[e.garrisonTargetId];
      if (
        e.garrisonEntryId &&
        w.entities[e.garrisonEntryId]?.type !== "wallStairs"
      ) {
        e.garrisonEntryId = undefined;
        if (b)
          e.order = {
            type: "move",
            targetId: b.id,
            x: b.x,
            z: b.z,
            path: findPath(w, e, b, true) || [],
          };
      }
      if (!b) {
        e.garrisonTargetId = undefined;
      } else if (
        distance(e, w.entities[e.garrisonEntryId || ""] || b) <= 1.1 &&
        !e.order?.path?.length
      ) {
        e.elevation = Math.min(
          1,
          (e.elevation || 0) + dt * (e.garrisonEntryId ? 2 : 1),
        );
        if (e.elevation >= 1) {
          e.garrisonId = b.id;
          e.garrisonTargetId = undefined;
          e.garrisonEntryId = undefined;
          e.order = undefined;
        }
      }
    }
    if (e.descending) {
      e.elevation = Math.max(0, (e.elevation || 0) - dt);
      if (e.elevation === 0) {
        detach(w, e);
        e.descending = false;
      }
    }
    const o = e.order;
    const target = o?.targetId ? w.entities[o.targetId] : undefined;
    if (e.kind === "tree" && e.type === "sapling") {
      e.growth = (e.growth || 0) + dt;
      if (e.growth >= 60) {
        e.type = "tree";
        e.label = "Drzewo";
        e.hp = e.maxHp = 30;
      }
    }
    if (e.kind === "dog") {
      e.alertCooldown = Math.max(0, (e.alertCooldown || 0) - dt);
      if (
        e.alertCooldown === 0 &&
        getEntities(w).some((v) => v.faction === "enemy" && distance(v, e) < 9)
      ) {
        announce(w, "Reks szczeka: wróg w pobliżu!");
        e.alertCooldown = 20;
      }
    }
    if (mobile(e) && !e.garrisonId && !e.descending) {
      if (o) o.retry = Math.max(0, (o.retry || 0) - dt);
      if (o?.type === "patrol" && !o.path?.length && !o.retry) {
        let destination =
          o.phase === "return"
            ? { x: o.startX!, z: o.startZ! }
            : { x: o.x!, z: o.z! };
        if (distance(e, destination) < 0.3) {
          o.phase = o.phase === "return" ? "outbound" : "return";
          destination =
            o.phase === "return"
              ? { x: o.startX!, z: o.startZ! }
              : { x: o.x!, z: o.z! };
        }
        o.path = findPath(w, e, destination) || [];
        o.retry = 0.5;
      }
      if (
        o?.type === "escort" &&
        target &&
        distance(e, target) > 2 &&
        !o.retry
      ) {
        o.path = findPath(w, e, target, true) || [];
        o.retry = 0.5;
      }
      if (
        o?.type === "follow" &&
        target &&
        distance(e, target) > 2 &&
        !o.path?.length &&
        !o.retry
      ) {
        o.path = findPath(w, e, target, true) || [];
        o.retry = 1;
      }
      if (o?.type === "move" && !o.path?.length && !o.retry) {
        const destination = target || { x: o.x!, z: o.z! };
        if (
          Number.isFinite(destination.x) &&
          distance(e, destination) > (target ? 1.5 : 0.1)
        ) {
          o.path = findPath(w, e, destination, !!target) || [];
          o.retry = 1;
        }
      }
      if (
        o &&
        ["attack", "raid", "gather", "work"].includes(o.type) &&
        target &&
        target.hp > 0 &&
        !o.path?.length &&
        distance(e, target) > 1.6 &&
        !o.retry
      ) {
        o.path = findPath(w, e, target, true) || [];
        o.retry = 1;
        if (!o.path.length && e.kind === "enemy") {
          const route = findPath(w, e, target, true, true);
          const barrier = route
            ?.map((p) => blocking(w, p.x, p.z, e))
            .find((b) => b?.faction === "player" && b.kind === "building");
          if (barrier) {
            o.destinationId = o.destinationId || target.id;
            o.targetId = barrier.id;
            o.path = findPath(w, e, barrier, true) || [];
          }
        }
      }
      if (o?.type === "trade" && !o.path?.length) {
        if (o.phase === "outbound" && target && distance(e, target) < 2) {
          o.phase = "return";
          o.path = findPath(w, e, { x: o.x!, z: o.z! }, true) || [];
        } else if (
          o.phase === "return" &&
          distance(e, { x: o.x!, z: o.z! }) < 2
        ) {
          w.resources.gold += 35;
          progressFor(w).tradeReturns++;
          delete w.entities[e.id];
          announce(w, "Karawana wróciła: +35 monet");
          continue;
        } else {
          o.path =
            findPath(
              w,
              e,
              o.phase === "return" ? { x: o.x!, z: o.z! } : target || e,
              true,
            ) || [];
        }
      }
      if (o && ["patrol", "escort"].includes(o.type)) {
        const threat = getEntities(w)
          .filter(
            (v) => v.faction === "enemy" && v.hp > 0 && distance(e, v) <= 5,
          )
          .sort((a, b) => distance(a, e) - distance(b, e))[0];
        if (threat && distance(e, threat) > 1.5 && (o.timer || 0) <= 0) {
          o.path = findPath(w, e, threat, true) || [];
          o.timer = 0.5;
        }
        o.timer = Math.max(0, (o.timer || 0) - dt);
      }
      moveAlong(w, e, dt);
    }
    if (o?.type === "gather" && target && distance(e, target) < 1.6) {
      o.timer = (o.timer || 0) + dt;
      if (o.timer >= 1) {
        o.timer = 0;
        target.hp -= 10;
        w.resources[target.kind === "rock" ? "stone" : "wood"] += 3;
        if (target.hp <= 0) {
          delete w.entities[target.id];
          e.order = undefined;
        }
      }
    }
    if (
      !w.alarm &&
      o?.type === "work" &&
      target?.kind === "building" &&
      target.hp > 0 &&
      distance(e, target) < 1.6
    ) {
      const def = buildingDefs[target.type];
      target.progress = (target.progress || 0) + dt;
      if (def?.production && target.progress >= (def.interval || 10)) {
        target.progress = 0;
        if (!def.consumes || canPay(w, def.consumes)) {
          if (def.consumes) pay(w, def.consumes);
          const irrigated =
            ["field", "farm"].includes(target.type) &&
            getEntities(w).some(
              (b) => b.type === "well" && distance(b, target) <= 5,
            );
          const fields =
            target.type === "mill" &&
            getEntities(w).some(
              (b) => b.type === "field" && distance(b, target) <= 5,
            );
          for (const [k, v] of Object.entries(def.production))
            w.resources[k as keyof Resources] +=
              v *
              (irrigated ? 1.5 : fields ? 2 : 1) *
              (["field", "farm"].includes(target.type) &&
              getEntities(w).some(
                (b) =>
                  b.type === "mill" &&
                  b.faction === "player" &&
                  b.hp > 0 &&
                  w.entities[b.workerId || ""]?.order?.targetId === b.id &&
                  distance(w.entities[b.workerId!], b) < 1.6 &&
                  distance(b, target) <= 5,
              )
                ? 1.25
                : 1);
        }
      }
      if (target.type === "forester" && target.progress >= 12) {
        target.progress = 0;
        let planted = false;
        for (let dx = -5; dx <= 5 && !planted; dx++)
          for (let dz = -5; dz <= 5 && !planted; dz++) {
            const x = target.x + dx,
              z = target.z + dz;
            if (
              Math.hypot(dx, dz) > 5 ||
              Math.hypot(dx, dz) < 2 ||
              !isWalkable(w, x, z) ||
              getEntities(w).some((e) => at(e, x, z))
            )
              continue;
            const tree = add(
              w,
              "tree",
              "sapling",
              "Sadzonka",
              x,
              z,
              "neutral",
              10,
            );
            tree.growth = 0;
            planted = true;
          }
      }
      if (
        ["repairWorkshop", "shipyard"].includes(target.type) &&
        target.progress! >= 4
      ) {
        const repair = getEntities(w)
          .filter(
            (b) =>
              b.faction === "player" &&
              b.hp > 0 &&
              b.hp < b.maxHp &&
              distance(b, target) <= 6 &&
              (target.type === "shipyard"
                ? b.kind === "boat"
                : b.kind === "building" &&
                  ["wall", "gate", "tower", "waterGate"].includes(kindOf(b))),
          )
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        const cost =
          target.type === "shipyard" ? { wood: 2 } : { wood: 2, stone: 1 };
        if (repair && canPay(w, cost)) {
          pay(w, cost);
          repair.hp = Math.min(repair.maxHp, repair.hp + 20);
        }
        target.progress = 0;
      }
      if (target.type === "hospital")
        for (const ally of getEntities(w))
          if (
            ally.faction === "player" &&
            mobile(ally) &&
            distance(ally, target) <= 5
          )
            ally.hp = Math.min(ally.maxHp, ally.hp + dt * 3);
    }
    const combat =
      ["soldier", "archer", "hero", "enemy"].includes(e.kind) ||
      kindOf(e) === "tower";
    if (combat) {
      const current = e.order?.targetId
        ? w.entities[e.order.targetId]
        : undefined;
      let enemy =
        current?.hp && ["attack", "raid"].includes(e.order?.type || "")
          ? current
          : undefined;
      const range =
        e.type === "ballistaTower"
          ? 10
          : e.type === "catapult"
            ? 8
            : e.type === "ram"
              ? 1.7
              : e.type === "stoneTower"
                ? 8
                : e.kind === "archer" || kindOf(e) === "tower"
                  ? e.garrisonId
                    ? 8
                    : 6
                  : 1.7;
      const foes = getEntities(w)
        .filter(
          (v) =>
            v.hp > 0 &&
            (e.faction === "enemy"
              ? v.faction === "player" &&
                !["dog", "horse", "boat"].includes(v.kind)
              : v.faction === "enemy"),
        )
        .sort((a, b) => distance(a, e) - distance(b, e));
      if (enemy && distance(e, enemy) > range) {
        const immediate = foes.find((v) => distance(v, e) <= range);
        if (immediate) enemy = immediate;
      }
      if (!enemy) enemy = foes.find((v) => distance(v, e) <= range);
      if (enemy)
        hit(
          w,
          e,
          enemy,
          dt,
          range,
          e.type === "ballistaTower"
            ? ["ram", "catapult"].includes(enemy.type)
              ? 90
              : 45
            : e.type === "catapult"
              ? 32
              : e.type === "ram"
                ? enemy.kind === "building" || enemy.kind === "town"
                  ? 36
                  : 7
                : e.type === "stoneTower"
                  ? 22
                  : kindOf(e) === "tower"
                    ? 15
                    : e.kind === "hero"
                      ? 18
                      : e.kind === "archer"
                        ? 12
                        : 14,
        );
      const canPursue =
        ["soldier", "archer", "enemy"].includes(e.kind) &&
        !e.garrisonId &&
        !e.garrisonTargetId &&
        !e.descending &&
        e.order?.phase !== "hold" &&
        (!e.order || ["stay", "attack", "raid"].includes(e.order.type));
      if (canPursue && (!current || current.hp <= 0 || !enemy)) {
        const next = foes.find((v) => distance(v, e) <= 7);
        if (next && (!e.order?.path?.length || e.order.targetId !== next.id)) {
          e.order = {
            type: "attack",
            targetId: next.id,
            path: findPath(w, e, next, true) || [],
            retry: 1,
          };
        }
      }
    }
  }
  for (const e of getEntities(w)) {
    if (e.carriedBy) {
      const carrier = w.entities[e.carriedBy];
      if (carrier) {
        e.x = carrier.x;
        e.z = carrier.z;
      } else e.carriedBy = undefined;
    }
    if (e.hp <= 0) {
      trackRaidDeath(w, e.id);
      if (e.mountedOn) {
        const mount = w.entities[e.mountedOn];
        if (mount) mount.carriedBy = undefined;
        e.mountedOn = undefined;
      }
      if (e.carriedBy) {
        const carrier = w.entities[e.carriedBy];
        if (carrier?.passengerId === e.id) carrier.passengerId = undefined;
        if (carrier?.passengerIds)
          carrier.passengerIds = carrier.passengerIds.filter(
            (id) => id !== e.id,
          );
        if (carrier?.mountedOn === e.id) carrier.mountedOn = undefined;
        e.carriedBy = undefined;
      }
      for (const attached of getEntities(w)) {
        if (attached.carriedBy === e.id) attached.carriedBy = undefined;
        if (attached.mountedOn === e.id) attached.mountedOn = undefined;
        if (attached.passengerId === e.id) attached.passengerId = undefined;
      }
      if (e.kind === "town") {
        e.hp = e.maxHp;
        e.faction = "player";
        e.relation = "conquered";
        w.resources.gold += 35;
        announce(w, e.label + " przyłączona do królestwa. +35 monet");
        continue;
      }
      if (e.workerId) {
        const worker = w.entities[e.workerId];
        if (worker) {
          detach(w, worker);
          worker.order = undefined;
        }
      }
      if (e.kind === "building") {
        const cancelled = w.recruitQueue.filter((q) => q.buildingId === e.id);
        for (const q of cancelled)
          for (const [key, value] of Object.entries(unitCosts[q.unit]))
            w.resources[key as keyof Resources] += value;
        w.recruitQueue = w.recruitQueue.filter((q) => q.buildingId !== e.id);
      }
      detach(w, e);
      if (e.passengerId) {
        const p = w.entities[e.passengerId];
        if (p) {
          p.carriedBy = undefined;
          const spot = nearbyFree(w, { x: e.x < 32 ? 30 : 34, z: e.z }, p);
          if (spot) Object.assign(p, spot);
        }
      }
      if (e.passengerIds)
        for (const id of e.passengerIds) {
          const p = w.entities[id];
          if (p) {
            p.carriedBy = undefined;
            const spot = nearbyFree(w, e, p, true);
            if (spot) Object.assign(p, spot);
            else p.hp = 0;
          }
        }
      for (const u of getEntities(w).filter(
        (u) => u.garrisonId === e.id || u.garrisonTargetId === e.id,
      )) {
        if (u) {
          cancelWallWalk(w, u);
          u.garrisonId = undefined;
          u.garrisonTargetId = undefined;
          u.elevation = 0;
          u.order = undefined;
          const p = nearbyFree(w, e, u);
          if (p) Object.assign(u, p);
        }
      }
      if (e.kind === "hero") {
        w.defeated = true;
        w.paused = true;
        e.order = undefined;
        announce(
          w,
          "Bohater poległ. Wczytaj wcześniejszy zapis, aby wrócić do doliny.",
        );
        return;
      } else {
        if (e.kind === "building") {
          if (
            ["wall", "gate"].includes(kindOf(e)) &&
            ["ram", "catapult", "ballistaTower"].includes(
              e.lastDamageKind || "",
            )
          )
            e.siegeCollapse = {
              time: w.time,
              by: e.lastDamageKind as "ram" | "catapult",
            };
          e.originalType = e.type;
          e.originalFaction = e.faction;
          e.kind = "ruin";
          if (e.channel) refreshWater(w);
          e.label = "Ruiny: " + e.label;
          e.type = "ruin";
          e.hp = e.maxHp = 100;
          e.faction = "neutral";
          e.workerId = undefined;
          e.fire = undefined;
        } else delete w.entities[e.id];
      }
    }
  }
  for (const unit of getEntities(w)) {
    const o = unit.order;
    if (o?.targetId) {
      const t = w.entities[o.targetId];
      if (
        !t ||
        (t.kind === "ruin" && o.type !== "move") ||
        (["attack", "raid"].includes(o.type) && t.faction === unit.faction)
      ) {
        if (o.destinationId && w.entities[o.destinationId])
          unit.order = { type: "raid", targetId: o.destinationId };
        else unit.order = undefined;
      }
    }
  }
  const restBuildings = getEntities(w).filter(
    (b) =>
      b.kind === "building" &&
      b.faction === "player" &&
      b.hp > 0 &&
      ["inn", "stable"].includes(b.type),
  );
  for (const unit of getEntities(w)) {
    if (unit.faction !== "player" || unit.hp <= 0 || !mobile(unit)) continue;
    if (
      restBuildings.some(
        (b) =>
          distance(b, unit) <= 5 && (b.type === "inn" || unit.kind === "horse"),
      )
    )
      unit.hp = Math.min(unit.maxHp, unit.hp + 2 * dt);
  }
  const capacity = storageCapacity(w);
  for (const key of ["wood", "stone", "food", "iron"] as const)
    w.resources[key] = Math.min(
      key === "food" ? storageCapacity(w, "food") : capacity,
      w.resources[key],
    );
  w.objectives.banditsDefeated = !getEntities(w).some(
    (e) => e.type === "bandit",
  );
  if (
    !w.victory &&
    w.objectives.banditsDefeated &&
    w.objectives.ruinsRestored &&
    getEntities(w).some(
      (e) => kindOf(e) === "castle" && e.faction === "player",
    ) &&
    getEntities(w).some(
      (e) =>
        e.kind === "town" && ["allied", "conquered"].includes(e.relation || ""),
    )
  ) {
    w.victory = true;
    announce(
      w,
      "Dolina zjednoczona! Sojusz, odbudowana strażnica i bezpieczne pogranicze. Możesz grać dalej.",
    );
  }
  const raidGems = collectRaidGems(w);
  const gems = collectGems(w) + collectTaskGems(w) + raidGems;
  if (gems)
    announce(
      w,
      raidGems
        ? `Najazd odparty! +${raidGems} klejnotów${gems > raidGems ? ` · zadania +${gems - raidGems}` : ""}`
        : `Ukończono zadanie! +${gems} klejnotów`,
    );
}
export function step(w: World, dt: number): void {
  if (w.defeated || !Number.isFinite(dt) || dt <= 0) return;
  w.paused = false;
  w.accumulator += Math.min(dt, 1) * w.speed;
  while (w.accumulator >= 0.1 && !w.defeated) {
    tick(w, 0.1);
    w.accumulator -= 0.1;
  }
}
