-- CRM interno da campanha Poly Dantas
-- Rode este script inteiro no SQL Editor do Supabase (Project > SQL Editor > New query).
-- Todas as tabelas são acessadas pelo backend via service role key, então o RLS
-- fica travado para qualquer outro tipo de acesso (anon/authenticated do Supabase).

create extension if not exists "pgcrypto";

do $$ begin
  create type member_role as enum ('master', 'full', 'engagement_only', 'agenda_only');
exception
  when duplicate_object then null;
end $$;

-- Pessoas com login no sistema
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  email text,
  role member_role not null default 'full',
  pin_hash text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table team_members add column if not exists email text;

-- Posts monitorados no grupo de engajamento
create table if not exists engagement_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  link text not null,
  post_date date not null default current_date,
  created_by uuid references team_members(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Lista de pessoas que precisam comentar/engajar
create table if not exists engagement_roster (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Marcação de quem já comentou em cada post
create table if not exists engagement_checks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references engagement_posts(id) on delete cascade,
  roster_id uuid not null references engagement_roster(id) on delete cascade,
  checked boolean not null default false,
  checked_by uuid references team_members(id) on delete set null,
  checked_at timestamptz,
  unique (post_id, roster_id)
);

-- Agenda semanal da candidata
create table if not exists agenda_items (
  id uuid primary key default gen_random_uuid(),
  item_date date not null,
  item_time time,
  location text,
  title text not null,
  description text,
  content_idea text,
  created_by uuid references team_members(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Banco de ideias (post-its)
create table if not exists idea_cards (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  color text not null default 'yellow',
  created_by uuid references team_members(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_engagement_checks_post on engagement_checks(post_id);
create index if not exists idx_engagement_checks_roster on engagement_checks(roster_id);
create index if not exists idx_agenda_items_date on agenda_items(item_date);

-- Bloqueia acesso direto via API pública do Supabase (anon/authenticated).
-- O app só acessa essas tabelas pelo servidor, usando a service role key,
-- que ignora RLS por padrão.
alter table team_members enable row level security;
alter table engagement_posts enable row level security;
alter table engagement_roster enable row level security;
alter table engagement_checks enable row level security;
alter table agenda_items enable row level security;
alter table idea_cards enable row level security;
