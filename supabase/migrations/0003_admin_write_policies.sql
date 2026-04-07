-- ============================================================
-- ADMIN WRITE POLICIES
-- ============================================================
-- The admin panel uses the Supabase anon key directly from the
-- browser. Clerk protects all /admin/* routes at the React level
-- so only the authenticated admin can reach forms that trigger
-- these writes. These policies allow the anon role to write
-- freely — security boundary is Clerk route protection.
-- ============================================================

-- items — admin can read ALL items (not just visible ones), and write freely
create policy "admin_read_all_items" on public.items
  for select using (true);

create policy "admin_insert_items" on public.items
  for insert with check (true);

create policy "admin_update_items" on public.items
  for update using (true);

create policy "admin_delete_items" on public.items
  for delete using (true);

-- certifications
create policy "admin_read_all_certifications" on public.certifications
  for select using (true);

create policy "admin_insert_certifications" on public.certifications
  for insert with check (true);

create policy "admin_update_certifications" on public.certifications
  for update using (true);

create policy "admin_delete_certifications" on public.certifications
  for delete using (true);

-- signatories
create policy "admin_read_all_signatories" on public.signatories
  for select using (true);

create policy "admin_insert_signatories" on public.signatories
  for insert with check (true);

create policy "admin_update_signatories" on public.signatories
  for update using (true);

create policy "admin_delete_signatories" on public.signatories
  for delete using (true);

-- images
create policy "admin_read_all_images" on public.images
  for select using (true);

create policy "admin_insert_images" on public.images
  for insert with check (true);

create policy "admin_update_images" on public.images
  for update using (true);

create policy "admin_delete_images" on public.images
  for delete using (true);

-- population_snapshots
create policy "admin_read_all_population_snapshots" on public.population_snapshots
  for select using (true);

create policy "admin_insert_population_snapshots" on public.population_snapshots
  for insert with check (true);

-- item_tags
create policy "admin_insert_item_tags" on public.item_tags
  for insert with check (true);

create policy "admin_delete_item_tags" on public.item_tags
  for delete using (true);
