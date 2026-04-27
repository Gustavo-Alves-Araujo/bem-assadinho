-- Fix: allow anon key to access customers table
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

create policy "allow_all_anon" on customers
  for all to anon using (true) with check (true);
