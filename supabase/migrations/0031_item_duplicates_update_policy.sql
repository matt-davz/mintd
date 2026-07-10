-- ============================================================
-- 0031_item_duplicates_update_policy.sql
-- Add UPDATE policy for item_duplicates so admin can edit notes
-- ============================================================

create policy "admin_update_item_duplicates" on public.item_duplicates
  for update using (true);
