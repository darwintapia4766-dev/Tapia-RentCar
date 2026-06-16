DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'client');
  END IF;
END $$;

-- ── Profiles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT, email TEXT, photo_url TEXT, phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── User roles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ── has_role function ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- ── set_updated_at trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ── Vehicles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, year INTEGER NOT NULL,
  category text NOT NULL DEFAULT 'Sedán',
  base_rate NUMERIC(10,2) NOT NULL,
  license_plate text,
  seats integer NOT NULL DEFAULT 5,
  transmission text NOT NULL DEFAULT 'Automática',
  engine text NOT NULL DEFAULT '',
  traction text NOT NULL DEFAULT 'FWD',
  fuel text NOT NULL DEFAULT 'Gasolina',
  luggage text NOT NULL DEFAULT '',
  ac boolean NOT NULL DEFAULT true,
  touchscreen boolean NOT NULL DEFAULT false,
  reverse_camera boolean NOT NULL DEFAULT false,
  parking_sensors boolean NOT NULL DEFAULT false,
  bluetooth boolean NOT NULL DEFAULT true,
  usb boolean NOT NULL DEFAULT true,
  sunroof boolean NOT NULL DEFAULT false,
  cruise_control boolean NOT NULL DEFAULT false,
  leather_seats boolean NOT NULL DEFAULT false,
  keyless_start boolean NOT NULL DEFAULT false,
  wireless_charger boolean NOT NULL DEFAULT false,
  car_play boolean NOT NULL DEFAULT false,
  airbags boolean NOT NULL DEFAULT true,
  extra_features text[] NOT NULL DEFAULT '{}'::text[],
  images TEXT[] NOT NULL DEFAULT '{}',
  available BOOLEAN NOT NULL DEFAULT true,
  units integer NOT NULL DEFAULT 1,
  blocked_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS vehicles_set_updated_at ON public.vehicles;
CREATE TRIGGER vehicles_set_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Bookings ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  vehicle_name TEXT NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  delivery_time TEXT NOT NULL, delivery_location TEXT NOT NULL,
  price_per_day NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente','confirmado','completado','cancelado')),
  client_name TEXT NOT NULL, client_email TEXT NOT NULL, client_phone TEXT NOT NULL,
  document_id text, flight_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ── Services ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, description text NOT NULL DEFAULT '',
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
DROP TRIGGER IF EXISTS services_set_updated_at ON public.services;
CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Site settings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY, value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Client contacts ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, email text NOT NULL, phone text NOT NULL,
  last_booking_at timestamptz NOT NULL DEFAULT now(),
  bookings_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, phone)
);
GRANT SELECT ON public.client_contacts TO authenticated;
GRANT ALL ON public.client_contacts TO service_role;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS set_client_contacts_updated_at ON public.client_contacts;
CREATE TRIGGER set_client_contacts_updated_at BEFORE UPDATE ON public.client_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS Policies ───────────────────────────────────────────────
-- profiles
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (auth.uid() = id OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- user_roles
DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_insert ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_update ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_delete ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_roles_admin_insert ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE POLICY user_roles_admin_update ON public.user_roles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE POLICY user_roles_admin_delete ON public.user_roles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

-- vehicles
DROP POLICY IF EXISTS vehicles_public_read ON public.vehicles;
DROP POLICY IF EXISTS vehicles_admin_insert ON public.vehicles;
DROP POLICY IF EXISTS vehicles_admin_update ON public.vehicles;
DROP POLICY IF EXISTS vehicles_admin_delete ON public.vehicles;
CREATE POLICY vehicles_public_read ON public.vehicles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY vehicles_admin_insert ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY vehicles_admin_update ON public.vehicles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY vehicles_admin_delete ON public.vehicles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- bookings
DROP POLICY IF EXISTS bookings_select ON public.bookings;
DROP POLICY IF EXISTS bookings_admin_update ON public.bookings;
DROP POLICY IF EXISTS bookings_admin_delete ON public.bookings;
CREATE POLICY bookings_select ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY bookings_admin_update ON public.bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY bookings_admin_delete ON public.bookings FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- services
DROP POLICY IF EXISTS services_public_read ON public.services;
DROP POLICY IF EXISTS services_admin_insert ON public.services;
DROP POLICY IF EXISTS services_admin_update ON public.services;
DROP POLICY IF EXISTS services_admin_delete ON public.services;
CREATE POLICY services_public_read ON public.services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY services_admin_insert ON public.services FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY services_admin_update ON public.services FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY services_admin_delete ON public.services FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- site_settings
DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
DROP POLICY IF EXISTS site_settings_admin_write ON public.site_settings;
CREATE POLICY site_settings_public_read ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_settings_admin_write ON public.site_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- client_contacts
DROP POLICY IF EXISTS client_contacts_admin_read ON public.client_contacts;
CREATE POLICY client_contacts_admin_read ON public.client_contacts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- ── Storage bucket policies ────────────────────────────────────
DROP POLICY IF EXISTS vehicle_images_public_read ON storage.objects;
DROP POLICY IF EXISTS vehicle_images_admin_insert ON storage.objects;
DROP POLICY IF EXISTS vehicle_images_admin_update ON storage.objects;
DROP POLICY IF EXISTS vehicle_images_admin_delete ON storage.objects;
CREATE POLICY vehicle_images_public_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'vehicle-images');
CREATE POLICY vehicle_images_admin_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY vehicle_images_admin_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicle-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (bucket_id = 'vehicle-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY vehicle_images_admin_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- ── Auto profile trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, photo_url)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Admin user ─────────────────────────────────────────────────
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'admin@tapiarentcar.com';
  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'admin@tapiarentcar.com', crypt('Santa123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrador Tapia"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), uid,
      jsonb_build_object('sub', uid::text, 'email', 'admin@tapiarentcar.com'),
      'email', uid::text, now(), now(), now());
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
END $$;

-- ── Seed datos iniciales ───────────────────────────────────────
INSERT INTO public.site_settings (key, value) VALUES
  ('business_name',    'Tapia RentCar'),
  ('whatsapp_number',  '18097294764'),
  ('business_address', 'Santo Domingo, República Dominicana'),
  ('instagram_url',    'https://instagram.com/tapiarentcarrd'),
  ('hero_headline',    'Tu carro te espera donde estés.'),
  ('hero_subheadline', 'Entrega en el aeropuerto, tu hotel o residencia.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.services (name, description, price_text, sort_order)
SELECT * FROM (VALUES
  ('Renta de vehículos',  'Flota moderna con AC, cámara y más. Desde 3 días.', 'desde $30/día', 1),
  ('Transfers al aeropuerto', 'Te recogemos o entregamos en AILA sin costo adicional.', 'Gratis en AILA', 2),
  ('Chofer privado',      'Conductor profesional para tus traslados en Santo Domingo.', 'A consultar', 3),
  ('Renta mensual',       'El mejor precio para estadías largas de 30 días o más.', 'Mejor precio', 4)
) AS v(name, description, price_text, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.services);

-- ── Vehículos (reemplaza PLACA1…PLACA7 con las placas reales) ──
INSERT INTO public.vehicles
  (name, year, category, base_rate, available, license_plate, seats, transmission, engine, traction, fuel, luggage,
   ac, touchscreen, reverse_camera, parking_sensors, bluetooth, usb, sunroof, cruise_control,
   leather_seats, keyless_start, wireless_charger, car_play, airbags, extra_features, sort_order)
SELECT * FROM (VALUES
  ('Honda CRV',         2020, 'SUV',       50::numeric, true, 'PLACA1', 5, 'Automática CVT', '1.5L Turbo', 'FWD', 'Gasolina', '2 grandes + 2 pequeñas', true, true, true, true, true, true, true, true, false, true, false, true, true, ARRAY['Honda Sensing','Techo solar eléctrico'], 1),
  ('Honda Civic',       2019, 'Sedán',     40::numeric, true, 'PLACA2', 5, 'Automática CVT', '1.5L Turbo', 'FWD', 'Gasolina', '2 medianas',             true, true, true, true, true, true, false, true, false, false, false, true, true, ARRAY['Apple CarPlay / Android Auto'], 2),
  ('Hyundai I10',       2022, 'Económico', 35::numeric, true, 'PLACA3', 5, 'Automática',     '1.0L',       'FWD', 'Gasolina', '1 mediana + 1 pequeña',  true, true, true, true, true, true, false, false, false, false, false, true, true, ARRAY[]::text[], 3),
  ('Hyundai Elantra',   2020, 'Sedán',     35::numeric, true, 'PLACA4', 5, 'Automática',     '2.0L',       'FWD', 'Gasolina', '2 medianas',             true, true, true, true, true, true, false, true, false, false, false, true, true, ARRAY[]::text[], 4),
  ('Chevrolet Captiva', 2023, 'SUV',       55::numeric, true, 'PLACA5', 7, 'Automática',     '1.5L Turbo', 'FWD', 'Gasolina', '3 grandes',              true, true, true, true, true, true, false, true, true, true, false, true, true, ARRAY['7 pasajeros','Tercera fila de asientos'], 5),
  ('Nissan March',      2019, 'Económico', 30::numeric, true, 'PLACA6', 5, 'Automática CVT', '1.6L',       'FWD', 'Gasolina', '1 mediana',              true, false, false, false, true, true, false, false, false, false, false, false, true, ARRAY[]::text[], 6),
  ('Kia Sorento',       2019, 'SUV',       55::numeric, true, 'PLACA7', 7, 'Automática',     '2.4L',       'FWD', 'Gasolina', '3 grandes',              true, true, true, true, true, true, true, true, true, false, false, true, true, ARRAY['7 pasajeros','Techo solar panorámico'], 7)
) AS v(name, year, category, base_rate, available, license_plate, seats, transmission, engine, traction, fuel, luggage,
       ac, touchscreen, reverse_camera, parking_sensors, bluetooth, usb, sunroof, cruise_control,
       leather_seats, keyless_start, wireless_charger, car_play, airbags, extra_features, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles ve WHERE ve.name = v.name AND ve.year = v.year::int);
