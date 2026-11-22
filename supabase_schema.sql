-- Romaneio: schema PostgreSQL (Supabase)
-- Derivado de schema.sql (MySQL) / database.js (SQLite).
-- MULTI-TENANT: banco compartilhado; toda tabela de negócio tem tenant_id e as
-- FKs são compostas (tenant_id, id) para impedir referências entre empresas.
-- Instalação nova: rode este arquivo. Banco já existente: rode migrations/001_multitenant.sql.
-- Requer PostgreSQL 15+.

create table if not exists public.tenants (
    id bigint generated always as identity primary key,
    name text not null,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists public.users (
    id bigint generated always as identity primary key,
    tenant_id bigint not null references public.tenants (id),
    name text not null,
    username text not null unique, -- único globalmente (login sem informar empresa)
    password text not null,
    profile text not null check (profile in ('Admin', 'Usuário')),
    celular text
);

create table if not exists public.fazendas (
    id bigint generated always as identity primary key,
    tenant_id bigint not null references public.tenants (id),
    name text not null,
    address text,
    unique (tenant_id, id)
);

create table if not exists public.pastos (
    id bigint generated always as identity primary key,
    tenant_id bigint not null references public.tenants (id),
    name text not null,
    fazenda_id bigint not null,
    unique (tenant_id, id),
    foreign key (tenant_id, fazenda_id) references public.fazendas (tenant_id, id) on delete cascade
);

create table if not exists public.bois (
    id bigint generated always as identity primary key,
    tenant_id bigint not null references public.tenants (id),
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
    pai_id bigint,
    mae_id bigint,
    sexo text check (sexo in ('M', 'F')),
    geracao integer,
    data_nascimento date,
    unique (tenant_id, id),
    foreign key (tenant_id, pai_id) references public.bois (tenant_id, id) on delete set null (pai_id),
    foreign key (tenant_id, mae_id) references public.bois (tenant_id, id) on delete set null (mae_id)
);

create table if not exists public.manejo_pasto (
    id bigint generated always as identity primary key,
    tenant_id bigint not null references public.tenants (id),
    boi_id bigint not null,
    pasto_id bigint not null,
    fazenda_id bigint not null,
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
    weights_count integer,
    foreign key (tenant_id, boi_id) references public.bois (tenant_id, id) on delete cascade,
    foreign key (tenant_id, pasto_id) references public.pastos (tenant_id, id) on delete cascade,
    foreign key (tenant_id, fazenda_id) references public.fazendas (tenant_id, id) on delete cascade
);

create table if not exists public.vacinas (
    id bigint generated always as identity primary key,
    tenant_id bigint not null references public.tenants (id),
    boi_id bigint not null,
    chip text,
    brinco text,
    vacina text not null,
    data_vacina date not null,
    created_at timestamptz not null default now(),
    foreign key (tenant_id, boi_id) references public.bois (tenant_id, id) on delete cascade
);

create table if not exists public.dietas (
    id bigint generated always as identity primary key,
    tenant_id bigint not null references public.tenants (id),
    fazenda_id bigint not null,
    pasto_id bigint not null,
    qtd_bois integer,
    data date not null,
    dieta_tipo text not null,
    qtd_kg numeric(10, 2),
    created_at timestamptz not null default now(),
    foreign key (tenant_id, fazenda_id) references public.fazendas (tenant_id, id) on delete cascade,
    foreign key (tenant_id, pasto_id) references public.pastos (tenant_id, id) on delete cascade
);

create table if not exists public.baixas (
    id bigint generated always as identity primary key,
    tenant_id bigint not null references public.tenants (id),
    boi_id bigint not null,
    boton text not null,
    brinco text,
    ultimo_peso numeric(10, 2),
    data_baixa date not null,
    status text not null check (status in ('Vendido', 'Morreu')),
    observacao text,
    created_at timestamptz not null default now(),
    foreign key (tenant_id, boi_id) references public.bois (tenant_id, id) on delete cascade
);

create table if not exists public.perspectives (
    id bigint generated always as identity primary key,
    tenant_id bigint not null references public.tenants (id),
    boi_id bigint not null,
    fazenda_id bigint,
    pasto_id bigint,
    start_date date,
    days integer,
    daily_rate numeric(10, 2),
    initial_weight numeric(10, 2),
    final_weight numeric(10, 2),
    created_at timestamptz not null default now(),
    foreign key (tenant_id, boi_id) references public.bois (tenant_id, id) on delete cascade,
    foreign key (tenant_id, fazenda_id) references public.fazendas (tenant_id, id) on delete set null (fazenda_id),
    foreign key (tenant_id, pasto_id) references public.pastos (tenant_id, id) on delete set null (pasto_id)
);

-- Índices nas chaves estrangeiras / tenant
create index if not exists idx_users_tenant on public.users (tenant_id);
create index if not exists idx_fazendas_tenant on public.fazendas (tenant_id);
create index if not exists idx_pastos_tenant on public.pastos (tenant_id);
create index if not exists idx_bois_tenant on public.bois (tenant_id);
create index if not exists idx_manejo_pasto_tenant on public.manejo_pasto (tenant_id);
create index if not exists idx_vacinas_tenant on public.vacinas (tenant_id);
create index if not exists idx_dietas_tenant on public.dietas (tenant_id);
create index if not exists idx_baixas_tenant on public.baixas (tenant_id);
create index if not exists idx_perspectives_tenant on public.perspectives (tenant_id);
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
alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.fazendas enable row level security;
alter table public.pastos enable row level security;
alter table public.bois enable row level security;
alter table public.manejo_pasto enable row level security;
alter table public.vacinas enable row level security;
alter table public.dietas enable row level security;
alter table public.baixas enable row level security;
alter table public.perspectives enable row level security;
