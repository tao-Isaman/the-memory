-- The Memory - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create memories table
create table public.memories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create nodes table
create table public.nodes (
  id uuid default uuid_generate_v4() primary key,
  memory_id uuid references public.memories(id) on delete cascade not null,
  type text not null check (type in ('password', 'image', 'text', 'text-image', 'youtube')),
  priority integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- Create indexes for better query performance
create index memories_user_id_idx on public.memories(user_id);
create index nodes_memory_id_idx on public.nodes(memory_id);
create index nodes_priority_idx on public.nodes(memory_id, priority);

-- Enable Row Level Security
alter table public.memories enable row level security;
alter table public.nodes enable row level security;

-- RLS Policies for memories
-- Anyone can view memories (for public sharing via URL)
create policy "Anyone can view memories"
  on public.memories for select
  using (true);

-- Users can insert their own memories
create policy "Users can insert own memories"
  on public.memories for insert
  with check (auth.uid() = user_id);

-- Users can update their own memories
create policy "Users can update own memories"
  on public.memories for update
  using (auth.uid() = user_id);

-- Users can delete their own memories
create policy "Users can delete own memories"
  on public.memories for delete
  using (auth.uid() = user_id);

-- RLS Policies for nodes
-- Anyone can view nodes (for public sharing via URL)
create policy "Anyone can view nodes"
  on public.nodes for select
  using (true);

-- Users can insert nodes to their memories
create policy "Users can insert own memory nodes"
  on public.nodes for insert
  with check (
    exists (
      select 1 from public.memories
      where memories.id = nodes.memory_id
      and memories.user_id = auth.uid()
    )
  );

-- Users can update nodes of their memories
create policy "Users can update own memory nodes"
  on public.nodes for update
  using (
    exists (
      select 1 from public.memories
      where memories.id = nodes.memory_id
      and memories.user_id = auth.uid()
    )
  );

-- Users can delete nodes of their memories
create policy "Users can delete own memory nodes"
  on public.nodes for delete
  using (
    exists (
      select 1 from public.memories
      where memories.id = nodes.memory_id
      and memories.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for auto-updating updated_at
create trigger memories_updated_at
  before update on public.memories
  for each row execute function public.handle_updated_at();
