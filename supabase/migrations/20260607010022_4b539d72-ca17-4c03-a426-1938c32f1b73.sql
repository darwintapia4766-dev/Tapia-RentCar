DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='vehicles') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.vehicles';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='services') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.services';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='site_settings') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.site_settings';
  END IF;
END $$;