# 📦 Setup do Romaneio

Guia completo para configurar o projeto Romaneio localmente.

## Pré-requisitos

- **Node.js**: v18.0.0 ou superior
- **pnpm**: v8.0.0 ou superior (instale com `npm install -g pnpm`)
- **Git**: para versionamento
- **Conta Supabase**: para o banco de dados

## 1. Clonar o Repositório

```bash
git clone https://github.com/maxdiasimax/romaneio.git
cd romaneio
```

## 2. Instalar Dependências

```bash
pnpm install
```

Isso instalará todas as dependências do monorepo em todas as workspaces.

## 3. Configurar Variáveis de Ambiente

### 3.1 Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Configurações** → **API** e copie:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Service Role Key (SUPABASE_SERVICE_ROLE_KEY)

### 3.2 Criar arquivo .env.local

```bash
cd apps/web
cp .env.example .env.local
```

Edite o arquivo `apps/web/.env.local` e preencha:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth.js (gere com: openssl rand -base64 32)
NEXTAUTH_SECRET=seu-secret-gerado
NEXTAUTH_URL=http://localhost:3000

# OpenAI ou Anthropic
OPENAI_API_KEY=sk-...
# ou
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=gpt-4

# Cakto (opcional, para testes)
NEXT_PUBLIC_CAKTO_PUBLIC_KEY=pk_...
CAKTO_SECRET_KEY=sk_...

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.3 Gerar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copie a saída e cole em `NEXTAUTH_SECRET`.

## 4. Configurar Banco de Dados

### 4.1 Executar Migrations

Via Supabase Dashboard:

1. Vá em **SQL Editor**
2. Cole o conteúdo de `supabase/migrations/001_initial_schema.sql`
3. Execute

Ou via CLI (se tiver Supabase CLI configurado):

```bash
supabase migration up
```

### 4.2 Verificar Tabelas

1. Vá em **Table Editor** no dashboard Supabase
2. Você deve ver as tabelas criadas:
   - users
   - plans
   - questions
   - simulados
   - flashcards
   - subscriptions
   - payments
   - user_statistics
   - study_sessions

## 5. Instalar Dependências Faltantes

Algumas dependências foram adicionadas ao package.json mas ainda não instaladas. Execute:

```bash
pnpm add bcryptjs dotenv
```

## 6. Rodar Servidor de Desenvolvimento

```bash
# Na raiz do projeto
pnpm dev
```

Isso iniciará:
- Next.js em http://localhost:3000
- O aplicativo será acessível em http://localhost:3000

## 7. Verificar Setup

Acesse http://localhost:3000 e você deve ver:

- ✅ Homepage do Romaneio
- ✅ Botões "Entrar" e "Cadastrar"
- ✅ Features listadas

Se houver erros:

1. Verifique se todas as variáveis de ambiente estão corretas
2. Verifique se o Supabase está acessível
3. Veja os logs no terminal

## 8. Criar Usuário Teste (Opcional)

Você pode criar um usuário diretamente no Supabase para testar:

1. Vá em **Table Editor** → **users**
2. Clique em **Insert row**
3. Preencha:
   - email: `teste@exemplo.com`
   - name: `Usuário Teste`
   - password_hash: hash da senha (use bcrypt)
   - is_admin: false

Para gerar um hash bcrypt:

```bash
node -e "console.log(require('bcryptjs').hashSync('sua-senha', 10))"
```

## 9. Próximos Passos

1. **Cadastro de Usuários**: Implemente a página `/auth/register`
2. **Login**: Implemente a página `/auth/login`
3. **Dashboard**: Crie o dashboard em `/app/dashboard`
4. **Geração de Questões**: Integre OpenAI API
5. **Pagamentos**: Configure Cakto

## Troubleshooting

### "Module not found: bcryptjs"

```bash
pnpm add bcryptjs
pnpm add --save-dev @types/bcryptjs
```

### "Supabase connection refused"

- Verifique se NEXT_PUBLIC_SUPABASE_URL está correto
- Teste a conexão em outro projeto Supabase
- Verifique sua conexão de internet

### "NextAuth secret is missing"

- Você esqueceu de configurar NEXTAUTH_SECRET
- Gere um novo com: `openssl rand -base64 32`

### "Erro ao fazer login"

- Verifique se o usuário existe no Supabase
- Verifique se a senha está correta
- Veja os logs do servidor

## Stack Instalado

- ✅ Next.js 14
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ React Query
- ✅ Zustand
- ✅ NextAuth.js
- ✅ Supabase
- ✅ Zod (validação)
- ✅ React Hook Form

## Estrutura do Projeto

```
romaneio/
├── apps/web/           # Next.js app
├── packages/
│   ├── shared/         # Tipos compartilhados
│   └── api/            # Lógica de backend
├── supabase/           # Migrations e config
├── docs/               # Documentação
└── README.md
```

## Referências

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Pronto! O projeto está configurado. Comece a desenvolver! 🚀**
