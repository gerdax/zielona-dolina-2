import { buildingDefs } from "./content";
import {
  addonsFor,
  collectGems,
  collectTaskGems,
  collectRaidGems,
  validAddonState,
} from "./addons";
import { settleInstantPurchases, type World } from "./simulation";
// The workshop never reads or overwrites campaign records, including purchase saves.
const DB =
  import.meta.env.DEV &&
  typeof location !== "undefined" &&
  new URLSearchParams(location.search).get("qa") === "village"
    ? "zielona-dolina-ii-test-village"
    : "zielona-dolina-ii";
export function validateSave(value: unknown): World {
  if (!value || typeof value !== "object") throw Error("Nieprawidłowy zapis");
  const w = value as World;
  if (
    w.version !== 1 ||
    w.size !== 64 ||
    !w.entities ||
    typeof w.entities !== "object" ||
    Array.isArray(w.entities) ||
    !w.resources ||
    !Array.isArray(w.messages) ||
    !Array.isArray(w.recruitQueue) ||
    !w.objectives ||
    !Number.isFinite(w.time) ||
    !Number.isFinite(w.nextId)
  )
    throw Error("Nieobsługiwana wersja zapisu");
  w.alarm ??= false;
  w.raidWarned ??= false;
  w.weaponLevel ??= 0;
  w.defeated ??= false;
  if (
    !Number.isFinite(w.raidTimer) ||
    !Number.isFinite(w.raidNumber) ||
    !Number.isInteger(w.weaponLevel) ||
    w.weaponLevel < 0 ||
    w.weaponLevel > 3 ||
    typeof w.alarm !== "boolean" ||
    typeof w.defeated !== "boolean" ||
    typeof w.victory !== "boolean"
  )
    throw Error("Uszkodzony stan kampanii");
  if (![1, 2, 3].includes(w.speed) || typeof w.paused !== "boolean")
    throw Error("Uszkodzony zegar zapisu");
  for (const k of ["wood", "stone", "food", "gold", "iron"] as const)
    if (!Number.isFinite(w.resources[k]) || w.resources[k] < 0)
      throw Error("Uszkodzone zasoby");
  if (
    w.nextMerchantAt !== undefined &&
    (!Number.isFinite(w.nextMerchantAt) || w.nextMerchantAt < 0)
  )
    throw Error("Uszkodzony zegar kupców");
  if (
    w.merchantVisits !== undefined &&
    (!Number.isInteger(w.merchantVisits) || w.merchantVisits < 0)
  )
    throw Error("Uszkodzona historia kupców");
  if (
    w.removedRoads !== undefined &&
    (!Array.isArray(w.removedRoads) ||
      w.removedRoads.length > 4096 ||
      !w.removedRoads.every(
        (k) => typeof k === "string" && /^\d+,\d+$/.test(k),
      ))
  )
    throw Error("Uszkodzony zapis ścieżek");
  if (
    w.testRaidAlarmWasOn !== undefined &&
    typeof w.testRaidAlarmWasOn !== "boolean"
  )
    throw Error("Uszkodzony stan ćwiczenia");
  if (
    w.testSupplyGranted !== undefined &&
    typeof w.testSupplyGranted !== "boolean"
  )
    throw Error("Uszkodzony znacznik zapasów testowych");
  if (
    w.testResourceCapacity !== undefined &&
    (!Number.isFinite(w.testResourceCapacity) || w.testResourceCapacity < 0)
  )
    throw Error("Uszkodzony limit zapasów testowych");
  for (const key of [
    "testDefenseBlueprints",
    "testDefenderBlueprints",
  ] as const) {
    const plans = w[key];
    if (
      plans !== undefined &&
      (!Array.isArray(plans) ||
        plans.length > 15000 ||
        plans.some(
          (e) =>
            !e ||
            typeof e.id !== "string" ||
            !Number.isFinite(e.x) ||
            !Number.isFinite(e.z) ||
            e.x < 0 ||
            e.z < 0 ||
            e.x >= w.size ||
            e.z >= w.size ||
            e.faction !== "player" ||
            (key === "testDefenseBlueprints"
              ? e.kind !== "building" || !buildingDefs[e.type]
              : !["soldier", "archer"].includes(e.kind) ||
                !e.id.startsWith("test-defense-unit-")),
        ))
    )
      throw Error("Uszkodzony plan odbudowy ćwiczebnej");
  }
  const entities = Object.values(w.entities);
  if (entities.length > 15000) throw Error("Zapis jest zbyt duży");
  const point = (p: { x: number; z: number }) =>
    p &&
    Number.isFinite(p.x) &&
    Number.isFinite(p.z) &&
    p.x >= 0 &&
    p.x <= 64 &&
    p.z >= 0 &&
    p.z <= 64;
  for (const e of entities) {
    if (
      !e ||
      typeof e.id !== "string" ||
      w.entities[e.id] !== e ||
      ![
        "hero",
        "worker",
        "soldier",
        "archer",
        "dog",
        "horse",
        "boat",
        "enemy",
        "building",
        "tree",
        "rock",
        "ruin",
        "town",
        "caravan",
        "merchant",
      ].includes(e.kind) ||
      typeof e.type !== "string" ||
      typeof e.label !== "string" ||
      !point(e) ||
      !Number.isFinite(e.hp) ||
      !Number.isFinite(e.maxHp) ||
      e.maxHp <= 0 ||
      !["player", "neutral", "enemy"].includes(e.faction)
    )
      throw Error("Uszkodzony obiekt zapisu");
    if (
      e.innReadyAt !== undefined &&
      (!Number.isFinite(e.innReadyAt) || e.innReadyAt < 0)
    )
      throw Error("Uszkodzony termin zlecenia zajazdu");
    if (
      e.fire !== undefined &&
      (!Number.isFinite(e.fire) || e.fire < 0 || e.fire > 12)
    )
      throw Error("Uszkodzony stan pożaru");
    if (
      e.rallyId &&
      (!w.entities[e.rallyId] || w.entities[e.rallyId].type !== "rallyPoint")
    )
      e.rallyId = undefined;
    if (
      e.slowUntil !== undefined &&
      (!Number.isFinite(e.slowUntil) || e.slowUntil < 0)
    )
      throw Error("Uszkodzony czas spowolnienia");
    if (
      e.slowFactor !== undefined &&
      (!Number.isFinite(e.slowFactor) || e.slowFactor < 0.1 || e.slowFactor > 1)
    )
      throw Error("Uszkodzone spowolnienie");
    if (e.joined !== undefined && typeof e.joined !== "boolean")
      throw Error("Uszkodzone połączenie konstrukcji");
    if (
      e.rotation !== undefined &&
      (!Number.isInteger(e.rotation) || e.rotation < 0 || e.rotation > 3)
    )
      throw Error("Uszkodzony obrót budowli");
    if (
      e.links !== undefined &&
      (!Array.isArray(e.links) ||
        e.links.length > 15000 ||
        e.links.some((id) => typeof id !== "string"))
    )
      throw Error("Uszkodzone połączenia budowli");
    if (e.merchant) {
      if (e.kind === "caravan" && e.type === "merchant") e.kind = "merchant";
      const m = e.merchant;
      if (
        e.type !== "merchant" ||
        e.kind !== "merchant" ||
        !["arriving", "trading", "leaving"].includes(m.phase) ||
        !point(m.home) ||
        !point(m.destination) ||
        !Number.isFinite(m.until) ||
        !Number.isFinite(m.retryAt) ||
        !m.stock ||
        ["wood", "stone", "food", "gold", "iron"].some(
          (k) =>
            !Number.isFinite(m.stock[k as keyof typeof m.stock]) ||
            m.stock[k as keyof typeof m.stock] < 0,
        )
      )
        throw Error("Uszkodzony zapis kupca");
    }
    if (e.tradeRoute) {
      const r = e.tradeRoute;
      if (
        e.kind !== "merchant" ||
        e.faction !== "player" ||
        typeof r.homeId !== "string" ||
        (r.targetId !== undefined && typeof r.targetId !== "string") ||
        !["wood", "stone", "food", "iron"].includes(r.resource) ||
        !Number.isInteger(r.amount) ||
        r.amount < 1 ||
        r.amount > 100 ||
        typeof r.repeat !== "boolean" ||
        !["idle", "loading", "outbound", "returning", "waiting"].includes(
          r.phase,
        ) ||
        !r.cargo ||
        ["wood", "stone", "food", "gold", "iron"].some(
          (k) =>
            !Number.isFinite(r.cargo[k as keyof typeof r.cargo]) ||
            r.cargo[k as keyof typeof r.cargo] < 0,
        ) ||
        !Number.isFinite(r.retryAt) ||
        !Number.isInteger(r.trips) ||
        r.trips < 0
      )
        throw Error("Uszkodzony zapis trasy handlowej");
    }
    if (
      e.bridgeBase !== undefined &&
      !["trench", "canal", "ravine"].includes(e.bridgeBase)
    )
      throw Error("Uszkodzona podstawa mostu");
    if (
      e.lastAttack &&
      (!Number.isFinite(e.lastAttack.time) ||
        !point(e.lastAttack) ||
        typeof e.lastAttack.targetId !== "string")
    )
      throw Error("Uszkodzony stan ataku");
    if (e.wallWalk) {
      const r = e.wallWalk;
      if (
        e.kind !== "archer" ||
        !Array.isArray(r.path) ||
        r.path.length < 2 ||
        r.path.length > 4096 ||
        !r.path.every((id) => typeof id === "string") ||
        typeof r.fromId !== "string" ||
        typeof r.toId !== "string" ||
        typeof r.destinationId !== "string" ||
        !Number.isFinite(r.progress) ||
        r.progress < 0 ||
        r.progress > 1
      )
        throw Error("Uszkodzony zapis przejścia po murze");
    }
    if (
      e.carriedBy &&
      w.entities[e.carriedBy]?.kind === "boat" &&
      w.entities[e.carriedBy].passengerId !== e.id &&
      !w.entities[e.carriedBy].passengerIds?.includes(e.id)
    )
      throw Error("Pasażer nie należy do statku");
    if (
      e.passengerIds !== undefined &&
      (!Array.isArray(e.passengerIds) ||
        e.kind !== "boat" ||
        e.type !== "transportBoat" ||
        e.passengerIds.length > 3 ||
        new Set(e.passengerIds).size !== e.passengerIds.length ||
        e.passengerIds.some(
          (id) =>
            typeof id !== "string" ||
            !w.entities[id] ||
            w.entities[id].carriedBy !== e.id ||
            id === e.passengerId,
        ))
    )
      throw Error("Uszkodzony spis pasażerów");
    if (
      e.garrisonEntryId &&
      (!w.entities[e.garrisonEntryId] ||
        w.entities[e.garrisonEntryId].type !== "wallStairs")
    )
      e.garrisonEntryId = undefined;
    for (const key of [
      "mountedOn",
      "carriedBy",
      "passengerId",
      "garrisonId",
      "occupantId",
    ] as const)
      if (e[key] && !w.entities[e[key]!])
        throw Error("Niekompletny zapis transportu");
    if (
      e.order?.path &&
      (!Array.isArray(e.order.path) ||
        e.order.path.length > 4096 ||
        !e.order.path.every(point))
    )
      throw Error("Uszkodzona trasa zapisu");
  }
  if (
    entities.filter((e) => e.kind === "hero").length !== 1 ||
    w.messages.some(
      (m) => !m || typeof m.text !== "string" || !Number.isFinite(m.time),
    ) ||
    w.recruitQueue.some(
      (q) =>
        !q ||
        !["soldier", "archer", "shieldbearer"].includes(q.unit) ||
        !Number.isFinite(q.remaining) ||
        typeof q.buildingId !== "string",
    )
  )
    throw Error("Niekompletny stan kampanii");
  if (w.addons !== undefined && !validAddonState(w.addons))
    throw Error("Uszkodzony zapis klejnotów i dodatków");
  addonsFor(w);
  settleInstantPurchases(w);
  collectGems(w);
  collectTaskGems(w);
  collectRaidGems(w);
  w.accumulator = 0;
  return w;
}
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("saves");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function saveWorld(world: World) {
  const copy = JSON.parse(JSON.stringify(world));
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("saves", "readwrite"),
        store = tx.objectStore("saves"),
        old = store.get("current");
      old.onsuccess = () => {
        if (old.result) store.put(old.result, "backup");
        store.put(copy, "current");
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function loadWorld(backup = false): Promise<World | null> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("saves", "readonly"),
        r = tx.objectStore("saves").get(backup ? "backup" : "current");
      r.onsuccess = () => {
        try {
          resolve(r.result ? validateSave(r.result) : null);
        } catch (e) {
          reject(e);
        }
      };
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
export function exportWorld(w: World) {
  const blob = new Blob([JSON.stringify(w)], { type: "application/json" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download =
    "zielona-dolina-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function importWorld(file: File) {
  if (file.size > 10_000_000) throw Error("Zapis jest zbyt duży");
  return validateSave(JSON.parse(await file.text()));
}
