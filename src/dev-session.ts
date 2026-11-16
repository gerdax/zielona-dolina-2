import { validateSave } from "./save";
import type { World } from "./simulation";
export interface DevSession {
  world: World;
  selected: string[];
  playing: boolean;
  camera: { x: number; z: number; zoom: number };
}
export function recoverSession(key: string): DevSession | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw) as DevSession;
    validateSave(saved.world);
    if (
      !saved.camera ||
      !Number.isFinite(saved.camera.x) ||
      !Number.isFinite(saved.camera.z) ||
      !Number.isFinite(saved.camera.zoom) ||
      !Array.isArray(saved.selected)
    )
      return null;
    try {
      sessionStorage.setItem(key + ":recovery-copy", raw);
    } catch {
      /* Keep restoration working when storage is full. */
    }
    sessionStorage.removeItem(key);
    return saved;
  } catch {
    return null;
  }
}
export function retainSession(key: string, session: DevSession) {
  try {
    sessionStorage.setItem(key, JSON.stringify(session));
  } catch {
    /* The normal autosave remains available when browser storage is full. */
  }
}

export function hasPendingSession(key: string): boolean {
  try {
    return !!sessionStorage.getItem(key);
  } catch {
    return false;
  }
}
