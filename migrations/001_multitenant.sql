-- =============================================================================
-- Romaneio — Migração 001: multi-tenancy (banco compartilhado, coluna tenant_id)
--
-- Requisitos: PostgreSQL 15+ (usa ON DELETE SET NULL (coluna)). Supabase atende.
-- FAÇA BACKUP ANTES (Supabase > Database > Backups) e rode primeiro em um branch.
-- Tudo roda em uma única transação: se algo falhar, nada é aplicado.
--
-- O que faz:
--   1. Cria a tabela tenants (empresas/clientes).
--   2. Move TODOS os dados atuais para a empresa "Empresa Padrão" (id menor).
--      Renomeie depois:  update tenants set name = 'Nome da empresa' where id = 1;
--   3. Adiciona tenant_id NOT NULL em todas as tabelas.
--   4. Troca as FKs por FKs COMPOSTAS (tenant_id, id): o próprio banco impede
--      que um registro de uma empresa aponte para dados de outra.
-- =============================================================================
begin;

-- 1) Empresas -----------------------------------------------------------------
create table if not exists public.tenants (
    id bigint generated always as identity primary key,
    name text not null,
    active boolean not null default true,
    created_at timestamptz not null default now()
);
alter table public.tenants enable row level security;

insert into public.tenants (name)
select 'Empresa Padrão' where not exists (select 1 from public.tenants);

-- 2) tenant_id: adiciona, preenche com a empresa padrão e trava NOT NULL -------
do $$
declare
    t text;
    default_tenant bigint := (select min(id) from public.tenants);
begin
    foreach t in array array['users','fazendas','pastos','bois','manejo_pasto',
                             'vacinas','dietas','baixas','perspectives']
    loop
        execute format('alter table public.%I add column if not exists tenant_id bigint', t);
        execute format('update public.%I set tenant_id = %s where tenant_id is null', t, default_tenant);
        execute format('alter table public.%I alter column tenant_id set not null', t);
        execute format('create index if not exists %I on public.%I (tenant_id)', 'idx_' || t || '_tenant', t);
        if not exists (select 1 from pg_constraint where conname = t || '_tenant_fk') then
            execute format(
                'alter table public.%I add constraint %I foreign key (tenant_id) references public.tenants (id)',
                t, t || '_tenant_fk');
        end if;
    end loop;
end $$;

-- 3) Chaves únicas (tenant_id, id): alvo das FKs compostas ----------------------
alter table public.fazendas add constraint fazendas_tenant_id_uk unique (tenant_id, id);
alter table public.pastos   add constraint pastos_tenant_id_uk   unique (tenant_id, id);
alter table public.bois     add constraint bois_tenant_id_uk     unique (tenant_id, id);

-- 4) Remove as FKs simples antigas (exceto para tenants) -----------------------
do $$
declare r record;
begin
    for r in
        select conrelid::regclass as tbl, conname
        from pg_constraint
        where contype = 'f'
          and connamespace = 'public'::regnamespace
          and conrelid in ('public.pastos'::regclass, 'public.bois'::regclass, 'public.manejo_pasto'::regclass,
                           'public.vacinas'::regclass, 'public.dietas'::regclass, 'public.baixas'::regclass,
                           'public.perspectives'::regclass)
          and confrelid <> 'public.tenants'::regclass
    loop
        execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    end loop;
end $$;

-- perspectives.fazenda_id / pasto_id não tinham FK: limpa órfãos antes de criar
update public.perspectives p set fazenda_id = null
 where fazenda_id is not null
   and not exists (select 1 from public.fazendas f where f.tenant_id = p.tenant_id and f.id = p.fazenda_id);
update public.perspectives p set pasto_id = null
 where pasto_id is not null
   and not exists (select 1 from public.pastos s where s.tenant_id = p.tenant_id and s.id = p.pasto_id);

-- 5) FKs compostas --------------------------------------------------------------
alter table public.pastos
    add constraint pastos_fazenda_fk foreign key (tenant_id, fazenda_id)
    references public.fazendas (tenant_id, id) on delete cascade;

alter table public.bois
    add constraint bois_pai_fk foreign key (tenant_id, pai_id)
    references public.bois (tenant_id, id) on delete set null (pai_id),
    add constraint bois_mae_fk foreign key (tenant_id, mae_id)
    references public.bois (tenant_id, id) on delete set null (mae_id);

alter table public.manejo_pasto
    add constraint manejo_boi_fk foreign key (tenant_id, boi_id)
    references public.bois (tenant_id, id) on delete cascade,
    add constraint manejo_pasto_fk foreign key (tenant_id, pasto_id)
    references public.pastos (tenant_id, id) on delete cascade,
    add constraint manejo_fazenda_fk foreign key (tenant_id, fazenda_id)
    references public.fazendas (tenant_id, id) on delete cascade;

alter table public.vacinas
    add constraint vacinas_boi_fk foreign key (tenant_id, boi_id)
    references public.bois (tenant_id, id) on delete cascade;

alter table public.dietas
    add constraint dietas_fazenda_fk foreign key (tenant_id, fazenda_id)
    references public.fazendas (tenant_id, id) on delete cascade,
    add constraint dietas_pasto_fk foreign key (tenant_id, pasto_id)
    references public.pastos (tenant_id, id) on delete cascade;

alter table public.baixas
    add constraint baixas_boi_fk foreign key (tenant_id, boi_id)
    references public.bois (tenant_id, id) on delete cascade;

alter table public.perspectives
    add constraint perspectives_boi_fk foreign key (tenant_id, boi_id)
    references public.bois (tenant_id, id) on delete cascade,
    add constraint perspectives_fazenda_fk foreign key (tenant_id, fazenda_id)
    references public.fazendas (tenant_id, id) on delete set null (fazenda_id),
    add constraint perspectives_pasto_fk foreign key (tenant_id, pasto_id)
    references public.pastos (tenant_id, id) on delete set null (pasto_id);

-- 6) Índices de apoio às FKs compostas (deleção em cascata e consultas) ---------
create index if not exists idx_pastos_tenant_fazenda   on public.pastos (tenant_id, fazenda_id);
create index if not exists idx_manejo_tenant_boi       on public.manejo_pasto (tenant_id, boi_id);
create index if not exists idx_manejo_tenant_pasto     on public.manejo_pasto (tenant_id, pasto_id);
create index if not exists idx_vacinas_tenant_boi      on public.vacinas (tenant_id, boi_id);
create index if not exists idx_baixas_tenant_boi       on public.baixas (tenant_id, boi_id);
create index if not exists idx_dietas_tenant_pasto     on public.dietas (tenant_id, pasto_id);

commit;
