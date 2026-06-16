import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeBookingPrice } from "@/lib/pricing";

const BookingInput = z.object({
  vehicleId: z.string().uuid(),
  vehicleName: z.string().min(1).max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.number().int().min(3).max(365),
  deliveryTime: z.string().min(1).max(60),
  deliveryLocation: z.string().min(2).max(300),
  deliveryFee: z.number().min(0).max(500).optional(),
  clientName: z.string().min(1).max(120),
  clientEmail: z.string().email().max(255),
  clientPhone: z.string().min(6).max(40),
  documentId: z.string().min(3).max(40).optional(),
  flightNumber: z.string().max(20).optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof BookingInput>) => BookingInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date().toISOString().slice(0, 10);
    const start = new Date(`${data.startDate}T00:00:00`);
    const end = new Date(`${data.endDate}T00:00:00`);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000);

    if (data.startDate < today) throw new Error("La fecha de inicio no puede ser en el pasado");
    if (days < 3 || days !== data.days) throw new Error("El mínimo de renta es 3 días");

    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from("vehicles")
      .select("id, name, year, base_rate, available, blocked_dates")
      .eq("id", data.vehicleId)
      .single();
    if (vehicleError || !vehicle || !vehicle.available) throw new Error("Selecciona un vehículo disponible");

    const blocked = Array.isArray(vehicle.blocked_dates) ? vehicle.blocked_dates : [];
    const overlapsBlocked = blocked.some((range) => {
      if (!range || typeof range !== "object") return false;
      const r = range as { start?: string; end?: string };
      return Boolean(r.start && r.end && data.startDate < r.end && data.endDate > r.start);
    });
    if (overlapsBlocked) throw new Error("Este vehículo no está disponible en las fechas seleccionadas");

    const { data: conflicts, error: conflictError } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("vehicle_id", data.vehicleId)
      .in("status", ["pendiente", "confirmado"])
      .lt("start_date", data.endDate)
      .gt("end_date", data.startDate)
      .limit(1);
    if (conflictError) throw new Error(conflictError.message);
    if ((conflicts ?? []).length > 0) throw new Error("Este vehículo ya tiene una reserva en esas fechas");

    const price = computeBookingPrice(Number(vehicle.base_rate), days);
    const allowedFees = [0, 29, 79];
    const deliveryFee = allowedFees.includes(data.deliveryFee ?? 0) ? (data.deliveryFee ?? 0) : 0;
    const totalPrice = price.total + deliveryFee;

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: null,
        vehicle_id: data.vehicleId,
        vehicle_name: `${vehicle.name} ${vehicle.year}`,
        start_date: data.startDate,
        end_date: data.endDate,
        days: data.days,
        delivery_time: data.deliveryTime,
        delivery_location: data.deliveryLocation,
        price_per_day: price.perDay,
        total_price: totalPrice,
        client_name: data.clientName,
        client_email: data.clientEmail,
        client_phone: data.clientPhone,
        document_id: data.documentId ?? null,
        flight_number: data.flightNumber ?? null,
        status: "pendiente",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    const { count } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("client_email", data.clientEmail)
      .eq("client_phone", data.clientPhone);
    await supabaseAdmin.from("client_contacts").upsert(
      {
        name: data.clientName,
        email: data.clientEmail,
        phone: data.clientPhone,
        last_booking_at: new Date().toISOString(),
        bookings_count: count ?? 1,
      },
      { onConflict: "email,phone" },
    );
    return { booking };
  });

const LookupInput = z.object({ code: z.string().min(4).max(36) });

export const lookupBooking = createServerFn({ method: "GET" })
  .inputValidator((d: z.infer<typeof LookupInput>) => LookupInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const prefix = data.code.toLowerCase().replace(/-/g, "").slice(0, 8);
    const { data: rows, error } = await supabaseAdmin
      .from("bookings")
      .select("id,vehicle_name,start_date,end_date,days,delivery_location,delivery_time,total_price,status,client_name,created_at")
      .ilike("id", `${prefix}%`)
      .limit(1);
    if (error) throw new Error(error.message);
    return { booking: rows?.[0] ?? null };
  });

const CancelPublicInput = z.object({ id: z.string().uuid() });

export const cancelBookingPublic = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof CancelPublicInput>) => CancelPublicInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from("bookings")
      .select("status")
      .eq("id", data.id)
      .single();
    if (fetchErr || !booking) throw new Error("Reserva no encontrada");
    if (booking.status !== "pendiente") throw new Error("Solo se pueden cancelar reservas pendientes");
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelado" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { bookings: data ?? [] };
  });

export const listAllBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { bookings: data ?? [] };
  });

const UpdateStatus = z.object({
  id: z.string().uuid(),
  status: z.enum(["pendiente", "confirmado", "completado", "cancelado"]),
});

export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof UpdateStatus>) => UpdateStatus.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateFlight = z.object({
  id: z.string().uuid(),
  flightNumber: z.string().max(20),
});

export const updateBookingFlight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof UpdateFlight>) => UpdateFlight.parse(d))
  .handler(async ({ data, context }) => {
    const value = data.flightNumber.trim();
    const { error } = await context.supabase
      .from("bookings")
      .update({ flight_number: value || null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const DeleteBooking = z.object({ id: z.string().uuid() });

export const deleteBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof DeleteBooking>) => DeleteBooking.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
