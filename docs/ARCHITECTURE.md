# 🏗️ Arquitetura do Romaneio

Visão geral da arquitetura técnica do projeto.

## Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENTE (Browser)                          │
│         Next.js Frontend + Tailwind + React Query            │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌────▼────────────┐
│  Next.js API │  │  Supabase   │  │  OpenAI API    │
│  Routes      │  │  Edge Func  │  │  (IA)          │
└────┬─────────┘  └──────┬──────┘  └────────────────┘
     │                   │
     └───────┬───────────┘
             │
     ┌───────▼────────────┐
     │  PostgreSQL DB     │
     │  (Supabase)        │
     └────────────────────┘

┌──────────────────────────────────────┐
│      APIs Externas                   │
├──────────────────────────────────────┤
│ ✓ Cakto (PIX/Pagamentos)            │
│ ✓ OpenAI/Claude (Geração IA)        │
│ ✓ SendGrid/Resend (Email)           │
│ ✓ Sentry (Monitoramento)            │
└──────────────────────────────────────┘
```

## Stack Tecnológico

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **React Query** - Data fetching e caching
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Serverless endpoints
- **Supabase** - PostgreSQL Database + Auth
- **OpenAI/Anthropic API** - Geração de questões com IA

### Integrations
- **Cakto** - Payment processing (PIX, Boleto, Card)
- **SendGrid/Resend** - Email marketing
- **Sentry** - Error tracking
- **Redis** - Queue + Cache (futuro)

### DevOps
- **Vercel** - Hosting (Next.js)
- **Supabase** - Database + Storage
- **GitHub Actions** - CI/CD

## Estrutura de Pastas

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── (app)/             # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── questoes/
│   │   │   ├── simulados/
│   │   │   ├── flashcards/
│   │   │   ├── estatisticas/
│   │   │   └── perfil/
│   │   ├── (admin)/           # Admin only
│   │   │   ├── usuarios/
│   │   │   ├── questoes/
│   │   │   ├── relatorios/
│   │   │   └── configuracoes/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/
│   │   │   ├── questoes/
│   │   │   ├── simulados/
│   │   │   ├── pagamentos/
│   │   │   └── webhooks/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── providers.tsx      # App providers
│   ├── components/            # React components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── questoes/
│   │   ├── simulados/
│   │   ├── flashcards/
│   │   └── common/
│   ├── lib/                   # Utilities
│   │   ├── api.ts            # HTTP client
│   │   ├── auth.ts           # Auth config
│   │   ├── db.ts             # DB client
│   │   └── validators.ts     # Zod schemas
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useQuestions.ts
│   │   ├── useStatistics.ts
│   │   └── usePayment.ts
│   ├── types/                # TypeScript types
│   ├── store/                # Zustand stores
│   └── styles/               # Global styles
├── public/                   # Static files
└── package.json
```

## Fluxos Principais

### 1. Autenticação

```
User → Login Form
   ↓
POST /api/auth/[...nextauth]
   ↓
Backend valida credenciais (Supabase)
   ↓
JWT token criado
   ↓
User redirected para /app/dashboard
```

### 2. Geração de Questões

```
User seleciona parâmetros (nível, banca, matéria, quantidade)
   ↓
POST /api/questoes/gerar
   ↓
Valida entrada (Zod)
   ↓
Verifica plano (rate limit)
   ↓
Chama OpenAI API com prompt estruturado
   ↓
Salva questões em DB
   ↓
Retorna para frontend (React Query refetch)
   ↓
User vê questões carregadas
```

### 3. Simulado

```
User clica "Novo Simulado"
   ↓
Seleciona: matérias, nível, quantidade
   ↓
POST /api/simulados/criar
   ↓
Backend seleciona questões (random ou curado por IA)
   ↓
Cria registro com status="draft"
   ↓
Frontend carrega interface simulador
   ↓
Timer começa (se configurado)
   ↓
User responde questões
   ↓
POST /api/simulados/:id/enviar (respostas)
   ↓
Backend calcula score
   ↓
Atualiza user_statistics
   ↓
Retorna relatório detalhado
```

### 4. Pagamento

```
User seleciona plano (Pro ou Premium)
   ↓
POST /api/pagamentos/criar-sessao
   ↓
Backend cria payment intent em Cakto
   ↓
Retorna QR Code PIX + URL
   ↓
User escaneia QR ou clica no link
   ↓
User completa pagamento em Cakto
   ↓
Cakto envia webhook para /api/webhooks/cakto
   ↓
Backend verifica assinatura (HMAC)
   ↓
Ativa subscription na DB
   ↓
Envia email de confirmação
   ↓
User têm acesso a features premium
```

## Data Flow

### State Management

```typescript
// Zustand stores
- authStore    // user info, isAuthenticated
- uiStore      // theme, modals, loading states
- appStore     // selected filters, etc

// React Query
- useQuestions() // fetch questions with cache
- useUser()      // fetch user profile
- useStatistics()// fetch stats with auto-refetch
```

### Caching Strategy

```
Frontend Cache (React Query)
   ↓
staleTime: 5 min (if data still fresh, use cache)
   ↓
cacheTime: 10 min (keep in memory for 10 min)
   ↓
Database queries optimized with indexes
   ↓
RLS (Row-Level Security) for data isolation
```

## Security Layers

### 1. Authentication
- NextAuth.js with JWT
- Password hashing (bcryptjs)
- Secure session cookies

### 2. Authorization
- Role-based access control (user, admin)
- Middleware protection on routes
- RLS policies on database

### 3. API Security
- CORS configuration
- CSRF protection (NextAuth)
- Rate limiting (per endpoint)
- Input validation (Zod)
- SQL injection prevention (prepared statements)

### 4. External Integrations
- Webhook signature verification (Cakto)
- API key rotation
- Timeout configurations

## Performance Optimization

### Frontend
- Code splitting (automatic with Next.js)
- Image optimization
- CSS-in-JS minimization
- React.memo for expensive components

### Backend
- Database indexes on frequently queried columns
- Query pagination for large datasets
- Caching with React Query
- Lazy loading of data

### Infrastructure
- CDN for static assets (Vercel)
- Database backups (Supabase)
- Edge caching

## Monitoring & Logging

### Error Tracking
- Sentry integration
- Error boundaries in React
- API error handling

### Analytics
- PostHog or Segment (future)
- User action tracking
- Conversion funnel monitoring

### Performance
- Web vitals monitoring
- API response time tracking
- Database query performance

## Development Workflow

### Local Development
```bash
pnpm dev  # Starts Next.js in development mode
```

### Testing
```bash
pnpm test          # Run unit tests (Jest)
pnpm test:e2e      # Run E2E tests (Playwright)
```

### Type Checking
```bash
pnpm typecheck     # TypeScript validation
```

### Linting
```bash
pnpm lint          # ESLint + Prettier
```

### Build
```bash
pnpm build         # Production build
pnpm start         # Start production server
```

## Deployment

### Environment Strategy
- **Development**: localhost:3000
- **Staging**: staging-romaneio.vercel.app
- **Production**: romaneio.com

### CI/CD Pipeline (GitHub Actions)
1. Run tests on PR
2. Lint code
3. Type checking
4. Build optimization
5. Deploy to staging on PR merge
6. Manual approval for production

### Vercel Deployment
- Automatic deployments on push to main
- Preview deployments for PRs
- Automatic rollbacks on error

## Future Considerations

- **Redis Queue**: For async job processing (PDF generation, bulk AI requests)
- **WebSocket**: Real-time notifications
- **GraphQL**: Potentially for complex queries
- **Microservices**: If project scales (separate service for IA)
- **Mobile App**: React Native or Flutter
- **PWA**: Progressive Web App features

---

Para mais detalhes, veja:
- [SETUP.md](./SETUP.md) - Como configurar localmente
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Estrutura do banco de dados
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Endpoints da API
