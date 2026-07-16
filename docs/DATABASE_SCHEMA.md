# 🗄️ Database Schema

Documentação completa do schema do banco de dados Romaneio.

## Visão Geral

O banco de dados foi projetado para:
- Armazenar usuários, questões e simulados
- Rastrear progresso e estatísticas de aprendizado
- Gerenciar subscrições e pagamentos
- Suportar geração automática de questões por IA

## Tabelas

### 1. users

Armazena informações dos usuários.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| email | VARCHAR(255) | Email único |
| name | VARCHAR(255) | Nome completo |
| password_hash | VARCHAR(255) | Senha hasheada (bcrypt) |
| avatar_url | TEXT | URL do avatar |
| cpf | VARCHAR(14) | CPF (opcional) |
| phone | VARCHAR(20) | Telefone (opcional) |
| bio | TEXT | Biografia |
| is_admin | BOOLEAN | Se é admin |
| email_verified_at | TIMESTAMP | Data de verificação |
| last_login_at | TIMESTAMP | Último acesso |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |
| deleted_at | TIMESTAMP | Data de exclusão (soft delete) |

### 2. plans

Define os planos de subscrição.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| name | ENUM | free, pro, premium |
| title | VARCHAR(255) | Título do plano |
| description | TEXT | Descrição |
| price | DECIMAL(10,2) | Preço em BRL |
| billing_cycle | VARCHAR(50) | monthly, yearly |
| features | JSONB | Features do plano |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

**Exemplo de features:**
```json
{
  "max_questions_per_day": 50,
  "max_simulados_per_month": 10,
  "flashcards": true,
  "priority_support": false
}
```

### 3. subscriptions

Rastreia subscrições ativas de usuários.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| user_id | UUID | Ref a users |
| plan_id | UUID | Ref a plans |
| status | ENUM | active, inactive, cancelled, expired |
| started_at | TIMESTAMP | Data de início |
| expires_at | TIMESTAMP | Data de expiração |
| auto_renew | BOOLEAN | Renovação automática |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### 4. payments

Histórico de pagamentos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| user_id | UUID | Ref a users |
| subscription_id | UUID | Ref a subscriptions |
| amount | DECIMAL(10,2) | Valor pago |
| currency | VARCHAR(3) | Moeda (BRL) |
| method | ENUM | pix, boleto, credit_card |
| status | ENUM | pending, completed, failed, refunded |
| transaction_id | VARCHAR(255) | ID da transação |
| cakto_reference_id | VARCHAR(255) | ID da Cakto |
| metadata | JSONB | Dados adicionais |
| paid_at | TIMESTAMP | Data do pagamento |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### 5. subjects

Matérias/disciplinas disponíveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| name | VARCHAR(255) | Nome da matéria |
| description | TEXT | Descrição |
| icon_url | TEXT | URL do ícone |
| created_at | TIMESTAMP | Data de criação |

### 6. questions

Banco de questões.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| subject_id | UUID | Ref a subjects |
| bank | ENUM | ENEM, OAB, CESPE, VUNESP, FCC, IBFC, OTHER |
| title | VARCHAR(500) | Título (opcional) |
| text | TEXT | Texto da questão |
| alternatives | JSONB | Array de alternativas |
| correct_alternative | INTEGER | Índice da resposta correta (0-4) |
| explanation | TEXT | Explicação da resposta |
| difficulty | ENUM | fácil, médio, difícil |
| tags | TEXT[] | Tags para categorização |
| year | INTEGER | Ano da questão |
| source_url | TEXT | URL da fonte |
| ai_generated | BOOLEAN | Se foi gerada por IA |
| generation_model | VARCHAR(50) | Modelo usado (gpt-4, claude-3, etc) |
| status | VARCHAR(50) | draft, published, archived |
| views_count | INTEGER | Quantas vezes foi visualizada |
| correct_count | INTEGER | Quantas vezes foi acertada |
| wrong_count | INTEGER | Quantas vezes foi errada |
| created_by | UUID | Ref a users (criador) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### 7. user_question_responses

Rastreia as respostas de usuários em questões.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| user_id | UUID | Ref a users |
| question_id | UUID | Ref a questions |
| selected_alternative | INTEGER | Alternativa escolhida (0-4) |
| is_correct | BOOLEAN | Se acertou |
| time_spent_seconds | INTEGER | Tempo gasto |
| attempt_number | INTEGER | Número da tentativa |
| simulado_id | UUID | Ref a simulados (opcional) |
| created_at | TIMESTAMP | Data |
| updated_at | TIMESTAMP | Última atualização |

**Índice Único:** (user_id, question_id, attempt_number)

### 8. simulados

Simulados/provas realizadas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| user_id | UUID | Ref a users |
| title | VARCHAR(255) | Título |
| description | TEXT | Descrição |
| subjects | UUID[] | Array de subject_ids |
| difficulty | ENUM | fácil, médio, difícil |
| question_count | INTEGER | Total de questões |
| time_limit_minutes | INTEGER | Tempo limite |
| status | ENUM | draft, in_progress, completed |
| started_at | TIMESTAMP | Quando começou |
| completed_at | TIMESTAMP | Quando terminou |
| score | DECIMAL(5,2) | Pontuação (0-100) |
| correct_count | INTEGER | Questões acertadas |
| wrong_count | INTEGER | Questões erradas |
| skipped_count | INTEGER | Questões puladas |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### 9. simulado_questions

Questões que fazem parte de um simulado.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| simulado_id | UUID | Ref a simulados |
| question_id | UUID | Ref a questions |
| order_position | INTEGER | Posição na ordem |
| created_at | TIMESTAMP | Data de criação |

**Índice Único:** (simulado_id, question_id)

### 10. flashcards

Flashcards de estudo.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| user_id | UUID | Ref a users |
| question_id | UUID | Ref a questions (opcional) |
| front | TEXT | Frente do card |
| back | TEXT | Verso do card |
| subject_id | UUID | Ref a subjects |
| deck_name | VARCHAR(255) | Nome do deck |
| status | ENUM | new, learning, mastered, forgotten |
| ease_factor | DECIMAL(3,2) | Fator de dificuldade (spaced rep) |
| interval_days | INTEGER | Intervalo até próxima revisão |
| next_review_at | TIMESTAMP | Quando revisar próximo |
| review_count | INTEGER | Total de revisões |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### 11. flashcard_reviews

Histórico de revisões de flashcards.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| flashcard_id | UUID | Ref a flashcards |
| quality | INTEGER | Qualidade (0-5) |
| review_time_seconds | INTEGER | Tempo gasto |
| created_at | TIMESTAMP | Data da revisão |

### 12. user_statistics

Estatísticas agregadas do usuário (denormalized para performance).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| user_id | UUID | Ref a users (UNIQUE) |
| total_questions_solved | INTEGER | Total de questões |
| correct_answers | INTEGER | Respostas corretas |
| wrong_answers | INTEGER | Respostas erradas |
| accuracy_percentage | DECIMAL(5,2) | Taxa de acerto |
| total_study_minutes | INTEGER | Total de minutos estudados |
| total_simulados_completed | INTEGER | Simulados completados |
| average_simulado_score | DECIMAL(5,2) | Média de pontuação |
| total_flashcards_reviewed | INTEGER | Flashcards revisados |
| streak_days | INTEGER | Sequência de dias |
| last_study_date | DATE | Último dia estudado |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### 13. study_sessions

Sessões de estudo.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | ID único |
| user_id | UUID | Ref a users |
| subject_id | UUID | Ref a subjects |
| duration_minutes | INTEGER | Duração |
| questions_solved | INTEGER | Questões resolvidas |
| correct_answers | INTEGER | Respostas corretas |
| created_at | TIMESTAMP | Data de criação |

## Views

### user_daily_stats

Estatísticas diárias do usuário.

```sql
SELECT
  study_date,
  user_id,
  questions_solved,
  correct_count,
  accuracy
FROM user_daily_stats
```

### subject_performance

Desempenho por matéria.

```sql
SELECT
  subject_id,
  subject_name,
  user_id,
  total_questions,
  correct_answers,
  accuracy
FROM subject_performance
```

## Enums

```sql
subscription_status: 'active' | 'inactive' | 'cancelled' | 'expired'
plan_type: 'free' | 'pro' | 'premium'
difficulty_level: 'fácil' | 'médio' | 'difícil'
exam_bank: 'ENEM' | 'OAB' | 'CESPE' | 'VUNESP' | 'FCC' | 'IBFC' | 'OTHER'
payment_method: 'pix' | 'boleto' | 'credit_card'
payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
simulado_status: 'draft' | 'in_progress' | 'completed'
flashcard_status: 'new' | 'learning' | 'mastered' | 'forgotten'
```

## Índices

Para otimizar queries, criamos índices em:

- `users(email)` - Login
- `users(is_admin)` - Filtro de admins
- `subscriptions(user_id)` - Buscar subscrição do usuário
- `subscriptions(status)` - Filtro por status
- `payments(user_id)` - Histórico de pagamentos
- `payments(status)` - Filtro por status
- `questions(subject_id)` - Questões por matéria
- `questions(bank)` - Questões por banca
- `questions(difficulty)` - Questões por nível
- `questions(status)` - Questões publicadas
- `user_question_responses(user_id)` - Respostas do usuário
- `user_question_responses(created_at)` - Queries temporais
- `simulados(user_id)` - Simulados do usuário
- `flashcards(user_id)` - Flashcards do usuário
- `flashcards(next_review_at)` - Próximas revisões
- `study_sessions(user_id)` - Sessões do usuário

## Row-Level Security (RLS)

RLS habilitado em tabelas sensíveis:

- `users` - Usuários veem apenas seus dados
- `questions` - Questões publicadas são públicas
- `user_question_responses` - Privado por usuário
- `simulados` - Privado por usuário
- `flashcards` - Privado por usuário
- `subscriptions` - Privado por usuário
- `payments` - Privado por usuário

## Denormalization Strategy

Para performance, algumas dados são denormalizados:

- `user_statistics` - Agregação de stats (atualizado via trigger)
- `questions(views_count, correct_count, wrong_count)` - Contadores

Triggers automáticos recalculam essas métricas quando necessário.

## Performance Notes

- Usar índices para queries frequentes
- Limitar resultados com paginação
- Usar caching no Redis para estatísticas
- Denormalizar quando agregações são custosas
- Monitorar slow queries

---

Para migrar este schema, execute:

```bash
# Via Supabase CLI
supabase db push

# Ou manualmente:
# 1. Copie o conteúdo de supabase/migrations/001_initial_schema.sql
# 2. Vá em Supabase → SQL Editor
# 3. Cole e execute
```
