export type DurationKey = "3" | "7" | "15" | "30";

export interface PricingTier {
  key: DurationKey;
  label: string;
  days: number;
  factor: number;       // = 1 - discountPct/100
  discountPct: number | null;
  badge: string | null;
}

// Precio visible = ceil(base / factor)  →  cliente ve precio inflado
// Real que paga  = base × días          →  dueño siempre recibe su margen
export const TIERS: PricingTier[] = [
  { key: "3",  label: "3 días",  days: 3,  factor: 1.00, discountPct: null, badge: null           },
  { key: "7",  label: "7 días",  days: 7,  factor: 0.95, discountPct: 5,    badge: "5% off"       },
  { key: "15", label: "15 días", days: 15, factor: 0.93, discountPct: 7,    badge: "7% off"       },
  { key: "30", label: "Mes",     days: 30, factor: 0.90, discountPct: 10,   badge: "Mejor precio" },
];

/** Precio visible por día que ve el cliente (inflado para que el descuento tenga sentido). */
export function pricePerDay(base: number, factor: number): number {
  return Math.ceil(base / factor);
}

/** Total real que paga el cliente ≈ base × días (dueño siempre recibe su mínimo). */
export function realTotal(base: number, days: number): number {
  return Math.round(base * days);
}

/** Cuánto ahorra el cliente vs. el precio visible sin descuento. */
export function savings(base: number, tier: PricingTier): number {
  const visibleTotal = pricePerDay(base, tier.factor) * tier.days;
  return Math.max(0, visibleTotal - realTotal(base, tier.days));
}

export function tierForDays(days: number): PricingTier {
  if (days >= 30) return TIERS[3];
  if (days >= 15) return TIERS[2];
  if (days >= 7)  return TIERS[1];
  return TIERS[0];
}

export function computeBookingPrice(base: number, days: number) {
  const tier = tierForDays(days);
  const perDay = pricePerDay(base, tier.factor);
  const total = realTotal(base, days);
  return { perDay, total, tier };
}
