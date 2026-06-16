import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UpdateInput = z.object({
  key: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
  value: z.string().max(2000),
});

export const updateSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof UpdateInput>) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
