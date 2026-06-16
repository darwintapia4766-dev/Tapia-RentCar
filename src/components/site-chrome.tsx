import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "@/routes/__root";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, LogOut, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import tapiaLogo from "@/assets/logo1.png";
import { useServerFn } from "@tanstack/react-start";
import { isAdmin as isAdminFn } from "@/lib/admin.functions";
import { useSiteSettings } from "@/lib/use-site-settings";

const ADMIN_EMAIL = "admin@tapiarentcar.com";

export function Navbar() {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const user = session?.user;
  const checkAdmin = useServerFn(isAdminFn);
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    if (!user) { setAdmin(false); return; }
    checkAdmin().then((r) => setAdmin(r.isAdmin)).catch(() => setAdmin(false));
  }, [user, checkAdmin]);

  // Secret access: 5 clicks on logo within 3s
  const clicksRef = useRef<number[]>([]);
  function handleLogoClick(e: React.MouseEvent) {
    const now = Date.now();
    clicksRef.current = [...clicksRef.current.filter((t) => now - t < 3000), now];
    if (clicksRef.current.length >= 5) {
      e.preventDefault();
      clicksRef.current = [];
      setShowLogin(true);
    }
  }

  const links = [
    { href: "#servicios", label: "Servicios" },
    { href: "#flota", label: "Flota" },
    { href: "#como-funciona", label: "Cómo funciona" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-navy/95 backdrop-blur border-b border-white/5 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 font-bold text-lg sm:text-xl tracking-tight select-none">
            <img src={tapiaLogo} alt="Tapia RentCar" className="h-10 w-10 object-contain bg-white rounded-md p-0.5" draggable={false} />
            <span>Tapia<span className="text-orange">RentCar</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-white/70 hover:text-white transition-colors">{l.label}</a>
            ))}
            <Link to="/reservar" className="text-white/70 hover:text-white transition-colors">Reservar</Link>
            <Link to="/mi-reserva" className="text-white/70 hover:text-white transition-colors">Mi reserva</Link>
            {user && !admin && (
              <Link to="/mi-cuenta" className="text-white/70 hover:text-white transition-colors">Mis reservas</Link>
            )}
            {admin && (
              <Link to="/admin" className="text-orange hover:text-orange/80 font-semibold transition-colors">Admin</Link>
            )}
          </div>
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <button onClick={() => signOut()} className="text-white/60 hover:text-white inline-flex items-center gap-1 text-sm" aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" /> Salir
              </button>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menú">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="md:hidden bg-navy border-t border-white/5 px-6 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-white/80">{l.label}</a>
            ))}
            <Link to="/reservar" onClick={() => setOpen(false)} className="text-white/80">Reservar</Link>
            {user && !admin && (
              <Link to="/mi-cuenta" onClick={() => setOpen(false)} className="text-white/80">Mis reservas</Link>
            )}
            {admin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="text-orange font-semibold">Admin</Link>
            )}
            {user && (
              <button onClick={() => { signOut(); setOpen(false); }} className="text-left text-white/80">Cerrar sesión</button>
            )}

          </div>
        )}
      </nav>
      {showLogin && <AdminLoginModal onClose={() => setShowLogin(false)} onSuccess={() => { setShowLogin(false); navigate({ to: "/admin" }); }} />}
    </>
  );
}

function AdminLoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
      if (error) {
        toast.error("Contraseña incorrecta");
        return;
      }
      toast.success("Acceso concedido");
      onSuccess();
    } catch {
      toast.error("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 grid place-items-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-card text-foreground max-w-sm w-full rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-navy text-white grid place-items-center">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Acceso de administrador</h2>
            <p className="text-xs text-muted-foreground">Ingresa tu contraseña</p>
          </div>
        </div>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground">Cancelar</button>
          <button
            type="submit"
            disabled={loading || !password}
            className="bg-orange text-orange-foreground font-semibold px-4 py-2 rounded-md text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Entrar
          </button>
        </div>
      </form>
    </div>
  );
}

const SOCIAL_ICONS = {
  instagram: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  ),
  facebook: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  tiktok: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  ),
  youtube: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
    </svg>
  ),
  twitter: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
    </svg>
  ),
};

export function Footer() {
  const settings = useSiteSettings();

  const socials = [
    { key: "instagram", url: settings.instagram_url, label: "Instagram" },
    { key: "facebook",  url: settings.facebook_url,  label: "Facebook"  },
    { key: "tiktok",    url: settings.tiktok_url,    label: "TikTok"    },
    { key: "youtube",   url: settings.youtube_url,   label: "YouTube"   },
    { key: "twitter",   url: settings.twitter_url,   label: "X / Twitter" },
  ].filter((s) => s.url.trim() !== "") as { key: keyof typeof SOCIAL_ICONS; url: string; label: string }[];

  return (
    <footer className="bg-navy text-white/60 py-12 px-6">
      <div className="max-w-7xl mx-auto grid sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <img src={tapiaLogo} alt="Tapia RentCar" className="h-12 w-12 object-contain bg-white rounded-md p-1" />
            <div className="font-bold text-white text-xl">Tapia<span className="text-orange">RentCar</span></div>
          </div>
          <p className="text-sm">Tu movilidad, nuestra misión.</p>
        </div>
        <div>
          <h5 className="text-white text-sm font-semibold mb-3">Contacto</h5>
          <p className="text-sm">WhatsApp: +1 (809) 729-4764</p>
          <p className="text-sm">Santo Domingo, R.D.</p>
        </div>
        {socials.length > 0 && (
          <div>
            <h5 className="text-white text-sm font-semibold mb-3">Síguenos</h5>
            <div className="flex flex-wrap gap-3">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-orange flex items-center justify-center text-white transition"
                >
                  {SOCIAL_ICONS[s.key]}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-white/10 text-xs text-white/40 text-center">
        © {new Date().getFullYear()} Tapia RentCar. Todos los derechos reservados.
      </div>
    </footer>
  );
}

export function FloatingWhatsApp() {
  const href = `https://wa.me/18097294764?text=${encodeURIComponent("Hola Tapia RentCar, quisiera más información.")}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 pulse-ring relative bg-whatsapp text-white h-14 w-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
      aria-label="WhatsApp"
    >
      <WhatsAppIcon />
    </a>
  );
}

export function WhatsAppIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.149-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
