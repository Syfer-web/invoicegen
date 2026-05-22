-- Run this in Supabase SQL Editor (Project → Database → SQL Editor)
-- Adds template_favorites column to profiles table

alter table public.profiles
  add column if not exists template_favorites text[] default '{}';

alter table public.profiles
  add column if not exists is_internal boolean default false;

alter table public.profiles
  add column if not exists subscription_status text default 'active';