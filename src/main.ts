import {
  addonsFor,
  rewardTasks,
  starterPacks,
  instantAddons,
  type InstantAddonId,
  outfits,
  dogCoats,
  bannerColors,
  bannerEmblems,
  type Appearance,
} from "./addons";
import {
  merchantOffers,
  merchantHireCost,
  exportPrice,
  type TradeResource,
} from "./merchants";
import { connectedConstruction, snapCandidates } from "./construction";
import "./style.css";
import "@fontsource/cormorant-garamond/latin-ext-500.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-ext-600.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/latin-ext-500-italic.css";
import "@fontsource/cormorant-garamond/latin-500-italic.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/latin-600.css";
import {
  createWorld,
  createNextExpedition,
  step,
  command,
  getEntities,
  canBuild,
  wallUpgradeAvailable,
  wallRepairAvailable,
  wallRebuildAvailable,
  connectedRebuildGroup,
  connectedWallGroup,
  planBridge,
  canRemoveRoad,
  planConstructionMove,
  merchantTradeAvailable,
  instantAddonAvailable,
  postCapacity,
  type World,
  type Entity,
  type Command,
} from "./simulation";
import { buildingDefs, unitCosts, boatCosts, type Resources } from "./content";
import { ValleyRenderer, type VisualWorld } from "./renderer";
import { saveWorld, loadWorld, exportWorld, importWorld } from "./save";
import { ValleyAudio } from "./audio";
import {
  createTestSettlement,
  createStressWorld,
  equipTestSettlement,
  startTestFire,
  startTestRaid,
  finishTestRaid,
  testRaidEnemies,
  testRaidLevels,
  grantTestResources,
  restoreTestDefenses,
  startTestBoltImpact,
  type TestRaidLevel,
} from "./qa";
import {
  recoverSession,
  retainSession,
  hasPendingSession,
} from "./dev-session";

const icons: Record<string, string> = {
  wood: "♧",
  stone: "◆",
  food: "❧",
  gold: "●",
  iron: "⚒",
  hall: "♜",
  castle: "♜",
  house: "⌂",
  lumber: "♧",
  quarry: "◆",
  farm: "❧",
  warehouse: "▣",
  market: "⚖",
  barracks: "⚔",
  forge: "⚒",
  hospital: "✚",
  stable: "♞",
  mine: "⛏",
  wall: "▥",
  gate: "Π",
  tower: "♜",
  bridge: "╬",
  dock: "⚓",
  road: "⋯",
  hero: "♛",
  worker: "♙",
  soldier: "⚔",
  archer: "➶",
  shieldbearer: "⬟",
  horse: "♞",
  camel: "♞",
  ram: "⚙",
  catapult: "⚙",
  dog: "♧",
  boat: "⚓",
  town: "⚑",
  ruin: "♜",
  enemy: "⚔",
  caravan: "▣",
  merchant: "⚖",
  playerMerchant: "⚖",
};
const resourceNames: Record<string, string> = {
  wood: "Drewno",
  stone: "Kamień",
  food: "Żywność",
  gold: "Monety",
  iron: "Żelazo",
};
const qa = import.meta.env.DEV
  ? new URLSearchParams(location.search).get("qa")
  : null;
const sessionKey = "valley:dev-session:" + (qa || "campaign");
const recovered = import.meta.env.DEV ? recoverSession(sessionKey) : null;
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<main id="scene" aria-label="Mapa Zielonej Doliny"></main>
 <header class="topbar"><button class="brand" id="home" title="Przenieś kamerę do osady"><span class="crest">♜</span><span>ZIELONA DOLINA <small>II · POGRANICZE</small></span></button><div id="resources"></div><div class="clock"><span id="season">WIOSNA <b>Dzień 1</b></span><button id="gemsWallet" title="Klejnoty i dodatki">◇ 0</button><button id="speed" title="Tempo gry">1×</button><button id="menu" title="Menu i zapis">☰</button></div></header>
 <aside id="objective" class="objective"></aside><div id="location"><span class="eyebrow">DOLINA RZECZNA</span><span id="locationName">Zielone Pogranicze</span></div><div id="worldLabels"></div>${qa === "stress" ? '<output id="diagnostics" aria-label="Diagnostyka wydajności"></output>' : ""}
 <div id="tooltip" role="tooltip"></div><div id="selectionBox"></div><div id="moveMarker"></div><div id="toast" role="status" aria-live="polite"></div>
 <div id="buildMode" class="hidden"></div><div id="mapHint">Przeciągnij mapę · Kółko przybliża</div>
 <div class="bottom"><section class="mapPanel"><div class="mapTop"><span>POGRANICZE</span><button id="atlas" title="Księga królestwa">◈</button></div><canvas id="minimap" width="220" height="150" aria-label="Minimapa — kliknij, aby przenieść kamerę"></canvas><div class="mapFoot"><button id="heroFocus" title="Znajdź bohatera">♛ Bohater</button><button id="army" title="Zaznacz wojsko">⚔ Armia</button></div></section>
 <section id="selection" class="selection"></section>
 <section class="commandPanel"><button id="build" class="buildButton"><span>⌂</span> Buduj <kbd>B</kbd></button><button id="kingdom"><span>◈</span> Królestwo</button><button id="selectGroup" title="Zaznacz oddział przeciągnięciem"><span>▧</span> Zaznacz</button><div class="cameraControls"><button data-pan="up" title="Przesuń w górę">↑</button><button data-pan="left" title="Przesuń w lewo">←</button><button data-pan="down" title="Przesuń w dół">↓</button><button data-pan="right" title="Przesuń w prawo">→</button><button data-zoom="-1" title="Oddal">−</button><button data-zoom="1" title="Przybliż">+</button></div></section></div>
 <section id="buildPanel" class="floatingPanel hidden"></section><section id="book" class="floatingPanel hidden"></section>
 <div id="modal" class="modal hidden"></div>
 <div id="intro" class="intro"><div class="introCard"><span class="eyebrow">NOWA OPOWIEŚĆ · TEN SAM DUCH</span><div class="introCrest">♜</div><h1>Zielona<br><em>Dolina</em><sup>II</sup></h1><p>Z małej osady rodzi się królestwo.</p><div class="introActions"><button id="start" class="primary">Wejdź do doliny <span>→</span></button><button id="continue" class="hidden">Kontynuuj wyprawę</button></div><small>Buduj. Odkrywaj. Chroń swoich ludzi.</small></div><span class="introFooter">POGRANICZE <i>✦</i> ROZDZIAŁ PIERWSZY</span></div>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
let world =
    recovered?.world ??
    (qa === "stress"
      ? createStressWorld()
      : qa === "village"
        ? createTestSettlement()
        : createWorld()),
  selected: string[] = recovered?.selected ?? [
    getEntities(world).find((e) => e.kind === "hero")!.id,
  ],
  playing = false,
  buildType: string | undefined,
  eraseRoads = false,
  buildRotation = 0,
  snapBuildings = true,
  constructionTurns = 0,
  constructionPoint = { x: 0, z: 0 },
  category = "osada",
  targetMode:
    | "move"
    | "attack"
    | "gather"
    | "assign"
    | "garrison"
    | "plant"
    | "patrol"
    | "moveConstruction"
    | "connect"
    | "escort"
    | undefined,
  bookTab = "overview",
  lastUI = 0,
  lastSave = 0,
  victoryShown = !!recovered?.world.victory,
  defeatShown = !!recovered?.world.defeated;
if (qa === "village") equipTestSettlement(world);
const audio = new ValleyAudio();
let view: ValleyRenderer;
try {
  view = new ValleyRenderer($("scene"));
} catch (error) {
  $("intro").innerHTML =
    '<div class="introCard"><h1>Potrzebna grafika 3D</h1><p>Włącz WebGL i akcelerację sprzętową w przeglądarce, a następnie odśwież stronę.</p></div>';
  throw error;
}
view.onFortificationSound = (kind, wood, position) =>
  audio.fortification(kind, wood, position, {
    x: view.target.x,
    z: view.target.z,
    zoom: view.zoomLevel,
  });
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const hero = () => getEntities(world).find((e) => e.kind === "hero");
const chosen = () => selected.map((id) => world.entities[id]).filter(Boolean);
let activeUnits = [...selected];
let selectionMode = false;
const behavior = (type: string) => buildingDefs[type]?.behavior || type;
const iconFor = (type: string) =>
  buildingDefs[type]?.icon || icons[type] || icons[behavior(type)] || "◆";
const linearBuild = () =>
  !!buildType &&
  ["road", "wall", "bridge", "pier", "trench", "canal"].includes(
    behavior(buildType),
  );
const ownUnits = () =>
  getEntities(world).filter(
    (e) =>
      e.faction === "player" &&
      ["hero", "worker", "soldier", "archer", "boat"].includes(e.kind),
  );
const cost = (c: Partial<Resources>) =>
  Object.entries(c)
    .map(
      ([k, v]) => `<span title="${resourceNames[k]}">${icons[k]} ${v}</span>`,
    )
    .join(" ");
const affordable = (c: Partial<Resources>) =>
  Object.entries(c).every(
    ([k, v]) => world.resources[k as keyof Resources] >= v,
  );
function toast(text: string, error = false) {
  $("toast").textContent = text;
  $("toast").className = error ? "visible error" : "visible";
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ($("toast").className = ""), 3500);
}
let toastTimer = 0;
function issue(c: Command, silent = false) {
  audio.unlock();
  const r = command(world, c);
  if (!silent || !r.ok) toast(r.message, !r.ok);
  audio.tone(r.ok ? "ok" : "error");
  lastUI = 0;
  renderUI();
  return r;
}
function select(ids: string[]) {
  closePanel("buildPanel");
  selected = ids;
  const movable = ids.filter(
    (id) =>
      world.entities[id]?.faction === "player" &&
      ["hero", "worker", "soldier", "archer", "boat"].includes(
        world.entities[id].kind,
      ),
  );
  if (movable.length) activeUnits = movable;
  targetMode = undefined;
  view?.setGhost(0, 0);
  audio.tone();
  renderSelection();
}
function enter(showHint = true) {
  playing = true;
  world.paused = false;
  $("intro").classList.add("hidden");
  audio.unlock();
  renderUI();
  if (showHint)
    toast("Kliknij ziemię, aby iść. Przeciągnij mapę, aby ją przesunąć.");
}
$("start").onclick = () => enter();
if (!qa || qa === "village")
  void loadWorld()
    .then((saved) => {
      if (saved) {
        if (qa === "village") {
          if (equipTestSettlement(saved)) void saveWorld(saved).catch(() => {});
          replaceWorld(saved);
          enter(false);
          return;
        }
        $("continue").classList.remove("hidden");
        $("continue").onclick = () => {
          replaceWorld(saved);
          enter();
        };
      }
    })
    .catch(() => {});
$("home").onclick = () => {
  const home = getEntities(world).find(
    (e) =>
      e.faction === "player" && ["hall", "castle"].includes(behavior(e.type)),
  );
  if (home) view.focus(home.x, home.z);
};
$("heroFocus").onclick = () => {
  const h = hero();
  if (h) {
    select([h.carriedBy || h.id]);
    view.focus(h.x, h.z);
  }
};
$("army").onclick = () =>
  select(
    getEntities(world)
      .filter(
        (e) => e.faction === "player" && ["soldier", "archer"].includes(e.kind),
      )
      .map((e) => e.id),
  );

$("speed").onclick = () =>
  issue(
    { type: "speed", value: world.speed === 3 ? 1 : world.speed + 1 },
    true,
  );
$("build").onclick = () => {
  closePanel("book");
  if (!$("buildPanel").classList.contains("hidden")) closePanel("buildPanel");
  else {
    targetMode = undefined;
    $("buildPanel").classList.remove("hidden");
    renderBuild();
  }
};
$("kingdom").onclick = $("atlas").onclick = () => {
  closePanel("buildPanel");
  $("book").classList.toggle("hidden");
  renderBook();
};
function closePanel(id: string) {
  $(id).classList.add("hidden");
  if (id === "buildPanel") {
    buildType = undefined;
    eraseRoads = false;
    view.setGhost(0, 0);
    renderBuildMode();
  }
}
document.querySelectorAll<HTMLButtonElement>("[data-pan]").forEach(
  (b) =>
    (b.onclick = () => {
      const d = b.dataset.pan;
      view.pan(
        d === "left" ? 100 : d === "right" ? -100 : 0,
        d === "up" ? 100 : d === "down" ? -100 : 0,
      );
    }),
);
document
  .querySelectorAll<HTMLButtonElement>("[data-zoom]")
  .forEach((b) => (b.onclick = () => view.zoom(Number(b.dataset.zoom) * -160)));
function status(e: Entity) {
  if ((e.fire || 0) > 0) return "Pożar · potrzebny strażak";
  if (e.fireTargetId)
    return "Gasi: " + (world.entities[e.fireTargetId]?.label || "pożar");
  if (e.type === "firehouse")
    return e.workerId ? "Strażak czuwa · zasięg 10 pól" : "Przydziel strażaka";
  if (e.tradeRoute) {
    const r = e.tradeRoute;
    return (
      r.reason ||
      {
        idle: "Gotowy do wyprawy",
        loading: "Załadunek",
        outbound: "W drodze do osady",
        returning: "Wraca z ładunkiem",
        waiting: "Czeka na załadunek",
      }[r.phase]
    );
  }
  if (e.merchant)
    return e.merchant.phase === "trading"
      ? `Handel · ${Math.max(0, Math.ceil(e.merchant.until - world.time))} s`
      : e.merchant.phase === "arriving"
        ? "Jedzie do osady"
        : "Odjeżdża";
  if (["canal", "trench"].includes(e.type))
    return world.floodedTiles?.includes(`${Math.round(e.x)},${Math.round(e.z)}`)
      ? "Kanał z wodą"
      : "Suchy wykop · połącz z rzeką";
  if (e.kind === "boat" && e.type === "transportBoat")
    return `Transportowiec · ${(e.passengerIds?.length || 0) + (e.passengerId ? 1 : 0)} / 4 pasażerów`;
  if (e.type === "signalTower")
    return world.raidWarned
      ? `Najazd za ${Math.ceil(world.raidTimer)} s · ${world.raidDirection || ""}`
      : "Czuwanie · zasięg 14 pól";
  if (e.carriedBy) return e.kind === "horse" ? "Pod siodłem" : "Na pokładzie";
  if (e.mountedOn)
    return world.entities[e.mountedOn]?.type === "camel"
      ? "Na wielbłądzie"
      : "Konno";
  if (e.wallWalk) {
    const next = world.entities[e.wallWalk.toId];
    return next?.type !== "bastion" &&
      next?.occupantId &&
      next.occupantId !== e.id
      ? "Czeka na przejście po murze"
      : "Przechodzi po murze";
  }
  if (e.garrisonId) return "Na stanowisku";
  if (e.pendingClose) return "Czeka na opróżnienie";
  if (behavior(e.type) === "bridge")
    return e.open ? "Most opuszczony" : "Most podniesiony";
  if (behavior(e.type) === "gate" || e.type === "waterGate")
    return e.gateMode === "auto"
      ? "Automatyczna"
      : e.open
        ? "Otwarta"
        : "Zamknięta";
  if (e.kind === "town")
    return e.relation === "allied"
      ? "Sojusznik"
      : e.relation === "conquered"
        ? "Przyłączona osada"
        : "Pokojowy sąsiad";
  if (e.order?.type === "work") return "Pracuje";
  if (e.order?.type === "follow") return "Podąża za bohaterem";
  if (e.order?.type === "stay") return "Czeka";
  if (e.order?.path?.length) return "W drodze";
  if (e.kind === "building" && buildingDefs[e.type]?.worker)
    return e.workerId ? "Pracownik przydzielony" : "Brak pracownika";
  return e.faction === "enemy" ? "Wrogi oddział" : "Gotowość";
}
function button(
  action: string,
  label: string,
  icon: string,
  disabled = false,
  title = "",
) {
  return `<button data-action="${action}" ${disabled ? "disabled" : ""} title="${escape(title)}"><span>${icon}</span>${label}</button>`;
}
let selectionSignature = "",
  buildSignature = "";
const routeDrafts = new Map<
  string,
  { targetId: string; resource: TradeResource; amount: number }
>();
function routeDraft(e: Entity) {
  if (!routeDrafts.has(e.id))
    routeDrafts.set(e.id, {
      targetId:
        e.tradeRoute?.targetId ||
        getEntities(world).find(
          (e) => e.kind === "town" && e.relation !== "hostile",
        )?.id ||
        "",
      resource: e.tradeRoute?.resource || "wood",
      amount: e.tradeRoute?.amount || 20,
    });
  return routeDrafts.get(e.id)!;
}
function chooseRouteMerchant(townId?: string) {
  const merchant = getEntities(world).find(
    (e) => e.tradeRoute && ["idle", "waiting"].includes(e.tradeRoute.phase),
  );
  if (merchant) {
    if (townId) routeDraft(merchant).targetId = townId;
    view.focus(merchant.x, merchant.z);
    select([merchant.id]);
  } else {
    const market = getEntities(world).find(
      (e) => behavior(e.type) === "market" && e.faction === "player",
    );
    if (market) {
      view.focus(market.x, market.z);
      select([market.id]);
    }
    toast("Zatrudnij kupca w targu", true);
  }
}
function renderSelection() {
  const list = chosen(),
    e = list[0];
  const signature = JSON.stringify([
    list.map((e) => [
      e.id,
      e.label,
      e.kind,
      e.type,
      e.hp,
      status(e),
      e.mountedOn,
      e.carriedBy,
      e.passengerId,
      e.passengerIds,
      e.workerId,
      e.occupantId,
      e.garrisonId,
      e.relation,
      e.gateMode,
    ]),
    targetMode,
    constructionTurns,
    e?.wallWalk?.destinationId,
    e?.rotation,
    e?.links,
    e?.kind === "building" &&
    ["wall", "gate", "tower"].includes(behavior(e.type))
      ? connectedWallGroup(world, e).map((p) => [p.id, p.hp, p.maxHp])
      : undefined,
    e &&
    (e.kind === "ruin" || ["wall", "gate", "tower"].includes(behavior(e.type)))
      ? connectedRebuildGroup(world, e).map((p) => [p.id, p.kind, p.type])
      : undefined,
    e?.merchant,
    e?.tradeRoute,
    world.resources,
    world.alarm,
    world.recruitQueue.map((q) => [q.unit, Math.ceil(q.remaining)]),
    world.weaponLevel,
    Object.values(unitCosts).map(affordable),
  ]);
  if (
    $("selection").contains(document.activeElement) &&
    document.activeElement?.matches("[data-route]")
  )
    return;
  if (signature === selectionSignature) return;
  selectionSignature = signature;
  let actions = "";
  if (!e) {
    $("selection").innerHTML =
      '<div class="emptySelection"><span>✦</span><p>Wybierz postać lub budowlę</p><small>Twoja dolina czeka.</small></div>';
    return;
  }
  if (list.length > 1) {
    actions =
      button("move", "Idź", "➤") +
      (list.some((e) => ["hero", "soldier", "archer"].includes(e.kind))
        ? button("attack", "Atakuj", "⚔")
        : "") +
      (list.some((e) => ["soldier", "archer"].includes(e.kind))
        ? button("patrol", "Patrol", "↔") + button("escort", "Eskortuj", "⬟")
        : "") +
      (list.some((e) => ["hero", "worker"].includes(e.kind))
        ? button("gather", "Zbieraj", "⛏")
        : "") +
      button("stop", "Zatrzymaj", "■") +
      button("cancel", "Anuluj", "×", !targetMode, "Anuluj wybór celu") +
      button("deselect", "Odznacz grupę", "◇");
    $("selection").innerHTML =
      `<div class="selectionHeading"><div class="portrait">⚔</div><div><span class="eyebrow">TWÓJ ODDZIAŁ</span><h2>${list.length} jednostek</h2><small>${targetMode ? "Wskaż cel na mapie" : "Wspólny rozkaz · wspólny cel"}</small></div></div><div class="actions">${actions}</div>`;
    return;
  }
  const h = hero(),
    icon = e.type === "merchant" ? "⚖" : icons[e.kind] || iconFor(e.type),
    type = behavior(e.type);
  if (
    e.faction === "player" &&
    ["hero", "worker", "soldier", "archer", "boat"].includes(e.kind) &&
    !e.carriedBy
  ) {
    actions += button("move", "Idź", "➤");
    if (["hero", "soldier", "archer"].includes(e.kind))
      actions += button("attack", "Atakuj", "⚔");
    actions += button("stop", "Zatrzymaj", "■");
  }
  if (
    e.carriedBy &&
    e.kind !== "hero" &&
    world.entities[e.carriedBy]?.kind === "boat"
  )
    actions += button("controlBoat", "Steruj transportowcem", "⚓");
  if (e.kind === "hero") {
    if (e.mountedOn) actions += button("dismount", "Zsiądź", "♞");
    if (e.carriedBy)
      actions +=
        button("controlBoat", "Steruj łodzią", "⚓") +
        button("disembark", "Wysiądź", "↓");
    else
      actions +=
        button("gather", "Zbieraj", "⛏") +
        button(
          "plant",
          "Posadź",
          "♧",
          false,
          "3 żywności · drzewo rośnie 60 sekund",
        );
  }
  if (e.kind === "worker")
    actions +=
      button("assign", "Przydziel", "⚒") + button("gather", "Zbieraj", "⛏");
  if (e.kind === "archer")
    actions += e.garrisonId
      ? button("garrison", "Przejdź po murze", "↔") +
        button("ungarrison", "Zejdź", "↓")
      : button("garrison", "Na mur", "♜");
  if (["soldier", "archer"].includes(e.kind))
    actions +=
      button("patrol", "Patrol", "↔") + button("escort", "Eskortuj", "⬟");
  if (e.kind === "horse")
    actions += e.carriedBy
      ? button("dismount", "Zsiądź", "♞")
      : button("mount", "Dosiądź", "♞", !h);
  if (e.kind === "dog")
    actions += button("follow", "Za mną", "➤") + button("stay", "Zostań", "■");
  if (e.kind === "boat")
    actions += e.passengerId
      ? button("disembark", "Wysiądź", "↓")
      : button("board", "Wsiądź", "⚓", !h);
  if (e.kind === "boat" && e.type === "transportBoat")
    actions +=
      button(
        "loadTroops",
        "Zaokrętuj oddział",
        "⚓",
        (e.passengerIds?.length || 0) >= 3,
        "Do 3 pobliskich żołnierzy lub pracowników",
      ) +
      button(
        "unloadTroops",
        "Wysadź oddział",
        "↓",
        !e.passengerIds?.length,
        "Wszyscy pasażerowie potrzebują wolnego brzegu",
      );
  if (e.kind === "tree" || e.kind === "rock")
    actions += button("collect", "Pozyskaj", "⛏", !h);
  if (e.kind === "ruin")
    actions += button("rebuild", "Odbuduj", "♜", !h, "60 drewna · 50 kamienia");
  if (
    e.kind === "ruin" ||
    (e.kind === "building" && ["wall", "gate", "tower"].includes(type))
  ) {
    const rebuild = wallRebuildAvailable(world, e.id);
    if (rebuild.parts.length)
      actions += button(
        "rebuildWall",
        "Odbuduj całość · " + cost(rebuild.cost),
        "♜",
        !rebuild.ok,
        rebuild.message + " · 60 drewna i 50 kamienia za element",
      );
  }
  if (e.kind === "town")
    actions +=
      button(
        "alliance",
        e.relation === "allied" ? "Sojusz zawarty" : "Zawrzyj sojusz",
        "⚑",
        e.relation === "allied" || e.relation === "conquered",
        "45 monet · 25 żywności",
      ) +
      button(
        "trade",
        "Wyślij karawanę",
        "⚖",
        e.relation === "hostile",
        "20 drewna → 35 monet po powrocie",
      ) +
      button(
        "declareWar",
        "Wypowiedz wojnę",
        "⚔",
        e.relation === "hostile" || e.relation === "conquered",
      );
  if (e.kind === "building") {
    if (
      ["trench", "canal", "ravine"].includes(e.type) &&
      e.faction === "player"
    ) {
      for (const bridge of ["fixedBridge", "stoneBridge"]) {
        const check = canBuild(world, bridge, e.x, e.z);
        actions += button(
          "span:" + bridge,
          buildingDefs[bridge].label,
          "╬",
          !check.ok,
          check.ok ? "Zbuduj przeprawę nad tym polem" : check.message,
        );
      }
    }
    if (e.faction === "player")
      actions += button(
        "demolish",
        type === "bridge" ? "Rozbierz odcinek" : "Rozbierz",
        "×",
        false,
        "Odzyskaj połowę materiałów",
      );
    if (type === "bridge" && e.faction === "player")
      actions += button(
        "demolishBridge",
        "Rozbierz cały most",
        "×",
        false,
        "Usuń wszystkie połączone odcinki; odzyskaj połowę materiałów",
      );
    if (["wall", "gate", "tower"].includes(type) && e.faction === "player")
      actions += button(
        "demolishWall",
        "Rozbierz cały mur",
        "×",
        false,
        "Usuń połączone mury, bramy i wieże; pozostałe budynki zostają",
      );
    if (["wall", "gate", "tower"].includes(type) && e.faction === "player") {
      const repair = wallRepairAvailable(world, e.id);
      actions += button(
        "repairWall",
        "Napraw całość" +
          (repair.parts.length ? " · " + cost(repair.cost) : ""),
        "⚒",
        !repair.ok,
        repair.message + " · 15 drewna i 10 kamienia za uszkodzony element",
      );
      const upgrade = wallUpgradeAvailable(world, e.id);
      if (
        upgrade.parts.length ||
        upgrade.message !== "Cały mur jest już kamienny"
      )
        actions += button(
          "upgradeWall",
          "Ulepsz cały mur · " + cost(upgrade.cost),
          "▥",
          !upgrade.ok,
          upgrade.message,
        );
    }
    if (qa === "village" && e.type === "firehouse")
      actions += button("testFire", "Pożar ćwiczebny", "♨");
    if (qa === "village" && ["rallyPoint", "ballistaTower"].includes(e.type)) {
      const active = testRaidEnemies(world).length;
      actions += active
        ? button(
            "stopTestRaid",
            "Zakończ ćwiczenie · " + active + " wrogów",
            "⚔",
          )
        : Object.entries(testRaidLevels)
            .map(([key, wave]) =>
              button(
                "testRaid:" + key,
                wave.label +
                  " najazd · " +
                  (wave.troops + wave.rams + wave.catapults),
                "⚔",
                false,
                `${wave.troops} napastników · ${wave.rams} taranów · ${wave.catapults} katapult`,
              ),
            )
            .join("");
    }
    if (qa === "village" && ["rallyPoint", "ballistaTower"].includes(e.type))
      actions += button(
        "restoreTestDefenses",
        "Napraw i odbuduj obronę",
        "⚒",
        testRaidEnemies(world).length > 0,
        "Bezpłatnie · osada testowa",
      );
    if (qa === "village" && e.type === "ballistaTower")
      actions += button("testBoltImpact", "Próba trafienia w mur", "➶");
    if (e.type === "rallyPoint")
      actions += button("assignRally", "Przypisz wolne wojsko", "⚑");
    if (e.type === "stable")
      actions += button(
        "buyHorse",
        "Kup konia · 25 monet, 20 żywności",
        "♞",
        !affordable({ gold: 25, food: 20 }),
      );
    if (e.type === "inn") {
      const wait = Math.max(0, Math.ceil((e.innReadyAt || 0) - world.time));
      actions += button(
        "innDelivery",
        wait
          ? "Nowa dostawa za " + wait + " s"
          : "Dostarcz 30 żywności · +25 monet",
        "⚖",
        wait > 0 || world.resources.food < 30,
      );
    }
    if (e.type === "shipyard")
      for (const vessel of ["boat", "transportBoat"] as const)
        actions += button(
          "vessel:" + vessel,
          (vessel === "boat" ? "Łódź" : "Transportowiec · 4 miejsca") +
            " · " +
            cost(boatCosts[vessel]),
          "⚓",
          !affordable(boatCosts[vessel]),
        );
    if (e.type === "wallStairs")
      actions += button(
        "useStairs",
        "Wejdź łucznikiem",
        "➶",
        false,
        "Najbliższy łucznik zajmie wolne stanowisko przy schodach",
      );
    if (e.type === "siegeWorkshop")
      actions +=
        button("engine:ram", "Taran", "⚙") +
        button("engine:catapult", "Katapulta", "⚙");
    if (["hall", "castle", "rallyPoint"].includes(type))
      actions += button("alarm", world.alarm ? "Odwołaj alarm" : "Alarm", "♧");
    if (
      ["gate", "bridge", "waterGate"].includes(type) &&
      !buildingDefs[e.type]?.fixed
    )
      actions += button(
        "toggle",
        e.pendingClose
          ? "Anuluj oczekiwanie"
          : e.open
            ? type === "bridge"
              ? "Podnieś"
              : "Zamknij"
            : type === "bridge"
              ? "Opuść"
              : "Otwórz",
        type === "bridge" ? "╬" : "Π",
      );
    if (type === "gate" || type === "waterGate")
      actions += button(
        "gateMode",
        e.gateMode === "auto" ? "Tryb ręczny" : "Automatyczna",
        "↻",
      );
    if (type === "barracks")
      actions +=
        button(
          "recruit:soldier",
          "Piechur",
          "⚔",
          !affordable(unitCosts.soldier),
          "10 drewna · 20 żywności · 5 monet",
        ) +
        button(
          "recruit:archer",
          "Łucznik",
          "➶",
          !affordable(unitCosts.archer),
          "20 drewna · 15 żywności · 10 monet",
        ) +
        button(
          "recruit:shieldbearer",
          "Tarczownik",
          "⬟",
          !affordable(unitCosts.shieldbearer),
        );
    if (type === "market")
      actions +=
        button(
          "hireMerchant",
          "Zatrudnij kupca",
          "⚖",
          !affordable(merchantHireCost),
          "30 monet · 20 drewna",
        ) +
        getEntities(world)
          .filter((v) => v.tradeRoute?.homeId === e.id)
          .map((v) =>
            button("focusMerchant:" + v.id, "Kupiec · " + status(v), "⚖"),
          )
          .join("");
    if (e.type === "forge")
      actions += button(
        "upgrade",
        "Ulepsz broń",
        "⚒",
        world.weaponLevel >= 3,
        "20 żelaza · 30 monet",
      );
    if (["tower", "wall"].includes(type))
      actions += button("postArcher", "Obsadź", "➶", !postCapacity(world, e));
    if (buildingDefs[e.type]?.worker && !e.workerId)
      actions += button("autoAssign", "Przydziel pracownika", "♙");
    if (e.hp < e.maxHp && e.faction === "player")
      actions += button(
        "repair",
        "Napraw",
        "⚒",
        false,
        "15 drewna · 10 kamienia",
      );
  }
  if (e.faction === "enemy") actions += button("attackTarget", "Atakuj", "⚔");
  if (e.kind === "building" && e.faction === "player") {
    const parts = connectedConstruction(getEntities(world), e).length;
    actions +=
      button(
        "moveConstruction",
        parts > 1 ? "Przesuń całość" : "Przesuń",
        "✥",
      ) +
      button(
        targetMode === "moveConstruction"
          ? "turnConstructionPreview"
          : "rotateConstruction",
        parts > 1 ? "Obróć całość" : "Obróć",
        "↻",
      ) +
      button(
        "connect",
        "Połącz",
        "↔",
        false,
        "Dosuń do ściany wskazanej budowli",
      );
    if (e.links?.length) actions += button("disconnect", "Odłącz", "⋈");
    if (targetMode) actions += button("cancel", "Anuluj", "×");
  }
  const ownedShop = e.tradeRoute
    ? (() => {
        const r = e.tradeRoute!,
          draft = routeDraft(e),
          towns = getEntities(world).filter(
            (v) => v.kind === "town" && v.relation !== "hostile" && v.hp > 0,
          ),
          town = world.entities[draft.targetId];
        const cargo =
          Object.entries(r.cargo)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${icons[k]} ${v}`)
            .join(" · ") || "Pusty wóz";
        const available =
          ["idle", "waiting"].includes(r.phase) &&
          Object.values(r.cargo).every((v) => v === 0);
        return `<div class="routeShop"><small>${cargo} · Kursy: ${r.trips}${r.repeat ? " · Stała trasa" : ""}</small>${
          available
            ? `<div class="routeFields"><label>Osada<select data-route="targetId" aria-label="Osada docelowa">${towns.map((v) => `<option value="${v.id}" ${v.id === draft.targetId ? "selected" : ""}>${escape(v.label)}</option>`).join("")}</select></label><label>Towar<select data-route="resource" aria-label="Towar">${Object.keys(
                merchantOffers,
              )
                .map(
                  (k) =>
                    `<option value="${k}" ${k === draft.resource ? "selected" : ""}>${resourceNames[k]}</option>`,
                )
                .join(
                  "",
                )}</select></label><label>Ilość<input data-route="amount" aria-label="Ilość towaru" type="number" min="1" max="100" value="${draft.amount}"></label></div><small>Zapłata: ${exportPrice(draft.resource, draft.amount, town?.relation === "allied")} monet po powrocie</small><div class="actions">${button("dispatchOnce", "Wyślij", "➤", !towns.length)}${button("dispatchRepeat", "Stała trasa", "↔", !towns.length)}</div>`
            : `<small>${escape(world.entities[r.targetId || ""]?.label || "Powrót do osady")} · ${resourceNames[r.resource]} × ${r.amount}</small>`
        }<div class="actions">${r.repeat ? button("stopMerchantRoute", "Zakończ trasę", "■") : ""}${r.phase !== "idle" ? button("recallMerchant", "Wróć z ładunkiem", "↶") : ""}</div></div>`;
      })()
    : "";
  const merchantShop = e.merchant
    ? `<div class="merchantShop"><small>Monety kupca: ${e.merchant.stock.gold}</small>${(
        Object.entries(merchantOffers) as [
          TradeResource,
          typeof merchantOffers.wood,
        ][]
      )
        .map(([resource, offer]) => {
          const buy = merchantTradeAvailable(world, e, resource, "buy"),
            sell = merchantTradeAvailable(world, e, resource, "sell");
          return `<div class="merchantRow"><span>${icons[resource]} ${resourceNames[resource]} <small>${e.merchant!.stock[resource]} szt.</small></span>${button("merchant:buy:" + resource, `Kup ${offer.amount} · ${offer.buy} ●`, "+", !buy.ok, buy.ok ? "Kup za monety" : buy.message)}${button("merchant:sell:" + resource, `Sprzedaj ${offer.amount} · ${offer.sell} ●`, "−", !sell.ok, sell.ok ? "Sprzedaj za monety" : sell.message)}</div>`;
        })
        .join("")}</div>`
    : "";
  const progress =
    type === "barracks" && world.recruitQueue.length
      ? `<div class="queue">Szkolenie: ${world.recruitQueue.length} <span>${Math.ceil(world.recruitQueue[0].remaining)} s</span><i style="--progress:${(1 - world.recruitQueue[0].remaining / (world.entities[world.recruitQueue[0].buildingId]?.type === "barracks" ? 7.5 : 10)) * 100}%"></i></div>`
      : "";
  if (
    e.faction === "player" &&
    ["hero", "worker", "soldier", "archer", "boat"].includes(e.kind)
  )
    actions += button(
      "cancel",
      "Anuluj",
      "×",
      !targetMode,
      "Anuluj wybór celu",
    );
  actions += button(
    "deselect",
    ["hero", "worker", "soldier", "archer"].includes(e.kind)
      ? "Odznacz postać"
      : "Odznacz",
    "◇",
    false,
    "Zamknij zaznaczenie bez zatrzymywania rozkazu",
  );
  $("selection").innerHTML =
    `<div class="selectionHeading"><div class="portrait ${e.faction}">${icon}</div><div class="selectionInfo"><span class="eyebrow">${e.tradeRoute ? "TWÓJ KUPIEC" : e.type === "merchant" ? "WĘDROWNY KUPIEC" : e.kind === "hero" ? "BOHATER POGRANICZA" : e.kind === "building" ? "TWOJA OSADA" : e.kind === "town" ? "SĄSIEDZI" : "ZIELONA DOLINA"}</span><h2>${escape(e.label)}</h2><div class="health"><i style="width:${Math.max(0, e.hp / e.maxHp) * 100}%"></i></div><small>${escape(status(e))} <span>${Math.ceil(e.hp)} / ${e.maxHp}</span></small></div></div>${progress}${merchantShop}${ownedShop}${e.kind === "building" && buildingDefs[e.type] ? `<div class="buildingFunction">${escape(buildingDefs[e.type].description.split(/\.\s+/)[0])}</div>` : ""}<div class="actions">${actions || "<small>Element świata</small>"}</div>${targetMode ? `<div class="targetHint">Wskaż ${targetMode === "moveConstruction" ? "miejsce dla całej konstrukcji" : targetMode === "connect" ? "budowlę do połączenia" : targetMode === "assign" ? "miejsce pracy" : targetMode === "garrison" ? "mur lub wieżę" : "cel na mapie"}</div>` : ""}`;
}
$("selection").oninput = (event) => {
  const field = event.target as HTMLInputElement | HTMLSelectElement,
    key = field.dataset.route,
    e = chosen()[0];
  if (!key || !e?.tradeRoute) return;
  const draft = routeDraft(e);
  if (key === "amount")
    draft.amount = Math.max(
      1,
      Math.min(100, Math.round(Number(field.value) || 1)),
    );
  else if (key === "resource") draft.resource = field.value as TradeResource;
  else draft.targetId = field.value;
};
$("selection").onchange = () => {
  selectionSignature = "";
  requestAnimationFrame(() => renderSelection());
};
$("selection").onclick = (event) => {
  const b = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "[data-action]",
  );
  if (!b) return;
  const a = b.dataset.action!,
    e = chosen()[0],
    h = hero();
  if (!e) return;
  if (
    [
      "connect",
      "move",
      "attack",
      "gather",
      "assign",
      "garrison",
      "plant",
      "patrol",
      "escort",
    ].includes(a)
  ) {
    closePanel("buildPanel");
    targetMode = a as typeof targetMode;
    renderSelection();
    return;
  }
  if (["rotate", "disconnect"].includes(a)) {
    issue({ type: a, actorId: e.id });
    renderSelection();
    return;
  }
  if (a === "moveConstruction") {
    closePanel("buildPanel");
    targetMode = "moveConstruction";
    constructionTurns = 0;
    constructionPoint = { x: e.x, z: e.z };
    showConstructionPreview(e.x, e.z);
    renderSelection();
    return;
  }
  if (a === "turnConstructionPreview") {
    constructionTurns = (constructionTurns + 1) % 4;
    showConstructionPreview(constructionPoint.x, constructionPoint.z);
    renderSelection();
    return;
  }
  if (a === "rotateConstruction") {
    issue({ type: a, actorId: e.id });
    return;
  }
  if (a.startsWith("span:")) {
    const r = issue({
      type: "build",
      building: a.split(":")[1],
      x: e.x,
      z: e.z,
    });
    if (r.ok) {
      const bridge = getEntities(world).find(
        (v) =>
          v.kind === "building" &&
          behavior(v.type) === "bridge" &&
          v.x === e.x &&
          v.z === e.z,
      );
      if (bridge) select([bridge.id]);
    }
    return;
  }
  if (a === "hireMerchant") {
    const r = issue({ type: a, buildingId: e.id });
    if (r.ok) {
      const hired = getEntities(world)
        .filter((v) => v.tradeRoute?.homeId === e.id)
        .at(-1);
      if (hired) select([hired.id]);
    }
    return;
  }
  if (a.startsWith("focusMerchant:")) {
    select([a.split(":")[1]]);
    return;
  }
  if (a === "dispatchOnce" || a === "dispatchRepeat") {
    const draft = routeDraft(e);
    issue({
      type: "dispatchMerchant",
      actorId: e.id,
      ...draft,
      repeat: a === "dispatchRepeat",
    });
    return;
  }
  if (["stopMerchantRoute", "recallMerchant"].includes(a)) {
    issue({ type: a, actorId: e.id });
    return;
  }
  if (a === "trade") {
    chooseRouteMerchant(e.kind === "town" ? e.id : undefined);
    return;
  }
  if (a.startsWith("merchant:")) {
    const [, side, resource] = a.split(":");
    issue({
      type: "merchantTrade",
      targetId: e.id,
      side: side as "buy" | "sell",
      resource: resource as TradeResource,
    });
    return;
  }
  if (a === "cancel") {
    view.setGhost(0, 0);
    targetMode = undefined;
    renderSelection();
    return;
  }
  if (a === "deselect") {
    activeUnits = [];
    select([]);
    return;
  }
  if (a === "controlBoat" && e.carriedBy) {
    select([e.carriedBy]);
    return;
  }
  if (a === "stop") {
    issue({ type: "stop", ids: selected });
    return;
  }
  if (qa === "village" && a === "testBoltImpact") {
    const r = startTestBoltImpact(world, e.id);
    toast(r.message, !r.ok);
    return;
  }
  if (qa === "village" && a === "restoreTestDefenses") {
    const r = restoreTestDefenses(world);
    toast(r.message, !r.ok);
    renderSelection();
    return;
  }
  if (qa === "village" && (a.startsWith("testRaid:") || a === "stopTestRaid")) {
    if (a === "stopTestRaid") {
      finishTestRaid(world, true);
      toast("Ćwiczenie zakończone");
    } else {
      const r = startTestRaid(world, a.split(":")[1] as TestRaidLevel);
      toast(r.message, !r.ok);
      if (r.target) {
        view.focus(r.target.x, r.target.z + 3);
        view.zoomLevel = 18;
        view.resize();
      }
    }
    renderSelection();
    return;
  }
  if (a === "assignRally") {
    issue({ type: a, buildingId: e.id });
    return;
  }
  if (qa === "village" && a === "testFire") {
    const r = startTestFire(world);
    toast(r.message, !r.ok);
    if (r.target) view.focus(r.target.x, r.target.z);
    renderSelection();
    return;
  }
  if (["buyHorse", "innDelivery"].includes(a)) {
    issue({ type: a, buildingId: e.id });
    return;
  }
  if (a.startsWith("vessel:")) {
    issue({
      type: "buildBoat",
      buildingId: e.id,
      vessel: a.split(":")[1] as "boat" | "transportBoat",
    });
    return;
  }
  if (a.startsWith("engine:")) {
    issue({
      type: "recruitEngine",
      engine: a.split(":")[1] as "ram" | "catapult",
      buildingId: e.id,
    });
    return;
  }
  if (a.startsWith("recruit:")) {
    issue({
      type: "recruit",
      unit: a.split(":")[1] as "soldier" | "archer" | "shieldbearer",
    });
    return;
  }
  if (a === "autoAssign") {
    const w = getEntities(world).find(
      (v) => v.kind === "worker" && !v.workplaceId,
    );
    if (w) issue({ type: "assign", workerId: w.id, buildingId: e.id });
    else toast("Zbuduj dom, aby przyciągnąć pracowników", true);
    return;
  }
  if (a === "postArcher") {
    const archer = getEntities(world).find(
      (v) =>
        v.kind === "archer" &&
        v.faction === "player" &&
        v.hp > 0 &&
        !v.garrisonId &&
        !v.garrisonTargetId &&
        !v.carriedBy,
    );
    if (archer) issue({ type: "garrison", actorId: archer.id, targetId: e.id });
    else toast("Wyszkol łucznika w koszarach", true);
    return;
  }
  if (a === "collect") {
    issue({ type: "gather", ids: [h!.id], targetId: e.id });
    return;
  }
  if (a === "attackTarget") {
    const army = getEntities(world).filter(
      (v) =>
        v.faction === "player" &&
        ["hero", "soldier", "archer"].includes(v.kind),
    );
    issue({ type: "attack", ids: army.map((v) => v.id), targetId: e.id });
    return;
  }
  issue({
    type: a,
    actorId: [
      "mount",
      "dismount",
      "board",
      "follow",
      "stay",
      "rebuild",
      "rebuildWall",
    ].includes(a)
      ? h?.id
      : e.id,
    targetId: e.id,
  });
};
const groups: Record<string, string[]> = {
  osada: [],
  produkcja: [],
  obrona: [],
  drogi: [],
  ozdoby: [],
};
const legacyCategories: Record<string, string> = {
  house: "osada",
  warehouse: "osada",
  market: "osada",
  hospital: "osada",
  castle: "osada",
  lumber: "produkcja",
  quarry: "produkcja",
  farm: "produkcja",
  mine: "produkcja",
  forge: "produkcja",
  stable: "produkcja",
  barracks: "obrona",
  wall: "obrona",
  gate: "obrona",
  tower: "obrona",
  road: "drogi",
  bridge: "drogi",
  dock: "drogi",
};
for (const [type, def] of Object.entries(buildingDefs))
  groups[def.category || legacyCategories[type] || "osada"].push(type);
function buildingPlacement(x: number, z: number) {
  const cell = { x: Math.round(x), z: Math.round(z), attachTo: undefined };
  // Crossing a channel takes priority over snapping to its bank.
  if (
    buildType &&
    behavior(buildType) === "bridge" &&
    getEntities(world).some(
      (e) =>
        e.kind === "building" &&
        ["trench", "canal", "ravine"].includes(e.type) &&
        Math.round(e.x) === cell.x &&
        Math.round(e.z) === cell.z,
    )
  )
    return cell;
  if (buildType && snapBuildings) {
    const candidate = snapCandidates(
      getEntities(world),
      buildType,
      buildRotation,
      x,
      z,
    ).find((p) => {
      const result = canBuild(world, buildType!, p.x, p.z, {
        rotation: buildRotation,
        attachTo: p.attachTo,
      });
      return result.ok || result.message === "Brakuje surowców";
    });
    if (candidate) return candidate;
  }
  return { x: Math.round(x), z: Math.round(z), attachTo: undefined };
}
function renderBuildMode() {
  const b = $("buildMode");
  b.classList.toggle("hidden", !buildType && !eraseRoads);
  $("build").classList.toggle("active", !!buildType || eraseRoads);
  if (eraseRoads) {
    b.innerHTML =
      '<span>×</span><b>Usuń ścieżki</b><small>Kliknij lub przeciągnij odcinek</small><button id="finishBuild">Zakończ ×</button>';
    return;
  }
  if (buildType)
    b.innerHTML = `<span>${iconFor(buildType)}</span><b>${buildingDefs[buildType].label}</b><small>${behavior(buildType) === "bridge" ? "Przeciągnij od brzegu do brzegu" : `Kliknij miejsce${linearBuild() ? " lub przeciągnij odcinek" : ""}`}</small><button id="snapBuild" aria-pressed="${snapBuildings}" title="Przyciąganie do ścian sąsiednich budowli">▣ Przyciąganie ${snapBuildings ? "✓" : "—"}</button><button id="rotateBuild" title="Obróć o 90° · R">↻ Obróć ${buildRotation * 90}°</button><button id="finishBuild">Zakończ ×</button>`;
}
$("buildMode").onclick = (event) => {
  const button = (event.target as HTMLElement).closest("button");
  if (!button) return;
  if (button.id === "snapBuild") {
    snapBuildings = !snapBuildings;
    renderBuildMode();
    return;
  }
  if (button.id === "rotateBuild") {
    buildRotation = (buildRotation + 1) % 4;
    renderBuildMode();
    view.rotateGhost(buildRotation);
    return;
  }
  closePanel("buildPanel");
  renderBuildMode();
};
$("selectGroup").onclick = () => {
  closePanel("buildPanel");
  selectionMode = !selectionMode;
  $("mapHint").classList.toggle("hidden", !selectionMode);
  $("selectGroup").classList.toggle("active", selectionMode);
  $("mapHint").textContent = selectionMode
    ? "Przeciągnij prostokąt wokół jednostek"
    : "Przeciągnij mapę · Kółko przybliża";
};
function renderBuild() {
  const signature = JSON.stringify([
    category,
    buildType,
    Object.values(buildingDefs).map((d) => affordable(d.cost)),
  ]);
  if (signature === buildSignature) return;
  buildSignature = signature;
  const cats: Record<string, string> = {
    osada: "Osada",
    produkcja: "Produkcja",
    obrona: "Obrona",
    drogi: "Przeprawy",
    ozdoby: "Ozdoby",
  };
  $("buildPanel").innerHTML =
    `<div class="panelTitle"><div><span class="eyebrow">ROZWIJAJ POGRANICZE</span><h2>Budowa</h2></div><button data-close="buildPanel" title="Zamknij">×</button></div><nav>${Object.keys(
      groups,
    )
      .map(
        (k) =>
          `<button data-category="${k}" class="${category === k ? "active" : ""}">${cats[k]}</button>`,
      )
      .join(
        "",
      )}</nav>${category === "drogi" ? '<button class="eraseRoadButton" data-erase-roads>× Usuń ścieżki</button>' : ""}<div class="buildGrid">${groups[
      category
    ]
      .map((k) => {
        const d = buildingDefs[k];
        return `<button data-building="${k}" class="${buildType === k ? "active" : ""} ${affordable(d.cost) ? "" : "expensive"}" title="${escape(d.description)}"><span class="buildingIcon">${iconFor(k)}</span><b>${d.label}</b><small>${cost(d.cost)}</small></button>`;
      })
      .join(
        "",
      )}</div><div class="panelFoot">${buildType ? `${buildingDefs[buildType].label} · kliknij teren${linearBuild() ? " lub przeciągnij odcinek" : ""}` : "Wybierz budowlę, potem miejsce na mapie."}</div>`;
}
$("buildPanel").onclick = (event) => {
  const t = event.target as HTMLElement;
  if (t.closest("[data-erase-roads]")) {
    closePanel("buildPanel");
    eraseRoads = true;
    targetMode = undefined;
    renderBuildMode();
    return;
  }
  const cat = t.closest<HTMLElement>("[data-category]");
  if (cat) {
    category = cat.dataset.category!;
    renderBuild();
  }
  const b = t.closest<HTMLElement>("[data-building]");
  if (b) {
    eraseRoads = false;
    buildType = b.dataset.building;
    targetMode = undefined;
    $("buildPanel").classList.add("hidden");
    renderBuildMode();
  }
  if (t.closest("[data-close]")) closePanel("buildPanel");
};
function objective() {
  const es = getEntities(world),
    has = (type: string) =>
      es.some((e) => behavior(e.type) === type && e.faction === "player");
  if (!has("quarry"))
    return {
      title: "Fundamenty osady",
      detail: "Zbuduj kamieniołom",
      icon: "◆",
      done: false,
    };
  if (
    !has("barracks") ||
    es.filter(
      (e) => e.faction === "player" && ["soldier", "archer"].includes(e.kind),
    ).length < 4
  )
    return {
      title: "Strzeż swoich ludzi",
      detail: has("barracks")
        ? "Wyszkol co najmniej 4 żołnierzy"
        : "Zbuduj koszary i wyszkol oddział",
      icon: "⚔",
      done: false,
    };
  if (
    !es.some(
      (e) =>
        e.kind === "town" && ["allied", "conquered"].includes(e.relation || ""),
    )
  )
    return {
      title: "Nie jesteś sam",
      detail: "Zawrzyj sojusz z sąsiadem",
      icon: "⚑",
      done: false,
    };
  if (!world.objectives.banditsDefeated)
    return {
      title: "Bezpieczne pogranicze",
      detail: "Pokonaj bandytów na południowym wschodzie",
      icon: "⚔",
      done: false,
    };
  if (!world.objectives.ruinsRestored)
    return {
      title: "Strażnica znów ożyje",
      detail: "Odbuduj ruiny bohaterem · 60 ♧ 50 ◆",
      icon: "♜",
      done: false,
    };
  if (!has("castle"))
    return {
      title: "Serce królestwa",
      detail: "Wznieś dwór",
      icon: "♜",
      done: false,
    };
  return {
    title: "Dolina zjednoczona",
    detail: "Twoja opowieść trwa dalej",
    icon: "✦",
    done: true,
  };
}
let bookRewardsSignature = "";
let instantCategory = "settlement",
  lastRenderedBookTab = "";
let instantPendingId: InstantAddonId | undefined;
function rewardsSignature() {
  const a = addonsFor(world);
  return JSON.stringify([
    a.gems,
    a.rewards,
    a.progress?.tradeReturns,
    bookTab === "addons"
      ? Object.entries(instantAddons)
          .filter(([, p]) => p.category === instantCategory)
          .map(([id]) => {
            const r = instantAddonAvailable(world, id as InstantAddonId);
            return [id, r.ok, r.message];
          })
      : null,
  ]);
}
function renderBook() {
  const scroll =
    lastRenderedBookTab === bookTab
      ? $("book").querySelector(".bookBody")?.scrollTop || 0
      : 0;
  lastRenderedBookTab = bookTab;
  bookRewardsSignature = rewardsSignature();
  const es = getEntities(world),
    towns = es.filter((e) => e.kind === "town");
  const nav = `<nav>${[
    ["overview", "Królestwo"],
    ["people", "Ludzie"],
    ["relations", "Sąsiedzi"],
    ["quests", "Zadania"],
    ["journal", "Dziennik"],
    ["addons", "Dodatki"],
  ]
    .map(
      ([k, l]) =>
        `<button data-tab="${k}" class="${bookTab === k ? "active" : ""}">${l}</button>`,
    )
    .join("")}</nav>`;
  let body = "";
  if (bookTab === "overview") {
    const goals = [
      [
        "Fundamenty",
        es.filter((e) => e.kind === "building" && e.faction === "player")
          .length + " budowli",
      ],
      ["Ludzie", ownUnits().length + " mieszkańców i żołnierzy"],
      [
        "Sąsiedzi",
        towns.filter((e) => e.relation === "allied").length + " sojuszy",
      ],
      [
        "Strażnica",
        world.objectives.ruinsRestored ? "Odbudowana" : "Czeka na odkrycie",
      ],
      [
        "Bandyci",
        world.objectives.banditsDefeated ? "Pokonani" : "Zagrażają szlakom",
      ],
    ];
    body = `<div class="bookLead">${objective().title}<small>${objective().detail}</small></div>${goals.map(([k, v]) => `<div class="bookRow"><span>${k}</span><b>${v}</b></div>`).join("")}<div class="bookNote">Połącz osadę, sojusz i odbudowaną strażnicę. Usuń zagrożenie bandytów i wznieś dwór.</div>`;
  }
  if (bookTab === "quests") {
    const a = addonsFor(world),
      wins = Object.keys(a.rewards).filter((k) =>
        k.startsWith("river:raid:"),
      ).length;
    body = `<div class="questLead"><b>Każdy odparty najazd <span>+10 ◇</span></b><small>Odparte fale: ${wins}</small></div>${rewardTasks(
      world,
    )
      .map(
        (task) =>
          `<article class="gemQuest ${a.rewards[task.key] ? "claimed" : ""}"><span>${a.rewards[task.key] ? "✓" : "⚑"}</span><div><b>${task.title}</b><small>${task.detail}</small></div><strong>${a.rewards[task.key] ? "✓ " : "+"}${task.amount} ◇</strong></article>`,
      )
      .join(
        "",
      )}<small>Nagrody otrzymujesz automatycznie, raz za zadanie lub falę.</small>`;
  }
  if (bookTab === "people")
    body = es
      .filter(
        (e) =>
          e.faction === "player" &&
          [
            "hero",
            "worker",
            "soldier",
            "archer",
            "horse",
            "dog",
            "boat",
          ].includes(e.kind),
      )
      .map(
        (e) =>
          `<button class="entityRow" data-focus="${e.id}"><span>${icons[e.type] || icons[e.kind]}</span><div><b>${escape(e.label)}</b><small>${escape(status(e))}</small></div><span>↗</span></button>`,
      )
      .join("");
  if (bookTab === "relations")
    body = towns
      .map(
        (e) =>
          `<div class="townCard"><button data-focus="${e.id}"><span>⚑</span><b>${escape(e.label)}</b><small>${status(e)}</small></button><div class="actions">${button("alliance:" + e.id, "Sojusz", "⚑", e.relation === "allied", "45 monet · 25 żywności")}${button("trade:" + e.id, "Karawana", "⚖")}</div></div>`,
      )
      .join("");
  if (bookTab === "journal")
    body = world.messages
      .map(
        (m) =>
          `<div class="journalRow"><span>${Math.floor(m.time / 60)}:${String(Math.floor(m.time % 60)).padStart(2, "0")}</span><p>${escape(m.text)}</p></div>`,
      )
      .join("");
  if (bookTab === "addons") {
    const a = addonsFor(world),
      appearance = a.appearance;
    const options = (
      values: Record<string, readonly string[] | string>,
      selected: string,
    ) =>
      Object.entries(values)
        .map(
          ([id, value]) =>
            `<option value="${id}" ${id === selected ? "selected" : ""}>${escape(Array.isArray(value) ? value[0] : (value as string))}</option>`,
        )
        .join("");
    body = `<div class="addonWallet"><span>◇ ${a.gems}</span><small>Zadania, podboje i odparte najazdy</small><button data-tab="quests">Zobacz zadania</button></div><h3>Do obecnej osady</h3><nav class="instantFilters">${[
      ["settlement", "Osada"],
      ["defense", "Obrona"],
      ["travel", "Podróż"],
    ]
      .map(
        ([key, label]) =>
          `<button data-instant-category="${key}" class="${instantCategory === key ? "active" : ""}">${label}</button>`,
      )
      .join("")}</nav><div class="addonPacks instantPacks">${Object.entries(
      instantAddons,
    )
      .filter(([, offer]) => offer.category === instantCategory)
      .map(([id, offer]) => {
        const available = instantAddonAvailable(world, id as InstantAddonId);
        return `<article><div><b>${offer.name}</b><small>${offer.description}</small>${!available.ok ? `<small class="addonUnavailable">${available.message}</small>` : ""}</div><button data-instant-addon="${id}" ${!available.ok || addonsBusy ? "disabled" : ""} title="${escape(available.message)}">${instantPendingId === id ? "Zapisywanie…" : `${offer.price} ◇ · Kup`}</button></article>`;
      })
      .join(
        "",
      )}</div><details class="starterDetails"><summary>Pakiety na nowe wyprawy</summary><small>Kup raz. Bonus na każdą nową wyprawę.</small><div class="addonPacks">${Object.entries(
      starterPacks,
    )
      .map(
        ([id, pack]) =>
          `<article><div><b>${pack.name}</b><small>${pack.description}</small></div><button data-addon="${id}" ${a.packs[id as keyof typeof starterPacks] || a.gems < pack.price || addonsBusy ? "disabled" : ""}>${a.packs[id as keyof typeof starterPacks] ? "✓ Kupiony" : `${pack.price} ◇ · Kup`}</button></article>`,
      )
      .join(
        "",
      )}</div></details><h3>Wygląd</h3><div class="appearanceFields"><label>Strój<select data-appearance="outfit" aria-label="Strój bohatera">${options(outfits, appearance.outfit)}</select></label><label>Kolor psa<select data-appearance="dogColor" aria-label="Kolor psa">${options(dogCoats, appearance.dogColor)}</select></label><label>Imię psa<input id="addonDogName" aria-label="Imię psa" maxlength="20" value="${escape(appearance.dogName)}"><button data-addon-name>Zapisz imię</button></label><label>Sztandar<select data-appearance="bannerColor" aria-label="Kolor sztandaru">${options(bannerColors, appearance.bannerColor)}</select></label><label>Herb<select data-appearance="bannerEmblem" aria-label="Herb sztandaru">${options(bannerEmblems, appearance.bannerEmblem)}</select></label></div><details class="newExpedition"><summary>Nowa wyprawa</summary><small>Obecna osada zostanie zastąpiona. Klejnoty, dodatki i wygląd zostają.</small><button data-new-expedition>Przygotuj nową wyprawę</button></details>`;
  }
  $("book").innerHTML =
    `<div class="panelTitle"><div><span class="eyebrow">TWOJE ZIEMIE</span><h2>Księga królestwa</h2></div><button data-close="book">×</button></div>${nav}<div class="bookBody">${body}</div>`;
  const bodyPanel = $("book").querySelector(".bookBody");
  if (bodyPanel) bodyPanel.scrollTop = scroll;
}
let addonsBusy = false;
async function buyInstantAddon(id: InstantAddonId) {
  if (addonsBusy) return;
  const state = world,
    purchaseId = crypto.randomUUID();
  const reserve = command(state, {
    type: "buyInstantAddon",
    instantId: id,
    purchaseId,
    deferEffect: true,
  });
  if (!reserve.ok) {
    toast(reserve.message, true);
    return;
  }
  addonsBusy = true;
  instantPendingId = id;
  renderBook();
  renderUI();
  try {
    try {
      await saveWorld(state);
    } catch {
      command(state, { type: "cancelInstantAddon", purchaseId });
      toast("Nie udało się zapisać zakupu. Klejnoty zwrócone.", true);
      return;
    }
    if (world !== state) return;
    const result = command(state, { type: "claimInstantAddon", purchaseId });
    try {
      await saveWorld(state);
      toast(result.message, !result.ok);
    } catch {
      toast(
        result.ok
          ? "Dodatek działa. Automatyczny zapis ponowi próbę."
          : result.message,
        true,
      );
    }
  } finally {
    addonsBusy = false;
    instantPendingId = undefined;
    renderUI();
    if (world === state) renderBook();
  }
}
async function addonAction(c: Command) {
  if (addonsBusy) return;
  const before = structuredClone(addonsFor(world));
  const r = command(world, c);
  if (!r.ok) {
    toast(r.message, true);
    return;
  }
  addonsBusy = true;
  renderBook();
  try {
    await saveWorld(world);
    toast(r.message);
  } catch {
    world.addons = before;
    for (const e of getEntities(world))
      if (e.kind === "dog" && e.faction === "player")
        e.label = before.appearance.dogName;
    toast("Nie udało się zapisać zmiany. Klejnoty zostały zwrócone.", true);
  } finally {
    addonsBusy = false;
    renderUI();
    renderBook();
  }
}
function openAddons() {
  $("tooltip").style.display = "none";
  closePanel("buildPanel");
  $("modal").classList.add("hidden");
  bookTab = "addons";
  $("book").classList.remove("hidden");
  renderBook();
}
$("gemsWallet").onclick = openAddons;
$("book").onchange = (event) => {
  const field = event.target as HTMLSelectElement;
  if (field.dataset.appearance)
    void addonAction({
      type: "appearance",
      appearanceField: field.dataset.appearance as keyof Appearance,
      appearanceValue: field.value,
    });
};
$("book").onclick = (event) => {
  const t = event.target as HTMLElement,
    tab = t.closest<HTMLElement>("[data-tab]"),
    focus = t.closest<HTMLElement>("[data-focus]"),
    a = t.closest<HTMLElement>("[data-action]");
  const category = t.closest<HTMLElement>("[data-instant-category]");
  if (category) {
    instantCategory = category.dataset.instantCategory!;
    renderBook();
    return;
  }
  const instant = t.closest<HTMLElement>("[data-instant-addon]");
  if (instant) {
    void buyInstantAddon(instant.dataset.instantAddon as InstantAddonId);
    return;
  }
  const addon = t.closest<HTMLElement>("[data-addon]");
  if (addon) {
    void addonAction({
      type: "buyAddon",
      addonId: addon.dataset.addon as keyof typeof starterPacks,
    });
    return;
  }
  if (t.closest("[data-addon-name]")) {
    void addonAction({
      type: "appearance",
      appearanceField: "dogName",
      appearanceValue: $<HTMLInputElement>("addonDogName").value,
    });
    return;
  }
  if (t.closest("[data-new-expedition]")) {
    if (addonsBusy) {
      toast("Poczekaj na zapisanie zakupu", true);
      return;
    }
    modal(
      "Nowa wyprawa",
      '<p>Zastąpi obecną osadę. Pobierzemy kopię jej zapisu. Klejnoty i dodatki zostają.</p><button data-modal="new-expedition" class="primary wide">Rozpocznij nową wyprawę</button><button data-modal="close" class="wide">Zostań w osadzie</button>',
    );
    return;
  }
  if (tab) {
    bookTab = tab.dataset.tab!;
    renderBook();
  }
  if (focus) {
    const e = world.entities[focus.dataset.focus!];
    if (e) {
      view.focus(e.x, e.z);
      select([e.id]);
      closePanel("book");
    }
  }
  if (a) {
    const [type, targetId] = a.dataset.action!.split(":");
    if (type === "trade") {
      closePanel("book");
      chooseRouteMerchant(targetId);
      return;
    }
    issue({ type, targetId });
    renderBook();
  }
  if (t.closest("[data-close]")) closePanel("book");
};
function renderUI() {
  const es = getEntities(world);
  $("resources").innerHTML =
    Object.entries(world.resources)
      .map(
        ([k, v]) =>
          `<div class="resource" title="${resourceNames[k]}"><span>${icons[k]}</span><b>${Math.floor(v)}</b><small>${resourceNames[k]}</small></div>`,
      )
      .join("") +
    `<div class="resource population" title="Mieszkańcy i wojsko"><span>♙</span><b>${ownUnits().length}</b><small>Ludzie</small></div>`;
  $("season").innerHTML =
    `WIOSNA <b>Dzień ${Math.floor(world.time / 240) + 1}</b>`;
  $("speed").textContent = world.speed + "×";
  $("gemsWallet").textContent = "◇ " + addonsFor(world).gems;
  const o = objective(),
    questReward = rewardTasks(world).find((q) => q.title === o.title),
    raid = world.raidWarned && world.raidTimer > 0;
  $("objective").innerHTML =
    `<div class="objectiveIcon">${o.icon}</div><div><span class="eyebrow">${o.done ? "TWOJE KRÓLESTWO" : "KOLEJNY KROK"}</span><b>${o.title}</b><small>${o.detail}</small>${questReward ? `<span class="gemRewardBadge">${addonsFor(world).rewards[questReward.key] ? "✓" : "+"}${questReward.amount} ◇</span>` : ""}</div>${raid ? `<div class="raidWarning">⚔ Najazd za ${Math.ceil(world.raidTimer)} s${world.raidDirection ? " · " + escape(world.raidDirection) : ""}</div>` : ""}`;
  selected = selected.filter((id) => !!world.entities[id]);
  renderSelection();
  drawMinimap();
  if (!$("buildPanel").classList.contains("hidden")) renderBuild();
  if (
    !$("book").classList.contains("hidden") &&
    ["quests", "addons"].includes(bookTab) &&
    rewardsSignature() !== bookRewardsSignature &&
    !$("book").contains(
      document.activeElement?.matches("input,select")
        ? document.activeElement
        : null,
    )
  )
    renderBook();
  if (world.victory && !victoryShown) {
    victoryShown = true;
    showOutcome(true);
  }
  if (world.defeated && !defeatShown) {
    defeatShown = true;
    showOutcome(false);
  }
  const last = world.messages[0];
  if (last && last.time > lastMessageTime && playing) {
    if (last.text.startsWith("Najazd!")) {
      toast(last.text, true);
      audio.tone("alarm");
    } else if (
      /Karawana wróciła|Jednostka gotowa|urat|ostrze|Reks|szczeka|klejnotów/.test(
        last.text,
      )
    )
      toast(last.text);
    lastMessageTime = last.time;
  }
  void es;
}
let lastMessageTime = -1;
function drawMinimap() {
  const c = $<HTMLCanvasElement>("minimap"),
    ctx = c.getContext("2d")!,
    sx = c.width / 64,
    sy = c.height / 64;
  ctx.fillStyle = "#627555";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#6b9e99";
  ctx.fillRect(31 * sx, 0, 3 * sx, c.height);
  for (const e of getEntities(world)) {
    ctx.fillStyle =
      e.kind === "tree"
        ? "#3e5d43"
        : e.kind === "rock"
          ? "#adb091"
          : e.faction === "enemy"
            ? "#c96f50"
            : e.faction === "player"
              ? "#e5ca85"
              : "#d3d1ad";
    const size =
      e.kind === "town"
        ? 4
        : e.kind === "building"
          ? 3
          : e.kind === "tree"
            ? 1.6
            : 2;
    ctx.fillRect(e.x * sx - size / 2, e.z * sy - size / 2, size, size);
  }
  ctx.strokeStyle = "#f1dd9b";
  ctx.lineWidth = 1;
  const r = view.zoomLevel * 0.6;
  ctx.strokeRect(
    (view.target.x - r / 2) * sx,
    (view.target.z - r / 2) * sy,
    r * sx,
    r * sy,
  );
}
function focusMinimap(event: PointerEvent) {
  const r = $("minimap").getBoundingClientRect();
  view.focus(
    ((event.clientX - r.left) / r.width) * 64,
    ((event.clientY - r.top) / r.height) * 64,
  );
  drawMinimap();
}
$("minimap").onpointerdown = (event) => {
  $("minimap").setPointerCapture(event.pointerId);
  focusMinimap(event);
};
$("minimap").onpointermove = (event) => {
  if (event.buttons & 1) focusMinimap(event);
};
function modal(title: string, body: string) {
  $("modal").innerHTML =
    `<section class="modalCard"><div class="panelTitle"><div><span class="eyebrow">ZIELONA DOLINA II</span><h2>${title}</h2></div><button data-modal="close">×</button></div>${body}</section>`;
  $("modal").classList.remove("hidden");
}
$("menu").onclick = () => {
  closePanel("buildPanel");
  closePanel("book");
  targetMode = undefined;
  renderUI();
  modal(
    "Menu gry",
    `<div class="menuGrid"><button data-modal="addons">◇ Klejnoty i dodatki</button><button data-modal="save">↓ Zapisz grę</button><button data-modal="load">↶ Wczytaj zapis</button><button data-modal="backup">↶ Poprzedni zapis</button><button data-modal="export">↗ Eksportuj</button><button data-modal="import">↙ Importuj</button><button data-modal="sound">♫ Dźwięk: ${audio.enabled ? "włączony" : "wyłączony"}</button><button data-modal="quality">◈ Grafika: ${view.quality === "high" ? "wysoka" : "oszczędna"}</button><button data-modal="help">? Sterowanie</button></div>${qa === "village" ? '<button data-modal="testResources">+100 000 każdego zasobu</button><button data-modal="restoreTestDefenses">Napraw i odbuduj obronę</button>' : ""}<button data-modal="resume" class="primary wide">Wróć do doliny →</button><input type="file" id="importFile" accept="application/json,.json" hidden>`,
  );
};
async function doSave() {
  if (qa && qa !== "village") {
    toast("Scena testowa — zapis wyłączony");
    return;
  }
  try {
    await saveWorld(world);
    toast("Gra zapisana");
  } catch {
    toast("Zapis niedostępny. Wyeksportuj postęp do pliku.", true);
  }
}
async function restore(backup = false) {
  try {
    const saved = await loadWorld(backup);
    if (!saved) {
      toast("Brak zapisu", true);
      return;
    }
    replaceWorld(saved);
    $("modal").classList.add("hidden");
    renderUI();
    toast("Wczytano zapis");
  } catch {
    toast("Nie można odczytać zapisu. Spróbuj poprzedniej kopii.", true);
  }
}
function replaceWorld(next: World) {
  audio.resetSiege();
  world = next;
  world.paused = false;
  selected = hero() ? [hero()!.carriedBy || hero()!.id] : [];
  targetMode = undefined;
  activeUnits = selected.length ? [...selected] : hero() ? [hero()!.id] : [];
  selectionMode = false;
  down = undefined;
  keys.clear();
  closePanel("buildPanel");
  closePanel("book");
  $("selectionBox").style.display = "none";
  $("tooltip").style.display = "none";
  for (const b of worldLabels.values()) b.remove();
  worldLabels.clear();
  lastMessageTime = -1;
  lastSave = performance.now();
  selectionSignature = "";
  buildSignature = "";
  defeatShown = false;
  victoryShown = world.victory;
  view.focus(hero()?.x ?? 15, hero()?.z ?? 30);
}
$("modal").onclick = async (event) => {
  const b = (event.target as HTMLElement).closest<HTMLElement>("[data-modal]");
  if (!b) return;
  switch (b.dataset.modal) {
    case "close":
      $("modal").classList.add("hidden");
      break;
    case "resume":
      $("modal").classList.add("hidden");
      world.paused = false;
      renderUI();
      break;
    case "addons":
      openAddons();
      break;
    case "new-expedition": {
      b.setAttribute("disabled", "");
      try {
        await saveWorld(world);
        exportWorld(world);
        const next = createNextExpedition(world);
        await saveWorld(next);
        replaceWorld(next);
        $("modal").classList.add("hidden");
        enter(false);
        toast("Nowa wyprawa gotowa");
      } catch {
        b.removeAttribute("disabled");
        toast(
          "Nie udało się zapisać nowej wyprawy. Osada pozostaje bez zmian.",
          true,
        );
      }
      break;
    }
    case "save":
      await doSave();
      break;
    case "load":
      await restore();
      break;
    case "backup":
      await restore(true);
      break;
    case "export":
      exportWorld(world);
      break;
    case "import":
      $<HTMLInputElement>("importFile").click();
      break;
    case "restoreTestDefenses":
      if (qa === "village") {
        const r = restoreTestDefenses(world);
        toast(r.message, !r.ok);
        renderUI();
      }
      break;
    case "testResources":
      if (qa === "village") {
        grantTestResources(world);
        toast("+100 000 każdego zasobu");
        renderUI();
      }
      break;
    case "sound":
      audio.enabled = !audio.enabled;
      b.textContent = "♫ Dźwięk: " + (audio.enabled ? "włączony" : "wyłączony");
      break;
    case "quality":
      view.setQuality(view.quality === "high");
      b.textContent =
        "◈ Grafika: " + (view.quality === "high" ? "wysoka" : "oszczędna");
      break;
    case "help":
      modal(
        "Wszystko pod ręką",
        `<div class="helpRows"><p><b>Kliknięcie</b> Wybierz jednostkę, potem kliknij ziemię, aby iść.</p><p><b>PPM</b> Idź, atakuj albo skorzystaj z obiektu.</p><p><b>Przeciągnięcie mapy</b> Przesuwa kamerę. Kółko przybliża miejsce pod kursorem.</p><p><b>Panel na dole</b> Wszystkie działania dostępne również przyciskami.</p><p><b>Zaznacz</b> Wybierz kilka jednostek prostokątem. Gra cały czas działa.</p><p><b>Budowa</b> Wybierz obiekt i kliknij teren. Drogi oraz mury rysuj przeciągnięciem.</p></div><button data-modal="close" class="primary wide">Rozumiem</button>`,
      );
      break;
  }
};
$("modal").onchange = async (event) => {
  const input = event.target as HTMLInputElement;
  if (input.id !== "importFile" || !input.files?.[0]) return;
  try {
    replaceWorld(await importWorld(input.files[0]));
    $("modal").classList.add("hidden");
    renderUI();
    toast("Zaimportowano grę");
  } catch (error) {
    toast(error instanceof Error ? error.message : "Nieprawidłowy plik", true);
  }
};
function showOutcome(win: boolean) {
  world.paused = false;
  modal(
    win ? "Dolina zjednoczona" : "Bohater poległ",
    `<div class="outcome"><span>${win ? "✦" : "⚔"}</span><p>${win ? "Sojusz zawarty. Pogranicze bezpieczne. Strażnica znów czuwa." : "Twoi ludzie zapamiętają tę wyprawę. Wczytaj zapis i poprowadź ich ponownie."}</p></div><button data-modal="${win ? "resume" : "load"}" class="primary wide">${win ? "Graj dalej →" : "Wczytaj zapis"}</button>`,
  );
}

let down:
    | {
        x: number;
        y: number;
        button: number;
        worldX: number;
        worldZ: number;
        selecting: boolean;
      }
    | undefined,
  lastPointer = { x: 0, y: 0 },
  dragged = false;
const canvas = view.renderer.domElement;
canvas.addEventListener("pointerleave", () => {
  lastHover = undefined;
  $("tooltip").style.display = "none";
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (event) => {
  if (!playing) return;
  audio.unlock();
  const p = view.pick(event.clientX, event.clientY);
  down = {
    x: event.clientX,
    y: event.clientY,
    button: event.button,
    selecting: selectionMode || event.shiftKey,
    worldX: p.x,
    worldZ: p.z,
  };
  lastPointer = { x: event.clientX, y: event.clientY };
  dragged = false;
  canvas.setPointerCapture(event.pointerId);
});
function showConstructionPreview(x: number, z: number) {
  const e = chosen()[0];
  if (!e) return;
  constructionPoint = { x: Math.round(x), z: Math.round(z) };
  const plan = planConstructionMove(
    world,
    e.id,
    constructionPoint.x,
    constructionPoint.z,
    constructionTurns,
  );
  view.setConstructionGhost(plan.members, plan.ok);
  return plan;
}
canvas.addEventListener("pointermove", (event) => {
  const p = view.pick(event.clientX, event.clientY);
  lastHover = p.id;
  hoverPos = { x: event.clientX, y: event.clientY };
  if (eraseRoads) {
    const p2 = { x: Math.round(p.x), z: Math.round(p.z) };
    const available = canRemoveRoad(world, p2.x, p2.z);
    view.setGhost(p2.x, p2.z, "road", false);
    canvas.style.cursor = "crosshair";
    $("tooltip").innerHTML = `<b>${available.message}</b>`;
    $("tooltip").style.cssText =
      `display:block;left:${event.clientX + 15}px;top:${event.clientY - 40}px`;
  } else if (targetMode === "moveConstruction") {
    const plan = showConstructionPreview(p.x, p.z);
    canvas.style.cursor = "crosshair";
    if (plan && !down) {
      $("tooltip").innerHTML =
        `<b>${plan.ok ? "Ustaw całą konstrukcję" : escape(plan.message)}</b><small>Obrót: ${constructionTurns * 90}°</small>`;
      $("tooltip").style.cssText =
        `display:block;left:${Math.min(innerWidth - 250, event.clientX + 18)}px;top:${Math.max(80, event.clientY - 55)}px`;
    }
  } else if (buildType) {
    const placement = buildingPlacement(p.x, p.z);
    const availability = canBuild(world, buildType, placement.x, placement.z, {
      rotation: buildRotation,
      attachTo: placement.attachTo,
    });
    view.setGhost(
      placement.x,
      placement.z,
      buildType,
      availability.ok,
      buildRotation,
      !!placement.attachTo,
    );
    if (placement.attachTo && !down) {
      $("tooltip").innerHTML =
        `<b>Połącz ze ścianą</b><small>${escape(world.entities[placement.attachTo].label)}</small>`;
      $("tooltip").style.cssText =
        `display:block;left:${Math.min(innerWidth - 210, event.clientX + 18)}px;top:${event.clientY - 55}px`;
    }
    if (!availability.ok && !down) {
      $("tooltip").innerHTML =
        `<b>${buildingDefs[buildType].label}</b><small>${escape(availability.message)}</small>`;
      $("tooltip").style.cssText =
        `display:block;left:${Math.min(innerWidth - 210, event.clientX + 18)}px;top:${event.clientY - 55}px`;
    } else if (!placement.attachTo) $("tooltip").style.display = "none";
    canvas.style.cursor = "crosshair";
  } else
    canvas.style.cursor = targetMode ? "crosshair" : p.id ? "pointer" : "grab";
  if (!down) return;
  const dx = event.clientX - down.x,
    dy = event.clientY - down.y;
  if (Math.hypot(dx, dy) > 6) dragged = true;
  if (
    down.button === 1 ||
    (down.button === 2 && dragged) ||
    (down.button === 0 &&
      dragged &&
      !down.selecting &&
      (!buildType || !linearBuild()) &&
      !eraseRoads)
  ) {
    $("mapHint").classList.add("hidden");
    canvas.style.cursor = "grabbing";
    view.pan(event.clientX - lastPointer.x, event.clientY - lastPointer.y);
    lastPointer = { x: event.clientX, y: event.clientY };
  }
  if (
    down.button === 0 &&
    dragged &&
    down.selecting &&
    !buildType &&
    !eraseRoads
  ) {
    const b = $("selectionBox");
    b.style.cssText = `display:block;left:${Math.min(down.x, event.clientX)}px;top:${Math.min(down.y, event.clientY)}px;width:${Math.abs(dx)}px;height:${Math.abs(dy)}px`;
  }
  if (down.button === 0 && dragged && buildType && linearBuild()) {
    if (behavior(buildType) === "bridge") {
      const plan = planBridge(
        world,
        buildType,
        { x: down.worldX, z: down.worldZ },
        p,
      );
      view.setConstructionGhost(
        plan.points.map((point, i) => ({
          ...point,
          id: "span-preview-" + i,
          kind: "building",
          type: buildType!,
          label: "Most",
          faction: "player",
          hp: 1,
          maxHp: 1,
          rotation: plan.rotation,
          open: true,
        })),
        plan.ok,
      );
      $("tooltip").innerHTML =
        `<b>${plan.points.length} odcinków · ${cost(plan.cost)}</b><small>${plan.ok ? "Puść, aby zbudować cały most" : escape(plan.message)}</small>`;
      $("tooltip").style.cssText =
        `display:block;left:${Math.min(innerWidth - 280, event.clientX + 15)}px;top:${Math.max(85, event.clientY - 65)}px`;
      return;
    }
    const count =
      Math.max(
        Math.abs(Math.round(p.x) - Math.round(down.worldX)),
        Math.abs(Math.round(p.z) - Math.round(down.worldZ)),
      ) + 1;
    const c = Object.fromEntries(
      Object.entries(buildingDefs[buildType].cost).map(([k, v]) => [
        k,
        v * count,
      ]),
    );
    $("tooltip").innerHTML = `${count} odcinków · ${cost(c)}`;
    $("tooltip").style.cssText =
      `display:block;left:${event.clientX + 15}px;top:${event.clientY - 45}px`;
  }
});
canvas.addEventListener("pointerup", (event) => {
  if (!down) return;
  const start = down;
  down = undefined;
  $("selectionBox").style.display = "none";
  const p = view.pick(event.clientX, event.clientY);
  if (
    start.button === 1 ||
    (start.button === 2 && dragged) ||
    (start.button === 0 &&
      dragged &&
      !start.selecting &&
      (!buildType || !linearBuild()) &&
      !eraseRoads)
  )
    return;
  if (start.button === 2 && (buildType || eraseRoads)) {
    closePanel("buildPanel");
    return;
  }
  if (start.button === 0 && eraseRoads) {
    const x = Math.round(dragged ? start.worldX : p.x),
      z = Math.round(dragged ? start.worldZ : p.z),
      dx = Math.round(p.x) - x,
      dz = Math.round(p.z) - z,
      n = Math.max(Math.abs(dx), Math.abs(dz));
    let count = 0;
    for (let i = 0; i <= n; i++) {
      const point = {
        x: Math.round(x + (dx * i) / (n || 1)),
        z: Math.round(z + (dz * i) / (n || 1)),
      };
      if (
        canRemoveRoad(world, point.x, point.z).ok &&
        command(world, { type: "removeRoad", ...point }).ok
      )
        count++;
    }
    toast(count ? `Usunięto ścieżki: ${count}` : "Tu nie ma ścieżki", !count);
    renderUI();
    return;
  }
  if (start.button === 0 && buildType) {
    if (dragged && behavior(buildType) === "bridge") {
      issue({
        type: "buildBridge",
        building: buildType,
        x: start.worldX,
        z: start.worldZ,
        endX: p.x,
        endZ: p.z,
      });
      view.setGhost(0, 0);
      $("tooltip").style.display = "none";
      renderUI();
      return;
    }
    let points: { x: number; z: number; attachTo?: string }[] = [
      buildingPlacement(p.x, p.z),
    ];
    if (dragged && linearBuild()) {
      const x = Math.round(start.worldX),
        z = Math.round(start.worldZ),
        dx = Math.round(p.x) - x,
        dz = Math.round(p.z) - z,
        n = Math.max(Math.abs(dx), Math.abs(dz));
      points = Array.from({ length: n + 1 }, (_, i) => ({
        x: Math.round(x + (dx * i) / (n || 1)),
        z: Math.round(z + (dz * i) / (n || 1)),
      }));
    }
    let built = 0;
    for (const point of points) {
      const r = command(world, {
        type: "build",
        building: buildType,
        rotation:
          points.length > 1 && ["wall", "gate"].includes(behavior(buildType))
            ? Math.abs(points.at(-1)!.x - points[0].x) >
              Math.abs(points.at(-1)!.z - points[0].z)
              ? 1
              : 0
            : buildRotation,
        ...point,
      });
      if (r.ok) built++;
      else if (points.length === 1) toast(r.message, true);
    }
    if (built) {
      toast(
        `Zbudowano: ${buildingDefs[buildType].label}${built > 1 ? " × " + built : ""}`,
      );
      audio.tone("ok");
    }
    renderUI();
    return;
  }
  if (start.button === 0 && dragged && start.selecting) {
    const ids = ownUnits()
      .filter((e) => !e.carriedBy)
      .filter((e) => {
        const s = view.screen(e.x, e.z);
        return (
          s.x >= Math.min(start.x, event.clientX) &&
          s.x <= Math.max(start.x, event.clientX) &&
          s.y >= Math.min(start.y, event.clientY) &&
          s.y <= Math.max(start.y, event.clientY)
        );
      })
      .map((e) => e.id);
    select(ids);
    selectionMode = false;
    $("selectGroup").classList.remove("active");
    $("mapHint").textContent = "Przeciągnij mapę · Kółko przybliża";
    return;
  }
  if (targetMode === "moveConstruction" && start.button === 2) {
    targetMode = undefined;
    view.setGhost(0, 0);
    renderSelection();
    return;
  }
  if (targetMode) {
    executeTarget(p);
    return;
  }
  if (start.button === 0) {
    if (!p.id) {
      contextual(p);
      return;
    }
    if (
      world.entities[p.id]?.faction === "enemy" &&
      chosen().some(
        (e) =>
          e.faction === "player" &&
          ["hero", "soldier", "archer"].includes(e.kind),
      )
    ) {
      contextual(p);
      return;
    }
    const selectedArcher = chosen()[0],
      post = world.entities[p.id];
    if (
      selectedArcher?.kind === "archer" &&
      selectedArcher.garrisonId &&
      post &&
      ["wall", "tower"].includes(behavior(post.type))
    ) {
      contextual(p);
      return;
    }
    select(event.shiftKey ? [...new Set([...selected, p.id])] : [p.id]);
    return;
  }
  contextual(p);
});
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    view.zoom(event.deltaY, event.clientX, event.clientY);
  },
  { passive: false },
);
function marker(x: number, z: number) {
  const s = view.screen(x, z);
  const m = $("moveMarker");
  m.style.left = s.x + "px";
  m.style.top = s.y + "px";
  m.classList.remove("ping");
  void m.offsetWidth;
  m.classList.add("ping");
}
function executeTarget(p: { id?: string; x: number; z: number }) {
  const mode = targetMode!;
  if (mode === "moveConstruction") {
    const r = issue({
      type: "moveConstruction",
      actorId: chosen()[0]?.id,
      x: Math.round(p.x),
      z: Math.round(p.z),
      rotation: constructionTurns,
    });
    if (r.ok) {
      targetMode = undefined;
      view.setGhost(0, 0);
      renderSelection();
    }
    return;
  }
  targetMode = undefined;
  if (mode === "connect")
    issue({ type: "connect", actorId: chosen()[0]?.id, targetId: p.id });
  else if (mode === "assign")
    issue({ type: "assign", workerId: chosen()[0]?.id, buildingId: p.id });
  else if (mode === "garrison")
    issue({ type: "garrison", actorId: chosen()[0]?.id, targetId: p.id });
  else {
    issue({
      type: mode,
      ids: selected,
      targetId: ["move", "plant", "patrol"].includes(mode) ? undefined : p.id,
      x: Math.round(p.x),
      z: Math.round(p.z),
    });
    marker(p.x, p.z);
  }
}
function contextual(p: { id?: string; x: number; z: number }) {
  if (chosen()[0]?.kind === "hero" && chosen()[0].carriedBy)
    select([chosen()[0].carriedBy!]);
  const t = p.id ? world.entities[p.id] : undefined,
    units = chosen().filter(
      (e) =>
        e.faction === "player" &&
        ["hero", "worker", "soldier", "archer", "boat"].includes(e.kind),
    ),
    h = hero();
  if (!units.length) {
    if (
      t &&
      ["gate", "bridge"].includes(behavior(t.type)) &&
      !buildingDefs[t.type]?.fixed
    ) {
      issue({ type: "toggle", targetId: t.id });
      return;
    }
    const remembered = activeUnits.filter(
      (id) => world.entities[id] && world.entities[id].faction === "player",
    );
    if (remembered.length) select(remembered);
    else if (h) select([h.carriedBy || h.id]);
  }
  if (t?.faction === "enemy") {
    if (chosen().every((e) => e.kind === "boat")) {
      toast("Łódź nie jest uzbrojona", true);
      return;
    }
    const fighters = chosen().filter((e) =>
      ["hero", "soldier", "archer"].includes(e.kind),
    );
    if (!fighters.length) {
      select([t.id]);
      return;
    }
    issue({ type: "attack", ids: fighters.map((e) => e.id), targetId: t.id });
    return;
  }
  if (t && ["tree", "rock"].includes(t.kind)) {
    issue({ type: "gather", ids: selected, targetId: t.id });
    return;
  }
  if (t?.kind === "horse" && selected.includes(h?.id || "")) {
    issue({ type: "mount", actorId: h?.id, targetId: t.id });
    return;
  }
  if (t?.kind === "boat" && selected.includes(h?.id || "")) {
    const r = issue({ type: "board", actorId: h?.id, targetId: t.id });
    if (r.ok) select([t.id]);
    return;
  }
  if (
    t &&
    ["tower", "wall"].includes(behavior(t.type)) &&
    chosen()[0]?.kind === "archer"
  ) {
    issue({ type: "garrison", actorId: chosen()[0].id, targetId: t.id });
    return;
  }
  if (t?.kind === "ruin" && selected.includes(h?.id || "")) {
    issue({ type: "rebuild", actorId: h?.id, targetId: t.id });
    return;
  }
  if (
    t &&
    ["gate", "bridge"].includes(behavior(t.type)) &&
    !buildingDefs[t.type]?.fixed
  ) {
    issue({ type: "toggle", targetId: t.id });
    return;
  }
  issue(
    { type: "move", ids: selected, x: Math.round(p.x), z: Math.round(p.z) },
    true,
  );
  marker(p.x, p.z);
}
let lastHover: string | undefined,
  hoverPos = { x: 0, y: 0 };
function hover() {
  if (buildType || eraseRoads || targetMode === "moveConstruction") return;
  const e = lastHover ? world.entities[lastHover] : undefined;
  if (!e || down || !playing) {
    if (!down) $("tooltip").style.display = "none";
    return;
  }
  const tip = $("tooltip");
  tip.innerHTML = `<b>${escape(e.label)}</b><small>${escape(status(e))}</small>`;
  tip.style.cssText = `display:block;left:${Math.min(innerWidth - 210, hoverPos.x + 18)}px;top:${Math.max(80, hoverPos.y - 62)}px`;
}
const keys = new Set<string>();
window.addEventListener("keydown", (event) => {
  if (!playing || (event.target as HTMLElement).matches("input,textarea"))
    return;
  keys.add(event.key.toLowerCase());
  if (event.code === "Space") event.preventDefault();
  if (event.key.toLowerCase() === "r" && buildType && !event.repeat) {
    buildRotation = (buildRotation + 1) % 4;
    renderBuildMode();
    view.rotateGhost(buildRotation);
  }
  if (
    event.key.toLowerCase() === "r" &&
    targetMode === "moveConstruction" &&
    !event.repeat
  ) {
    constructionTurns = (constructionTurns + 1) % 4;
    showConstructionPreview(constructionPoint.x, constructionPoint.z);
    renderSelection();
  }
  if (event.key === "Escape") {
    eraseRoads = false;
    buildType = undefined;
    targetMode = undefined;
    selectionMode = false;
    $("selectGroup").classList.remove("active");
    view.setGhost(0, 0);
    closePanel("buildPanel");
    closePanel("book");
    $("modal").classList.add("hidden");
    renderSelection();
  }
  if (event.key.toLowerCase() === "b" && !event.repeat) $("build").click();
  if (event.key === "Home") $("heroFocus").click();
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => {
  keys.clear();
});
let prev = performance.now(),
  accumulator = 0,
  frames = 0;
const metrics: { fps: number; entities: number; simulationMs: number }[] = [];
function frame(now: number) {
  const dt = Math.min((now - prev) / 1000, 0.25);
  prev = now;
  const simStart = performance.now();
  if (playing) step(world, dt);
  if (qa === "village" && finishTestRaid(world))
    toast("Najazd ćwiczebny odparty");
  $("scene").dataset.worldTime = world.time.toFixed(1);
  $("scene").dataset.camera =
    `${view.target.x.toFixed(2)},${view.target.z.toFixed(2)}`;
  const simMs = performance.now() - simStart;
  if (playing) {
    if (keys.has("w") || keys.has("arrowup")) view.pan(0, dt * 450);
    if (keys.has("s") || keys.has("arrowdown")) view.pan(0, -dt * 450);
    if (keys.has("a") || keys.has("arrowleft")) view.pan(dt * 450, 0);
    if (keys.has("d") || keys.has("arrowright")) view.pan(-dt * 450, 0);
  }
  view.update(world as unknown as VisualWorld, selected, now / 1000);
  if (playing)
    audio.updateSiege(world, {
      x: view.target.x,
      z: view.target.z,
      zoom: view.zoomLevel,
    });
  audio.updateWagons(world, {
    x: view.target.x,
    z: view.target.z,
    zoom: view.zoomLevel,
  });
  updateWorldLabels();
  if (now - lastUI > 350) {
    lastUI = now;
    renderUI();
    hover();
  }
  if (
    playing &&
    now - lastSave > 30000 &&
    !world.defeated &&
    (!qa || qa === "village")
  ) {
    lastSave = now;
    void saveWorld(world).catch(() => {});
  }
  accumulator += dt;
  frames++;
  if (accumulator >= 1) {
    metrics.push({
      fps: view.fps,
      entities: getEntities(world).length,
      simulationMs: simMs,
    });
    if (metrics.length > 120) metrics.shift();
    if (qa === "stress")
      $("diagnostics").textContent =
        `${view.fps} FPS · ${getEntities(world).filter((e) => ["hero", "soldier", "archer", "enemy"].includes(e.kind)).length} jednostek · symulacja ${simMs.toFixed(2)} ms · ${world.time.toFixed(1)} s · ${world.defeated ? "KONIEC" : "DZIAŁA"}`;
    accumulator = 0;
    frames = 0;
  }
  requestAnimationFrame(frame);
}
const worldLabels = new Map<string, HTMLButtonElement>();
function updateWorldLabels() {
  for (const [id, b] of worldLabels)
    if (!world.entities[id]) {
      b.remove();
      worldLabels.delete(id);
    }
  if (!playing) return;
  for (const e of getEntities(world)) {
    const important =
      e.kind === "merchant" ||
      ["hero", "horse", "dog", "boat", "town", "ruin"].includes(e.kind) ||
      e.type === "gate" ||
      (e.type === "bridge" && e.x === 32);
    const chosenEntity = selected.includes(e.id);
    if (!important && !chosenEntity) continue;
    let b = worldLabels.get(e.id);
    if (!b) {
      b = document.createElement("button");
      b.className = "worldLabel";
      b.dataset.entity = e.id;
      b.setAttribute("aria-label", e.label);
      const entityId = e.id;
      b.onclick = () => {
        const current = world.entities[entityId];
        if (!current) return;
        if (targetMode)
          executeTarget({ id: current.id, x: current.x, z: current.z });
        else select([current.id]);
      };
      $("worldLabels").append(b);
      worldLabels.set(e.id, b);
    }
    const p = view.screen(
      e.x,
      e.z,
      e.kind === "town"
        ? 3.5
        : e.kind === "building"
          ? 2.6
          : e.kind === "horse"
            ? 1.8
            : 1.7,
    );
    b.setAttribute("aria-label", e.label);
    b.style.left = p.x + "px";
    b.style.top = p.y + "px";
    b.classList.toggle("selected", chosenEntity);
    b.classList.toggle("enemy", e.faction === "enemy");
    b.hidden =
      (!important && !chosenEntity) ||
      p.x < 10 ||
      p.x > innerWidth - 10 ||
      p.y < 100 ||
      p.y > innerHeight - 215;
    const label = `<span>${iconFor(e.type) || icons[e.kind] || "◆"}</span>${e.kind === "town" || e.kind === "merchant" || chosenEntity ? `<small>${escape(e.label)}</small>` : ""}`;
    if (b.innerHTML !== label) b.innerHTML = label;
    if (e.hp < e.maxHp)
      b.style.setProperty("--hp", Math.max(0, e.hp / e.maxHp) * 100 + "%");
  }
  for (const [id, b] of worldLabels) {
    const e = world.entities[id];
    if (
      e &&
      !["hero", "horse", "dog", "boat", "town", "ruin"].includes(e.kind) &&
      e.kind !== "merchant" &&
      e.type !== "gate" &&
      !(e.type === "bridge" && e.x === 32) &&
      !selected.includes(id)
    )
      b.hidden = true;
  }
}
if (qa === "stress") view.focus(21, 43);
if (qa === "village") {
  $("locationName").textContent = "Osada testowa";
  $("home").title = "Osada testowa · osobny zapis";
  document.title = "Zielona Dolina II — Osada testowa";
  view.zoomLevel = 32;
  view.resize();
  view.focus(19, 31);
  enter(false);
}
if (recovered?.playing) {
  view.zoomLevel = recovered.camera.zoom;
  view.focus(recovered.camera.x, recovered.camera.z);
  enter(false);
}
if (import.meta.env.DEV && !recovered && hasPendingSession(sessionKey) && !qa) {
  $<HTMLButtonElement>("start").disabled = true;
  loadWorld()
    .then((saved) => {
      if (saved) {
        world = saved;
        selected = [getEntities(world).find((e) => e.kind === "hero")!.id];
        enter(false);
        toast("Przywrócono ostatni zapis po aktualizacji");
      } else toast("Kopia sesji wymaga odzyskania. Zachowano dane.", true);
    })
    .catch(() =>
      toast("Nie udało się odczytać zapisu. Zachowano kopię sesji.", true),
    )
    .finally(() => {
      $<HTMLButtonElement>("start").disabled = false;
    });
}
if (import.meta.hot)
  import.meta.hot.on("vite:beforeFullReload", () =>
    retainSession(sessionKey, {
      world,
      selected,
      playing,
      camera: { x: view.target.x, z: view.target.z, zoom: view.zoomLevel },
    }),
  );
requestAnimationFrame(frame);
// Read-only diagnostics for browser QA; mutations stay behind normal game commands.
Object.defineProperty(window, "valley", {
  get: () => ({
    state: structuredClone(world),
    metrics: structuredClone(metrics),
    camera: { x: view.target.x, z: view.target.z, zoom: view.zoomLevel },
  }),
});
