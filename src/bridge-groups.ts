interface Segment {
  id: string;
  type: string;
  x: number;
  z: number;
  rotation?: number;
}
/** A gap always splits a crossing; distant tiles never share a moving deck. */
export function connectedBridgeGroup<T extends Segment>(
  entities: T[],
  target: T,
): T[] {
  const rotation = target.rotation ?? 0;
  const vertical = rotation % 2 === 1;
  const along = (e: T) =>
    (vertical ? e.z : e.x) * (rotation === 1 || rotation === 2 ? -1 : 1);
  const across = (e: T) => Math.round(vertical ? e.x : e.z);
  const row = entities
    .filter(
      (e) =>
        e.type === target.type &&
        (e.rotation ?? 0) === rotation &&
        across(e) === across(target),
    )
    .sort((a, b) => along(a) - along(b));
  const index = row.findIndex((e) => e.id === target.id);
  if (index < 0) return [target];
  let first = index,
    last = index;
  while (first > 0 && along(row[first]) - along(row[first - 1]) === 1) first--;
  while (last < row.length - 1 && along(row[last + 1]) - along(row[last]) === 1)
    last++;
  return row.slice(first, last + 1);
}
