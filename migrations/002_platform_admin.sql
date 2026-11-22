-- Romaneio — Migração 002: dono da plataforma (gestão de empresas)
-- Rode DEPOIS da 001. O sistema continua funcionando sem esta migração; só a tela
-- "Gestão de Empresas" depende dela.
alter table public.users add column if not exists is_platform_admin boolean not null default false;

-- Conceda a flag ao SEU usuário (somente por SQL; nenhuma rota da API a altera):
-- update public.users set is_platform_admin = true where username = 'SEU_USUARIO';
