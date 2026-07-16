# 🎓 Romaneio - Plataforma de Preparação para Concursos com IA

Uma plataforma web completa e inteligente para preparação de concursos públicos, desenvolvida com tecnologias modernas e geração de questões por inteligência artificial.

## ✨ Funcionalidades Principais

### 🤖 Geração de Questões por IA
- Questões geradas por OpenAI/Claude obedecendo parâmetros específicos
- Filtros por: nível, banca, matéria e quantidade
- Explicações detalhadas para cada questão

### 📊 Dashboard Inteligente
- KPIs em tempo real: total de questões, taxa de acerto, horas estudadas
- Gráficos de evolução e progresso
- Matriz de desempenho por matéria
- Atividades recentes e metas de estudo

### 📝 Simulados Personalizados
- Geração automática de simulados baseado em IA
- Timer configurável
- Análise detalhada de resultados
- Histórico completo de simulados

### 🎴 Flashcards Inteligentes
- Geração automática de flashcards de questões
- Algoritmo de Spaced Repetition
- Modo de revisão com swipe
- Rastreamento de retenção

### 💳 Integração com Pagamentos
- Integração com Cakto para PIX, Boleto e Cartão
- Planos: Free, Pro e Premium
- Checkout interativo
- Email de confirmação automático

### 🛡️ Painel Administrativo
- Gerenciamento completo de usuários
- Análise de banco de questões
- Relatórios de receita e estatísticas
- Monitoramento do sistema

## 🏗️ Stack Tecnológico

### Frontend
- **Next.js 14** - React framework com App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilização
- **React Query** - Data fetching
- **Zustand** - State management
- **React Hook Form + Zod** - Validação de formulários
- **Recharts** - Visualização de dados

### Backend
- **Next.js API Routes** - Serverless endpoints
- **Supabase** - PostgreSQL + Auth + Storage
- **OpenAI/Anthropic API** - Geração com IA

### Integrações
- **Cakto** - Processamento de pagamentos
- **SendGrid/Resend** - Email
- **Sentry** - Monitoramento de erros

### DevOps
- **Vercel** - Hospedagem
- **GitHub Actions** - CI/CD
- **Supabase** - Database

## 📂 Estrutura do Projeto

```
romaneio/
├── apps/
│   └── web/                    # Next.js Application
│       ├── src/
│       │   ├── app/           # Next.js App Router
│       │   ├── components/    # React Components
│       │   ├── lib/           # Utilities
│       │   ├── hooks/         # Custom Hooks
│       │   ├── types/         # TypeScript Types
│       │   ├── store/         # Zustand Stores
│       │   └── styles/        # Global Styles
│       ├── public/            # Static Files
│       └── package.json
├── packages/
│   ├── shared/                # Shared Types
│   └── api/                   # Shared API Logic
├── supabase/
│   ├── migrations/            # Database Migrations
│   └── config.toml            # Supabase Config
├── docs/                      # Documentação
└── README.md
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- pnpm 8+
- Conta Supabase

### Instalação

```bash
# Clone o repositório
git clone https://github.com/maxdiasimax/romaneio.git
cd romaneio

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cd apps/web
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Execute migrations do banco de dados
# (Veja docs/SETUP.md para instruções detalhadas)

# Inicie servidor de desenvolvimento
pnpm dev
```

Acesse http://localhost:3000

## 📖 Documentação

- **[SETUP.md](./docs/SETUP.md)** - Guia de instalação e configuração
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Visão geral da arquitetura
- **[DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - Estrutura do banco de dados
- **[API_ENDPOINTS.md](./docs/API_ENDPOINTS.md)** - Endpoints da API

## 📋 Fases de Desenvolvimento

### ✅ Fase 1: Infraestrutura Base (Atual)
- [x] Setup do monorepo
- [x] Configuração Next.js
- [x] Banco de dados (schema)
- [x] Autenticação (estrutura)
- [x] Documentação inicial

### ⏳ Fase 2: Funcionalidades Core (Próxima)
- [ ] Geração de questões por IA
- [ ] CRUD de questões
- [ ] Visualização e resolução de questões

### 🗓️ Fase 3: Dashboard e Estatísticas
- [ ] Dashboard principal
- [ ] Gráficos de evolução
- [ ] Estatísticas detalhadas

### 🗓️ Fase 4: Simulados e Flashcards
- [ ] Simulados
- [ ] Flashcards
- [ ] Algoritmo de spaced repetition

### 🗓️ Fase 5: Pagamentos
- [ ] Integração Cakto
- [ ] Checkout
- [ ] Webhooks de pagamento

### 🗓️ Fase 6: Backoffice Admin
- [ ] Painel administrativo
- [ ] Gerenciamento de usuários
- [ ] Relatórios

### 🗓️ Fase 7: Otimizações
- [ ] Testes
- [ ] Performance
- [ ] Deploy

## 🔐 Segurança

- ✅ Autenticação com NextAuth.js e JWT
- ✅ Senhas hasheadas com bcryptjs
- ✅ Row-Level Security (RLS) no banco de dados
- ✅ CORS configuration
- ✅ Validação de entrada com Zod
- ✅ CSRF protection
- ✅ Verificação de assinatura em webhooks

## 📊 Planos

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Questões/dia | 5 | 50 | Ilimitado |
| Simulados/mês | 1 | 10 | Ilimitado |
| Flashcards | ❌ | ✅ | ✅ |
| Suporte | - | - | Prioritário |
| Preço | Grátis | R$ 29,90/mês | R$ 49,90/mês |

## 🤝 Contributing

Contribuições são bem-vindas! Por favor:

1. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
2. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abra um Pull Request

## 📝 License

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para detalhes.

## 👨‍💼 Autor

**Máximo Dias**
- Email: maxdias@imaxsi.com
- GitHub: [@maxdiasimax](https://github.com/maxdiasimax)

## 🙏 Agradecimentos

- [Vercel](https://vercel.com) - Hospedagem
- [Supabase](https://supabase.com) - Banco de dados
- [OpenAI](https://openai.com) - API de IA
- [Next.js](https://nextjs.org) - Framework
- [Tailwind CSS](https://tailwindcss.com) - Estilização

## 📞 Suporte

Tem dúvidas? Abra uma [issue](https://github.com/maxdiasimax/romaneio/issues) ou envie um email para maxdias@imaxsi.com

---

**Desenvolvido com ❤️ para educação de qualidade**