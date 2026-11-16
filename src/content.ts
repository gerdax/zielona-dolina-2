export interface Resources {
  wood: number;
  stone: number;
  food: number;
  gold: number;
  iron: number;
}
export interface BuildingDef {
  label: string;
  category?: "osada" | "produkcja" | "obrona" | "drogi" | "ozdoby";
  icon?: string;
  behavior?: string;
  material?: "wood" | "stone";
  fixed?: boolean;
  passable?: boolean;
  lightRadius?: number;
  consumes?: Partial<Resources>;
  cost: Partial<Resources>;
  hp: number;
  description: string;
  production?: Partial<Resources>;
  interval?: number;
  worker?: boolean;
  capacity?: number;
}
export const buildingDefs: Record<string, BuildingDef> = {
  waterGate: {
    label: "Brama wodna",
    cost: { wood: 35, stone: 45, iron: 8 },
    hp: 280,
    description:
      "Krata na wodzie. Tryb automatyczny przepuszcza własne łodzie i zatrzymuje wrogie.",
    material: "stone",
    category: "obrona",
    icon: "⚓",
  },
  wallStairs: {
    label: "Schody na mury",
    cost: { wood: 20, stone: 15 },
    hp: 150,
    description:
      "Szybsze wejście na sąsiedni mur lub wieżę. Łucznicy korzystają z najbliższych schodów.",
    passable: true,
    category: "obrona",
    icon: "▤",
  },
  shipyard: {
    label: "Stocznia",
    cost: { wood: 90, stone: 35, iron: 10 },
    hp: 250,
    description:
      "Buduje łodzie i transportowce dla bohatera oraz trzech pasażerów. Pracownik naprawia łodzie w pobliżu.",
    worker: true,
    category: "drogi",
    icon: "⚓",
  },
  merchantPost: {
    label: "Posterunek kupiecki",
    cost: { wood: 60, stone: 25, gold: 30 },
    hp: 220,
    description:
      "Zatrudnia kupców i obsługuje stałe trasy. Chroni odpoczywające karawany i skraca postój między kursami.",
    behavior: "market",
    category: "osada",
    icon: "⚖",
  },
  repairWorkshop: {
    label: "Warsztat naprawczy",
    cost: { wood: 65, stone: 35, iron: 5 },
    hp: 200,
    description:
      "Pracownik naprawia umocnienia w promieniu 6 pól. Co 4 s zużywa 2 drewna i 1 kamień, przywracając 20 wytrzymałości.",
    worker: true,
    category: "produkcja",
    icon: "⚒",
  },
  signalTower: {
    label: "Wieża sygnałowa",
    cost: { wood: 45, stone: 45 },
    hp: 230,
    description:
      "Ostrzega o najazdach 3 minuty wcześniej i wskazuje kierunek. Wykrywa pobliskich wrogów.",
    category: "obrona",
    icon: "⚑",
  },
  warehouse: {
    label: "Magazyn",
    cost: { wood: 35, stone: 10 },
    hp: 160,
    description: "Zwiększa bezpieczny limit zapasów o 300.",
  },
  forge: {
    label: "Kuźnia",
    cost: { wood: 60, stone: 35 },
    hp: 180,
    description: "Ulepsz uzbrojenie całej armii za 20 żelaza i 30 monet.",
  },
  house: {
    label: "Dom",
    cost: { wood: 30, stone: 5 },
    hp: 120,
    description: "Miejsce dla dwóch nowych pracowników.",
    capacity: 2,
  },
  lumber: {
    label: "Chata drwala",
    cost: { wood: 35, stone: 5 },
    hp: 100,
    description: "Pracownik pozyskuje 5 drewna co 8 sekund.",
    production: { wood: 5 },
    interval: 8,
    worker: true,
  },
  quarry: {
    label: "Kamieniołom",
    cost: { wood: 40 },
    hp: 140,
    description: "Pracownik wydobywa 4 kamienia co 10 sekund.",
    production: { stone: 4 },
    interval: 10,
    worker: true,
  },
  farm: {
    label: "Gospodarstwo",
    cost: { wood: 30, stone: 5 },
    hp: 100,
    description: "Pracownik produkuje 6 żywności co 10 sekund.",
    production: { food: 6 },
    interval: 10,
    worker: true,
  },
  mine: {
    label: "Kopalnia żelaza",
    cost: { wood: 50, stone: 25 },
    hp: 150,
    description: "Pracownik wydobywa 3 żelaza co 12 sekund.",
    production: { iron: 3 },
    interval: 12,
    worker: true,
  },
  barracks: {
    label: "Koszary",
    cost: { wood: 65, stone: 20 },
    hp: 220,
    description: "Szkolenie piechoty i łuczników.",
  },
  market: {
    label: "Targ",
    cost: { wood: 45, stone: 15 },
    hp: 140,
    description: "Wysyłaj rzeczywiste karawany do Brzeźnicy.",
  },
  tower: {
    label: "Wieża",
    cost: { wood: 45, stone: 35 },
    hp: 250,
    description: "Ostrzeliwuje wrogów w zasięgu 7 pól; mieści łucznika.",
  },
  wall: {
    label: "Mur",
    cost: { stone: 8 },
    hp: 200,
    description: "Blokuje przejście. Stanowisko dla łucznika.",
  },
  gate: {
    label: "Brama",
    cost: { wood: 15, stone: 10 },
    hp: 200,
    description: "Otwierana brama. Zamknięta blokuje wszystkich.",
  },
  bridge: {
    label: "Most zwodzony",
    cost: { wood: 35, stone: 15 },
    hp: 220,
    description: "Segment przeprawy przez rzekę; można go podnieść.",
  },
  dock: {
    label: "Przystań",
    cost: { wood: 45, stone: 15 },
    hp: 140,
    description: "Przy brzegu buduje łódź dla bohatera.",
  },
  road: {
    label: "Droga",
    cost: { stone: 1 },
    hp: 50,
    description: "Przejezdna droga przyspiesza ruch.",
  },
  hospital: {
    label: "Szpital",
    cost: { wood: 50, stone: 25 },
    hp: 160,
    description: "Pracownik leczy pobliskie własne jednostki.",
    worker: true,
  },
  bastion: {
    label: "Bastion narożny",
    cost: { stone: 100, wood: 25 },
    hp: 480,
    behavior: "tower",
    material: "stone",
    category: "obrona",
    icon: "♜",
    description:
      "Łączy mury i mieści trzech łuczników. Kamienna platforma obronna.",
  },
  ballistaTower: {
    label: "Wieża balistyczna",
    cost: { stone: 80, wood: 70, iron: 20 },
    hp: 300,
    behavior: "tower",
    material: "stone",
    category: "obrona",
    icon: "➶",
    description:
      "Balista strzela co 3 s na 10 pól. 45 obrażeń, podwójne przeciw machinom.",
  },
  spikePit: {
    label: "Wilcze doły",
    cost: { wood: 20, stone: 5 },
    hp: 80,
    passable: true,
    category: "obrona",
    icon: "▾",
    description:
      "Ranią wrogów (5 życia/s) i spowalniają o 65%. Swoi przechodzą bezpiecznie.",
  },
  chevaux: {
    label: "Kozły obronne",
    cost: { wood: 25 },
    hp: 120,
    passable: true,
    material: "wood",
    category: "obrona",
    icon: "╳",
    description:
      "Spowalniają wrogów o 50%, konnicę i tarany o 80%. Tarany i konnica tracą 8 życia/s.",
  },
  fortifiedGate: {
    label: "Brama warowna",
    cost: { stone: 120, wood: 50, iron: 15 },
    hp: 600,
    behavior: "gate",
    material: "stone",
    category: "obrona",
    icon: "Π",
    description:
      "Dwie baszty i opuszczana krata. Automatycznie wpuszcza swoich; zamknięta blokuje wrogów.",
  },
  rallyPoint: {
    label: "Punkt zbiórki",
    cost: { wood: 20, stone: 10 },
    hp: 100,
    passable: true,
    category: "obrona",
    icon: "⚑",
    description:
      "Przypisz wolne wojsko. Podczas alarmu łucznicy zajmują pobliskie stanowiska, reszta zbiera się przy sztandarze.",
  },
  fortressArmory: {
    label: "Zbrojownia forteczna",
    cost: { stone: 60, wood: 50, iron: 15 },
    hp: 260,
    category: "obrona",
    icon: "⚒",
    description:
      "Do 6 pól: obrońcy otrzymują 15% mniej obrażeń i odzyskują 2 życia/s po 6 s bez trafienia. Premia nie kumuluje się.",
  },
  firehouse: {
    label: "Remiza strażacka",
    cost: { wood: 60, stone: 35, iron: 5 },
    hp: 220,
    worker: true,
    description:
      "Przydziel strażaka. Gasi pożary do 10 pól; studnia do 6 pól od remizy podwaja tempo gaszenia.",
    category: "osada",
    icon: "♨",
  },
  inn: {
    label: "Zajazd",
    cost: { wood: 70, stone: 25, gold: 20 },
    hp: 200,
    description:
      "Leczy podróżnych do 5 pól (2 życia/s). Co 90 s: dostarcz 30 żywności za 25 monet.",
    category: "osada",
    icon: "♜",
  },
  granary: {
    label: "Spichlerz",
    cost: { wood: 55, stone: 20 },
    hp: 180,
    description:
      "Miejsce na dodatkowe 500 żywności. Kilka spichlerzy sumuje pojemność.",
    category: "produkcja",
    icon: "▤",
  },
  stable: {
    label: "Stajnia",
    cost: { wood: 45, food: 20 },
    hp: 150,
    description:
      "Pierwszy koń w cenie budowy. Kupuje kolejne za 25 monet i 20 żywności; leczy konie do 5 pól.",
  },
  castle: {
    label: "Dwór",
    cost: { wood: 110, stone: 90, gold: 60 },
    hp: 500,
    description: "Ośrodek odbudowanego królestwa; warunek zwycięstwa.",
  },
};
// The complete construction catalog retains the original game's building families.
Object.assign(buildingDefs, {
  well: {
    label: "Studnia",
    cost: { wood: 20, stone: 15 },
    hp: 100,
    description: "Nawadnia pola i gospodarstwa do 5 pól: +50% plonów.",
    category: "produkcja",
    icon: "◉",
  },
  field: {
    label: "Pole",
    cost: { wood: 10 },
    hp: 60,
    description: "Rolnik zbiera 3 żywności co 10 s; studnia zwiększa plony.",
    production: { food: 3 },
    interval: 10,
    worker: true,
    passable: true,
    category: "produkcja",
    icon: "❧",
  },
  mill: {
    label: "Młyn",
    cost: { wood: 60, stone: 20 },
    hp: 140,
    description:
      "Przy wodzie. Młynarz daje 6 żywności co 12 s; pobliskie pole podwaja produkcję. Pracujący młyn zwiększa plony pól i gospodarstw do 5 pól o 25%.",
    production: { food: 6 },
    interval: 12,
    worker: true,
    category: "produkcja",
    icon: "⚙",
  },
  livestock: {
    label: "Hodowla",
    cost: { wood: 40, stone: 5 },
    hp: 120,
    description: "Hodowca daje 5 żywności co 10 s.",
    production: { food: 5 },
    interval: 10,
    worker: true,
    category: "produkcja",
    icon: "♧",
  },
  forester: {
    label: "Leśniczówka",
    cost: { wood: 40, stone: 10 },
    hp: 120,
    description:
      "Leśnik sadzi co 12 s prawdziwą sadzonkę w promieniu 5 pól. Drzewo rośnie 60 s.",
    worker: true,
    interval: 12,
    category: "produkcja",
    icon: "♧",
  },
  goldMine: {
    label: "Kopalnia złota",
    cost: { wood: 80, stone: 30 },
    hp: 160,
    description: "Górnik wydobywa i przetapia złoto: 4 monety co 12 s pracy.",
    production: { gold: 4 },
    interval: 12,
    worker: true,
    category: "produkcja",
    icon: "✦",
  },
  tradingPost: {
    label: "Skład handlowy",
    cost: { wood: 70, stone: 15 },
    hp: 140,
    description: "Kupiec wymienia 5 drewna na 3 monety co 12 s pracy.",
    production: { gold: 3 },
    consumes: { wood: 5 },
    interval: 12,
    worker: true,
    category: "osada",
    icon: "⚖",
  },
  siegeWorkshop: {
    label: "Warsztat oblężniczy",
    cost: { wood: 100, stone: 40 },
    hp: 200,
    description:
      "Buduje rzeczywiste tarany i katapulty; użyj rozkazu budowy machiny.",
    category: "obrona",
    icon: "⚙",
  },
  recruitOffice: {
    label: "Biuro werbunkowe",
    cost: { wood: 80, stone: 25 },
    hp: 160,
    description:
      "Pozwala szkolić piechotę, łuczników i tarczowników; koszary szkolą szybciej.",
    behavior: "barracks",
    category: "obrona",
    icon: "⚔",
  },
  armory: {
    label: "Zbrojownia",
    cost: { wood: 50, stone: 40 },
    hp: 180,
    description:
      "Pancerze zmniejszają obrażenia własnego wojska o 20%; bonus nie sumuje się.",
    category: "obrona",
    icon: "⬟",
  },
  palisade: {
    label: "Drewniana palisada",
    cost: { wood: 5 },
    hp: 65,
    description:
      "Tania drewniana zapora. Blokuje ruch, można zastąpić ją bramą.",
    behavior: "wall",
    material: "wood",
    category: "obrona",
    icon: "▥",
  },
  stoneRampart: {
    label: "Kamienny wał",
    cost: { stone: 8 },
    hp: 200,
    description:
      "Kamienny mur o szerokości palisady. Zachowuje połączenia po ulepszeniu.",
    behavior: "wall",
    material: "stone",
    category: "obrona",
    icon: "▥",
  },
  woodGate: {
    label: "Drewniana brama",
    cost: { wood: 15 },
    hp: 90,
    description: "Ręczna brama z drewna; otwarcie przepuszcza obie strony.",
    behavior: "gate",
    material: "wood",
    category: "obrona",
    icon: "Π",
  },
  friendlyGate: {
    label: "Brama dla swoich",
    cost: { wood: 20, stone: 5 },
    hp: 120,
    description: "Automatycznie przepuszcza własnych i zatrzymuje wrogów.",
    behavior: "gate",
    material: "wood",
    category: "obrona",
    icon: "Π",
  },
  stoneTower: {
    label: "Kamienna wieża",
    cost: { wood: 30, stone: 60 },
    hp: 350,
    description:
      "Wzmocniona wieża strzela na 8 pól, za 22 obrażenia. Mieści łucznika.",
    behavior: "tower",
    material: "stone",
    category: "obrona",
    icon: "♜",
  },
  fixedBridge: {
    label: "Most stały",
    cost: { wood: 30, stone: 15 },
    hp: 180,
    description:
      "Drewniana stała przeprawa. Przepuszcza pieszych, blokuje łodzie.",
    behavior: "bridge",
    fixed: true,
    material: "wood",
    category: "drogi",
    icon: "╬",
  },
  stoneBridge: {
    label: "Kamienny most",
    cost: { wood: 10, stone: 30 },
    hp: 300,
    description: "Mocna stała przeprawa. Przepuszcza pieszych, blokuje łodzie.",
    behavior: "bridge",
    fixed: true,
    material: "stone",
    category: "drogi",
    icon: "╬",
  },
  pier: {
    label: "Pomost",
    cost: { wood: 10 },
    hp: 90,
    description:
      "Odcinek przejścia i cumowania nad wodą. Piesi mogą wejść na pomost.",
    behavior: "bridge",
    fixed: true,
    material: "wood",
    category: "drogi",
    icon: "⚓",
  },
  stoneRoad: {
    label: "Kamienna droga",
    cost: { stone: 3 },
    hp: 100,
    description:
      "Ruch po kamiennej drodze szybszy o 80%. Można ulepszyć zwykłą drogę.",
    behavior: "road",
    material: "stone",
    passable: true,
    category: "drogi",
    icon: "⋯",
  },
  trench: {
    label: "Wykop / fosa",
    cost: { stone: 4 },
    hp: 100,
    description:
      "Blokuje pieszych. Po połączeniu z rzeką zalewa się wodą. Można przykryć mostem.",
    category: "drogi",
    icon: "⛏",
  },
  ravine: {
    label: "Wąwóz",
    cost: { stone: 5 },
    hp: 100,
    description:
      "Głęboki przekop blokuje pieszych. Zbuduj nad nim most, aby połączyć brzegi.",
    behavior: "trench",
    category: "drogi",
    icon: "⛏",
  },
  canal: {
    label: "Kanał",
    cost: { stone: 6 },
    hp: 100,
    description:
      "Połączenie z wodą zalewa kanał. Most nad kanałem umożliwia przejście pieszych.",
    category: "drogi",
    icon: "≈",
  },
  camelYard: {
    label: "Zagroda wielbłądów",
    cost: { wood: 45, stone: 15 },
    hp: 150,
    description:
      "Hoduje wielbłąda co 60 s za 10 żywności, do 3 sztuk. Bohater może go dosiąść także w dolinie.",
    category: "produkcja",
    icon: "♞",
  },
  lantern: {
    label: "Latarnia",
    cost: { wood: 12, stone: 5 },
    hp: 70,
    description: "Oświetla otoczenie w promieniu 4 pól.",
    lightRadius: 4,
    passable: true,
    category: "ozdoby",
    icon: "☀",
  },
  torch: {
    label: "Pochodnia",
    cost: { wood: 4 },
    hp: 35,
    description: "Oświetla otoczenie w promieniu 2,5 pola.",
    lightRadius: 2.5,
    passable: true,
    category: "ozdoby",
    icon: "♨",
  },
  campfire: {
    label: "Ognisko",
    cost: { wood: 8, stone: 2 },
    hp: 50,
    description: "Dekoracyjne ognisko i światło przy obozowisku.",
    lightRadius: 2,
    passable: true,
    category: "ozdoby",
    icon: "♨",
  },
  bench: {
    label: "Ławka",
    cost: { wood: 6 },
    hp: 50,
    description: "Dekoracyjna ławka w osadzie; nie blokuje przejścia.",
    passable: true,
    category: "ozdoby",
    icon: "▰",
  },
  signpost: {
    label: "Drogowskaz",
    cost: { wood: 5 },
    hp: 50,
    description: "Widoczny punkt orientacyjny przy drodze.",
    passable: true,
    category: "ozdoby",
    icon: "➜",
  },
  banner: {
    label: "Chorągiew",
    cost: { wood: 8 },
    hp: 50,
    description: "Dekoracyjna chorągiew królestwa.",
    passable: true,
    category: "ozdoby",
    icon: "⚑",
  },
  keep: {
    label: "Zamek",
    cost: { wood: 160, stone: 180, gold: 100 },
    hp: 900,
    description:
      "Kamienna siedziba królestwa, 900 zdrowia i +300 pojemności magazynowej. Spełnia cel budowy dworu.",
    behavior: "castle",
    material: "stone",
    category: "osada",
    icon: "♜",
  },
} satisfies Record<string, BuildingDef>);
for (const [type, def] of Object.entries(buildingDefs)) {
  def.category ??= [
    "lumber",
    "quarry",
    "farm",
    "mine",
    "forge",
    "stable",
  ].includes(type)
    ? "produkcja"
    : ["barracks", "wall", "gate", "tower"].includes(type)
      ? "obrona"
      : ["road", "bridge", "dock"].includes(type)
        ? "drogi"
        : "osada";
  def.icon ??=
    (
      {
        house: "⌂",
        warehouse: "▣",
        market: "⚖",
        hospital: "✚",
        castle: "♜",
        lumber: "♧",
        quarry: "◆",
        farm: "❧",
        mine: "⛏",
        forge: "⚒",
        stable: "♞",
        barracks: "⚔",
        wall: "▥",
        gate: "Π",
        tower: "♜",
        road: "⋯",
        bridge: "╬",
        dock: "⚓",
      } as Record<string, string>
    )[type] || "◆";
}
buildingDefs.dock.label = "Port rzeczny";
buildingDefs.tower.material = "wood";
buildingDefs.tower.label = "Drewniana wieża";
buildingDefs.wall.material = "stone";
buildingDefs.gate.material = "stone";
buildingDefs.wall.label = "Kamienny mur";
buildingDefs.gate.label = "Kamienna brama";
buildingDefs.barracks.description =
  "Szkolenie wojska w 7,5 s; pobliscy żołnierze odzyskują zdrowie po walce.";
export const engineCosts = {
  ram: { wood: 60, stone: 10, gold: 20 },
  catapult: { wood: 100, stone: 35, gold: 40 },
};
export const unitCosts = {
  shieldbearer: { wood: 15, food: 25, gold: 15 },
  soldier: { wood: 10, food: 20, gold: 5 },
  archer: { wood: 20, food: 15, gold: 10 },
};
export const futureScope = [
  "Kampania pustynna i orkowie",
  "Kawaleria oddziałowa",
  "Rozbudowana flota i abordaż",
  "Kolonie wyspiarskie",
  "Wojny i mediacja między wieloma sąsiadami",
  "Pory roku i zimowe zaopatrzenie",
  "Ekwipunek i awanse bohaterów",
];

export const boatCosts = {
  boat: { wood: 45, gold: 10 },
  transportBoat: { wood: 80, iron: 10, gold: 25 },
} satisfies Record<string, Partial<Resources>>;
