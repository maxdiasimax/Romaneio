# Multi-tenancy (várias empresas no mesmo sistema)

**Modelo:** um banco/schema compartilhado; toda tabela de negócio tem `tenant_id`.

## Como o isolamento funciona
1. **Login** (`/api/login`) devolve um JWT com `id` e `tid` (empresa). Empresa suspensa não entra.
2. **`requireAuth`** busca o usuário no banco a cada requisição e define `req.tenantId` a partir do
   *banco* (conferindo com o `tid` do token). Perfil, troca de empresa e suspensão valem na hora.
   O tenant **nunca** vem de body, query string ou cabeçalho.
3. **Toda query** em `server.js` filtra por `tenant_id = req.tenantId` (SELECT/UPDATE/DELETE) e
   grava `tenant_id` nos INSERTs. Regra para código novo: *nenhuma query em tabela de negócio sem tenant_id*.
4. **FKs compostas** `(tenant_id, id)` no banco: mesmo que uma rota esqueça de validar, é impossível
   uma empresa referenciar fazenda/pasto/boi de outra (o INSERT/UPDATE falha com erro de FK).
5. RLS continua ligado sem policies (API REST pública do Supabase não acessa nada); o backend usa role privilegiada.

## Operação
- **Banco existente:** faça backup, rode `migrations/001_multitenant.sql` (todos os dados atuais vão para
  a "Empresa Padrão" — renomeie: `update tenants set name='Cliente X' where id=1;`). PostgreSQL 15+.
- **Banco novo:** rode `supabase_schema.sql`.
- **Nova empresa (cliente):** `node scripts/create-tenant.js "Empresa" usuario "Nome Admin" "senha"`
  (o Admin da empresa cria os demais usuários em *Cadastro de Usuários*).
- **Suspender / reativar:** `update tenants set active = false where id = 2;`
- Gestão de empresas é feita por script/SQL de propósito: nenhum perfil "Admin" de cliente tem
  poder sobre outras empresas.
- `username` é **único no sistema todo** (login sem informar empresa).
- Não existe mais o usuário padrão `admin/admin123`.
- Sessões antigas (token sem `tid`) são invalidadas: todos precisam logar de novo após o deploy.
- Teste de regressão: `tests/tenant-isolation.test.js` (só em banco de teste).

## Ordem de deploy (importante)
O código novo e o schema novo dependem um do outro: código novo sem a migração dá erro 500
(`tenants` não existe); código antigo com a migração aplicada falha em todo INSERT (`tenant_id` NOT NULL).
Não há ordem sem janela, então: **backup → rodar a migração → subir o código imediatamente**.
Depois disso todos os usuários precisam fazer login de novo.
