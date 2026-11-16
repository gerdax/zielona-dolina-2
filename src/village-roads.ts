export const villageRoadTiles = new Map<
  string,
  { x: number; z: number; width: number; depth: number; color: string }
>();
for (let x = 10; x < 31; x++)
  villageRoadTiles.set(`${x},30`, {
    x,
    z: 30,
    width: 0.99,
    depth: 1.05,
    color: "#b4a782",
  });
for (let z = 23; z < 36; z++)
  villageRoadTiles.set(`16,${z}`, {
    x: 16,
    z,
    width: 1,
    depth: 0.99,
    color: "#b0a27c",
  });
for (let x = 34; x < 48; x++)
  villageRoadTiles.set(`${x},30`, {
    x,
    z: 30,
    width: 0.99,
    depth: 0.6,
    color: "#a5a17c",
  });
export const roadKey = (x: number, z: number) =>
  `${Math.round(x)},${Math.round(z)}`;
