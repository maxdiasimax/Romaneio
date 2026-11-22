# Romaneio

Sistema de controle de rebanho (multi-empresa). Node.js + Express + PostgreSQL (Supabase); front em HTML estático (`public/`).

## Rodar
1. `cp .env.example .env` e preencha (`JWT_SECRET` e dados do banco).
2. Aplique `supabase_schema.sql` e as migrações de `migrations/` no banco.
3. Crie a primeira empresa: `node scripts/create-tenant.js "Empresa" usuario "Nome do Admin" senha`
4. `npm start` (porta `PORT`, padrão 3001).

## Testes
`npm test` roda o teste de isolamento entre empresas. **Use somente banco descartável** — veja o cabeçalho de `tests/tenant-isolation.test.js`.

## Segurança
Veja `MULTITENANT.md`. Rode `npm run audit` periodicamente.
