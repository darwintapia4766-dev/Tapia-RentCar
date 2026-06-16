
-- 1. Remove public insert policy + anon grant on bookings (server fn uses supabaseAdmin)
DROP POLICY IF EXISTS bookings_public_insert ON public.bookings;
REVOKE INSERT ON public.bookings FROM anon;

-- Allow server-side (service_role) inserts; authenticated users may insert their own bookings
CREATE POLICY bookings_authenticated_insert_own ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pendiente'
    AND client_name IS NOT NULL
    AND client_email IS NOT NULL
    AND client_phone IS NOT NULL
  );

-- 2. DB-level price sanity
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_price_per_day_positive CHECK (price_per_day > 0),
  ADD CONSTRAINT bookings_total_price_positive CHECK (total_price > 0),
  ADD CONSTRAINT bookings_days_positive CHECK (days > 0);

-- 3. Remove bookings from realtime publication (contains client PII)
ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings;

-- 4. Lock down user_roles: explicit admin-only management, deny self-service
CREATE POLICY user_roles_admin_insert ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ));

CREATE POLICY user_roles_admin_update ON public.user_roles
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ));

CREATE POLICY user_roles_admin_delete ON public.user_roles
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ));
