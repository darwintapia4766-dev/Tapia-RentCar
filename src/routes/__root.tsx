import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { Session } from "@supabase/supabase-js";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy/90"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Intenta de nuevo o vuelve al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground"
          >
            Reintentar
          </button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm font-medium">Inicio</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tapia RentCar — Renta de carros, transfers y chofer en RD" },
      { name: "description", content: "Alquiler de vehículos, traslados al aeropuerto y servicio de chofer privado en República Dominicana. Sin tarjeta de crédito, efectivo o débito." },
      { name: "author", content: "Tapia RentCar" },
      { property: "og:title", content: "Tapia RentCar — Renta de carros, transfers y chofer en RD" },
      { property: "og:description", content: "Alquiler de vehículos, traslados al aeropuerto y servicio de chofer privado en República Dominicana. Sin tarjeta de crédito, efectivo o débito." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tapia RentCar — Renta de carros, transfers y chofer en RD" },
      { name: "twitter:description", content: "Alquiler de vehículos, traslados al aeropuerto y servicio de chofer privado en República Dominicana. Sin tarjeta de crédito, efectivo o débito." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2f1feddb-2216-4e92-8f9b-2377060b74ee/id-preview-f7847510--6173c97c-9c46-4ceb-a23d-024787172a50.lovable.app-1780787723492.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2f1feddb-2216-4e92-8f9b-2377060b74ee/id-preview-f7847510--6173c97c-9c46-4ceb-a23d-024787172a50.lovable.app-1780787723492.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

function AuthListener() {
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);
  return null;
}

// ----- Shared session hook used by pages -----
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, loading };
}

export async function signInWithGoogle(redirectAfter?: string) {
  if (redirectAfter && typeof window !== "undefined") {
    sessionStorage.setItem("post_login_redirect", redirectAfter);
  }
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
  });
  return result;
}

export async function signOut() {
  await supabase.auth.signOut();
}
