ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

DROP POLICY IF EXISTS bookings_insert_own ON public.bookings;

GRANT INSERT ON public.bookings TO anon;

CREATE POLICY bookings_public_insert
ON public.bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pendiente'
  AND user_id IS NULL
  AND client_name IS NOT NULL
  AND client_phone IS NOT NULL
  AND client_email IS NOT NULL
);