import { buildingDefs, type Resources } from "./content";
import type { World } from "./simulation";
export const starterPacks = {
  soldiers: {
    price: 50,
    name: "Straż początkowa",
    description: "3 żołnierzy na każdą nową wyprawę",
  },
  village: {
    price: 400,
    name: "Rozwinięta osada",
    description: "3 domy, drwal, kamieniołom, gospodarstwo i 2 pola",
  },
} as const;
export const instantAddons = {
  builders: {
    name: "Materiały budowlane",
    price: 25,
    category: "settlement",
    description: "+200 drewna · +100 kamienia",
    resources: { wood: 200, stone: 100 },
  },
  food: {
    name: "Zapasy żywności",
    price: 10,
    category: "settlement",
    description: "+150 żywności",
    resources: { food: 150 },
  },
  iron: {
    name: "Dostawa żelaza",
    price: 15,
    category: "settlement",
    description: "+30 żelaza",
    resources: { iron: 30 },
  },
  gold: {
    name: "Skrzynia monet",
    price: 15,
    category: "settlement",
    description: "+200 monet",
    resources: { gold: 200 },
  },
  workers: {
    name: "Nowi osadnicy",
    price: 15,
    category: "settlement",
    description: "2 osadników przy osadzie",
    spawn: { kind: "worker", type: "worker", count: 2, hp: 60 },
  },
  archers: {
    name: "Łucznicze posiłki",
    price: 25,
    category: "defense",
    description: "3 łuczników przy osadzie",
    spawn: { kind: "archer", type: "archer", count: 3, hp: 70 },
  },
  healing: {
    name: "Pomoc uzdrowicieli",
    price: 10,
    category: "defense",
    description: "Jednostki odzyskują do 50% pełnego zdrowia",
    restore: "units",
  },
  repairs: {
    name: "Brygada naprawcza",
    price: 15,
    category: "defense",
    description: "Budowle odzyskują do 50% pełnej wytrzymałości",
    restore: "buildings",
  },
  horse: {
    name: "Koń podróżny",
    price: 20,
    category: "travel",
    description: "Wierzchowiec przy osadzie",
    spawn: { kind: "horse", type: "horse", count: 1, hp: 100 },
  },
  camel: {
    name: "Wielbłąd juczny",
    price: 25,
    category: "travel",
    description: "Wielbłąd przy osadzie",
    spawn: { kind: "horse", type: "camel", count: 1, hp: 100 },
  },
} satisfies Record<
  string,
  {
    name: string;
    price: number;
    category: string;
    description: string;
    resources?: Partial<Resources>;
    spawn?: {
      kind: "worker" | "archer" | "horse";
      type: string;
      count: number;
      hp: number;
    };
    restore?: string;
  }
>;
export type InstantAddonId = keyof typeof instantAddons;
export interface InstantPurchase {
  addonId: InstantAddonId;
  price: number;
  time: number;
  status: "pending" | "complete" | "refunded";
}
export const outfits = {
  default: ["Wędrowiec", "#e2bc65"],
  knight: ["Rycerz", "#a9b4b2"],
  scout: ["Zwiadowca", "#6e8b50"],
  desert: ["Pustynny wędrowiec", "#d8ba7b"],
} as const;
export const dogCoats = {
  brown: ["Brązowy", "#a67b47"],
  black: ["Czarny", "#45433e"],
  cream: ["Kremowy", "#dfcba1"],
  red: ["Rudy", "#b96c3e"],
} as const;
export const bannerColors = {
  gold: ["Złoty", "#d6b55e"],
  red: ["Czerwony", "#b65b4c"],
  blue: ["Niebieski", "#679cac"],
  green: ["Zielony", "#75a16a"],
} as const;
export const bannerEmblems = {
  star: "Gwiazda",
  moon: "Księżyc",
  tree: "Drzewo",
  sword: "Miecz",
} as const;
export interface Appearance {
  outfit: keyof typeof outfits;
  dogColor: keyof typeof dogCoats;
  dogName: string;
  bannerColor: keyof typeof bannerColors;
  bannerEmblem: keyof typeof bannerEmblems;
}
export interface AddonState {
  instantPurchases?: Record<string, InstantPurchase>;
  instantSequence?: number;
  progress?: { tradeReturns: number };
  raids?: Record<string, RaidRewardRecord>;
  gems: number;
  rewards: Record<string, boolean>;
  packs: Partial<Record<keyof typeof starterPacks, boolean>>;
  appearance: Appearance;
  starterApplied: boolean;
}
function inferredTradeReturns(w: World) {
  return Object.values(w.entities).reduce((sum, e) => {
    const r = e.tradeRoute;
    return (
      sum +
      (r
        ? Math.max(
            0,
            r.trips - (r.phase === "returning" && r.cargo.gold > 0 ? 1 : 0),
          )
        : 0)
    );
  }, 0);
}
export function addonsFor(w: World): AddonState {
  return (w.addons ??= {
    gems: 0,
    progress: { tradeReturns: inferredTradeReturns(w) },
    rewards: {},
    packs: {},
    appearance: {
      outfit: "default",
      dogColor: "brown",
      dogName:
        Object.values(w.entities).find((e) => e.kind === "dog")?.label ||
        "Reks",
      bannerColor: "gold",
      bannerEmblem: "star",
    },
    starterApplied: true,
  });
}
export function grantGems(w: World, key: string, amount = 10) {
  const a = addonsFor(w);
  if (
    a.rewards[key] ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    !Number.isSafeInteger(a.gems + amount)
  )
    return false;
  a.rewards[key] = true;
  a.gems += amount;
  return true;
}
export function collectGems(w: World) {
  let amount = 0;
  if (w.objectives.banditsDefeated && grantGems(w, "river:camp:bandits"))
    amount += 10;
  for (const e of Object.values(w.entities))
    if (
      e.kind === "town" &&
      e.relation === "conquered" &&
      grantGems(w, "river:town:" + e.id)
    )
      amount += 10;
  return amount;
}
export function validAddonState(value: AddonState): boolean {
  if (
    !value ||
    !Number.isSafeInteger(value.gems) ||
    value.gems < 0 ||
    typeof value.starterApplied !== "boolean" ||
    !value.rewards ||
    typeof value.rewards !== "object" ||
    Array.isArray(value.rewards) ||
    !Object.values(value.rewards).every((v) => v === true) ||
    !value.packs ||
    typeof value.packs !== "object" ||
    Array.isArray(value.packs) ||
    !Object.entries(value.packs).every(
      ([k, v]) => Object.hasOwn(starterPacks, k) && typeof v === "boolean",
    )
  )
    return false;
  if (
    value.progress !== undefined &&
    (!value.progress ||
      typeof value.progress !== "object" ||
      !Number.isSafeInteger(value.progress.tradeReturns) ||
      value.progress.tradeReturns < 0)
  )
    return false;
  if (
    value.raids &&
    (typeof value.raids !== "object" ||
      Array.isArray(value.raids) ||
      Object.values(value.raids).some(
        (r) =>
          !r ||
          !Number.isSafeInteger(r.number) ||
          r.number < 1 ||
          typeof r.homeId !== "string" ||
          typeof r.failed !== "boolean" ||
          typeof r.resolved !== "boolean" ||
          !Array.isArray(r.enemyIds) ||
          !r.enemyIds.length ||
          r.enemyIds.length > 1000 ||
          !r.enemyIds.every((id) => typeof id === "string") ||
          new Set(r.enemyIds).size !== r.enemyIds.length ||
          !Array.isArray(r.defeatedIds) ||
          !r.defeatedIds.every(
            (id) => typeof id === "string" && r.enemyIds.includes(id),
          ) ||
          new Set(r.defeatedIds).size !== r.defeatedIds.length,
      ))
  )
    return false;
  if (
    value.instantSequence !== undefined &&
    (!Number.isSafeInteger(value.instantSequence) || value.instantSequence < 0)
  )
    return false;
  if (
    value.instantPurchases !== undefined &&
    (!value.instantPurchases ||
      typeof value.instantPurchases !== "object" ||
      Array.isArray(value.instantPurchases) ||
      Object.values(value.instantPurchases).some(
        (p) =>
          !p ||
          typeof p.addonId !== "string" ||
          !p.addonId ||
          p.addonId.length > 80 ||
          !Number.isSafeInteger(p.price) ||
          p.price <= 0 ||
          p.price > 100000 ||
          !Number.isFinite(p.time) ||
          p.time < 0 ||
          !["pending", "complete", "refunded"].includes(p.status),
      ))
  )
    return false;
  const a = value.appearance;
  return (
    !!a &&
    Object.hasOwn(outfits, a.outfit) &&
    Object.hasOwn(dogCoats, a.dogColor) &&
    Object.hasOwn(bannerColors, a.bannerColor) &&
    Object.hasOwn(bannerEmblems, a.bannerEmblem) &&
    typeof a.dogName === "string" &&
    a.dogName.trim().length > 0 &&
    a.dogName.length <= 20
  );
}

export interface RaidRewardRecord {
  number: number;
  homeId: string;
  enemyIds: string[];
  defeatedIds: string[];
  failed: boolean;
  resolved: boolean;
}
export function progressFor(w: World) {
  const a = addonsFor(w);
  return (a.progress ??= {
    tradeReturns: inferredTradeReturns(w),
  });
}
export function rewardTasks(w: World) {
  const es = Object.values(w.entities).filter((e) => e.hp > 0),
    owned = es.filter((e) => e.faction === "player");
  const has = (family: string) =>
    owned.some(
      (e) =>
        e.kind === "building" &&
        (buildingDefs[e.type]?.behavior || e.type) === family,
    );
  const returns = progressFor(w).tradeReturns;
  return [
    {
      id: "quarry",
      key: "river:quest:quarry",
      title: "Fundamenty osady",
      detail: "Zbuduj kamieniołom",
      amount: 5,
      complete: has("quarry"),
    },
    {
      id: "defense",
      key: "river:quest:defense",
      title: "Strzeż swoich ludzi",
      detail: "Koszary i 4 żołnierzy",
      amount: 10,
      complete:
        has("barracks") &&
        owned.filter((e) => ["soldier", "archer"].includes(e.kind)).length >= 4,
    },
    {
      id: "neighbor",
      key: "river:quest:neighbor",
      title: "Nie jesteś sam",
      detail: "Sojusz lub przyłączenie osady",
      amount: 10,
      complete: es.some(
        (e) =>
          e.kind === "town" &&
          ["allied", "conquered"].includes(e.relation || ""),
      ),
    },
    {
      id: "bandits",
      key: "river:camp:bandits",
      title: "Bezpieczne pogranicze",
      detail: "Pokonaj obóz bandytów",
      amount: 10,
      complete: w.objectives.banditsDefeated,
    },
    {
      id: "ruins",
      key: "river:quest:ruins",
      title: "Strażnica znów ożyje",
      detail: "Odbuduj ruiny",
      amount: 10,
      complete: w.objectives.ruinsRestored,
    },
    {
      id: "castle",
      key: "river:quest:castle",
      title: "Serce królestwa",
      detail: "Wznieś dwór lub zamek",
      amount: 15,
      complete: has("castle"),
    },
    {
      id: "victory",
      key: "river:quest:victory",
      title: "Dolina zjednoczona",
      detail: "Ukończ region",
      amount: 25,
      complete: w.victory,
    },
    {
      id: "trade1",
      key: "river:quest:trade1",
      title: "Pierwszy szlak",
      detail: `Zakończ kurs handlowy · ${Math.min(returns, 1)}/1`,
      amount: 5,
      complete: returns >= 1,
    },
    {
      id: "trade10",
      key: "river:quest:trade10",
      title: "Kupieckie szlaki",
      detail: `Zakończ 10 kursów · ${Math.min(returns, 10)}/10`,
      amount: 15,
      complete: returns >= 10,
    },
  ];
}
export function collectTaskGems(w: World) {
  let amount = 0;
  for (const task of rewardTasks(w))
    if (task.complete && grantGems(w, task.key, task.amount))
      amount += task.amount;
  return amount;
}
export function startRaidReward(
  w: World,
  number: number,
  homeId: string,
  enemyIds: string[],
) {
  if (!enemyIds.length) return;
  const a = addonsFor(w);
  a.raids ??= {};
  a.raids[String(number)] ??= {
    number,
    homeId,
    enemyIds: [...enemyIds],
    defeatedIds: [],
    failed: false,
    resolved: false,
  };
  // Keep active waves and recent completed records; reward identities stay permanent.
  const done = Object.values(a.raids)
    .filter((r) => r.resolved)
    .sort((a, b) => b.number - a.number);
  for (const r of done.slice(20)) delete a.raids[String(r.number)];
}
export function trackRaidDeath(w: World, id: string) {
  for (const raid of Object.values(addonsFor(w).raids || {})) {
    if (raid.resolved) continue;
    if (raid.homeId === id) raid.failed = true;
    if (raid.enemyIds.includes(id) && !raid.defeatedIds.includes(id))
      raid.defeatedIds.push(id);
  }
}
export function collectRaidGems(w: World) {
  const a = addonsFor(w);
  let amount = 0;
  if (!a.raids && w.raidNumber > 0) {
    const enemies = Object.values(w.entities).filter(
        (e) => e.type === "raider" && e.hp > 0,
      ),
      home = Object.values(w.entities).find(
        (e) =>
          e.kind === "building" &&
          e.faction === "player" &&
          (e.type === "hall" ||
            (buildingDefs[e.type]?.behavior || e.type) === "castle"),
      );
    if (enemies.length && home)
      startRaidReward(
        w,
        w.raidNumber,
        home.id,
        enemies.map((e) => e.id),
      );
  }
  for (const raid of Object.values(a.raids || {})) {
    if (
      raid.resolved ||
      !raid.enemyIds.every((id) => raid.defeatedIds.includes(id))
    )
      continue;
    raid.resolved = true;
    const home = w.entities[raid.homeId];
    if (
      !raid.failed &&
      !w.defeated &&
      home?.kind === "building" &&
      home.faction === "player" &&
      home.hp > 0 &&
      grantGems(w, `river:raid:${raid.number}`, 10)
    )
      amount += 10;
  }
  return amount;
}
