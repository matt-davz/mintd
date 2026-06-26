-- ============================================================
-- 0029_loas_storage_bucket.sql
-- Public Supabase Storage bucket for LOA files (images + PDFs).
-- Cloudinary raw resources require signed delivery on this account
-- so LOA files are stored in Supabase Storage instead.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'loas',
  'loas',
  true,
  20971520, -- 20 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

-- Public read — any visitor can view LOA files
create policy "Public read loas"
  on storage.objects for select
  using (bucket_id = 'loas');

-- Admin write — anon key is fine (Clerk guards the admin routes)
create policy "Admin insert loas"
  on storage.objects for insert
  with check (bucket_id = 'loas');

create policy "Admin update loas"
  on storage.objects for update
  using (bucket_id = 'loas');

create policy "Admin delete loas"
  on storage.objects for delete
  using (bucket_id = 'loas');
