import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ServiceInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(1000),
  price_text: z.string().max(120),
  visible: z.boolean(),
  sort_order: z.number().int().min(0).max(999),
});

export const upsertService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ServiceInput>) => ServiceInput.parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase
        .from("services")
        .update({
          name: data.name,
          description: data.description,
          price_text: data.price_text,
          visible: data.visible,
          sort_order: data.sort_order,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("services").insert({
      name: data.name,
      description: data.description,
      price_text: data.price_text,
      visible: data.visible,
      sort_order: data.sort_order,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
