DROP POLICY IF EXISTS user_roles_select_own_or_admin ON public.user_roles;
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own_or_admin_direct ON public.profiles;
CREATE POLICY profiles_select_own_or_admin_direct
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own_or_admin_direct ON public.profiles;
CREATE POLICY profiles_update_own_or_admin_direct
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

DROP POLICY IF EXISTS vehicles_admin_insert ON public.vehicles;
DROP POLICY IF EXISTS vehicles_admin_update ON public.vehicles;
DROP POLICY IF EXISTS vehicles_admin_delete ON public.vehicles;
DROP POLICY IF EXISTS vehicles_admin_insert_direct ON public.vehicles;
DROP POLICY IF EXISTS vehicles_admin_update_direct ON public.vehicles;
DROP POLICY IF EXISTS vehicles_admin_delete_direct ON public.vehicles;
CREATE POLICY vehicles_admin_insert_direct ON public.vehicles FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY vehicles_admin_update_direct ON public.vehicles FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY vehicles_admin_delete_direct ON public.vehicles FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

DROP POLICY IF EXISTS services_admin_insert ON public.services;
DROP POLICY IF EXISTS services_admin_update ON public.services;
DROP POLICY IF EXISTS services_admin_delete ON public.services;
DROP POLICY IF EXISTS services_admin_insert_direct ON public.services;
DROP POLICY IF EXISTS services_admin_update_direct ON public.services;
DROP POLICY IF EXISTS services_admin_delete_direct ON public.services;
CREATE POLICY services_admin_insert_direct ON public.services FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY services_admin_update_direct ON public.services FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY services_admin_delete_direct ON public.services FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

DROP POLICY IF EXISTS site_settings_admin_write ON public.site_settings;
DROP POLICY IF EXISTS site_settings_admin_write_direct ON public.site_settings;
CREATE POLICY site_settings_admin_write_direct ON public.site_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

DROP POLICY IF EXISTS bookings_select_own_or_admin ON public.bookings;
DROP POLICY IF EXISTS bookings_admin_update ON public.bookings;
DROP POLICY IF EXISTS bookings_admin_delete ON public.bookings;
DROP POLICY IF EXISTS bookings_select_own_or_admin_direct ON public.bookings;
DROP POLICY IF EXISTS bookings_admin_update_direct ON public.bookings;
DROP POLICY IF EXISTS bookings_admin_delete_direct ON public.bookings;
CREATE POLICY bookings_select_own_or_admin_direct ON public.bookings FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);
CREATE POLICY bookings_admin_update_direct ON public.bookings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY bookings_admin_delete_direct ON public.bookings FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  last_booking_at timestamp with time zone NOT NULL DEFAULT now(),
  bookings_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (email, phone)
);
GRANT SELECT ON public.client_contacts TO authenticated;
GRANT ALL ON public.client_contacts TO service_role;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_contacts_admin_read ON public.client_contacts;
CREATE POLICY client_contacts_admin_read ON public.client_contacts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

DROP TRIGGER IF EXISTS set_client_contacts_updated_at ON public.client_contacts;
CREATE TRIGGER set_client_contacts_updated_at
BEFORE UPDATE ON public.client_contacts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS vehicle_images_public_read ON storage.objects;
DROP POLICY IF EXISTS vehicle_images_admin_insert ON storage.objects;
DROP POLICY IF EXISTS vehicle_images_admin_update ON storage.objects;
DROP POLICY IF EXISTS vehicle_images_admin_delete ON storage.objects;
DROP POLICY IF EXISTS vehicle_images_admin_insert_direct ON storage.objects;
DROP POLICY IF EXISTS vehicle_images_admin_update_direct ON storage.objects;
DROP POLICY IF EXISTS vehicle_images_admin_delete_direct ON storage.objects;
CREATE POLICY vehicle_images_admin_insert_direct ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vehicle-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY vehicle_images_admin_update_direct ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vehicle-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (bucket_id = 'vehicle-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY vehicle_images_admin_delete_direct ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vehicle-images' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;