create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  email_verified boolean default false,
  display_name text,
  photo_url text,
  preferred_level text,
  native_language text,
  analytics jsonb not null default '{
    "totalTranslations": 0,
    "ocrScans": 0,
    "pronunciationAttempts": 0,
    "sentenceGenerations": 0,
    "entityAnalyses": 0
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  feature text not null check (
    feature in ('translation', 'ocr', 'pronunciation', 'sentence', 'entity')
  ),
  count_field text not null,
  label text not null,
  amount integer not null default 1 check (amount > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_created_idx
  on public.activity_logs (user_id, created_at desc);

alter table public.users enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "Users can read own activity" on public.activity_logs;
create policy "Users can read own activity"
  on public.activity_logs for select
  using (auth.uid() = user_id);
