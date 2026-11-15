-- Grupos "quero um desses": itens únicos parecidos, com um preferido (⭐).
-- Quando um item do grupo é dado ou marcado "já tenho", os outros saem da lista
-- de desejos junto (vão para "já tenho" marcados como left_with_group).

create table public.item_groups (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           text not null references public.profiles (id) on delete cascade,
  name               text not null check (char_length(btrim(name)) between 1 and 60),
  preferred_item_id  uuid references public.items (id) on delete set null,
  created_at         timestamptz not null default now()
);
create index item_groups_owner_idx on public.item_groups (owner_id);

alter table public.items
  add column group_id uuid references public.item_groups (id) on delete set null,
  add column left_with_group boolean not null default false;
create index items_group_idx on public.items (group_id) where group_id is not null;

-- Só itens únicos ficam em grupo (RN: "sempre bem-vindo" pode ser dado várias vezes)
alter table public.items add constraint items_grupo_so_unico
  check (group_id is null or kind = 'unico');

alter table public.item_groups enable row level security;
revoke all on public.item_groups from anon, authenticated;
grant select, insert, update, delete on public.item_groups to service_role;

-- Tira da lista os outros itens dos grupos que tiveram um item resolvido.
create or replace function public.settle_item_groups(p_items uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.items o
     set status = 'ja_tenho', status_changed_at = now(), left_with_group = true
    from public.items r
   where r.id = any (p_items)
     and r.group_id is not null
     and r.status in ('ja_tenho', 'recebido')
     and o.group_id = r.group_id
     and o.id <> r.id
     and o.status = 'desejado';
end;
$$;
revoke all on function public.settle_item_groups(uuid[]) from public, anon, authenticated;
grant execute on function public.settle_item_groups(uuid[]) to service_role;

-- Dar o combo agora também resolve os grupos dos itens dados.
create or replace function public.combo_mark_given(p_combo uuid, p_creator text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_combo public.combos%rowtype;
  v_items uuid[];
begin
  select * into v_combo from public.combos where id = p_combo for update;

  if v_combo.id is null or v_combo.creator_id <> p_creator then
    raise exception 'Combo não encontrado';
  end if;
  if v_combo.status = 'dado' then
    raise exception 'Esse combo já foi dado';
  end if;
  if not exists (select 1 from public.combo_items where combo_id = p_combo) then
    raise exception 'O combo está vazio';
  end if;

  update public.items i
     set status = 'recebido', status_changed_at = now()
    from public.combo_items ci
   where ci.combo_id = p_combo
     and ci.item_id = i.id
     and i.kind = 'unico'
     and i.status = 'desejado';

  select array_agg(item_id) into v_items from public.combo_items where combo_id = p_combo and item_id is not null;
  if v_items is not null then
    perform public.settle_item_groups(v_items);
  end if;

  update public.combos
     set status = 'dado',
         purchased_at = coalesce(purchased_at, now()),
         given_at = now()
   where id = p_combo;
end;
$$;
