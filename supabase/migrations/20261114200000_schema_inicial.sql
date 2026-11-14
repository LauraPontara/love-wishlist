-- =============================================================================
-- Love Wishlist: schema inicial (requisitos fechados em 14/11/2026)
--
-- Princípios:
--  * ADR-002: só o servidor (service_role) acessa o banco. RLS ligado sem
--    policies; anon/authenticated sem nenhum grant.
--  * ADR-009: todo presente é um combo. "Reservado" = estar num combo
--    'comprado'. O histórico vem dos combos 'dado'. As invariantes ficam em triggers.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: os dois membros do casal
-- (o vínculo telefone → perfil vive só em env vars, nunca aqui)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                text primary key check (id ~ '^[a-z0-9_-]{2,32}$'),
  display_name      text not null check (char_length(display_name) between 1 and 40),
  avatar            text check (avatar is null or avatar ~ '^[a-z0-9-]{2,40}$'), -- arquivo em public/avatars/{avatar}.svg
  notify_new_items  boolean not null default true,
  notify_occasions  boolean not null default true,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- items: desejos de cada um
-- ---------------------------------------------------------------------------
create table public.items (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           text not null references public.profiles (id) on delete cascade,

  -- RF12/RN05: o link é editável, mas nunca vazio
  url                text not null check (url ~* '^https?://\S+$'),
  url_normalized     text not null check (url_normalized <> ''),

  title              text not null check (char_length(btrim(title)) between 1 and 300),
  image_url          text,
  price_cents        integer check (price_cents is null or price_cents >= 0),
  currency           char(3) not null default 'BRL',
  price_checked_at   timestamptz,
  store              text check (store is null or char_length(store) <= 80),
  category           text not null default 'Outros' check (category in (
                       'Beleza', 'Cuidados pessoais', 'Comida & doces', 'Roupas',
                       'Acessórios', 'Tecnologia', 'Casa', 'Livros & papelaria',
                       'Experiências', 'Outros')),
  variant            jsonb not null default '{}'::jsonb check (jsonb_typeof(variant) = 'object'),
  notes              text check (notes is null or char_length(notes) <= 1000),

  kind               text not null default 'unico' check (kind in ('unico', 'sempre')),
  status             text not null default 'desejado' check (status in ('desejado', 'ja_tenho', 'recebido')),
  status_changed_at  timestamptz,

  scrape_status      text not null default 'manual' check (scrape_status in
                       ('ok', 'parcial', 'bloqueado', 'link_quebrado', 'manual')),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- RN03: itens "sempre" nunca saem da lista
  constraint items_sempre_sempre_desejado check (kind = 'unico' or status = 'desejado'),
  constraint items_status_changed_coerente check ((status = 'desejado') = (status_changed_at is null)),
  -- RF10: mesmo link não se repete na lista do mesmo dono
  constraint items_owner_url_unico unique (owner_id, url_normalized)
);

create index items_owner_status_idx on public.items (owner_id, status);

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- occasions: calendário do casal (repete todo ano)
-- ---------------------------------------------------------------------------
create table public.occasions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  kind        text not null check (kind in ('aniversario', 'namoro', 'natal', 'dia_namorados', 'outra')),
  month       smallint not null check (month between 1 and 12),
  day         smallint not null check (day between 1 and 31),
  honoree_id  text references public.profiles (id) on delete cascade, -- null = do casal
  created_at  timestamptz not null default now(),

  constraint occasions_dia_valido check (
    make_date(2024, month, day) is not null  -- 2024 é bissexto: aceita 29/02
  ),
  constraint occasions_aniversario_tem_dono check (kind <> 'aniversario' or honoree_id is not null)
);

-- RF36: datas que já vêm cadastradas
insert into public.occasions (name, kind, month, day) values
  ('Natal', 'natal', 12, 25),
  ('Dia dos Namorados', 'dia_namorados', 6, 12);

-- ---------------------------------------------------------------------------
-- combos: presentes montados (RN02: visíveis só para quem montou)
-- ---------------------------------------------------------------------------
create table public.combos (
  id             uuid primary key default gen_random_uuid(),
  creator_id     text not null references public.profiles (id) on delete cascade,
  recipient_id   text not null references public.profiles (id) on delete cascade,
  name           text not null check (char_length(btrim(name)) between 1 and 80),
  occasion_id    uuid references public.occasions (id) on delete set null,
  occasion_date  date,
  budget_cents   integer check (budget_cents is null or budget_cents >= 0),
  status         text not null default 'montado' check (status in ('montado', 'comprado', 'dado')),
  purchased_at   timestamptz,
  given_at       timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint combos_nao_para_si check (creator_id <> recipient_id),
  constraint combos_purchased_coerente check ((status = 'comprado') = (purchased_at is not null) or status = 'dado'),
  constraint combos_given_coerente check ((status = 'dado') = (given_at is not null))
);

create index combos_creator_idx   on public.combos (creator_id, status);
create index combos_recipient_idx on public.combos (recipient_id, status);

create trigger combos_set_updated_at
  before update on public.combos
  for each row execute function public.set_updated_at();

-- RN07: combo 'dado' é definitivo
create or replace function public.combos_dado_imutavel()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'dado' then
    raise exception 'Um combo já dado não pode ser alterado';
  end if;
  return new;
end;
$$;

create trigger combos_dado_imutavel
  before update on public.combos
  for each row execute function public.combos_dado_imutavel();

-- ---------------------------------------------------------------------------
-- combo_items: itens da wishlist ou extras dentro de um combo
-- ---------------------------------------------------------------------------
create table public.combo_items (
  id                uuid primary key default gen_random_uuid(),
  combo_id          uuid not null references public.combos (id) on delete cascade,
  item_id           uuid references public.items (id) on delete set null, -- RF34: sobrevive à exclusão
  is_extra          boolean not null default false,
  snapshot_title    text not null check (char_length(btrim(snapshot_title)) between 1 and 300),
  extra_url         text check (extra_url is null or extra_url ~* '^https?://\S+$'),
  quantity          integer not null default 1 check (quantity between 1 and 99),
  unit_price_cents  integer check (unit_price_cents is null or unit_price_cents >= 0),
  paid_cents        integer check (paid_cents is null or paid_cents >= 0),
  created_at        timestamptz not null default now(),

  -- Item da lista XOR extra (o item_id pode virar null se o item for excluído)
  constraint combo_items_extra_sem_item check (not is_extra or item_id is null),
  constraint combo_items_extra_url_so_extra check (is_extra or extra_url is null)
);

create unique index combo_items_item_unico_no_combo
  on public.combo_items (combo_id, item_id) where item_id is not null;
create index combo_items_item_idx on public.combo_items (item_id) where item_id is not null;

-- RN07/RN08/RF28: regras de composição do combo
create or replace function public.combo_items_validar()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_combo  public.combos%rowtype;
  v_item   public.items%rowtype;
begin
  -- RF34: quando o item é excluído da lista, o FK zera item_id.
  -- Isso vale em qualquer etapa, inclusive 'dado'; o snapshot preserva o histórico.
  if tg_op = 'UPDATE'
     and old.item_id is not null and new.item_id is null
     and new.combo_id = old.combo_id and new.is_extra = old.is_extra
     and new.quantity = old.quantity then
    return new;
  end if;

  select * into v_combo
  from public.combos
  where id = coalesce(new.combo_id, old.combo_id);

  if v_combo.status = 'dado' then
    raise exception 'Um combo já dado não pode ser alterado';
  end if;

  -- Adicionar/remover/trocar item só com o combo montado.
  -- Com o combo comprado, só "paguei" e o preço unitário podem mudar.
  if v_combo.status <> 'montado' then
    if tg_op <> 'UPDATE'
       or new.item_id is distinct from old.item_id
       or new.is_extra is distinct from old.is_extra
       or new.quantity is distinct from old.quantity
       or new.combo_id is distinct from old.combo_id then
      raise exception 'Itens só podem ser adicionados ou removidos com o combo montado';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.item_id is not null
     and (tg_op = 'INSERT' or new.item_id is distinct from old.item_id) then
    select * into v_item from public.items where id = new.item_id;

    if v_item.owner_id <> v_combo.recipient_id then
      raise exception 'O item precisa ser da lista de quem vai receber o combo';
    end if;
    if v_item.kind = 'unico' and v_item.status <> 'desejado' then
      raise exception 'Esse item não está mais disponível';
    end if;
  end if;

  if new.item_id is not null and new.quantity > 1 then
    select * into v_item from public.items where id = new.item_id;
    if v_item.kind = 'unico' then
      raise exception 'Itens únicos têm quantidade 1';
    end if;
  end if;

  return new;
end;
$$;

create trigger combo_items_validar
  before insert or update or delete on public.combo_items
  for each row execute function public.combo_items_validar();

-- ---------------------------------------------------------------------------
-- Transições de etapa do combo (atômicas)
-- ---------------------------------------------------------------------------

-- montado → comprado (reserva em segredo os itens únicos)
create or replace function public.combo_mark_purchased(p_combo uuid, p_creator text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_combo public.combos%rowtype;
begin
  select * into v_combo from public.combos where id = p_combo for update;

  if v_combo.id is null or v_combo.creator_id <> p_creator then
    raise exception 'Combo não encontrado';
  end if;
  if v_combo.status <> 'montado' then
    raise exception 'Só um combo montado pode ser marcado como comprado';
  end if;
  if not exists (select 1 from public.combo_items where combo_id = p_combo) then
    raise exception 'O combo está vazio';
  end if;

  -- Os itens únicos precisam continuar disponíveis
  if exists (
    select 1
    from public.combo_items ci
    join public.items i on i.id = ci.item_id
    where ci.combo_id = p_combo and i.kind = 'unico' and i.status <> 'desejado'
  ) then
    raise exception 'Algum item do combo não está mais disponível';
  end if;

  -- RN04: um item único só pode estar em um combo comprado por vez
  if exists (
    select 1
    from public.combo_items ci
    join public.items i on i.id = ci.item_id and i.kind = 'unico'
    join public.combo_items other on other.item_id = ci.item_id and other.combo_id <> p_combo
    join public.combos oc on oc.id = other.combo_id and oc.status = 'comprado'
    where ci.combo_id = p_combo
  ) then
    raise exception 'Algum item do combo já está em outro combo comprado';
  end if;

  update public.combos
     set status = 'comprado', purchased_at = now()
   where id = p_combo;
end;
$$;

-- comprado → montado
create or replace function public.combo_unmark_purchased(p_combo uuid, p_creator text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.combos
     set status = 'montado', purchased_at = null
   where id = p_combo and creator_id = p_creator and status = 'comprado';

  if not found then
    raise exception 'Combo não encontrado ou não está comprado';
  end if;
end;
$$;

-- montado/comprado → dado (itens únicos desejados viram 'recebido')
create or replace function public.combo_mark_given(p_combo uuid, p_creator text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_combo public.combos%rowtype;
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

  update public.combos
     set status = 'dado',
         purchased_at = coalesce(purchased_at, now()),
         given_at = now()
   where id = p_combo;
end;
$$;

-- ---------------------------------------------------------------------------
-- Web Push
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  text not null references public.profiles (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index push_subscriptions_profile_idx on public.push_subscriptions (profile_id);

-- Evita lembrete duplicado: uma linha por ocasião + ano + pessoa
create table public.notification_log (
  occasion_id  uuid not null references public.occasions (id) on delete cascade,
  year         smallint not null,
  profile_id   text not null references public.profiles (id) on delete cascade,
  sent_at      timestamptz not null default now(),
  primary key (occasion_id, year, profile_id)
);

-- ---------------------------------------------------------------------------
-- Infra: rate limit do login e cache de extração
-- ---------------------------------------------------------------------------
create table public.login_attempts (
  id            bigint generated always as identity primary key,
  ip_hash       text not null,
  attempted_at  timestamptz not null default now()
);

create index login_attempts_ip_time_idx on public.login_attempts (ip_hash, attempted_at desc);

create table public.scrape_cache (
  url_normalized  text primary key,
  payload         jsonb not null,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Segurança: RLS em tudo, sem policies; só service_role tem grants
-- ---------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.items              enable row level security;
alter table public.occasions          enable row level security;
alter table public.combos             enable row level security;
alter table public.combo_items        enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_log   enable row level security;
alter table public.login_attempts     enable row level security;
alter table public.scrape_cache       enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on function public.combo_mark_purchased(uuid, text)   to service_role;
grant execute on function public.combo_unmark_purchased(uuid, text) to service_role;
grant execute on function public.combo_mark_given(uuid, text)       to service_role;
