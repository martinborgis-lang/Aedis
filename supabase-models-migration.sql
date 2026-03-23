-- Migration: Add 3D model support (Pascal Editor viewer)
-- Run this in Supabase SQL Editor

-- 1. Create the "models" storage bucket via Supabase UI:
--    Storage > New bucket > "models" > Public: true

-- 2. Storage policies
create policy "Public read models"
  on storage.objects for select
  using (bucket_id = 'models');

create policy "Architects can upload models"
  on storage.objects for insert
  with check (
    bucket_id = 'models'
    and auth.role() = 'authenticated'
  );

create policy "Architects can delete their models"
  on storage.objects for delete
  using (
    bucket_id = 'models'
    and auth.role() = 'authenticated'
  );

-- 3. Add model_url column to projects
alter table projects
  add column if not exists model_url text;
