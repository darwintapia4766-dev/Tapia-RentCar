import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Navbar, Footer, FloatingWhatsApp, WhatsAppIcon } from "@/components/site-chrome";
import { vehicleImage } from "@/lib/vehicle-images";
import { whatsappLink } from "@/lib/whatsapp";
import { TIERS, pricePerDay, realTotal, savings } from "@/lib/pricing";
import heroCar from "@/assets/hero-car.jpg";
import tapiaLogo from "@/assets/logo1.png";
import {
  Car,
  Plane,
  UserCog,
  ShieldCheck,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  ChevronDown,
  Phone,
  CheckCircle2,
  Users,
  Camera,
  Smartphone,
  Banknote,
  PlaneLanding,
  Landmark,
  Globe,
  Search,
  CalendarDays,
  Droplets,
  Zap,
  AirVent,
  Gauge,
  Luggage,
  Bluetooth,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tapia RentCar — Renta de carros, transfers y chofer en Santo Domingo" },
      { name: "description", content: "Alquiler de vehículos económicos, traslados al aeropuerto y servicio de chofer privado en República Dominicana. Pago en efectivo, transferencia o PayPal." },
      { property: "og:title", content: "Tapia RentCar — Tu carro te espera donde estés" },
      { property: "og:description", content: "Renta de carros, transfer y chofer en Santo Domingo. Pago en efectivo, transferencia o PayPal." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: IndexPage,
});

type Blocked = { start: string; end: string; label: string };
type Vehicle = {
  id: string;
  name: string;
  year: number;
  category: string;
  base_rate: number;
  available: boolean;
  sort_order: number;
  units: number;
  images: string[];
  blocked_dates: Blocked[];
  seats: number;
  transmission: string;
  engine: string;
  traction: string;
  fuel: string;
  luggage: string;
  ac: boolean;
  touchscreen: boolean;
  reverse_camera: boolean;
  parking_sensors: boolean;
  bluetooth: boolean;
  usb: boolean;
  sunroof: boolean;
  cruise_control: boolean;
  leather_seats: boolean;
  keyless_start: boolean;
  wireless_charger: boolean;
  car_play: boolean;
  airbags: boolean;
  extra_features: string[];
};

function IndexPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  function scrollToFleet() {
    document.getElementById("flota")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero
        startDate={startDate}
        endDate={endDate}
        startTime={startTime}
        endTime={endTime}
        onStartDate={setStartDate}
        onEndDate={setEndDate}
        onStartTime={setStartTime}
        onEndTime={setEndTime}
        onSearch={scrollToFleet}
      />
      <Fleet startDate={startDate} endDate={endDate} />
      <TrustStrip />
      <Services />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}



const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", {
    day: "numeric", month: "numeric", year: "numeric",
  });
}

function DateTimeField({
  label, date, time, minDate, onDate, onTime, borderRight = true,
}: {
  label: string; date: string; time: string; minDate: string;
  onDate: (v: string) => void; onTime: (v: string) => void; borderRight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = date ? new Date(date + "T00:00:00") : undefined;
  const disabled = { before: new Date(minDate + "T00:00:00") };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex-1 h-full px-4 flex flex-col justify-center text-left hover:bg-muted/20 transition focus:outline-none ${borderRight ? "border-r border-border" : ""}`}
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground leading-none">{label}</p>
          <div className="mt-1 flex items-center gap-1">
            <span className={`text-sm font-medium leading-none ${date ? "text-foreground" : "text-muted-foreground"}`}>
              {date ? fmtDate(date) : "Agregar fecha"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
            <div className="w-px h-4 bg-border mx-1" />
            <span className={`text-sm font-medium leading-none ${time ? "text-foreground" : "text-muted-foreground"}`}>
              {time || "Hora"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-xl z-[200]" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) {
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              onDate(iso);
            } else {
              onDate("");
            }
          }}
          disabled={disabled}
          captionLayout="label"
        />
        <div className="border-t border-border px-3 pb-3 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Hora de entrega</p>
          <div className="grid grid-cols-4 gap-1 max-h-36 overflow-y-auto pr-1">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => { onTime(t); setOpen(false); }}
                className={`text-xs px-1 py-1.5 rounded-md text-center transition font-medium ${
                  t === time ? "bg-orange text-white" : "hover:bg-muted text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Hero({
  startDate, endDate, startTime, endTime,
  onStartDate, onEndDate, onStartTime, onEndTime,
  onSearch,
}: {
  startDate: string; endDate: string; startTime: string; endTime: string;
  onStartDate: (v: string) => void; onEndDate: (v: string) => void;
  onStartTime: (v: string) => void; onEndTime: (v: string) => void;
  onSearch: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const days = startDate && endDate
    ? Math.max(0, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;

  return (
    <section className="relative bg-navy text-white">
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <img src={heroCar} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent" />
      </div>
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <span className="mt-4 inline-flex items-center gap-2 bg-orange/15 text-orange text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider">
          <Car className="h-3.5 w-3.5" /> Santo Domingo · República Dominicana
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
          Tu carro te espera <span className="text-orange">donde estés.</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-white/75 max-w-2xl mx-auto">
          Muévete libre por la isla. Entrega en el aeropuerto, tu hotel o residencia.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-white/60">
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full"><Banknote className="h-3.5 w-3.5 text-orange" /> Efectivo</span>
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full"><Landmark className="h-3.5 w-3.5 text-orange" /> Transferencia</span>
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full"><Globe className="h-3.5 w-3.5 text-orange" /> PayPal</span>
        </div>

        {/* Buscador estilo Turo */}
        <div className="mt-8 bg-white rounded-xl shadow-2xl text-foreground max-w-4xl mx-auto">
          <div className="flex items-stretch h-14">

            {/* Desde */}
            <DateTimeField
              label="Desde"
              date={startDate}
              time={startTime}
              minDate={today}
              onDate={(v) => { onStartDate(v); if (endDate && v > endDate) onEndDate(""); }}
              onTime={onStartTime}
            />

            {/* Hasta */}
            <DateTimeField
              label="Hasta"
              date={endDate}
              time={endTime}
              minDate={startDate || today}
              onDate={onEndDate}
              onTime={onEndTime}
              borderRight={false}
            />

            {/* Botón */}
            <div className="flex items-center justify-center px-3">
              <button onClick={onSearch}
                className="bg-orange text-white h-9 w-9 rounded-lg hover:brightness-110 transition flex items-center justify-center flex-shrink-0"
                aria-label="Buscar">
                <Search className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>

{days > 0 && days < 3 && (
          <p className="mt-3 text-sm text-orange/80">El mínimo de renta es 3 días.</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/80">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange" /> 100% Confiable</span>
          <span className="flex items-center gap-2"><PlaneLanding className="h-4 w-4 text-orange" /> Entrega gratis en Las Américas (AILA)</span>
          <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-orange" /> Atención 24/7</span>
        </div>

      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: ShieldCheck,  stat: "100%",       label: "Vehículos asegurados"         },
    { icon: PlaneLanding, stat: "Gratis",      label: "Entrega en AILA"              },
    { icon: Banknote,     stat: "Flexible",    label: "Efectivo · Transferencia · PayPal" },
    { icon: Clock,        stat: "24/7",        label: "Atención por WhatsApp"        },
  ];
  return (
    <section className="bg-white border-y border-border py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {items.map(({ icon: Icon, stat, label }) => (
          <div key={label} className="flex flex-col items-center text-center gap-1.5">
            <div className="h-10 w-10 rounded-full bg-navy/5 flex items-center justify-center">
              <Icon className="h-5 w-5 text-orange" />
            </div>
            <p className="text-lg font-bold text-navy leading-none">{stat}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


type Service = {
  id: string;
  name: string;
  description: string;
  price_text: string;
  visible: boolean;
  sort_order: number;
};

function pickServiceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("transfer") || n.includes("aeropuerto")) return Plane;
  if (n.includes("chofer") || n.includes("conductor")) return UserCog;
  if (n.includes("entrega") || n.includes("domicilio")) return MapPin;
  return Car;
}

function pickServiceWhatsapp(name: string) {
  const n = name.toLowerCase();
  if (n.includes("transfer") || n.includes("aeropuerto")) return "Hola, quisiera cotizar un transfer al aeropuerto.";
  if (n.includes("chofer")) return "Hola, necesito un chofer privado.";
  if (n.includes("entrega") || n.includes("domicilio")) return "Hola, quisiera coordinar la entrega del vehículo.";
  return null;
}

function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("services").select("*").eq("visible", true).order("sort_order")
      .then(({ data }) => { setServices((data as Service[]) ?? []); setLoading(false); });
  }, []);

  return (
    <section id="servicios" className="py-20 px-4 sm:px-6 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-orange text-xs font-semibold uppercase tracking-wider">Servicios</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Todo lo que necesitas para moverte</h2>
          <p className="mt-3 text-muted-foreground">Renta de carros, traslados y chofer privado en República Dominicana.</p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((s, idx) => {
              const Icon = pickServiceIcon(s.name);
              const wa = pickServiceWhatsapp(s.name);
              const isFleet = !wa;
              const accent = idx === 0 ? "bg-navy" : idx === 1 ? "bg-orange" : idx === 2 ? "bg-emerald-600" : "bg-purple-600";
              return (
                <div key={s.id} className="group bg-white rounded-2xl overflow-hidden border border-border hover:shadow-xl hover:-translate-y-1 transition flex flex-col">
                  <div className={`${accent} px-6 pt-6 pb-8 text-white relative`}>
                    <Icon className="h-8 w-8 opacity-90" />
                    <div className="absolute bottom-0 right-0 h-16 w-16 rounded-tl-full bg-white/10" />
                  </div>
                  <div className="p-5 flex flex-col flex-1 -mt-4 relative">
                    <div className={`inline-flex self-start mb-3 text-xs font-bold px-2.5 py-1 rounded-full text-white ${accent}`}>
                      {s.price_text || "Consultar"}
                    </div>
                    <h3 className="font-bold text-base leading-snug">{s.name}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed flex-1">{s.description}</p>
                    {isFleet ? (
                      <a href="#flota" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:text-orange transition">
                        Ver flota <ChevronRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <a href={whatsappLink(wa!)} target="_blank" rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:text-orange transition">
                        Solicitar por WhatsApp <ChevronRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

const CATEGORIES = ["Todos", "Económico", "Sedán", "SUV"] as const;
type Category = (typeof CATEGORIES)[number];

function Fleet({ startDate, endDate }: { startDate: string; endDate: string }) {
  const navigate = useNavigate({ from: "/" });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("Todos");

  useEffect(() => {
    supabase
      .from("vehicles")
      .select("*")
      .eq("available", true)
      .order("sort_order")
      .then(({ data }) => {
        setVehicles((data as unknown as Vehicle[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = activeCategory === "Todos"
    ? vehicles
    : vehicles.filter((v) => v.category === activeCategory);

  return (
    <section id="flota" className="py-20 px-4 sm:px-6 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">Vehículos disponibles en Santo Domingo</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Tarifa mínima de 3 días · Efectivo, transferencia o PayPal</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                  activeCategory === cat
                    ? "bg-navy text-white border-navy"
                    : "bg-white border-border text-foreground/70 hover:border-navy/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {startDate && endDate && (
          <p className="text-sm text-muted-foreground mb-4">
            Disponibilidad: <strong>{startDate}</strong> → <strong>{endDate}</strong>
          </p>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No hay vehículos en esta categoría.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((v) => {
              const img = v.images?.[0] ?? vehicleImage(v.name);
              const blocked = Array.isArray(v.blocked_dates) ? v.blocked_dates : [];
              const units = v.units ?? 1;
              const days = startDate && endDate
                ? Math.max(0, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
                : 0;
              const overlapsSelected = startDate && endDate
                ? blocked.find((b) => startDate < b.end && endDate > b.start)
                : null;
              const gallery = v.images && v.images.length > 0 ? v.images : [img];
              return (
                <VehicleCard
                  key={v.id}
                  v={v}
                  images={gallery}
                  units={units}
                  days={days}
                  overlapsSelected={overlapsSelected}
                  onSelect={() =>
                    navigate({
                      to: "/vehiculo/$id",
                      params: { id: v.id },
                      search: { start: startDate || undefined, end: endDate || undefined },
                    })
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function Pricing() {
  const base = 50;
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-orange text-xs font-semibold uppercase tracking-wider">Precios transparentes</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Mientras más días, mejor precio</h2>
          <p className="mt-3 text-muted-foreground">
            Descuentos automáticos en rentas largas.{" "}
            <span className="font-medium text-foreground">Ejemplo: Honda CRV · US${base}/día</span>
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TIERS.map((t) => {
            const visible = pricePerDay(base, t.factor);
            const total   = realTotal(base, t.days);
            const saved   = savings(base, t);
            const isFeatured = t.key === "30";
            return (
              <div key={t.key}
                className={`relative rounded-2xl border flex flex-col overflow-hidden ${
                  isFeatured ? "border-navy shadow-xl" : "border-border"
                }`}
              >
                {/* Header */}
                <div className={`px-5 pt-5 pb-4 ${isFeatured ? "bg-navy text-white" : "bg-white"}`}>
                  {t.badge && (
                    <span className={`inline-block mb-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isFeatured ? "bg-orange text-white" : "bg-orange/10 text-orange"
                    }`}>
                      {t.badge}
                    </span>
                  )}
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isFeatured ? "text-white/50" : "text-muted-foreground"}`}>
                    {t.label}
                  </p>
                  {t.discountPct ? (
                    <>
                      <p className={`text-xs line-through leading-none mb-0.5 ${isFeatured ? "text-white/30" : "text-muted-foreground/50"}`}>
                        US${visible}/día
                      </p>
                      <p className="text-2xl font-bold text-orange leading-none">
                        US${base}<span className={`text-xs font-normal ml-0.5 ${isFeatured ? "text-white/50" : "text-muted-foreground"}`}>/día</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-orange leading-none">
                      US${visible}<span className={`text-xs font-normal ml-0.5 ${isFeatured ? "text-white/50" : "text-muted-foreground"}`}>/día</span>
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className={`px-5 py-3 flex flex-col gap-1 text-xs border-t ${
                  isFeatured ? "bg-navy/90 border-white/10" : "bg-surface border-border"
                }`}>
                  <div className={`font-semibold ${isFeatured ? "text-white" : "text-foreground"}`}>
                    Total US${total}
                  </div>
                  {saved > 0 ? (
                    <div className="text-emerald-500 font-semibold">Ahorras US${saved}</div>
                  ) : (
                    <div className={isFeatured ? "text-white/40" : "text-muted-foreground"}>Precio estándar</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Renta mínima 3 días · Descuentos aplicados automáticamente
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: 1, icon: Car,          title: "Elige tu vehículo",      desc: "Explora la flota y selecciona el carro ideal para tu viaje." },
    { n: 2, icon: CalendarDays,  title: "Indica fechas y entrega", desc: "Selecciona tus fechas, horario y el lugar donde te llevamos el carro." },
    { n: 3, icon: Phone,        title: "Coordinamos contigo",     desc: "Te confirmamos por WhatsApp y resolvemos cualquier duda en minutos." },
    { n: 4, icon: CheckCircle2, title: "A disfrutar",             desc: "Te entregamos el vehículo listo, donde estés, a la hora acordada." },
  ];
  return (
    <section id="como-funciona" className="py-20 px-4 sm:px-6 bg-navy text-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-orange text-xs font-semibold uppercase tracking-wider">Cómo funciona</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Reservar es muy fácil</h2>
          <p className="mt-3 text-white/60">Sin papeleo, sin complicaciones. En minutos tienes tu carro confirmado.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden">
          {steps.map((s) => (
            <div key={s.n} className="bg-navy px-7 py-8 flex flex-col gap-4 hover:bg-white/5 transition">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-orange flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {s.n}
                </span>
                <s.icon className="h-5 w-5 text-orange/70" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-snug">{s.title}</h3>
                <p className="mt-1.5 text-sm text-white/60 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-white/40">¿Tienes dudas? Escríbenos por WhatsApp y te respondemos al instante.</p>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    { name: "María González",   city: "Santo Domingo", initials: "MG", text: "Excelente servicio. El carro estaba impecable y la entrega fue puntual directo en el aeropuerto. Muy recomendado.", rating: 5 },
    { name: "Carlos Rodríguez", city: "Santiago",       initials: "CR", text: "Llevo tres rentas con Tapia y siempre superan las expectativas. Precios justos y atención de primera.", rating: 5 },
    { name: "Ana Martínez",     city: "Punta Cana",     initials: "AM", text: "Pago por transferencia muy fácil. La comunicación por WhatsApp fue inmediata. Volveré a rentar.", rating: 5 },
  ];
  return (
    <section className="py-20 px-4 sm:px-6 bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-orange text-xs font-semibold uppercase tracking-wider">Testimonios</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Lo que dicen nuestros clientes</h2>
          <p className="mt-3 text-muted-foreground">Más de 500 viajes completados en República Dominicana.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="bg-white rounded-2xl border border-border p-7 flex flex-col gap-4 hover:shadow-md transition">
              <div className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-orange text-orange" />)}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="h-9 w-9 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">{r.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.city}, R.D.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "¿Qué formas de pago aceptan?", a: "Aceptamos efectivo, transferencia bancaria y PayPal. Solo requerimos un depósito de seguridad reembolsable al entregar el vehículo." },
    { q: "¿Entregan el vehículo en el aeropuerto?", a: "Sí, entregamos en el AILA, Punta Cana, La Romana, hoteles y residencias en todo Santo Domingo." },
    { q: "¿Qué documentos necesito?", a: "Cédula o pasaporte vigente y licencia de conducir válida." },
    { q: "¿Puedo extender la reserva?", a: "Por supuesto. Avísanos con anticipación por WhatsApp y coordinamos la extensión." },
    { q: "¿Los precios incluyen seguro?", a: "Sí, todos los vehículos incluyen seguro básico. Ofrecemos coberturas adicionales opcionales." },
  ];
  return (
    <section className="py-20 px-4 sm:px-6 bg-surface">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-orange text-xs font-semibold uppercase tracking-wider">Preguntas frecuentes</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold">¿Tienes dudas?</h2>
        </div>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <details key={i} className="bg-white border border-border rounded-xl overflow-hidden group">
              <summary className="flex items-center justify-between cursor-pointer font-semibold list-none px-5 py-4 hover:bg-muted/30 transition">
                <span className="pr-4">{f.q}</span>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-orange transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">¿No encontraste lo que buscabas?</p>
          <a
            href={whatsappLink("Hola, tengo una pregunta sobre la renta de vehículos.")}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-whatsapp text-white font-semibold px-5 py-2.5 rounded-lg hover:brightness-110 transition text-sm"
          >
            <WhatsAppIcon className="h-4 w-4" /> Pregúntanos por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-navy to-navy/90 rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 bg-orange/20 rounded-full blur-3xl" />
        <img src={tapiaLogo} alt="Tapia RentCar" className="relative mx-auto h-16 w-auto mb-4 opacity-90" />
        <h2 className="relative text-3xl sm:text-4xl font-bold">¿Listo para tu próximo viaje?</h2>
        <p className="relative mt-3 text-white/75 max-w-xl mx-auto">Reserva en minutos y recibe confirmación directa por WhatsApp.</p>
        <div className="relative mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/reservar" className="inline-flex items-center justify-center gap-2 bg-orange text-orange-foreground font-semibold px-6 py-3.5 rounded-md hover:brightness-110">
            Reservar ahora <ChevronRight className="h-4 w-4" />
          </Link>
          <a href={whatsappLink("Hola Tapia RentCar, quisiera más información.")} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-whatsapp text-white font-semibold px-6 py-3.5 rounded-md hover:brightness-110">
            <WhatsAppIcon className="h-5 w-5" /> Chatea con nosotros
          </a>
        </div>
      </div>
    </section>
  );
}

function VehicleCard({
  v,
  images,
  units,
  days,
  overlapsSelected,
  onSelect,
}: {
  v: Vehicle;
  images: string[];
  units: number;
  days: number;
  overlapsSelected: Blocked | null | undefined;
  onSelect: () => void;
}) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || !hovered) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % images.length), 1800);
    return () => window.clearInterval(id);
  }, [images.length, hovered]);

  const tier = days >= 30 ? TIERS[3] : days >= 15 ? TIERS[2] : days >= 7 ? TIERS[1] : TIERS[0];
  const perDay = pricePerDay(Number(v.base_rate), tier.factor);
  const total = days >= 3 ? realTotal(Number(v.base_rate), days) : null;

  return (
    <article
      className="bg-white rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col cursor-pointer"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setActive(0); }}
    >
      {/* Imagen */}
      <div className="aspect-[16/10] bg-muted overflow-hidden relative">
        {images.map((src, i) => (
          <img key={src + i} src={src} alt={v.name} loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 group-hover:scale-105 ${i === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <span className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
          {v.category}
        </span>
        {units > 1 && (
          <span className="absolute top-3 right-3 z-10 bg-navy/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {units} unid.
          </span>
        )}
        {overlapsSelected && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <span className="bg-white text-destructive text-xs font-bold px-3 py-1.5 rounded-full">No disponible en esas fechas</span>
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} type="button" aria-label={`Imagen ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); setActive(i); }}
                className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-base leading-tight">{v.name}</h3>
          <p className="text-xs text-muted-foreground">{v.year}</p>
        </div>

        {/* Specs 2×2 */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-orange flex-shrink-0" />
            {v.seats} pasajeros
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-orange flex-shrink-0" />
            {v.transmission.split(" ")[0]}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Droplets className="h-3.5 w-3.5 text-orange flex-shrink-0" />
            {v.fuel}
          </span>
          {v.ac && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AirVent className="h-3.5 w-3.5 text-orange flex-shrink-0" />
              Aire AC
            </span>
          )}
        </div>

        {/* Chips de características premium */}
        {(v.car_play || v.reverse_camera || v.sunroof || v.cruise_control || v.bluetooth) && (
          <div className="flex flex-wrap gap-1">
            {v.car_play       && <span className="text-[10px] bg-navy/5 text-navy px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Smartphone className="h-3 w-3" />CarPlay</span>}
            {v.reverse_camera && <span className="text-[10px] bg-navy/5 text-navy px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Camera className="h-3 w-3" />Cámara</span>}
            {v.sunroof        && <span className="text-[10px] bg-navy/5 text-navy px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Luggage className="h-3 w-3" />Techo solar</span>}
            {v.cruise_control && <span className="text-[10px] bg-navy/5 text-navy px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Gauge className="h-3 w-3" />Cruise</span>}
            {v.bluetooth      && <span className="text-[10px] bg-navy/5 text-navy px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Bluetooth className="h-3 w-3" />Bluetooth</span>}
          </div>
        )}


        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-orange">US${perDay}<span className="text-sm font-normal text-muted-foreground">/día</span></span>
            {total && <span className="text-sm text-muted-foreground">US${total} total</span>}
            {!total && tier.badge && <span className="text-xs text-orange font-semibold">{tier.badge}</span>}
          </div>
          <div className="mt-2 w-full bg-navy text-white text-sm font-semibold text-center py-2.5 rounded-xl group-hover:bg-orange transition">
            Reservar
          </div>
        </div>
      </div>
    </article>
  );
}
