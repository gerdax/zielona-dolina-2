import type { Resources } from "./content";
export type TradeResource = Exclude<keyof Resources, "gold">;
export const merchantOffers: Record<
  TradeResource,
  { amount: number; buy: number; sell: number }
> = {
  wood: { amount: 10, buy: 8, sell: 4 },
  stone: { amount: 10, buy: 10, sell: 5 },
  food: { amount: 20, buy: 6, sell: 3 },
  iron: { amount: 5, buy: 15, sell: 8 },
};
export interface MerchantVisit {
  phase: "arriving" | "trading" | "leaving";
  stock: Resources;
  until: number;
  home: { x: number; z: number };
  destination: { x: number; z: number };
  retryAt: number;
}

export const exportRates: Record<TradeResource, number> = {
  wood: 1.75,
  stone: 2,
  food: 0.8,
  iron: 5,
};
export const merchantHireCost = { gold: 30, wood: 20 };
export interface MerchantRoute {
  homeId: string;
  targetId?: string;
  resource: TradeResource;
  amount: number;
  repeat: boolean;
  phase: "idle" | "loading" | "outbound" | "returning" | "waiting";
  cargo: Resources;
  retryAt: number;
  trips: number;
  reason?: string;
}
export const exportPrice = (
  resource: TradeResource,
  amount: number,
  allied = false,
) => Math.floor(exportRates[resource] * amount * (allied ? 1.2 : 1));
