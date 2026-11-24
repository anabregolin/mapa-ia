-- Tabela da sincronização do Mapa de IA. Rodar uma vez no SQL Editor do Supabase.
-- Cada pessoa tem UMA linha e só enxerga/altera a própria (RLS).
create table if not exists public.progresso (
  user_id uuid primary key references auth.users (id) on delete cascade,
  estado jsonb not null,
  versao bigint not null default 1,
  atualizado timestamptz not null default now()
);

alter table public.progresso enable row level security;

create policy "ler o próprio" on public.progresso for select to authenticated using (auth.uid() = user_id);
create policy "criar o próprio" on public.progresso for insert to authenticated with check (auth.uid() = user_id);
create policy "mudar o próprio" on public.progresso for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
