# Tapia RentCar — Major Update Plan

This is a large multi-area update. I'll break it into phases so you can approve and we ship incrementally. The backend is **Lovable Cloud (Supabase)**, not Firebase — I'll map your Firestore requirements to it (admin gating uses our existing `user_roles` table, not `VITE_ADMIN_UID`).

---

## Phase 1 — Database schema + seed 7 vehicles

Extend `vehicles` table with all new spec columns:
- `license_plate` (text, internal only — never returned to public reads)
- `seats`, `transmission`, `engine`, `traction`, `fuel`, `luggage`
- Equipment booleans: `ac`, `touchscreen`, `reverse_camera`, `parking_sensors`, `bluetooth`, `usb`, `sunroof`, `cruise_control`, `leather_seats`, `keyless_start`, `wireless_charger`, `car_play`, `airbags`
- `extra_features` (text[])

Add `document_id` to `bookings` (cédula/pasaporte).
Add `delivery_zones` to `site_settings` (JSON).

Seed the 7 vehicles you listed. License plates will be placeholder (`PLACA1`–`PLACA7`) for you to edit later in admin.

**Security:** Public reads will use a server function that projects only safe columns (excludes `license_plate`). Direct table reads stay open for non-sensitive fields, or I'll add a view — I'll choose the simpler safe option.

## Phase 2 — Fleet section + date filter (homepage)

- Sticky date range picker above the grid (min 3 days, "Buscar disponibilidad")
- Vehicle cards with quick-spec icons, availability badge, 4 pricing tabs
- Expandable "Ver especificaciones" with full spec list + ✅/❌
- Filter by date availability (checks `blocked_dates` + existing bookings)
- Selected dates persist to `/reservar` via URL params

## Phase 3 — Booking form revamp (/reservar)

- Add fields: `documentId`, delivery location dropdown with the 7 options + custom address
- Delivery time selector (6:00–22:00, 30-min steps) — already exists, will keep
- Return time stays (already added)
- Price summary with discount badge + "Ahorras $X"
- On submit: save booking → open WhatsApp with new message format including document & email
- Success screen with "Volver al inicio"

## Phase 4 — Admin panel overhaul (/admin)

5 tabs, mobile responsive, Spanish:

1. **Reservas** — table, status dropdown, WhatsApp button, filter/search by name or document
2. **Vehículos** — full edit form (all new spec fields, license plate, equipment checkboxes, extra features, photos, blocked dates, availability toggle), add/delete
3. **Servicios** — already mostly exists, polish
4. **Clientes** — list with document ID, signup date, bookings count, WhatsApp, CSV export
5. **Configuración** — WhatsApp number, business name/address, Instagram, hero copy, delivery zones manager

Admin gating stays via `user_roles.role = 'admin'` (already implemented). I will **not** use `VITE_ADMIN_UID` — that's less secure and you already have proper roles.

## Phase 5 — Client dashboard polish (/mi-cuenta)

Show profile, booking list with vehicle thumbnail, status badges, WhatsApp button per booking.

---

## Technical notes / decisions I need to flag

1. **Google login**: already in place; will reuse for booking auth gate.
2. **License plates**: I'll restrict via a public-safe server function for list views; admin uses authenticated server fn that returns full data.
3. **Pricing**: existing `src/lib/pricing.ts` already matches your formulas — no logic change needed, just surface badges in UI.
4. **Hardcoded content**: I'll move hero copy + business info into `site_settings` so admin Configuración tab drives them.
5. **Delivery fee**: stored as label-only ("Gratis" / "A coordinar") — no numeric fee added to total, matches your spec.

---

## Suggested rollout

Given the size, I recommend shipping in this order with checkpoints:

- **PR 1 (this turn)**: Phase 1 — schema migration + seed vehicles
- **PR 2**: Phase 2 — fleet UI + date filter
- **PR 3**: Phase 3 — booking form
- **PR 4**: Phase 4 — admin panel
- **PR 5**: Phase 5 — client dashboard + final polish

Approve and I'll start with **Phase 1** (migration + seed). After each phase you can test in preview and we move to the next. If you want me to push straight through all phases without stopping, say "todo de una vez" and I'll batch it.
