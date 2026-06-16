import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Navbar, Footer, FloatingWhatsApp } from "@/components/site-chrome";
import { vehicleImage } from "@/lib/vehicle-images";
import { computeBookingPrice, TIERS, pricePerDay, realTotal } from "@/lib/pricing";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Droplets,
  Zap,
  AirVent,
  Gauge,
  Luggage,
  Bluetooth,
  Smartphone,
  Camera,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  Star,
  Banknote,
  PlaneLanding,
  CircleParking,
  Wifi,
  Usb,
  TriangleAlert,
  Cigarette,
  Trash2,
  Fuel,
  CalendarDays,
  MapPin,
} from "lucide-react";

type Vehicle = {
  id: string;
  name: string;
  year: number;
  category?: string | null;
  base_rate: number;
  available: boolean;
  sort_order: number;
  images: string[];
  seats?: number | null;
  transmission?: string | null;
  engine?: string | null;
  traction?: string | null;
  fuel?: string | null;
  luggage?: string | null;
  ac?: boolean | null;
  touchscreen?: boolean | null;
  reverse_camera?: boolean | null;
  parking_sensors?: boolean | null;
  bluetooth?: boolean | null;
  usb?: boolean | null;
  sunroof?: boolean | null;
  cruise_control?: boolean | null;
  leather_seats?: boolean | null;
  keyless_start?: boolean | null;
  wireless_charger?: boolean | null;
  car_play?: boolean | null;
  airbags?: boolean | null;
  extra_features?: string[] | null;
};

const searchSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});

export const Route = createFileRoute("/vehiculo/$id")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Detalle del vehículo — Tapia RentCar" }],
  }),
  component: VehiculoPage,
});

function VehiculoPage() {
  const { id } = Route.useParams();
  const { start, end } = Route.useSearch();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    supabase
      .from("vehicles")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setVehicle(data as Vehicle);
        setLoading(false);
      });
  }, [id]);

  const days = useMemo(() => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.round((e.getTime() - s.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }, [start, end]);

  const price = useMemo(() => {
    if (!vehicle || days < 3) return null;
    return computeBookingPrice(Number(vehicle.base_rate), days);
  }, [vehicle, days]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-orange border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Vehículo no encontrado.</p>
        <Link to="/" className="text-orange underline">Volver al inicio</Link>
      </div>
    );
  }

  const fallback = vehicleImage(vehicle.name);
  const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [fallback];

  const features: { icon: React.ElementType; label: string }[] = [
    ...(vehicle.ac               ? [{ icon: AirVent,       label: "Aire acondicionado" }] : []),
    ...(vehicle.car_play         ? [{ icon: Smartphone,    label: "Apple CarPlay" }] : []),
    ...(vehicle.bluetooth        ? [{ icon: Bluetooth,     label: "Bluetooth" }] : []),
    ...(vehicle.usb              ? [{ icon: Usb,           label: "Puerto USB" }] : []),
    ...(vehicle.touchscreen      ? [{ icon: Wifi,          label: "Pantalla táctil" }] : []),
    ...(vehicle.reverse_camera   ? [{ icon: Camera,        label: "Cámara trasera" }] : []),
    ...(vehicle.parking_sensors  ? [{ icon: CircleParking, label: "Sensores de parqueo" }] : []),
    ...(vehicle.cruise_control   ? [{ icon: Gauge,         label: "Control de crucero" }] : []),
    ...(vehicle.sunroof          ? [{ icon: Luggage,       label: "Techo solar" }] : []),
    ...(vehicle.keyless_start    ? [{ icon: Zap,           label: "Arranque sin llave" }] : []),
    ...(vehicle.wireless_charger ? [{ icon: Wifi,          label: "Cargador inalámbrico" }] : []),
    ...(vehicle.leather_seats    ? [{ icon: Star,          label: "Asientos de cuero" }] : []),
  ];

  function handleReservar() {
    navigate({
      to: "/reservar",
      search: { vehicle: vehicle!.id, start: start || undefined, end: end || undefined },
    });
  }

  const tierRows = TIERS.map((tier) => {
    const perDay = pricePerDay(Number(vehicle.base_rate), tier.factor);
    const total = realTotal(Number(vehicle.base_rate), tier.days);
    return { tier, perDay, total };
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 sm:py-10">
        {/* Back */}
        <button
          onClick={() => navigate({ to: "/", search: { start: start || undefined, end: end || undefined } as never })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy mb-6 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al catálogo
        </button>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-8">

            {/* Gallery */}
            <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[16/9] select-none">
              <img
                src={images[activeImg]}
                alt={vehicle.name}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition"
                  >
                    <ChevronLeft className="h-5 w-5 text-navy" />
                  </button>
                  <button
                    onClick={() => setActiveImg((p) => (p + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition"
                  >
                    <ChevronRight className="h-5 w-5 text-navy" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
                      />
                    ))}
                  </div>
                </>
              )}
              {images.length > 1 && (
                <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                  {activeImg + 1} / {images.length}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition ${i === activeImg ? "border-orange" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Title & Category */}
            <div>
              {vehicle.category && (
                <span className="text-xs font-semibold uppercase tracking-widest text-orange mb-1 block">
                  {vehicle.category}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-navy">
                {vehicle.name} <span className="text-muted-foreground font-normal">{vehicle.year}</span>
              </h1>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Users,    label: "Pasajeros",    value: vehicle.seats ? `${vehicle.seats} personas` : "—" },
                { icon: Zap,      label: "Transmisión",  value: vehicle.transmission ?? "—" },
                { icon: Droplets, label: "Combustible",  value: vehicle.fuel ?? "—" },
                { icon: Luggage,  label: "Equipaje",     value: vehicle.luggage ?? "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-muted/50 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                  <Icon className="h-6 w-6 text-orange" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
                  <span className="text-sm font-semibold text-navy">{value}</span>
                </div>
              ))}
            </div>

            {/* Features */}
            {features.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy mb-4">Características del vehículo</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {features.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
                      <Icon className="h-4 w-4 text-orange flex-shrink-0" />
                      <span className="text-sm text-foreground">{label}</span>
                    </div>
                  ))}
                  {vehicle.extra_features?.map((feat) => (
                    <div key={feat} className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-orange flex-shrink-0" />
                      <span className="text-sm text-foreground">{feat}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Included */}
            <section>
              <h2 className="text-lg font-bold text-navy mb-4">Incluido en el precio</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: ShieldCheck,   text: "Vehículo asegurado" },
                  { icon: PlaneLanding,  text: "Entrega gratis en AILA" },
                  { icon: Phone,         text: "Atención 24/7 por WhatsApp" },
                  { icon: Banknote,      text: "Sin recargos ocultos" },
                  { icon: CheckCircle2,  text: "Sin tarjeta de crédito requerida" },
                  { icon: Clock,         text: "Coordinación flexible de horarios" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-orange flex-shrink-0" />
                    <span className="text-sm text-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Pricing table */}
            <section>
              <h2 className="text-lg font-bold text-navy mb-4">Tarifas</h2>
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy text-white">
                      <th className="text-left px-4 py-3 font-semibold">Duración</th>
                      <th className="text-right px-4 py-3 font-semibold">Precio/día</th>
                      <th className="text-right px-4 py-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tierRows.map(({ tier, perDay, total }, i) => (
                      <tr key={tier.key} className={i % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                        <td className="px-4 py-3 font-medium text-navy">
                          {tier.label}
                          {tier.badge && (
                            <span className="ml-2 text-[10px] bg-orange/10 text-orange px-2 py-0.5 rounded-full font-semibold">
                              {tier.badge}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">US${perDay}/día</td>
                        <td className="px-4 py-3 text-right font-bold text-navy">US${total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-4 py-2.5 text-xs text-muted-foreground bg-muted/20 border-t border-border">
                  Tarifa mínima de 3 días · El precio refleja el descuento aplicado por duración.
                </p>
              </div>
            </section>

            {/* Rules */}
            <section>
              <h2 className="text-lg font-bold text-navy mb-4">Normas del vehículo</h2>
              <div className="space-y-3">
                {[
                  { icon: Cigarette,      text: "No fumar dentro del vehículo" },
                  { icon: Trash2,         text: "Entregar el vehículo limpio" },
                  { icon: Fuel,           text: "Devolver con el mismo nivel de combustible" },
                  { icon: TriangleAlert,  text: "No se permite conducir fuera de la República Dominicana" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-red-500" />
                    </div>
                    <span className="text-sm text-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Location */}
            <section>
              <h2 className="text-lg font-bold text-navy mb-3">Punto de entrega principal</h2>
              <div className="flex items-start gap-3 bg-muted/40 rounded-2xl px-5 py-4">
                <MapPin className="h-5 w-5 text-orange mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-navy">Aeropuerto Internacional Las Américas (AILA)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Santo Domingo, República Dominicana · Entrega gratis</p>
                  <p className="text-xs text-muted-foreground mt-1">También podemos llevarte el vehículo a hoteles, residencias u otras zonas. Coordina por WhatsApp.</p>
                </div>
              </div>
            </section>

          </div>

          {/* ── RIGHT COLUMN — Pricing Card ── */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-border bg-white shadow-lg overflow-hidden">
              {/* Price header */}
              <div className="bg-navy px-6 py-5 text-white">
                <p className="text-sm opacity-70 mb-1">Precio por día desde</p>
                <p className="text-3xl font-bold">
                  US${pricePerDay(Number(vehicle.base_rate), 1)}
                  <span className="text-base font-normal opacity-70">/día</span>
                </p>
                <p className="text-xs opacity-60 mt-1">Tarifa mínima de 3 días</p>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Date summary */}
                {start && end ? (
                  <div className="bg-muted/50 rounded-xl px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-orange" />
                      <span className="text-muted-foreground">Recogida:</span>
                      <span className="font-semibold text-navy">{start}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-orange" />
                      <span className="text-muted-foreground">Entrega:</span>
                      <span className="font-semibold text-navy">{end}</span>
                    </div>
                    {days >= 3 && (
                      <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                        {days} días · {price?.tier.badge ? <span className="text-orange font-semibold">{price.tier.badge}</span> : "Tarifa estándar"}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-orange/5 border border-orange/20 rounded-xl px-4 py-3 flex items-start gap-2">
                    <CalendarDays className="h-4 w-4 text-orange mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Selecciona las fechas en el buscador para ver el precio exacto de tu estadía.
                    </p>
                  </div>
                )}

                {/* Total */}
                {price && (
                  <div className="bg-orange/5 rounded-xl px-4 py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total estimado</span>
                      <span className="text-xl font-bold text-orange">US${price.total}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Entrega AILA incluida · Sin cargos ocultos</p>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={handleReservar}
                  className="w-full bg-orange text-white font-bold py-3.5 rounded-xl hover:brightness-110 transition text-base"
                >
                  Reservar ahora
                </button>

                {/* Payment methods */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Aceptamos efectivo · transferencia · PayPal</p>
                </div>

                {/* Trust badges */}
                <div className="border-t border-border pt-4 space-y-2">
                  {[
                    { icon: ShieldCheck, text: "Vehículo 100% asegurado" },
                    { icon: Clock,       text: "Confirmación por WhatsApp" },
                    { icon: Banknote,    text: "Depósito reembolsable" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-orange flex-shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
