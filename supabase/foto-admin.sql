-- ═══════════════════════════════════════════════════════════
-- Foto-Verwaltung freischalten (einmalig ausführen)
-- Supabase-Projekt „tischlerei-bilder“ → SQL Editor → einfügen → Run
--
-- Danach: Authentication → Users → „Add user“ → E-Mail + Passwort,
-- Haken bei „Auto Confirm User“. Nur E-Mails aus foto_admins
-- dürfen hochladen, ändern und löschen. Lesen bleibt öffentlich.
-- ═══════════════════════════════════════════════════════════

-- Allowlist: nur diese E-Mail-Adressen dürfen Fotos verwalten
create table if not exists public.foto_admins (
  email text primary key check (email = lower(email))
);
alter table public.foto_admins enable row level security;
-- bewusst keine Policies: die Tabelle ist nur über die Funktion unten lesbar

create or replace function public.is_foto_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.foto_admins a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.is_foto_admin() from public, anon;
grant execute on function public.is_foto_admin() to authenticated;

-- Weitere Personen freischalten: einfach eine Zeile ergänzen
insert into public.foto_admins (email) values
  ('tischlerei.ochenbauer@gmail.com')
on conflict do nothing;

drop policy if exists "Foto-Admins duerfen hochladen" on storage.objects;
create policy "Foto-Admins duerfen hochladen"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'bilder' and public.is_foto_admin());

drop policy if exists "Foto-Admins duerfen aendern" on storage.objects;
create policy "Foto-Admins duerfen aendern"
  on storage.objects for update to authenticated
  using (bucket_id = 'bilder' and public.is_foto_admin())
  with check (bucket_id = 'bilder' and public.is_foto_admin());

drop policy if exists "Foto-Admins duerfen loeschen" on storage.objects;
create policy "Foto-Admins duerfen loeschen"
  on storage.objects for delete to authenticated
  using (bucket_id = 'bilder' and public.is_foto_admin());

-- Bucket absichern: nur Bilder und die Kategorien-Datei, max. 15 MB pro Datei
update storage.buckets
set file_size_limit = 15728640,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/json']
where id = 'bilder';
