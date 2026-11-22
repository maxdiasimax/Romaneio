-- Romaneio: schema PostgreSQL (Supabase)
-- Derivado de schema.sql (MySQL) / database.js (SQLite).

create table if not exists public.users (
    id bigint generated always as identity primary key,
    name text not null,
    username text not null unique,
    password text not null,
    profile text not null check (profile in ('Admin', 'Usuário')),
    celular text
);

create table if not exists public.fazendas (
    id bigint generated always as identity primary key,
    name text not null,
    address text
);

create table if not exists public.pastos (
    id bigint generated always as identity primary key,
    name text not null,
    fazenda_id bigint not null references public.fazendas (id) on delete cascade
);

create table if not exists public.bois (
    id bigint generated always as identity primary key,
    name text not null,
    initial_weight numeric(10, 2),
    arrival_date date,
    brinco text,
    vendedor text,
    local_compra text,
    valor_boi numeric(10, 2),
    valor_comissao numeric(10, 2),
    valor_frete numeric(10, 2),
    valor_por_kg numeric(10, 2),
    raca text,
    baixa_id bigint,
    baixa_status text,
    pai_id bigint references public.bois (id) on delete set null,
    mae_id bigint references public.bois (id) on delete set null,
    sexo text check (sexo in ('M', 'F')),
    geracao integer,
    data_nascimento date
);

create table if not exists public.manejo_pasto (
    id bigint generated always as identity primary key,
    boi_id bigint not null references public.bois (id) on delete cascade,
    pasto_id bigint not null references public.pastos (id) on delete cascade,
    fazenda_id bigint not null references public.fazendas (id) on delete cascade,
    initial_weight_manejo numeric(10, 2),
    weight_01 numeric(10, 2), date_weight_01 timestamp,
    weight_02 numeric(10, 2), date_weight_02 timestamp,
    weight_03 numeric(10, 2), date_weight_03 timestamp,
    weight_04 numeric(10, 2), date_weight_04 timestamp,
    weight_05 numeric(10, 2), date_weight_05 timestamp,
    weight_06 numeric(10, 2), date_weight_06 timestamp,
    weight_07 numeric(10, 2), date_weight_07 timestamp,
    weight_08 numeric(10, 2), date_weight_08 timestamp,
    weight_09 numeric(10, 2), date_weight_09 timestamp,
    weight_10 numeric(10, 2), date_weight_10 timestamp,
    total_weight_registered numeric(10, 2),
    weights_count integer
);

create table if not exists public.vacinas (
    id bigint generated always as identity primary key,
    boi_id bigint not null references public.bois (id) on delete cascade,
    chip text,
    brinco text,
    vacina text not null,
    data_vacina date not null,
    created_at timestamptz not null default now()
);

create table if not exists public.dietas (
    id bigint generated always as identity primary key,
    fazenda_id bigint not null references public.fazendas (id) on delete cascade,
    pasto_id bigint not null references public.pastos (id) on delete cascade,
    qtd_bois integer,
    data date not null,
    dieta_tipo text not null,
    qtd_kg numeric(10, 2),
    created_at timestamptz not null default now()
);

create table if not exists public.baixas (
    id bigint generated always as identity primary key,
    boi_id bigint not null references public.bois (id) on delete cascade,
    boton text not null,
    brinco text,
    ultimo_peso numeric(10, 2),
    data_baixa date not null,
    status text not null check (status in ('Vendido', 'Morreu')),
    observacao text,
    created_at timestamptz not null default now()
);

create table if not exists public.perspectives (
    id bigint generated always as identity primary key,
    boi_id bigint not null references public.bois (id) on delete cascade,
    fazenda_id bigint,
    pasto_id bigint,
    start_date date,
    days integer,
    daily_rate numeric(10, 2),
    initial_weight numeric(10, 2),
    final_weight numeric(10, 2),
    created_at timestamptz not null default now()
);

-- Índices nas chaves estrangeiras
create index if not exists idx_pastos_fazenda on public.pastos (fazenda_id);
create index if not exists idx_bois_pai on public.bois (pai_id);
create index if not exists idx_bois_mae on public.bois (mae_id);
create index if not exists idx_manejo_boi on public.manejo_pasto (boi_id);
create index if not exists idx_manejo_pasto on public.manejo_pasto (pasto_id);
create index if not exists idx_manejo_fazenda on public.manejo_pasto (fazenda_id);
create index if not exists idx_vacinas_boi on public.vacinas (boi_id);
create index if not exists idx_dietas_fazenda on public.dietas (fazenda_id);
create index if not exists idx_dietas_pasto on public.dietas (pasto_id);
create index if not exists idx_baixas_boi on public.baixas (boi_id);
create index if not exists idx_perspectives_boi on public.perspectives (boi_id);

-- Segurança: RLS ligado e sem policies = a API REST pública (anon/authenticated)
-- não acessa nada. O backend Node conecta como role privilegiada (bypassa RLS).
-- Importante porque users.password guarda hashes.
alter table public.users enable row level security;
alter table public.fazendas enable row level security;
alter table public.pastos enable row level security;
alter table public.bois enable row level security;
alter table public.manejo_pasto enable row level security;
alter table public.vacinas enable row level security;
alter table public.dietas enable row level security;
alter table public.baixas enable row level security;
alter table public.perspectives enable row level security;
