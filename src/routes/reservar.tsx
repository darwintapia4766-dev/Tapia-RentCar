import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Navbar, Footer, FloatingWhatsApp, WhatsAppIcon } from "@/components/site-chrome";
import { vehicleImage } from "@/lib/vehicle-images";
import { computeBookingPrice } from "@/lib/pricing";
import { whatsappLink } from "@/lib/whatsapp";
import { useServerFn } from "@tanstack/react-start";
import { createBooking } from "@/lib/bookings.functions";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Home, ShieldCheck } from "lucide-react";

const PAYPAL_EMAIL = "darwintapia4766@gmail.com";
const PAYPAL_NET = 20; // lo que Tapia quiere recibir
// Gross-up: PayPal cobra ~4.5% + $0.49 en transacciones internacionales
// Para recibir $20 netos: cliente paga (20 + 0.49) / (1 - 0.045) = ~$21.56 → redondeamos a $22
const PAYPAL_GROSS = 22;

function paypalDepositUrl(vehicleName: string, days: number) {
  const item = encodeURIComponent(`Depósito reserva ${vehicleName} · ${days} días`);
  return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(PAYPAL_EMAIL)}&amount=${PAYPAL_GROSS}&currency_code=USD&item_name=${item}&no_shipping=1`;
}

const searchSchema = z.object({ vehicle: z.string().optional(), start: z.string().optional(), end: z.string().optional() });

const DELIVERY_OPTIONS = [
  { label: "Aeropuerto Las Américas (AILA) — Gratis", fee: 0 as number | null },
  { label: "Hotel en Santo Domingo", fee: null as number | null },
  { label: "Residencia en Santo Domingo", fee: null as number | null },
  { label: "Hotel en Punta Cana", fee: null as number | null },
  { label: "Hotel en La Romana", fee: null as number | null },
  { label: "Hotel en Santiago", fee: null as number | null },
  { label: "Otra dirección", fee: null as number | null },
];

const AILA_OPTION = DELIVERY_OPTIONS[0].label;
const CUSTOM_OPTION = DELIVERY_OPTIONS[6].label;
const AILA_FREE_NOTE = "Entrega gratis en el Aeropuerto Las Américas (AILA). Para otras zonas coordinamos el costo por WhatsApp.";

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}


export const Route = createFileRoute("/reservar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Reservar — Tapia RentCar" },
      { name: "description", content: "Reserva tu vehículo en pocos minutos." },
    ],
  }),
  component: ReservarPage,
});

type Vehicle = {
  id: string;
  name: string;
  year: number;
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

function ReservarPage() {
  const { vehicle: vehicleSearch, start, end } = Route.useSearch();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(vehicleSearch);
  const [startDate, setStartDate] = useState(start ?? "");
  const [endDate, setEndDate] = useState(end ?? "");
  const [deliveryTime, setDeliveryTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const createFn = useServerFn(createBooking);

  useEffect(() => {
    supabase
      .from("vehicles")
      .select("*")
      .eq("available", true)
      .order("sort_order")
      .then(({ data }) => {
        const vs = (data as Vehicle[]) ?? [];
        setVehicles(vs);
        // No auto-seleccionar: el usuario elige el vehículo
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = vehicles.find((v) => v.id === selectedId);
  const isAirportDelivery = deliveryLocation === AILA_OPTION;
  const isCustomLocation = deliveryLocation === CUSTOM_OPTION;
  const finalLocation = isCustomLocation ? customLocation.trim() : deliveryLocation;
  const deliveryOption = DELIVERY_OPTIONS.find((o) => o.label === deliveryLocation);
  const deliveryFee = deliveryOption?.fee ?? 0;
  const deliveryFeeKnown = deliveryOption ? deliveryOption.fee !== null : false;
  const deliveryStatus = !deliveryOption ? "—" : deliveryOption.fee === 0 ? "Gratis" : deliveryOption.fee === null ? "A coordinar por WhatsApp" : `US$${deliveryOption.fee}`;
  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.round((e.getTime() - s.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const price = useMemo(() => {
    if (!selected || days < 3) return null;
    return computeBookingPrice(Number(selected.base_rate), days);
  }, [selected, days]);

  const grandTotal = price ? price.total + (deliveryFeeKnown ? deliveryFee : 0) : null;


  const canSubmit = selected && days >= 3 && finalLocation && deliveryTime && returnTime && clientName.trim() && clientPhone.trim().length >= 6 && clientEmail.trim() && documentId.trim().length >= 3 && price;

  function validateForm() {
    const today = new Date().toISOString().slice(0, 10);
    const next: string[] = [];
    if (!selected) next.push("Selecciona un vehículo");
    if (!startDate || startDate < today) next.push("La fecha de inicio no puede ser en el pasado");
    if (!endDate || days < 3) next.push("El mínimo de renta es 3 días");
    if (!deliveryLocation) next.push("Selecciona el lugar de entrega");
    if (isCustomLocation && customLocation.trim().length < 3) next.push("Escribe la dirección de entrega");
    if (!deliveryTime) next.push("Indica la hora de entrega");
    if (!returnTime) next.push("Indica la hora de devolución");
    if (!clientName.trim()) next.push("Ingresa tu nombre completo");
    if (clientPhone.trim().length < 6) next.push("Ingresa tu número de WhatsApp");
    if (!clientEmail.trim()) next.push("Ingresa tu correo electrónico");
    if (documentId.trim().length < 3) next.push("Ingresa tu cédula o pasaporte");
    setErrors(next);
    return next.length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm() || !canSubmit || !selected || !price) return;
    setSubmitting(true);
    try {
      const combinedTime = `Entrega ${deliveryTime} · Devolución ${returnTime}`;
      const result = await createFn({
        data: {
          vehicleId: selected.id,
          vehicleName: `${selected.name} ${selected.year}`,
          startDate,
          endDate,
          days,
          deliveryTime: combinedTime,
          deliveryLocation: finalLocation,
          deliveryFee: deliveryFeeKnown ? deliveryFee : 0,
          clientName,
          clientEmail,
          clientPhone,
          documentId: documentId.trim(),
          flightNumber: flightNumber.trim() || undefined,
        },
      });
      setBookingId(result.booking.id);
      const subtotal = price.total;
      const totalLine = deliveryFeeKnown
        ? `💰 Total: $${subtotal + deliveryFee} (vehículo $${subtotal} + entrega $${deliveryFee})`
        : `💰 Total: $${subtotal} + entrega a coordinar`;
      const msg = [
        "Hola Tapia RentCar! Quiero solicitar una reserva:",
        `🚗 Vehículo: ${selected.name} ${selected.year}`,
        `📅 Desde: ${startDate}`,
        `📅 Hasta: ${endDate} (${days} días)`,
        `⏰ Hora de entrega: ${deliveryTime}`,
        `⏰ Hora de devolución: ${returnTime}`,
        `📍 Lugar de entrega: ${finalLocation}`,
        `🚚 Entrega: ${deliveryStatus}`,
        totalLine,
        `👤 Nombre: ${clientName}`,
        `🪪 Documento: ${documentId}`,
        `📧 Correo: ${clientEmail}`,
        `📱 WhatsApp: ${clientPhone}`,
        ...(isAirportDelivery && flightNumber.trim() ? [`✈️ Número de vuelo: ${flightNumber.trim()}`] : []),
        "Por favor confirmar disponibilidad.",
      ].join("\n");
      window.open(whatsappLink(msg), "_blank");
      toast.success("¡Solicitud enviada!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear la reserva";
      toast.error(message);
      setErrors([message]);
    } finally {
      setSubmitting(false);
    }
  }

  if (bookingId) {
    const shortCode = bookingId.slice(0, 8).toUpperCase();
    const vehicleLabel = selected ? `${selected.name} ${selected.year}` : "vehículo";
    const paypalUrl = paypalDepositUrl(vehicleLabel, days);
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 sm:px-6 py-16 grid place-items-center">
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm w-full">
            <div className="mx-auto h-14 w-14 rounded-full bg-whatsapp/10 text-whatsapp grid place-items-center">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-bold">¡Solicitud enviada!</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Tu reserva quedó registrada para <strong>{vehicleLabel}</strong>.
            </p>
            <div className="mt-4 bg-navy/5 border border-navy/20 rounded-xl px-5 py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Código de reserva</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-navy mt-1">{shortCode}</p>
              <p className="text-xs text-muted-foreground mt-1">Guárdalo para consultar o cancelar tu reserva en <strong>/mi-reserva</strong></p>
            </div>

            <div className="mt-6 bg-orange/5 border border-orange/20 rounded-xl p-5">
              <div className="flex items-center justify-center gap-2 text-orange font-semibold mb-1">
                <ShieldCheck className="h-5 w-5" /> Asegura tu reserva
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Paga <strong className="text-foreground">US${PAYPAL_GROSS}</strong> por PayPal para garantizar tu vehículo
                <span className="block mt-1 text-xs">(incluye comisión de procesamiento · depósito neto US${PAYPAL_NET})</span>
                El resto lo pagas en efectivo al recoger el carro.
              </p>
              <a
                href={paypalUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold px-6 py-3.5 rounded-lg transition shadow-md"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79A.859.859 0 0 1 5.79 2h7.816c2.67 0 4.545.822 5.227 2.588.288.745.344 1.496.22 2.333-.01.066-.02.132-.03.2v.556l.373.212c.312.176.59.405.826.68.458.536.676 1.233.635 2.07-.054 1.068-.36 2.004-.907 2.782-.49.7-1.126 1.24-1.89 1.604-.74.352-1.605.53-2.568.53h-.61a1.83 1.83 0 0 0-1.807 1.544l-.133.72-.754 4.775-.034.19a.14.14 0 0 1-.138.12H7.076z"/>
                  <path d="M20.55 7.262c-.014.09-.03.182-.047.276-.654 3.36-2.893 4.521-5.75 4.521H13.34a.707.707 0 0 0-.698.598l-.745 4.725-.211 1.338a.372.372 0 0 0 .368.43h2.584a.62.62 0 0 0 .613-.524l.025-.13.486-3.084.031-.17a.62.62 0 0 1 .613-.524h.386c2.5 0 4.458-.995 5.03-3.875.239-1.228.115-2.254-.519-2.976a2.473 2.473 0 0 0-.753-.604z"/>
                </svg>
                Pagar US$20 depósito con PayPal
              </a>
              <p className="mt-3 text-xs text-muted-foreground">
                Opcional pero recomendado. Puedes también coordinar el pago por WhatsApp.
              </p>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappLink(`Hola Tapia RentCar! Acabo de enviar mi solicitud de reserva para ${vehicleLabel}. Mi nombre es ${clientName}.`)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-whatsapp text-white font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition"
              >
                <WhatsAppIcon className="h-4 w-4" /> Confirmar por WhatsApp
              </a>
              <Link
                to="/"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-muted text-foreground font-semibold px-4 py-2.5 rounded-lg hover:bg-muted/70 transition"
              >
                <Home className="h-4 w-4" /> Volver al inicio
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold">Reservar vehículo</h1>
        <p className="mt-2 text-muted-foreground">Mínimo 3 días. Te contactaremos por WhatsApp para confirmar.</p>

        <div className="mt-6 bg-whatsapp/10 border border-whatsapp/20 rounded-xl p-4 text-sm text-foreground/80">
          No necesitas iniciar sesión. Completa tus datos y te contactaremos por WhatsApp.
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Section title="1. Elige tu vehículo">
              {selected ? (
                <div className="rounded-xl border-2 border-orange overflow-hidden shadow-lg">
                  <div className="aspect-[4/3] bg-muted sm:aspect-[16/6]">
                    <img src={selected.images?.[0] ?? vehicleImage(selected.name)} alt={selected.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{selected.name}</div>
                      <div className="text-xs text-muted-foreground">{selected.year}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-orange font-bold">US${Math.ceil(Number(selected.base_rate))}<span className="text-xs text-muted-foreground">/d</span></div>
                      <button type="button" onClick={() => setSelectedId(undefined)} className="text-xs font-semibold underline text-muted-foreground hover:text-orange">
                        Cambiar
                      </button>
                    </div>
                  </div>
                  <VehicleSpecs v={selected} />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {vehicles.map((v) => {
                    const img = v.images?.[0] ?? vehicleImage(v.name);
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setSelectedId(v.id)}
                        className="text-left rounded-xl border-2 border-border hover:border-orange/50 overflow-hidden transition"
                      >
                        <div className="aspect-[4/3] bg-muted">
                          <img src={img} alt={v.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm">{v.name}</div>
                            <div className="text-xs text-muted-foreground">{v.year}</div>
                          </div>
                          <div className="text-orange font-bold">US${Math.ceil(Number(v.base_rate))}<span className="text-xs text-muted-foreground">/d</span></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Section>

            {selected && (
              <>


            <Section title="2. Fechas y entrega">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Fecha inicio">
                  <input type="date" required value={startDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Fecha fin">
                  <input type="date" required value={endDate} min={startDate || new Date().toISOString().slice(0, 10)} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Hora de entrega">
                  <select required value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className={inputCls}>
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Hora de devolución">
                  <select required value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className={inputCls}>
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Lugar de entrega" className="sm:col-span-2">
                  <select required value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} className={inputCls}>
                    <option value="">Selecciona el lugar de entrega</option>
                    {DELIVERY_OPTIONS.map((option) => (
                      <option key={option.label} value={option.label}>
                        {option.label}{option.fee && option.fee > 0 ? ` — US$${option.fee}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-muted-foreground">{AILA_FREE_NOTE}</p>
                </Field>
                {isCustomLocation && (
                  <Field label="Escribe tu dirección de entrega" className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Ej: Calle Duarte #12, Bávaro, Punta Cana"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      maxLength={250}
                      className={inputCls}
                    />
                  </Field>
                )}
                {isAirportDelivery && (
                  <Field label="Número de vuelo (opcional)" className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Ej: AA1234 — puedes dejarlo en blanco si aún no lo sabes"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                      maxLength={20}
                      className={inputCls}
                    />
                  </Field>
                )}
              </div>
              {deliveryLocation && (
                <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  deliveryFee === 0 && deliveryFeeKnown ? "bg-whatsapp/10 text-whatsapp"
                  : deliveryFeeKnown ? "bg-navy/10 text-navy"
                  : "bg-orange/10 text-orange"
                }`}>
                  {deliveryFeeKnown ? (deliveryFee === 0 ? "Entrega gratis" : `Entrega US$${deliveryFee}`) : "Costo de entrega a coordinar"}
                </div>
              )}
              {deliveryLocation && !deliveryFeeKnown && (
                <p className="mt-3 text-sm text-muted-foreground">El costo de entrega será coordinado por WhatsApp según tu ubicación.</p>
              )}
              {startDate && endDate && days < 3 && (
                <p className="mt-3 text-sm text-destructive">El mínimo de renta es 3 días.</p>
              )}
            </Section>

            <Section title="3. Tus datos">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nombre completo">
                  <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Cédula o pasaporte">
                  <input type="text" required placeholder="001-1234567-8" value={documentId} onChange={(e) => setDocumentId(e.target.value)} maxLength={40} className={inputCls} />
                </Field>
                <Field label="Teléfono / WhatsApp">
                  <input type="tel" required placeholder="+1 809..." value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Correo electrónico">
                  <input type="email" required value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={inputCls} />
                </Field>
              </div>
            </Section>
            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              </div>
            )}
              </>
            )}
          </div>


          <aside className="lg:col-span-1">
            <div className="sticky top-20 bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-lg">Resumen</h3>
              {selected && (
                <div className="mt-4 flex gap-3">
                  <img src={selected.images?.[0] ?? vehicleImage(selected.name)} alt="" className="h-16 w-20 rounded-md object-cover" />
                  <div>
                    <div className="font-semibold text-sm">{selected.name}</div>
                    <div className="text-xs text-muted-foreground">{selected.year}</div>
                  </div>
                </div>
              )}
              <div className="mt-5 space-y-2 text-sm">
                <Row label="Días" value={days ? `${days}` : "—"} />
                <Row label="Precio/día" value={price ? `US$${price.perDay}` : "—"} />
                <Row label="Subtotal vehículo" value={price ? `US$${price.total}` : "—"} />
                <Row label="Entrega" value={deliveryStatus} />
                <Row label="Hora entrega" value={deliveryTime} />
                <Row label="Hora devolución" value={returnTime} />
                {isCustomLocation && customLocation && (
                  <Row label="Dirección" value={customLocation.length > 24 ? customLocation.slice(0, 24) + "…" : customLocation} />
                )}
                {isAirportDelivery && flightNumber && (
                  <Row label="Vuelo" value={flightNumber} />
                )}
              </div>
              <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-orange">
                  {grandTotal !== null ? `US$${grandTotal}${!deliveryFeeKnown ? " +" : ""}` : "—"}
                </span>
              </div>
              {!deliveryFeeKnown && deliveryLocation && (
                <p className="mt-1 text-[11px] text-muted-foreground text-right">+ entrega a coordinar</p>
              )}
              <button
                type="submit"
                disabled={!canSubmit || submitting || !!bookingId}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-orange text-orange-foreground font-semibold px-4 py-3 rounded-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : bookingId ? <CheckCircle2 className="h-4 w-4" /> : <WhatsAppIcon className="h-4 w-4" />}
                {bookingId ? "Reserva creada" : "Solicitar reserva"}
              </button>
              <p className="mt-3 text-xs text-muted-foreground text-center">Al confirmar te abriremos WhatsApp con los detalles.</p>
            </div>
          </aside>
        </form>

        <p className="mt-8 text-sm text-muted-foreground">
          ¿Prefieres reservar directo? <Link to="/" className="underline">Volver al inicio</Link>
        </p>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="font-bold text-lg mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function VehicleSpecs({ v }: { v: Vehicle }) {
  const basics: { label: string; value?: string | number | null }[] = [
    { label: "Pasajeros", value: v.seats },
    { label: "Transmisión", value: v.transmission },
    { label: "Motor", value: v.engine },
    { label: "Tracción", value: v.traction },
    { label: "Combustible", value: v.fuel },
    { label: "Equipaje", value: v.luggage },
  ].filter((b) => b.value !== null && b.value !== undefined && b.value !== "");

  const features: { label: string; on: boolean }[] = [
    { label: "Aire acondicionado", on: !!v.ac },
    { label: "Airbags", on: !!v.airbags },
    { label: "Bluetooth", on: !!v.bluetooth },
    { label: "USB", on: !!v.usb },
    { label: "Pantalla táctil", on: !!v.touchscreen },
    { label: "CarPlay / Android Auto", on: !!v.car_play },
    { label: "Cámara de reversa", on: !!v.reverse_camera },
    { label: "Sensores de parqueo", on: !!v.parking_sensors },
    { label: "Control crucero", on: !!v.cruise_control },
    { label: "Asientos de cuero", on: !!v.leather_seats },
    { label: "Encendido sin llave", on: !!v.keyless_start },
    { label: "Cargador inalámbrico", on: !!v.wireless_charger },
    { label: "Techo solar", on: !!v.sunroof },
  ].filter((f) => f.on);
  const extras = (v.extra_features ?? []).filter(Boolean);

  if (basics.length === 0 && features.every((f) => !f.on) && extras.length === 0) return null;

  return (
    <div className="border-t border-border bg-muted/30">
      <div className="px-4 pt-3 pb-2 text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
        Especificaciones
      </div>
      <div className="max-h-56 overflow-y-auto px-4 pb-4 space-y-3 [scrollbar-width:thin]">
        {basics.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {basics.map((b) => (
              <div key={b.label} className="flex justify-between border-b border-border/40 pb-1">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-medium text-right">{b.value}</span>
              </div>
            ))}
          </div>
        )}
        {features.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-whatsapp" />
                <span className="truncate">{f.label}</span>
              </div>
            ))}
          </div>
        )}
        {extras.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {extras.map((e) => (
              <span key={e} className="text-xs bg-background border border-border rounded-full px-2 py-0.5 text-muted-foreground">{e}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
