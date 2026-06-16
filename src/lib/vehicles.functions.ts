import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

const VehicleInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  year: z.number().int().min(1990).max(2100),
  category: z.string().min(1).max(40),
  base_rate: z.number().positive().max(10000),
  available: z.boolean(),
  units: z.number().int().min(1).max(99).optional(),
  images: z.array(z.string().url()).max(12).optional(),
  blocked_dates: z
    .array(
      z.object({
        start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        label: z.string().min(1).max(80),
      }),
    )
    .max(200)
    .optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  license_plate: z.string().max(20).optional().nullable(),
  seats: z.number().int().min(1).max(20).optional(),
  transmission: z.string().max(40).optional(),
  engine: z.string().max(60).optional(),
  traction: z.string().max(20).optional(),
  fuel: z.string().max(30).optional(),
  luggage: z.string().max(120).optional(),
  ac: z.boolean().optional(),
  touchscreen: z.boolean().optional(),
  reverse_camera: z.boolean().optional(),
  parking_sensors: z.boolean().optional(),
  bluetooth: z.boolean().optional(),
  usb: z.boolean().optional(),
  sunroof: z.boolean().optional(),
  cruise_control: z.boolean().optional(),
  leather_seats: z.boolean().optional(),
  keyless_start: z.boolean().optional(),
  wireless_charger: z.boolean().optional(),
  car_play: z.boolean().optional(),
  airbags: z.boolean().optional(),
  extra_features: z.array(z.string().min(1).max(120)).max(20).optional(),
});

export const upsertVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof VehicleInput>) => VehicleInput.parse(d))
  .handler(async ({ data, context }) => {
    const { id: _id, blocked_dates, ...rest } = data;
    const patch: Record<string, unknown> = { ...rest };
    if (blocked_dates !== undefined) patch.blocked_dates = blocked_dates as unknown as Json;
    if (data.id) {
      const { error } = await context.supabase
        .from("vehicles")
        .update(patch as never)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("vehicles").insert(patch as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderVehicles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids: string[] }) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const updates = data.ids.map((id, i) =>
      context.supabase.from("vehicles").update({ sort_order: i + 1 }).eq("id", id),
    );
    await Promise.all(updates);
    return { ok: true };
  });

export const deleteVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("vehicles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
