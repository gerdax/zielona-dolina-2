export function hudViewport(
  view:
    | {
        offsetLeft: number;
        offsetTop: number;
        width: number;
        height: number;
        scale: number;
      }
    | undefined,
  width: number,
  height: number,
) {
  const scale = view?.scale || 1;
  return {
    x: view?.offsetLeft || 0,
    y: view?.offsetTop || 0,
    width: (view?.width || width) * scale,
    height: (view?.height || height) * scale,
    scale: 1 / scale,
  };
}
export function resourceAmount(value: number) {
  if (value >= 1000000)
    return (
      new Intl.NumberFormat("pl", { maximumFractionDigits: 1 }).format(
        value / 1000000,
      ) + "m"
    );
  if (value >= 10000) return Math.round(value / 1000) + "k";
  return String(Math.floor(value));
}
