import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMyBookings } from "@/lib/bookings.functions";
import { Navbar, Footer, FloatingWhatsApp } from "@/components/site-chrome";
import { signInWithGoogle, useSession } from "@/routes/__root";
import { Loader2, Car, Calendar, MapPin } from "lucide-react";

export const Route = createFileRoute("/mi-cuenta")({
  head: () => ({ meta: [{ title: "Mi cuenta — Tapia RentCar" }] }),
  component: AccountPage,
});

type Booking = {
  id: string;
  vehicle_name: string;
  start_date: string;
  end_date: string;
  days: number;
  delivery_time: string;
  delivery_location: string;
  total_price: number;
  status: string;
  created_at: string;
};

function AccountPage() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const listFn = useServerFn(listMyBookings);

  useEffect(() => {
    if (loading) return;
    if (!session) return;
    listFn()
      .then((r) => setBookings(r.bookings as Booking[]))
      .catch((e) => setErr(e instanceof Error ? e.message : "Error"));
  }, [session, loading, listFn]);

  if (loading) {
    return <Centered><Loader2 className="h-6 w-6 animate-spin" /></Centered>;
  }
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 grid place-items-center px-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold">Inicia sesión para ver tus reservas</h1>
            <button onClick={() => signInWithGoogle("/mi-cuenta")} className="mt-6 bg-navy text-white font-semibold px-6 py-3 rounded-md">
              Iniciar sesión con Google
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold">Mis reservas</h1>
        <p className="mt-2 text-muted-foreground">Historial de tus reservas con Tapia RentCar.</p>

        <div className="mt-8 space-y-4">
          {err && <p className="text-destructive text-sm">{err}</p>}
          {!bookings ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <p className="text-muted-foreground">Aún no tienes reservas.</p>
              <Link to="/reservar" className="mt-4 inline-block bg-orange text-orange-foreground font-semibold px-5 py-2.5 rounded-md">
                Crear primera reserva
              </Link>
            </div>
          ) : (
            bookings.map((b) => (
              <article key={b.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-orange" />
                    <span className="font-bold">{b.vehicle_name}</span>
                    <StatusPill status={b.status} />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {b.start_date} → {b.end_date} ({b.days}d)</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {b.delivery_location} · {b.delivery_time}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-xl font-bold text-orange">US${Number(b.total_price)}</div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendiente: "bg-orange/15 text-orange",
    confirmado: "bg-emerald-100 text-emerald-700",
    completado: "bg-slate-200 text-slate-700",
    cancelado: "bg-red-100 text-red-700",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen grid place-items-center">{children}</div>;
}
