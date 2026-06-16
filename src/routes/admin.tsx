import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Navbar, Footer, WhatsAppIcon } from "@/components/site-chrome";
import { useSession } from "@/routes/__root";
import { isAdmin, listClients } from "@/lib/admin.functions";
import { listAllBookings, updateBookingStatus, updateBookingFlight, deleteBooking } from "@/lib/bookings.functions";
import { upsertVehicle, deleteVehicle, reorderVehicles } from "@/lib/vehicles.functions";
import { upsertService, deleteService } from "@/lib/services.functions";
import { updateSetting } from "@/lib/site-settings.functions";
import { useSiteSettings, whatsappFromSettings } from "@/lib/use-site-settings";
import { VehicleImageUploader } from "@/components/admin/VehicleImageUploader";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Save, Calendar as CalendarIcon, Download, Search, Eye, EyeOff, Lock, KeyRound, ExternalLink, X, MapPin, Clock, Plane, DollarSign, CalendarDays, User, Phone, Mail, FileText, Car, FileDown } from "lucide-react";
import { generateBookingPdf, bookingShortCode } from "@/lib/booking-pdf";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Tapia RentCar" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Blocked = { start: string; end: string; label: string };
type Vehicle = {
  id: string;
  name: string;
  year: number;
  category: string;
  base_rate: number;
  available: boolean;
  units: number;
  images: string[];
  blocked_dates: Blocked[];
  sort_order: number;
  license_plate: string | null;
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
type Booking = {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  document_id: string | null;
  vehicle_name: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  days: number;
  total_price: number;
  price_per_day: number;
  status: string;
  created_at: string;
  delivery_location: string | null;
  delivery_time: string;
  flight_number: string | null;
};
type Service = {
  id: string;
  name: string;
  description: string;
  price_text: string;
  visible: boolean;
  sort_order: number;
};
type Client = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  document_id: string | null;
  created_at: string;
  bookings_count: number;
};

const TABS = [
  { id: "reservas", label: "Reservas" },
  { id: "calendario", label: "Calendario" },
  { id: "vehiculos", label: "Vehículos" },
  { id: "servicios", label: "Servicios" },
  { id: "clientes", label: "Clientes" },
  { id: "config", label: "Configuración" },
  { id: "cuenta", label: "Cuenta" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function AdminPage() {
  const { session, loading } = useSession();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabId>("reservas");
  const isAdminFn = useServerFn(isAdmin);

  useEffect(() => {
    if (loading || !session) {
      setAdmin(loading ? null : false);
      return;
    }
    isAdminFn().then((r) => setAdmin(r.isAdmin)).catch(() => setAdmin(false));
  }, [session, loading, isAdminFn]);

  if (loading || admin === null) {
    return (
      <Shell>
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </Shell>
    );
  }
  if (!session) {
    return (
      <Shell>
        <div className="max-w-md mx-auto text-center py-20">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Para entrar como administrador, haz <strong>5 clics rápidos en el logo</strong> de Tapia RentCar e ingresa tu contraseña.
          </p>
          <Link to="/" className="mt-6 inline-block bg-navy text-white font-semibold px-6 py-3 rounded-md">Volver al inicio</Link>
        </div>
      </Shell>
    );
  }
  if (!admin) {
    return (
      <Shell>
        <div className="max-w-md mx-auto text-center py-20">
          <h1 className="text-2xl font-bold">Acceso denegado</h1>
          <p className="mt-2 text-muted-foreground">Tu cuenta no tiene permisos de administrador.</p>
          <Link to="/" className="mt-6 inline-block bg-navy text-white font-semibold px-6 py-3 rounded-md">Volver al inicio</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Panel de administración</h1>
        <p className="text-muted-foreground mt-1">Gestiona reservas, flota, servicios y configuración del sitio.</p>
      </div>
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition ${
              tab === t.id ? "border-orange text-orange" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "reservas" && <BookingsTab />}
      {tab === "calendario" && <CalendarTab />}
      {tab === "vehiculos" && <VehiclesTab />}
      {tab === "servicios" && <ServicesTab />}
      {tab === "clientes" && <ClientsTab />}
      {tab === "config" && <ConfigTab />}
      {tab === "cuenta" && <AccountTab />}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">{children}</main>
      <Footer />
    </div>
  );
}

/* ---------- RESERVAS ---------- */

function BookingsTab() {
  const settings = useSiteSettings();
  const listFn = useServerFn(listAllBookings);
  const updateFn = useServerFn(updateBookingStatus);
  const updateFlightFn = useServerFn(updateBookingFlight);
  const deleteFn = useServerFn(deleteBooking);
  const [rows, setRows] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>("todos");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);

  const load = useCallback(async () => {
    try {
      const { bookings } = await listFn();
      setRows(bookings as Booking[]);
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin_bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  async function changeStatus(id: string, status: string) {
    try {
      await updateFn({ data: { id, status: status as "pendiente" | "confirmado" | "completado" | "cancelado" } });
      toast.success("Estado actualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  async function saveFlight(id: string, flightNumber: string) {
    try {
      await updateFlightFn({ data: { id, flightNumber } });
      toast.success("Vuelo guardado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  async function removeBooking(b: Booking) {
    if (!confirm(`¿Eliminar definitivamente la reserva de ${b.client_name} (${b.vehicle_name}, ${b.start_date})?\n\nEsta acción no se puede deshacer.`)) return;
    try {
      await deleteFn({ data: { id: b.id } });
      toast.success("Reserva eliminada.");
      setRows((prev) => prev.filter((r) => r.id !== b.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  const filtered = rows.filter((b) => {
    if (filter !== "todos" && b.status !== filter) return false;
    if (q && !b.client_name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <section>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre del cliente"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-md border border-border bg-background text-sm">
          <option value="todos">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="confirmado">Confirmadas</option>
          <option value="completado">Completadas</option>
          <option value="cancelado">Canceladas</option>
        </select>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <div className="overflow-x-auto bg-card border border-border rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Cliente</Th><Th>Documento</Th><Th>Teléfono</Th><Th>Vehículo</Th><Th>Fechas</Th><Th>Días</Th><Th>Vuelo</Th><Th>Total</Th><Th>Estado</Th><Th>Acción</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">Sin reservas</td></tr>
              ) : filtered.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-border cursor-pointer hover:bg-muted/40 transition"
                  onClick={() => setSelected(b)}
                >
                  <Td><div className="font-medium">{b.client_name}</div><div className="text-xs text-muted-foreground">{b.client_email}</div></Td>
                  <Td className="text-xs">{b.document_id ?? "—"}</Td>
                  <Td>{b.client_phone}</Td>
                  <Td>{b.vehicle_name}</Td>
                  <Td>{b.start_date} → {b.end_date}</Td>
                  <Td>{b.days}</Td>
                  <Td onClick={(e) => e.stopPropagation()}><FlightCell value={b.flight_number ?? ""} onSave={(v) => saveFlight(b.id, v)} /></Td>
                  <Td className="font-bold text-orange">US${Number(b.total_price)}</Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <StatusPicker value={b.status} onChange={(s) => changeStatus(b.id, s)} />
                  </Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={whatsappFromSettings(settings.whatsapp_number, `Hola ${b.client_name}, sobre tu reserva de ${b.vehicle_name} del ${b.start_date} al ${b.end_date}.`)}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 bg-whatsapp text-white text-xs font-semibold px-2.5 py-1.5 rounded"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={() => removeBooking(b)}
                        title="Eliminar reserva"
                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-red-600/40 text-red-600 hover:bg-red-600 hover:text-white transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <BookingDetailDialog booking={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

const STATUS_OPTIONS: Array<{ value: "pendiente" | "confirmado" | "completado" | "cancelado"; label: string; cls: string }> = [
  { value: "pendiente", label: "Pendiente", cls: "bg-orange-500 text-white border-orange-500" },
  { value: "confirmado", label: "Confirmada", cls: "bg-green-600 text-white border-green-600" },
  { value: "completado", label: "Completada", cls: "bg-muted text-foreground border-border" },
  { value: "cancelado", label: "Cancelada", cls: "bg-red-600 text-white border-red-600" },
];

function StatusPicker({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const current = STATUS_OPTIONS.find((o) => o.value === value);
  const cls = current?.cls ?? "bg-background text-foreground border-border";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs font-semibold rounded-full border px-2.5 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${cls}`}
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value} className="bg-background text-foreground">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function FlightCell({ value, onSave }: { value: string; onSave: (v: string) => void | Promise<void> }) {
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value]);
  const dirty = v.trim() !== (value ?? "").trim();
  const query = encodeURIComponent(`vuelo ${v.trim()}`);
  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="—"
        maxLength={20}
        className="w-24 text-xs border border-border rounded px-2 py-1 bg-background"
      />
      {v.trim() && (
        <a
          href={`https://www.google.com/search?q=${query}`}
          target="_blank"
          rel="noreferrer"
          title="Buscar vuelo en Google"
          className="text-muted-foreground hover:text-orange"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {dirty && (
        <button onClick={() => onSave(v)} className="text-[10px] bg-navy text-white font-semibold px-2 py-1 rounded">
          OK
        </button>
      )}
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => <th className="px-3 py-2 font-semibold">{children}</th>;
const Td = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: React.MouseEventHandler<HTMLTableCellElement> }) => (
  <td className={`px-3 py-3 ${className}`} onClick={onClick}>{children}</td>
);

function BookingDetailDialog({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  if (!booking) return null;
  const statusLabel: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    completado: "Completado",
    cancelado: "Cancelado",
  };
  const statusColor: Record<string, string> = {
    pendiente: "bg-orange-500 text-white",
    confirmado: "bg-green-600 text-white",
    completado: "bg-muted text-muted-foreground",
    cancelado: "bg-red-600 text-white",
  };
  const settings = useSiteSettings();
  const code = bookingShortCode(booking.id);
  const waMsg = `Hola ${booking.client_name}, le envío el comprobante de su reserva *${code}* en Tapia Rent Car (${booking.vehicle_name}, ${booking.start_date} → ${booking.end_date}). Cualquier consulta o cambio, indíqueme este código. ¡Gracias!`;
  const waHref = whatsappFromSettings(booking.client_phone || settings.whatsapp_number, waMsg);
  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de la reserva</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg bg-muted/50 border border-border px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Código de reserva</div>
              <div className="text-base font-bold tracking-wider">{code}</div>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[booking.status] ?? "bg-muted text-muted-foreground"}`}>
              {statusLabel[booking.status] ?? booking.status}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground"><User className="h-3.5 w-3.5" /> Cliente</div>
              <div className="font-medium">{booking.client_name}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> Correo</div>
              <div className="font-medium">{booking.client_email}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> Teléfono</div>
              <div className="font-medium">{booking.client_phone}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground"><FileText className="h-3.5 w-3.5" /> Documento</div>
              <div className="font-medium">{booking.document_id ?? "—"}</div>
            </div>
          </div>
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex items-center gap-1.5 text-muted-foreground"><Car className="h-3.5 w-3.5" /> Vehículo</div>
            <div className="font-medium">{booking.vehicle_name}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> Fechas</div>
              <div className="font-medium">{booking.start_date} → {booking.end_date}</div>
              <div className="text-muted-foreground">{booking.days} días</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Hora de entrega</div>
              <div className="font-medium">{booking.delivery_time}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Lugar de entrega</div>
              <div className="font-medium">{booking.delivery_location ?? "—"}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground"><Plane className="h-3.5 w-3.5" /> Vuelo</div>
              <div className="font-medium">{booking.flight_number ?? "—"}</div>
            </div>
          </div>
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /> Precio</div>
              <div className="font-medium">US${Number(booking.price_per_day).toFixed(2)}/día</div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground">Total</div>
              <div className="text-xl font-bold text-orange">US${Number(booking.total_price).toFixed(2)}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">Reservado el {new Date(booking.created_at).toLocaleDateString("es-DO")}</div>

          <div className="border-t border-border pt-3 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => generateBookingPdf(booking)}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-orange text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-orange/90 transition"
            >
              <FileDown className="h-4 w-4" /> Descargar PDF
            </button>
            <a
              href={waHref}
              target="_blank" rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-whatsapp text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition"
            >
              <WhatsAppIcon className="h-4 w-4" /> Abrir WhatsApp
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground text-center -mt-2">
            Descargue el PDF y adjúntelo en el chat de WhatsApp del cliente.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- CALENDARIO ---------- */

function CalendarTab() {
  const listFn = useServerFn(listAllBookings);
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<Booking | null>(null);

  const load = useCallback(async () => {
    try {
      const { bookings } = await listFn();
      setRows(bookings as Booking[]);
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin_calendar")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const monthLabel = cursor.toLocaleDateString("es-DO", { month: "long", year: "numeric" });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = useMemo(
    () => rows
      .filter((b) => b.status !== "cancelado" && b.end_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 20),
    [rows, today],
  );

  const cells: Date[] = [];
  for (let i = 0; i < totalCells; i++) {
    cells.push(new Date(year, month, i - startWeekday + 1));
  }

  function statusClasses(status: string) {
    if (status === "confirmado") return "bg-green-600 text-white";
    if (status === "pendiente") return "bg-orange-500 text-white";
    if (status === "cancelado") return "bg-red-600 text-white line-through";
    if (status === "completado") return "bg-muted text-muted-foreground";
    return "bg-muted text-muted-foreground";
  }

  function eventsForDay(d: Date) {
    const iso = d.toISOString().slice(0, 10);
    const events: { booking: Booking; kind: "entrega" | "regreso" }[] = [];
    for (const b of rows) {
      if (b.start_date === iso) events.push({ booking: b, kind: "entrega" });
      if (b.end_date === iso) events.push({ booking: b, kind: "regreso" });
    }
    return events;
  }

  return (
    <section className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-orange" />
            <h2 className="text-lg font-bold capitalize">{monthLabel}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="px-3 py-1.5 rounded-md border border-border text-sm">‹ Anterior</button>
            <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="px-3 py-1.5 rounded-md border border-border text-sm">Hoy</button>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="px-3 py-1.5 rounded-md border border-border text-sm">Siguiente ›</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs mb-3">
          <Legend color="bg-green-600" label="Confirmada" />
          <Legend color="bg-orange-500" label="Pendiente" />
          <Legend color="bg-red-600" label="Cancelada" />
          <Legend color="bg-muted" label="Completada" />
        </div>
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
          <div className="grid grid-cols-7 gap-1 text-xs">
            {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (
              <div key={d} className="text-center font-semibold text-muted-foreground py-1">{d}</div>
            ))}
            {cells.map((d, i) => {
              const inMonth = d.getMonth() === month;
              const iso = d.toISOString().slice(0, 10);
              const isToday = iso === today;
              const events = eventsForDay(d);
              return (
                <div
                  key={i}
                  className={`min-h-[88px] rounded-md border p-1 ${
                    inMonth ? "bg-background border-border" : "bg-muted/30 border-border/40 opacity-60"
                  } ${isToday ? "ring-2 ring-orange" : ""}`}
                >
                  <div className="text-[11px] font-semibold mb-1 flex justify-end">{d.getDate()}</div>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map((e, idx) => (
                      <div
                        key={`${e.booking.id}-${e.kind}-${idx}`}
                        title={`${e.kind === "entrega" ? "Entrega" : "Regreso"}: ${e.booking.client_name} · ${e.booking.vehicle_name} (${e.booking.status})`}
                        className={`truncate rounded px-1 py-0.5 text-[10px] cursor-pointer hover:opacity-90 ${statusClasses(e.booking.status)}`}
                        onClick={() => setSelected(e.booking)}
                      >
                        {e.kind === "entrega" ? "▶ " : "◀ "}{e.booking.vehicle_name}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">+{events.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="font-bold mb-3">Próximas reservas</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay reservas próximas.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="py-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/40 rounded px-1 -mx-1 transition"
                onClick={() => setSelected(b)}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{b.vehicle_name} · {b.client_name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {b.start_date} → {b.end_date}
                    {b.flight_number ? ` · ✈ ${b.flight_number}` : ""}
                    {b.delivery_location ? ` · ${b.delivery_location}` : ""}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                  b.status === "confirmado" ? "bg-green-600 text-white"
                  : b.status === "pendiente" ? "bg-orange-500 text-white"
                  : b.status === "cancelado" ? "bg-red-600 text-white"
                  : "bg-muted text-muted-foreground"
                }`}>{b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <BookingDetailDialog booking={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

/* ---------- VEHICULOS ---------- */

function VehiclesTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [creating, setCreating] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const reorderFn = useServerFn(reorderVehicles);

  const load = useCallback(async () => {
    const { data } = await supabase.from("vehicles").select("*").order("sort_order");
    setVehicles((data as unknown as Vehicle[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin_vehicles")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setOverIdx(idx); }

  async function handleDrop(dropIdx: number) {
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setOverIdx(null); return; }
    const next = [...vehicles];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(dropIdx, 0, moved);
    setVehicles(next);
    setDragIdx(null);
    setOverIdx(null);
    setSaving(true);
    try {
      await reorderFn({ data: { ids: next.map((v) => v.id) } });
      toast.success("Orden guardado.");
    } catch {
      toast.error("Error al guardar el orden.");
      load();
    } finally { setSaving(false); }
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold">Flota ({vehicles.length})</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Arrastra las tarjetas para cambiar el orden</p>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin text-orange" />}
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 bg-orange text-orange-foreground font-semibold px-4 py-2 rounded-md text-sm">
            <Plus className="h-4 w-4" /> Nuevo vehículo
          </button>
        </div>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v, idx) => (
            <article
              key={v.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
              className={`bg-card border rounded-2xl overflow-hidden transition-all cursor-grab active:cursor-grabbing select-none ${
                dragIdx === idx ? "opacity-40 scale-95" : ""
              } ${overIdx === idx && dragIdx !== idx ? "border-orange shadow-lg scale-[1.02]" : "border-border"}`}
            >
              <div className="aspect-[4/3] bg-muted relative">
                {v.images?.[0]
                  ? <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sin foto</div>
                }
                <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  #{idx + 1}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{v.name}</h3>
                    <p className="text-xs text-muted-foreground">{v.year} · {v.category} · {v.units ?? 1} {(v.units ?? 1) === 1 ? "unidad" : "unidades"}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.available ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                    {v.available ? "Disponible" : "Ocupado"}
                  </span>
                </div>
                <div className="mt-2 text-orange font-bold">US${Number(v.base_rate)}/día</div>
                <div className="mt-3">
                  <button
                    onClick={() => setEditing(v)}
                    className="w-full bg-navy text-white text-sm font-semibold py-2 rounded-md"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {(editing || creating) && (
        <VehicleEditor
          vehicle={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </section>
  );
}

function VehicleEditor({ vehicle, onClose, onSaved }: { vehicle: Vehicle | null; onClose: () => void; onSaved: () => void }) {
  const upsertFn = useServerFn(upsertVehicle);
  const deleteFn = useServerFn(deleteVehicle);
  const [name, setName] = useState(vehicle?.name ?? "");
  const [year, setYear] = useState(vehicle?.year ?? new Date().getFullYear());
  const [category, setCategory] = useState(vehicle?.category ?? "Sedán");
  const [baseRate, setBaseRate] = useState(Number(vehicle?.base_rate ?? 40));
  const [units, setUnits] = useState(Number(vehicle?.units ?? 1));
  const [available, setAvailable] = useState(vehicle?.available ?? true);
  const [images, setImages] = useState<string[]>(vehicle?.images ?? []);
  const [blocked, setBlocked] = useState<Blocked[]>(Array.isArray(vehicle?.blocked_dates) ? vehicle!.blocked_dates : []);
  const [licensePlate, setLicensePlate] = useState(vehicle?.license_plate ?? "");
  const [seats, setSeats] = useState(Number(vehicle?.seats ?? 5));
  const [transmission, setTransmission] = useState(vehicle?.transmission ?? "Automática");
  const [engine, setEngine] = useState(vehicle?.engine ?? "");
  const [traction, setTraction] = useState(vehicle?.traction ?? "FWD");
  const [fuel, setFuel] = useState(vehicle?.fuel ?? "Gasolina");
  const [luggage, setLuggage] = useState(vehicle?.luggage ?? "");
  const [equip, setEquip] = useState({
    ac: vehicle?.ac ?? true,
    airbags: vehicle?.airbags ?? true,
    bluetooth: vehicle?.bluetooth ?? true,
    usb: vehicle?.usb ?? true,
    touchscreen: vehicle?.touchscreen ?? false,
    reverse_camera: vehicle?.reverse_camera ?? false,
    parking_sensors: vehicle?.parking_sensors ?? false,
    car_play: vehicle?.car_play ?? false,
    cruise_control: vehicle?.cruise_control ?? false,
    keyless_start: vehicle?.keyless_start ?? false,
    leather_seats: vehicle?.leather_seats ?? false,
    sunroof: vehicle?.sunroof ?? false,
    wireless_charger: vehicle?.wireless_charger ?? false,
  });
  const [extrasText, setExtrasText] = useState((vehicle?.extra_features ?? []).join("\n"));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tempId = useMemo(() => crypto.randomUUID(), []);
  const id = vehicle?.id ?? tempId;

  // Blocked dates form
  const [bStart, setBStart] = useState("");
  const [bEnd, setBEnd] = useState("");
  const [bLabel, setBLabel] = useState("Rentado");

  async function save() {
    setSaving(true);
    try {
      const extras = extrasText.split("\n").map((s) => s.trim()).filter(Boolean);
      await upsertFn({
        data: {
          id: vehicle?.id,
          name, year: Number(year), category, base_rate: Number(baseRate),
          units: Number(units),
          available, images, blocked_dates: blocked,
          license_plate: licensePlate.trim() || null,
          seats: Number(seats),
          transmission, engine, traction, fuel, luggage,
          ...equip,
          extra_features: extras,
        },
      });
      toast.success(vehicle ? "Vehículo actualizado." : "Vehículo creado.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!vehicle) return;
    try {
      await deleteFn({ data: { id: vehicle.id } });
      toast.success("Vehículo eliminado.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  function addBlocked() {
    if (!bStart || !bEnd || bStart > bEnd) return;
    setBlocked([...blocked, { start: bStart, end: bEnd, label: bLabel || "Bloqueado" }]);
    setBStart(""); setBEnd(""); setBLabel("Rentado");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card max-w-3xl w-full rounded-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card rounded-t-2xl">
          <h2 className="text-xl font-bold">{vehicle ? "Editar vehículo" : "Nuevo vehículo"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <L label="Nombre"><input className={inp} value={name} onChange={(e) => setName(e.target.value)} /></L>
            <L label="Año"><input type="number" className={inp} value={year} onChange={(e) => setYear(Number(e.target.value))} /></L>
            <L label="Categoría">
              <select className={inp} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>SUV</option><option>Sedán</option><option>Económico</option><option>Camioneta</option><option>Premium</option>
              </select>
            </L>
            <L label="Tarifa base US$/día"><input type="number" step="1" className={inp} value={baseRate} onChange={(e) => setBaseRate(Number(e.target.value))} /></L>
            <L label="Cantidad de unidades"><input type="number" min={1} max={99} className={inp} value={units} onChange={(e) => setUnits(Number(e.target.value))} /></L>
            <L label="Placa (solo admin)"><input className={inp} value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="A123456" /></L>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-4 w-4" />
            Disponible para reservar
          </label>

          <div>
            <h3 className="font-semibold text-sm mb-2">Especificaciones</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <L label="Pasajeros"><input type="number" min={1} max={20} className={inp} value={seats} onChange={(e) => setSeats(Number(e.target.value))} /></L>
              <L label="Transmisión">
                <select className={inp} value={transmission} onChange={(e) => setTransmission(e.target.value)}>
                  <option>Automática</option><option>Automática CVT</option><option>Manual</option>
                </select>
              </L>
              <L label="Motor"><input className={inp} value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="1.5L Turbo" /></L>
              <L label="Tracción">
                <select className={inp} value={traction} onChange={(e) => setTraction(e.target.value)}>
                  <option>FWD</option><option>RWD</option><option>AWD</option><option>4WD</option>
                </select>
              </L>
              <L label="Combustible">
                <select className={inp} value={fuel} onChange={(e) => setFuel(e.target.value)}>
                  <option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option>
                </select>
              </L>
              <L label="Equipaje"><input className={inp} value={luggage} onChange={(e) => setLuggage(e.target.value)} placeholder="2 grandes + 2 pequeñas" /></L>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Equipamiento</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              {([
                ["ac", "Aire acondicionado"],
                ["airbags", "Airbags"],
                ["bluetooth", "Bluetooth"],
                ["usb", "Puertos USB"],
                ["touchscreen", "Pantalla táctil"],
                ["reverse_camera", "Cámara de reversa"],
                ["parking_sensors", "Sensores de parqueo"],
                ["car_play", "Apple CarPlay / Android Auto"],
                ["cruise_control", "Control crucero"],
                ["keyless_start", "Encendido sin llave"],
                ["leather_seats", "Asientos de cuero"],
                ["sunroof", "Techo solar"],
                ["wireless_charger", "Cargador inalámbrico"],
              ] as const).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 bg-muted/40 rounded px-3 py-1.5">
                  <input type="checkbox" checked={equip[k]} onChange={(e) => setEquip({ ...equip, [k]: e.target.checked })} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <L label="Características extra (una por línea)">
            <textarea className={inp} rows={3} value={extrasText} onChange={(e) => setExtrasText(e.target.value)} placeholder="Honda Sensing&#10;Techo solar panorámico" />
          </L>

          <div>
            <h3 className="font-semibold text-sm mb-2">Fotos del vehículo</h3>
            <VehicleImageUploader vehicleId={id} images={images} onChange={setImages} />
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Fechas bloqueadas</h3>
            <div className="grid sm:grid-cols-4 gap-2">
              <input type="date" className={inp} value={bStart} onChange={(e) => setBStart(e.target.value)} placeholder="Inicio" />
              <input type="date" className={inp} value={bEnd} onChange={(e) => setBEnd(e.target.value)} placeholder="Fin" />
              <select className={inp} value={bLabel} onChange={(e) => setBLabel(e.target.value)}>
                <option>Rentado</option><option>Mantenimiento</option><option>Reservado</option><option>Otro</option>
              </select>
              <button type="button" onClick={addBlocked} className="bg-navy text-white font-semibold rounded-md text-sm">Agregar</button>
            </div>
            <ul className="mt-3 space-y-1">
              {blocked.length === 0 && <li className="text-xs text-muted-foreground">Sin bloqueos.</li>}
              {blocked.map((b, i) => (
                <li key={i} className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-sm">
                  <span>{b.start} → {b.end} · <span className="text-muted-foreground">{b.label}</span></span>
                  <button onClick={() => setBlocked(blocked.filter((_, j) => j !== i))} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-6 border-t border-border flex justify-between gap-3">
          {vehicle && (
            confirmDelete ? (
              <div className="flex gap-2">
                <button onClick={remove} className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-semibold">Confirmar eliminar</button>
                <button onClick={() => setConfirmDelete(false)} className="text-sm">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-red-600 text-sm font-semibold inline-flex items-center gap-1">
                <Trash2 className="h-4 w-4" /> Eliminar vehículo
              </button>
            )
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm">Cancelar</button>
            <button onClick={save} disabled={saving || !name} className="bg-orange text-orange-foreground font-semibold px-5 py-2 rounded-md text-sm inline-flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50";
const L = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block"><span className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{label}</span>{children}</label>
);

/* ---------- SERVICIOS ---------- */

function ServicesTab() {
  const [list, setList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const upsertFn = useServerFn(upsertService);
  const deleteFn = useServerFn(deleteService);

  const load = useCallback(async () => {
    const { data } = await supabase.from("services").select("*").order("sort_order");
    setList((data as Service[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(s: Service) {
    try {
      await upsertFn({ data: { id: s.id, name: s.name, description: s.description, price_text: s.price_text, visible: s.visible, sort_order: s.sort_order } });
      toast.success("Servicio guardado.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  }
  async function add() {
    try {
      await upsertFn({ data: { name: "Nuevo servicio", description: "", price_text: "", visible: true, sort_order: list.length + 1 } });
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  }
  async function remove(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    try { await deleteFn({ data: { id } }); load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  }

  if (loading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <section className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-bold">Servicios</h2>
        <button onClick={add} className="inline-flex items-center gap-2 bg-orange text-orange-foreground font-semibold px-4 py-2 rounded-md text-sm">
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>
      <div className="space-y-3">
        {list.map((s, idx) => (
          <div key={s.id} className="bg-card border border-border rounded-2xl p-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <L label="Nombre"><input className={inp} value={s.name} onChange={(e) => setList(list.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} /></L>
              <L label="Texto de precio"><input className={inp} value={s.price_text} onChange={(e) => setList(list.map((x, i) => i === idx ? { ...x, price_text: e.target.value } : x))} /></L>
            </div>
            <L label="Descripción"><textarea className={inp} rows={2} value={s.description} onChange={(e) => setList(list.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} /></L>
            <div className="mt-3 flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={s.visible} onChange={(e) => setList(list.map((x, i) => i === idx ? { ...x, visible: e.target.checked } : x))} />
                {s.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} Visible en home
              </label>
              <div className="flex gap-2">
                <button onClick={() => remove(s.id)} className="text-red-600 text-sm inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                <button onClick={() => save(s)} className="bg-navy text-white text-sm font-semibold px-4 py-2 rounded-md inline-flex items-center gap-1"><Save className="h-4 w-4" /> Guardar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- CLIENTES ---------- */

function ClientsTab() {
  const settings = useSiteSettings();
  const listFn = useServerFn(listClients);
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listFn().then((r) => { setRows(r.clients as Client[]); setLoading(false); });
  }, [listFn]);

  function exportCSV() {
    const header = ["Nombre", "Documento", "Email", "Teléfono", "Registro", "Reservas"];
    const lines = rows.map((c) => [c.name ?? "", c.document_id ?? "", c.email ?? "", c.phone ?? "", c.created_at, String(c.bookings_count)].map((v) => `"${v.replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "clientes.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Clientes ({rows.length})</h2>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 bg-navy text-white font-semibold px-4 py-2 rounded-md text-sm">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>
      <div className="overflow-x-auto bg-card border border-border rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><Th>Nombre</Th><Th>Documento</Th><Th>Email</Th><Th>Teléfono</Th><Th>Registro</Th><Th>Reservas</Th><Th>Acción</Th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <Td>{c.name ?? "—"}</Td>
                <Td className="text-xs">{c.document_id ?? "—"}</Td>
                <Td>{c.email ?? "—"}</Td>
                <Td>{c.phone ?? "—"}</Td>
                <Td>{new Date(c.created_at).toLocaleDateString("es-DO")}</Td>
                <Td className="font-bold">{c.bookings_count}</Td>
                <Td>
                  {c.phone ? (
                    <a href={whatsappFromSettings(settings.whatsapp_number, `Hola ${c.name ?? ""}, soy de Tapia RentCar.`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 bg-whatsapp text-white text-xs font-semibold px-2.5 py-1.5 rounded">
                      <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  ) : <span className="text-xs text-muted-foreground">Sin teléfono</span>}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- CONFIG ---------- */

function ConfigTab() {
  const s = useSiteSettings();
  const updateFn = useServerFn(updateSetting);
  const [form, setForm] = useState(s);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(s); }, [s]);

  async function save() {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(form)) {
        await updateFn({ data: { key, value: String(value) } });
      }
      toast.success("Configuración guardada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally { setSaving(false); }
  }

  return (
    <section className="max-w-2xl space-y-4">
      <h2 className="text-lg font-bold">Configuración del sitio</h2>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <L label="Nombre del negocio"><input className={inp} value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></L>
        <L label="WhatsApp (solo números, con código de país)"><input className={inp} value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} /></L>
        <L label="Dirección"><input className={inp} value={form.business_address} onChange={(e) => setForm({ ...form, business_address: e.target.value })} /></L>
        <L label="Instagram URL"><input className={inp} value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="https://instagram.com/..." /></L>
        <L label="Facebook URL"><input className={inp} value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} placeholder="https://facebook.com/..." /></L>
        <L label="TikTok URL"><input className={inp} value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} placeholder="https://tiktok.com/@..." /></L>
        <L label="YouTube URL"><input className={inp} value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtube.com/@..." /></L>
        <L label="Twitter / X URL"><input className={inp} value={form.twitter_url} onChange={(e) => setForm({ ...form, twitter_url: e.target.value })} placeholder="https://x.com/..." /></L>
        <L label="Titular del hero"><input className={inp} value={form.hero_headline} onChange={(e) => setForm({ ...form, hero_headline: e.target.value })} /></L>
        <L label="Subtítulo del hero"><textarea className={inp} rows={2} value={form.hero_subheadline} onChange={(e) => setForm({ ...form, hero_subheadline: e.target.value })} /></L>
        <button onClick={save} disabled={saving} className="bg-orange text-orange-foreground font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar cambios
        </button>
      </div>
    </section>
  );
}

/* ---------- CUENTA / CONTRASEÑA ---------- */

function AccountTab() {
  const { session } = useSession();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);

  async function change(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    if (pwd !== pwd2) { toast.error("Las contraseñas no coinciden"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      toast.success("Contraseña actualizada correctamente");
      setPwd(""); setPwd2("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-4">
      <h2 className="text-lg font-bold">Mi cuenta</h2>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-2 text-sm">
        <div className="text-muted-foreground">Sesión actual</div>
        <div className="font-medium">{session?.user?.email}</div>
      </div>
      <form onSubmit={change} className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4" /> Cambiar contraseña</h3>
        <L label="Nueva contraseña">
          <input type="password" className={inp} value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" />
        </L>
        <L label="Repetir nueva contraseña">
          <input type="password" className={inp} value={pwd2} onChange={(e) => setPwd2(e.target.value)} autoComplete="new-password" />
        </L>
        <button type="submit" disabled={saving || !pwd || !pwd2} className="bg-orange text-orange-foreground font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Actualizar contraseña
        </button>
        <p className="text-xs text-muted-foreground">Recuerda anotarla en un lugar seguro. Esta es la contraseña para entrar al panel.</p>
      </form>
    </section>
  );
}
