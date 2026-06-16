
-- 1. vehicles: category + updated_at
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Sedán',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.vehicles SET category = 'SUV' WHERE name IN ('Honda CRV','Chevrolet Captiva','Kia Sorento');
UPDATE public.vehicles SET category = 'Sedán' WHERE name IN ('Honda Civic','Hyundai Elantra');
UPDATE public.vehicles SET category = 'Económico' WHERE name IN ('Hyundai I10','Nissan March');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS vehicles_set_updated_at ON public.vehicles;
CREATE TRIGGER vehicles_set_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. services
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_text text NOT NULL DEFAULT '',
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS services_public_read ON public.services;
CREATE POLICY services_public_read ON public.services FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS services_admin_insert ON public.services;
CREATE POLICY services_admin_insert ON public.services FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS services_admin_update ON public.services;
CREATE POLICY services_admin_update ON public.services FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS services_admin_delete ON public.services;
CREATE POLICY services_admin_delete ON public.services FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS services_set_updated_at ON public.services;
CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.services (name, description, price_text, sort_order)
SELECT * FROM (VALUES
  ('Renta diaria', 'Alquila tu vehículo por días con tarifas competitivas y entrega rápida.', 'desde $30/día', 1),
  ('Renta semanal', '7 días con 5% de descuento incluido. Ideal para viajes de trabajo o turismo.', '5% off', 2),
  ('Renta mensual', '30 días al mejor precio. Perfecto para estadías largas.', 'Mejor precio', 3),
  ('Entrega a domicilio', 'Te llevamos el vehículo a tu hotel, casa o aeropuerto en Santo Domingo.', 'Gratis en zona metro', 4)
) AS v(name, description, price_text, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.services);

-- 3. site_settings (key/value)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
CREATE POLICY site_settings_public_read ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS site_settings_admin_write ON public.site_settings;
CREATE POLICY site_settings_admin_write ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (key, value) VALUES
  ('business_name', 'Tapia RentCar'),
  ('whatsapp_number', '18097294764'),
  ('business_address', 'Santo Domingo, República Dominicana'),
  ('instagram_url', 'https://instagram.com/tapiarentcar'),
  ('hero_headline', 'Renta tu auto en Santo Domingo'),
  ('hero_subheadline', 'Flota moderna, precios claros y entrega a domicilio. Reserva en minutos.')
ON CONFLICT (key) DO NOTHING;

-- 4. Realtime (idempotente)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['bookings','vehicles','services','site_settings'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
  END LOOP;
END $$;
