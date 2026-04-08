-- ============================================================
-- 0007_signatories_additions.sql
-- Add signature detail columns to signatories
-- Useful across all item types, not just photos
-- ============================================================

alter table public.signatories
  add column signature_location text,
  add column ink_color           text;

comment on column public.signatories.signature_location is 'Where on the item the signature appears e.g. sweet spot, barrel, panel';
comment on column public.signatories.ink_color          is 'Ink color used for the signature e.g. blue, black, silver, gold';
