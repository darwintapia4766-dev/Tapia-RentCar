-- =============================================================
-- Tapia RentCar — Seed de 7 vehículos
-- Pega este SQL en: Supabase Dashboard → SQL Editor → Run
-- Reemplaza [PLACA1]…[PLACA7] con las placas reales antes de ejecutar
-- =============================================================

DELETE FROM vehicles; -- limpia vehículos anteriores si los hay

INSERT INTO vehicles (
  name, year, category, base_rate, license_plate,
  seats, transmission, engine, traction, fuel, luggage,
  ac, touchscreen, reverse_camera, parking_sensors,
  bluetooth, usb, sunroof, cruise_control, leather_seats,
  keyless_start, wireless_charger, car_play, airbags,
  extra_features, available, units, sort_order,
  blocked_dates, images
) VALUES

-- 1. Honda CR-V
(
  'Honda CR-V', 2020, 'SUV', 50, '[PLACA1]',
  5, 'Automática CVT', '1.5L Turbo', 'FWD', 'Gasolina', '2 grandes + 2 pequeñas',
  true, true, true, true,
  true, true, true, true, false,
  true, false, true, true,
  ARRAY['Honda Sensing', 'Techo solar eléctrico'],
  true, 1, 1, '[]'::jsonb, ARRAY[]::text[]
),

-- 2. Honda Civic
(
  'Honda Civic', 2019, 'Sedán', 40, '[PLACA2]',
  5, 'Automática CVT', '1.5L Turbo', 'FWD', 'Gasolina', '2 medianas',
  true, true, true, true,
  true, true, false, true, false,
  false, false, true, true,
  ARRAY['Apple CarPlay / Android Auto'],
  true, 1, 2, '[]'::jsonb, ARRAY[]::text[]
),

-- 3. Hyundai i10
(
  'Hyundai i10', 2022, 'Económico', 35, '[PLACA3]',
  5, 'Automática', '1.0L', 'FWD', 'Gasolina', '1 mediana + 1 pequeña',
  true, true, true, true,
  true, true, false, false, false,
  false, false, true, true,
  ARRAY[]::text[],
  true, 1, 3, '[]'::jsonb, ARRAY[]::text[]
),

-- 4. Hyundai Elantra
(
  'Hyundai Elantra', 2020, 'Sedán', 35, '[PLACA4]',
  5, 'Automática', '2.0L', 'FWD', 'Gasolina', '2 medianas',
  true, true, true, true,
  true, true, false, true, false,
  false, false, true, true,
  ARRAY[]::text[],
  true, 1, 4, '[]'::jsonb, ARRAY[]::text[]
),

-- 5. Chevrolet Captiva
(
  'Chevrolet Captiva', 2023, 'SUV', 55, '[PLACA5]',
  7, 'Automática', '1.5L Turbo', 'FWD', 'Gasolina', '3 grandes',
  true, true, true, true,
  true, true, false, true, true,
  true, false, true, true,
  ARRAY['7 pasajeros', 'Tercera fila de asientos'],
  true, 1, 5, '[]'::jsonb, ARRAY[]::text[]
),

-- 6. Nissan March
(
  'Nissan March', 2019, 'Económico', 30, '[PLACA6]',
  5, 'Automática CVT', '1.6L', 'FWD', 'Gasolina', '1 mediana',
  true, false, false, false,
  true, true, false, false, false,
  false, false, false, true,
  ARRAY[]::text[],
  true, 1, 6, '[]'::jsonb, ARRAY[]::text[]
),

-- 7. Kia Sorento
(
  'Kia Sorento', 2019, 'SUV', 55, '[PLACA7]',
  7, 'Automática', '2.4L', 'FWD', 'Gasolina', '3 grandes',
  true, true, true, true,
  true, true, true, true, true,
  false, false, true, true,
  ARRAY['7 pasajeros', 'Techo solar panorámico'],
  true, 1, 7, '[]'::jsonb, ARRAY[]::text[]
);
