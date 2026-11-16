import * as T from "three";
const mats = new Map<string, T.MeshStandardMaterial>();
function material(color: string) {
  if (!mats.has(color))
    mats.set(color, new T.MeshStandardMaterial({ color, roughness: 0.95 }));
  return mats.get(color)!;
}
function box(
  g: T.Object3D,
  c: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), material(c));
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}
function cyl(
  g: T.Object3D,
  c: string,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
) {
  const m = new T.Mesh(new T.CylinderGeometry(r, r, h, 8), material(c));
  m.position.set(x, y, z);
  m.castShadow = true;
  g.add(m);
  return m;
}
function roof(
  g: T.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  c: string,
) {
  for (const side of [-1, 1]) {
    const m = box(g, c, x + side * w * 0.23, y, z, w * 0.6, 0.07, d);
    m.rotation.z = -side * 0.5;
  }
  box(g, "#493e2d", x, y + w * 0.13, z, 0.065, 0.065, d + 0.08);
}
export function expansionModel(type: string): T.Group | undefined {
  if (
    ![
      "firehouse",
      "inn",
      "granary",
      "stable",
      "waterGate",
      "wallStairs",
      "shipyard",
      "merchantPost",
      "repairWorkshop",
      "signalTower",
    ].includes(type)
  )
    return;
  const g = new T.Group(),
    wood = "#9c7446",
    dark = "#514431",
    stone = "#a5ab96",
    teal = "#426e70";
  if (type === "firehouse") {
    box(g, stone, 0, 0.12, 0, 1.9, 0.24, 1.8);
    box(g, "#c8b58b", 0, 0.9, 0, 1.7, 1.6, 1.5);
    roof(g, 0, 1.85, 0, 2.1, 1.9, "#98523c");
    box(g, dark, 0, 0.66, 0.77, 1.1, 1.15, 0.04);
    for (const x of [-0.56, 0.56]) box(g, wood, x, 0.66, 0.83, 0.13, 1.2, 0.1);
    box(g, wood, 0, 1.25, 0.83, 1.25, 0.12, 0.1);
    // Bucket cart waiting in the open bay.
    box(g, wood, 0, 0.36, 0.96, 0.75, 0.12, 0.65);
    for (const x of [-0.43, 0.43]) {
      const wheel = cyl(g, dark, x, 0.24, 0.98, 0.22, 0.08);
      wheel.rotation.z = Math.PI / 2;
    }
    for (const x of [-0.21, 0.21]) {
      cyl(g, wood, x, 0.57, 0.95, 0.16, 0.32);
      cyl(g, "#6eaaa5", x, 0.74, 0.95, 0.12, 0.02);
    }
    for (const x of [-0.25, 0.25])
      box(g, wood, x, 0.39, 1.65, 0.05, 0.05, 0.75);
    box(g, stone, -0.58, 2.05, -0.4, 0.4, 0.65, 0.4);
    for (const x of [-0.8, -0.36]) box(g, dark, x, 2.48, -0.4, 0.06, 0.6, 0.06);
    roof(g, -0.58, 2.84, -0.4, 0.7, 0.7, "#98523c");
    cyl(g, "#d5b367", -0.58, 2.53, -0.4, 0.15, 0.2);
    for (let i = 0; i < 7; i++)
      box(g, wood, 0.9, 0.2 + i * 0.23, -0.5, 0.08, 0.04, 0.45);
    for (const z of [-0.76, -0.24]) box(g, dark, 0.9, 0.9, z, 0.06, 1.8, 0.06);
    return g;
  }
  if (["inn", "granary", "stable"].includes(type)) {
    box(g, stone, 0, 0.07, 0, 1.9, 0.14, 1.7);
    if (type === "stable") {
      box(g, "#c7b78a", 0, 0.8, -0.65, 1.7, 1.4, 0.12);
      for (const x of [-0.8, 0, 0.8])
        box(g, dark, x, 0.77, 0.48, 0.12, 1.5, 0.12);
      roof(g, 0, 1.6, -0.05, 2, 1.8, teal);
      for (const x of [-0.4, 0.4]) {
        box(g, wood, x, 0.46, 0.52, 0.65, 0.66, 0.08);
        box(g, "#c6b468", x, 0.45, 0.12, 0.45, 0.22, 0.5);
      }
      // Horseshoe sign above the two open stalls.
      const shoe = new T.Mesh(
        new T.TorusGeometry(0.16, 0.035, 4, 10, Math.PI * 1.6),
        material("#d4bc74"),
      );
      shoe.position.set(0, 1.26, 0.6);
      shoe.rotation.z = Math.PI * 0.7;
      g.add(shoe);
      box(g, wood, 1.05, 0.33, 0.3, 0.4, 0.55, 0.6);
      box(g, "#587b78", 1.05, 0.62, 0.3, 0.32, 0.035, 0.5);
    } else {
      box(
        g,
        type === "inn" ? "#d6c498" : "#ab8150",
        0,
        0.85,
        0,
        1.65,
        1.55,
        1.45,
      );
      for (const x of [-0.8, 0.8])
        for (const z of [-0.7, 0.7]) box(g, dark, x, 0.9, z, 0.1, 1.7, 0.1);
      roof(g, 0, 1.82, 0, 2, 1.85, type === "inn" ? "#8d5140" : teal);
      box(g, dark, 0, 0.62, 0.74, 0.43, 1.08, 0.04);
      if (type === "inn") {
        for (const x of [-0.53, 0.53]) {
          box(g, dark, x, 1.14, 0.75, 0.3, 0.42, 0.04);
          box(g, "#e2bd70", x, 1.14, 0.78, 0.22, 0.32, 0.025);
        }
        box(g, stone, 0.58, 1.96, -0.36, 0.28, 0.85, 0.3);
        box(g, wood, 1.05, 1.28, 0.8, 0.7, 0.06, 0.06);
        box(g, dark, 1.22, 1.02, 0.8, 0.44, 0.36, 0.06);
        cyl(g, "#d6b56c", 1.22, 1.02, 0.85, 0.12, 0.17);
        box(g, wood, -0.85, 0.48, 1.1, 0.7, 0.09, 0.45);
        for (const x of [-1.1, -0.6])
          box(g, dark, x, 0.25, 1.1, 0.07, 0.5, 0.3);
      } else {
        for (let i = 0; i < 7; i++)
          box(g, wood, -0.72 + i * 0.24, 0.88, 0.74, 0.03, 1.4, 0.035);
        for (const y of [0.32, 1.44]) box(g, dark, 0, y, 0.77, 1.7, 0.07, 0.04);
        for (const x of [-0.7, -0.25, 0.2]) {
          cyl(g, "#c9b47c", x, 0.32, 1.05, 0.18, 0.43);
          cyl(g, "#967948", x, 0.55, 1.05, 0.07, 0.06);
        }
        box(g, dark, 0, 1.4, 0.8, 0.4, 0.3, 0.06);
        for (const x of [-0.09, 0, 0.09])
          box(g, "#dfc36d", x, 1.4, 0.84, 0.035, 0.21, 0.025);
      }
    }
    return g;
  }
  if (type === "waterGate") {
    for (const x of [-0.75, 0.75]) {
      box(g, stone, x, 1.55, 0, 0.32, 3.3, 0.5);
      box(g, "#c0c0a7", x, 3.28, 0, 0.45, 0.15, 0.65);
    }
    box(g, dark, 0, 3.2, 0, 1.7, 0.18, 0.3);
    const grille = new T.Group();
    g.add(grille);
    g.userData.waterDoor = grille;
    for (let i = 0; i < 7; i++)
      box(grille, "#505f5b", -0.5 + i / 6, 0.52, 0, 0.045, 1.15, 0.06);
    for (const y of [0.1, 0.7, 1.05])
      box(grille, "#6d7a6e", 0, y, 0, 1.18, 0.07, 0.08);
    const drum = cyl(g, wood, 0.93, 0.6, 0, 0.18, 0.35);
    drum.rotation.z = Math.PI / 2;
    box(g, dark, 0.9, 0.3, 0, 0.15, 0.6, 0.25);
    box(g, "#c6b27b", 0.9, 0.95, 0, 0.025, 0.6, 0.025);
  } else if (type === "wallStairs") {
    for (let i = 0; i < 10; i++)
      box(
        g,
        i % 2 ? stone : "#babca4",
        0,
        0.065 + i * 0.06,
        -0.7 + i * 0.14,
        0.9,
        0.13 + i * 0.12,
        0.15,
      );
    for (const x of [-0.51, 0.51]) {
      const rail = box(g, dark, x, 1, -0.05, 0.055, 0.055, 1.9);
      rail.rotation.x = -0.7;
      for (const z of [-0.7, 0.56])
        box(g, wood, x, z < 0 ? 0.3 : 1.35, z, 0.055, 0.6, 0.055);
    }
  } else if (type === "shipyard") {
    box(g, stone, -0.35, 0.08, 0, 1.8, 0.16, 1.9);
    for (const x of [-1.1, 0.4])
      for (const z of [-0.85, 0.85]) box(g, dark, x, 0.85, z, 0.12, 1.6, 0.12);
    roof(g, -0.35, 1.65, 0, 1.7, 2, teal);
    for (let i = 0; i < 12; i++)
      box(g, wood, 0.65 + i * 0.24, 0.13, 0, 0.225, 0.15, 1.8);
    for (const x of [0.7, 3.2])
      for (const z of [-0.8, 0.8]) cyl(g, dark, x, -0.03, z, 0.09, 0.9);
    for (const z of [-0.75, 0.75]) box(g, dark, 1.85, 1.1, z, 0.13, 1.9, 0.13);
    box(g, wood, 1.85, 2.1, 0, 0.16, 0.16, 1.8);
    box(g, "#d4bd83", 1.85, 1.45, 0, 0.02, 1.25, 0.02);
    cyl(g, "#59665d", 1.85, 0.83, 0, 0.1, 0.18);
    for (const z of [-0.38, 0.38]) box(g, dark, 1.7, 0.35, z, 1.5, 0.18, 0.07);
    for (let i = 0; i < 5; i++) {
      const rib = box(g, wood, 1.1 + i * 0.3, 0.36, 0, 0.055, 0.065, 0.75);
      rib.rotation.x = 0.15;
    }
    for (const z of [-0.9, 0.9]) cyl(g, wood, -0.85, 0.3, z, 0.18, 0.5);
  } else if (type === "merchantPost") {
    box(g, stone, 0, 0.08, 0, 2.1, 0.16, 1.8);
    for (const x of [-0.85, 0.85])
      for (const z of [-0.68, 0.68]) box(g, dark, x, 0.85, z, 0.1, 1.5, 0.1);
    roof(g, 0, 1.65, 0, 1.9, 1.8, teal);
    box(g, "#d9bb72", 0, 1.25, 0.8, 1.6, 0.3, 0.06);
    for (let i = 0; i < 3; i++) {
      box(g, wood, -0.5 + i * 0.45, 0.35, 0.15, 0.4, 0.5, 0.45);
      box(g, dark, -0.5 + i * 0.45, 0.34, 0.39, 0.42, 0.05, 0.025);
    }
    for (const x of [-1.1, 1.1]) {
      cyl(g, dark, x, 0.3, 1.2, 0.05, 0.6);
      box(g, wood, 0, 0.48, 1.2, 2.2, 0.07, 0.07);
    }
    cyl(g, "#a48a51", 1.25, 0.4, 0, 0.22, 0.65);
  } else if (type === "repairWorkshop") {
    box(g, stone, 0, 0.65, 0, 1.6, 1.3, 1.4);
    roof(g, 0, 1.55, 0, 1.8, 1.65, "#9c6247");
    box(g, dark, 0, 0.55, 0.72, 0.6, 1.05, 0.045);
    box(g, wood, 0, 0.45, 1.04, 1.35, 0.1, 0.45);
    for (const x of [-0.5, 0.5]) box(g, dark, x, 0.2, 1.04, 0.09, 0.4, 0.12);
    box(g, "#58635c", 0.15, 0.62, 1, 0.48, 0.22, 0.2);
    box(g, "#9da596", 0.15, 0.76, 1, 0.7, 0.07, 0.24);
    const hammer = box(g, wood, -0.4, 0.73, 1.05, 0.045, 0.45, 0.045);
    hammer.rotation.z = 0.6;
    box(g, "#879184", -0.53, 0.91, 1.05, 0.22, 0.1, 0.11);
    for (let i = 0; i < 4; i++)
      box(g, wood, -1, 0.12 + i * 0.1, 0, 0.55, 0.07, 0.8);
  } else {
    for (const x of [-0.5, 0.5])
      for (const z of [-0.5, 0.5]) box(g, dark, x, 1.6, z, 0.14, 3.2, 0.14);
    box(g, wood, 0, 2.85, 0, 1.45, 0.17, 1.45);
    for (const z of [-0.72, 0.72]) {
      box(g, wood, 0, 3.3, z, 1.5, 0.08, 0.07);
      for (const x of [-0.65, 0.65]) box(g, dark, x, 3.1, z, 0.07, 0.6, 0.07);
    }
    for (let i = 0; i < 9; i++)
      box(g, wood, 0, 0.25 + i * 0.3, 0.6, 0.48, 0.055, 0.07);
    for (const x of [-0.28, 0.28]) box(g, dark, x, 1.45, 0.62, 0.06, 2.8, 0.06);
    cyl(g, "#566158", 0, 3.25, 0, 0.31, 0.35);
    const fire = new T.Group();
    g.add(fire);
    g.userData.signalFire = fire;
    const flame = new T.Mesh(
      new T.ConeGeometry(0.23, 0.65, 7),
      new T.MeshBasicMaterial({ color: "#f3b55f" }),
    );
    flame.position.y = 3.65;
    fire.add(flame);
    const small = new T.Mesh(
      new T.ConeGeometry(0.12, 0.42, 6),
      new T.MeshBasicMaterial({ color: "#f8de88" }),
    );
    small.position.y = 3.6;
    fire.add(small);
  }
  return g;
}
