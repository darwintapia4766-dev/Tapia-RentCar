import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { lookupBooking, cancelBookingPublic } from "@/lib/bookings.functions";
import { whatsappLink } from "@/lib/whatsapp";
import { Navbar, Footer, FloatingWhatsApp, WhatsAppIcon } from "@/components/site-chrome";
import {
  Search, Car, Calendar, MapPin, Clock, CheckCircle2,
  XCircle, AlertTriangle, Loader2, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/mi-reserva")({
  head: () => ({ meta: [{ title: "Consultar reserva — Tapia RentCar" }] }),
  component: MyReservationPage,
});

type Booking = {
  id: string;
  vehicle_name: string;
  start_date: string;
  end_date: string;
  days: number;
  delivery_location: string;
  delivery_time: string;
  total_price: number;
  status: string;
  client_name: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pendiente:  { label: "Pendiente de confirmación", className: "bg-orange/15 text-orange" },
  confirmado: { label: "Confirmada",                 className: "bg-emerald-100 text-emerald-700" },
  completado: { label: "Completada",                 className: "bg-slate-200 text-slate-700" },
  cancelado:  { label: "Cancelada",                  className: "bg-red-100 text-red-600" },
};

function MyReservationPage() {
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupFn = useServerFn(lookupBooking);
  const cancelFn = useServerFn(cancelBookingPublic);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase().replace(/\s/g, "");
    if (trimmed.length < 4) return;
    setSearching(true);
    setNotFound(false);
    setBooking(null);
    setError(null);
    setCancelled(false);
    try {
      const res = await lookupFn({ data: { code: trimmed } });
      if (res.booking) {
        setBooking(res.booking as Booking);
      } else {
        setNotFound(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al buscar");
    } finally {
      setSearching(false);
    }
  }

  async function handleCancel() {
    if (!booking) return;
    if (!confirm("¿Confirmas que deseas cancelar esta reserva? Esta acción no se puede deshacer.")) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelFn({ data: { id: booking.id } });
      setCancelled(true);
      setBooking({ ...booking, status: "cancelado" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cancelar");
    } finally {
      setCancelling(false);
    }
  }

  const shortCode = booking ? booking.id.slice(0, 8).toUpperCase() : "";
  const status = booking ? STATUS_STYLES[booking.status] ?? { label: booking.status, className: "bg-muted text-muted-foreground" } : null;

  const modifyMsg = booking
    ? `Hola Tapia RentCar, quisiera modificar mi reserva.\nCódigo: ${shortCode}\nVehículo: ${booking.vehicle_name}\nFechas actuales: ${booking.start_date} → ${booking.end_date}\n\nCambio que necesito: `
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 sm:px-6 py-12">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Consultar reserva</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Ingresa el código de 8 caracteres que recibiste al confirmar tu reserva.
          </p>
        </div>

        {/* Buscador */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ej: A3F7B2C1"
            maxLength={36}
            className="flex-1 rounded-lg border border-border bg-card px-4 py-3 font-mono text-lg tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
          <button
            type="submit"
            disabled={searching || code.trim().length < 4}
            className="bg-orange text-white px-5 py-3 rounded-lg font-semibold hover:brightness-110 disabled:opacity-50 transition flex items-center gap-2"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </button>
        </form>

        {/* Estados */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        {notFound && (
          <div className="mt-6 text-center py-10 border border-border rounded-2xl bg-card">
            <XCircle className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="mt-3 font-semibold">No encontramos esa reserva</p>
            <p className="mt-1 text-sm text-muted-foreground">Verifica el código e intenta de nuevo.</p>
          </div>
        )}

        {/* Detalle de reserva */}
        {booking && status && (
          <div className="mt-6 bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-navy text-white px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Código de reserva</p>
                <p className="text-2xl font-mono font-bold tracking-widest">{shortCode}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${status.className}`}>
                {status.label}
              </span>
            </div>

            {/* Info */}
            <div className="px-6 py-5 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Car className="h-4 w-4 text-orange flex-shrink-0" />
                <span className="font-semibold">{booking.vehicle_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-orange flex-shrink-0" />
                <span>{booking.start_date} → {booking.end_date} <span className="text-muted-foreground">({booking.days} días)</span></span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-orange flex-shrink-0" />
                <span>{booking.delivery_location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-orange flex-shrink-0" />
                <span>{booking.delivery_time}</span>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-orange">US${Number(booking.total_price)}</span>
              </div>
            </div>

            {/* Acciones */}
            {cancelled && (
              <div className="mx-6 mb-5 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> Reserva cancelada correctamente.
              </div>
            )}

            {booking.status === "pendiente" && !cancelled && (
              <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappLink(modifyMsg)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-whatsapp text-white font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition text-sm"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Solicitar cambio
                </a>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 inline-flex items-center justify-center gap-2 border border-destructive text-destructive font-semibold px-4 py-2.5 rounded-lg hover:bg-destructive/5 transition text-sm disabled:opacity-50"
                >
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Cancelar reserva
                </button>
              </div>
            )}

            {booking.status === "confirmado" && (
              <div className="px-6 pb-6">
                <a
                  href={whatsappLink(modifyMsg)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-whatsapp text-white font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition text-sm"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Coordinar cambio por WhatsApp
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Volver al inicio
          </Link>
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
