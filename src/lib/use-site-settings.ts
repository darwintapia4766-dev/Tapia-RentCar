import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  business_name: string;
  whatsapp_number: string;
  business_address: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  youtube_url: string;
  twitter_url: string;
  hero_headline: string;
  hero_subheadline: string;
};

const DEFAULTS: SiteSettings = {
  business_name: "Tapia RentCar",
  whatsapp_number: "18097294764",
  business_address: "Santo Domingo, Rep\u00FAblica Dominicana",
  instagram_url: "https://www.instagram.com/tapiarentcarrd?utm_source=qr",
  facebook_url: "",
  tiktok_url: "",
  youtube_url: "",
  twitter_url: "",
  hero_headline: "Renta tu auto en Santo Domingo",
  hero_subheadline: "Flota moderna, precios claros y entrega a domicilio.",
};

export function useSiteSettings(): SiteSettings {
  const [s, setS] = useState<SiteSettings>(DEFAULTS);
  const channelId = useRef(`site_settings_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const m: Record<string, string> = {};
        for (const r of data) m[r.key] = r.value;
        setS({ ...DEFAULTS, ...(m as Partial<SiteSettings>) });
      }
    };
    load();
    const channel = supabase
      .channel(channelId.current)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return s;
}

export function whatsappFromSettings(number: string, message: string) {
  const clean = number.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
