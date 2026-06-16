
-- Phase 1: Extend vehicles schema with full spec fields and seed 7 vehicles

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS license_plate text,
  ADD COLUMN IF NOT EXISTS seats integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS transmission text NOT NULL DEFAULT 'Automática',
  ADD COLUMN IF NOT EXISTS engine text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS traction text NOT NULL DEFAULT 'FWD',
  ADD COLUMN IF NOT EXISTS fuel text NOT NULL DEFAULT 'Gasolina',
  ADD COLUMN IF NOT EXISTS luggage text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ac boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS touchscreen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reverse_camera boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking_sensors boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bluetooth boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS usb boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sunroof boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cruise_control boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS leather_seats boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS keyless_start boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wireless_charger boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS car_play boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS airbags boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS extra_features text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS document_id text;

-- Seed 7 vehicles (idempotent via name+year uniqueness check)
INSERT INTO public.vehicles
  (name, year, category, base_rate, available, license_plate, seats, transmission, engine, traction, fuel, luggage,
   ac, touchscreen, reverse_camera, parking_sensors, bluetooth, usb, sunroof, cruise_control,
   leather_seats, keyless_start, wireless_charger, car_play, airbags, extra_features, sort_order)
SELECT * FROM (VALUES
  ('Honda CRV',         2020, 'SUV',        50::numeric, true, 'PLACA1', 5, 'Automática CVT', '1.5L Turbo', 'FWD', 'Gasolina', '2 grandes + 2 pequeñas',
    true, true, true, true, true, true, true, true, false, true, false, true, true, ARRAY['Honda Sensing','Techo solar eléctrico'], 1),
  ('Honda Civic',       2019, 'Sedán',      40::numeric, true, 'PLACA2', 5, 'Automática CVT', '1.5L Turbo', 'FWD', 'Gasolina', '2 medianas',
    true, true, true, true, true, true, false, true, false, false, false, true, true, ARRAY['Apple CarPlay / Android Auto'], 2),
  ('Hyundai I10',       2022, 'Económico',  35::numeric, true, 'PLACA3', 5, 'Automática',     '1.0L',       'FWD', 'Gasolina', '1 mediana + 1 pequeña',
    true, true, true, true, true, true, false, false, false, false, false, true, true, ARRAY[]::text[], 3),
  ('Hyundai Elantra',   2020, 'Sedán',      35::numeric, true, 'PLACA4', 5, 'Automática',     '2.0L',       'FWD', 'Gasolina', '2 medianas',
    true, true, true, true, true, true, false, true, false, false, false, true, true, ARRAY[]::text[], 4),
  ('Chevrolet Captiva', 2023, 'SUV',        55::numeric, true, 'PLACA5', 7, 'Automática',     '1.5L Turbo', 'FWD', 'Gasolina', '3 grandes',
    true, true, true, true, true, true, false, true, true, true, false, true, true, ARRAY['7 pasajeros','Tercera fila de asientos'], 5),
  ('Nissan March',      2019, 'Económico',  30::numeric, true, 'PLACA6', 5, 'Automática CVT', '1.6L',       'FWD', 'Gasolina', '1 mediana',
    true, false, false, false, true, true, false, false, false, false, false, false, true, ARRAY[]::text[], 6),
  ('Kia Sorento',       2019, 'SUV',        55::numeric, true, 'PLACA7', 7, 'Automática',     '2.4L',       'FWD', 'Gasolina', '3 grandes',
    true, true, true, true, true, true, true, true, true, false, false, true, true, ARRAY['7 pasajeros','Techo solar panorámico'], 7)
) AS v(name, year, category, base_rate, available, license_plate, seats, transmission, engine, traction, fuel, luggage,
       ac, touchscreen, reverse_camera, parking_sensors, bluetooth, usb, sunroof, cruise_control,
       leather_seats, keyless_start, wireless_charger, car_play, airbags, extra_features, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.vehicles ve WHERE ve.name = v.name AND ve.year = v.year
);
