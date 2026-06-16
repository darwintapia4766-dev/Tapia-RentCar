import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UpdateVehicle = z.object({
  id: z.string().uuid(),
  base_rate: z.number().positive().optional(),
  available: z.boolean().optional(),
  blocked_dates: z
    .array(
      z.object({
        start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .optional(),
});

export const updateVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof UpdateVehicle>) => UpdateVehicle.parse(d))
  .handler(async ({ data, context }) => {
    const patch: {
      base_rate?: number;
      available?: boolean;
      blocked_dates?: unknown;
    } = {};
    if (data.base_rate !== undefined) patch.base_rate = data.base_rate;
    if (data.available !== undefined) patch.available = data.available;
    if (data.blocked_dates !== undefined) patch.blocked_dates = data.blocked_dates;
    const { error } = await context.supabase
      .from("vehicles")
      .update(patch as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: bookings, error } = await context.supabase
      .from("bookings")
      .select("client_name, client_email, client_phone, document_id, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const clients = new Map<string, { id: string; name: string; email: string; phone: string; document_id: string | null; created_at: string; bookings_count: number }>();
    for (const b of bookings ?? []) {
      const key = `${b.client_email}|${b.client_phone}`;
      const current = clients.get(key);
      clients.set(key, {
        id: key,
        name: b.client_name,
        email: b.client_email,
        phone: b.client_phone,
        document_id: current?.document_id ?? b.document_id ?? null,
        created_at: current?.created_at ?? b.created_at,
        bookings_count: (current?.bookings_count ?? 0) + 1,
      });
    }
    return { clients: Array.from(clients.values()) };
  });

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) return { isAdmin: false };
    return { isAdmin: !!data };
  });
