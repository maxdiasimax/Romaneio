# 🔌 API Endpoints

Documentação de todos os endpoints da API Romaneio.

## Base URL

```
http://localhost:3000/api
```

## Authentication Endpoints

### POST /auth/[...nextauth]

Handles all NextAuth.js authentication flows.

**Included Flows:**
- POST `/auth/signin` - Sign in with credentials
- POST `/auth/signout` - Sign out
- POST `/auth/callback` - OAuth callbacks
- GET `/auth/session` - Get current session
- GET `/auth/providers` - List available providers

---

## Questions Endpoints

### POST /questoes/gerar

Generate questions using AI.

**Request Body:**
```json
{
  "nivel": "médio",
  "banca": "ENEM",
  "materia": "Português",
  "quantidade": 5,
  "tags": ["interpretação de texto"]
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "uuid-job-id",
  "status": "processing",
  "estimatedTime": 30
}
```

**Query Parameters:**
- `nivel` (required): 'fácil' | 'médio' | 'difícil'
- `banca` (required): 'ENEM' | 'OAB' | 'CESPE' | 'VUNESP' | 'FCC' | 'IBFC' | 'OTHER'
- `materia` (required): Subject ID or name
- `quantidade` (required): 1-50
- `tags` (optional): Array of tags

**Rate Limit:**
- Free: 5 questions/day
- Pro: 50 questions/day
- Premium: Unlimited

---

### GET /questoes

List questions with filters.

**Query Parameters:**
- `skip` (optional): Default 0
- `limit` (optional): Default 20, max 100
- `banca` (optional): Filter by exam bank
- `nivel` (optional): Filter by difficulty
- `materia` (optional): Filter by subject
- `tags` (optional): Array of tags
- `sort` (optional): 'newest' | 'popular' | 'hardest'

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "text": "Question text...",
      "alternatives": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
      "difficulty": "médio",
      "bank": "ENEM",
      "subject": "Português",
      "views": 1234,
      "correctRate": 78.5,
      "userAnswer": "A",
      "isCorrect": true,
      "explanation": "The answer is A because..."
    }
  ],
  "total": 1234,
  "skip": 0,
  "limit": 20
}
```

---

### GET /questoes/:id

Get a specific question.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "text": "Question text...",
  "alternatives": [...],
  "difficulty": "médio",
  "bank": "ENEM",
  "subject": "Português",
  "explanation": "...",
  "sourceUrl": "https://...",
  "year": 2023,
  "userResponse": {
    "answer": "A",
    "isCorrect": true,
    "timeSpent": 120,
    "attemptNumber": 1
  }
}
```

---

### POST /questoes/:id/responder

Submit an answer to a question.

**Request Body:**
```json
{
  "selectedAlternative": 0,
  "timeSpentSeconds": 120,
  "simuladoId": "uuid-optional"
}
```

**Response (201 Created):**
```json
{
  "id": "response-uuid",
  "questionId": "uuid",
  "selectedAlternative": 0,
  "isCorrect": true,
  "explanation": "...",
  "correctAlternative": 0
}
```

---

## Simulados Endpoints

### POST /simulados

Create a new simulado.

**Request Body:**
```json
{
  "title": "Simulado ENEM 2024",
  "description": "Full ENEM simulation",
  "subjects": ["uuid-subject-1", "uuid-subject-2"],
  "difficulty": "médio",
  "questionCount": 40,
  "timeLimitMinutes": 180
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "status": "draft",
  "title": "Simulado ENEM 2024",
  "questions": [
    {
      "id": "uuid",
      "text": "...",
      "alternatives": [...],
      "position": 1
    }
  ],
  "startedAt": null,
  "completedAt": null
}
```

---

### GET /simulados

List user's simulados.

**Query Parameters:**
- `status` (optional): 'draft' | 'in_progress' | 'completed'
- `skip` (optional): Default 0
- `limit` (optional): Default 20

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Simulado ENEM 2024",
      "status": "completed",
      "score": 85.5,
      "questionCount": 40,
      "correctCount": 34,
      "wrongCount": 6,
      "completedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5
}
```

---

### GET /simulados/:id

Get simulado details.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "Simulado ENEM 2024",
  "status": "completed",
  "questions": [
    {
      "position": 1,
      "text": "...",
      "alternatives": [...],
      "userAnswer": "A",
      "isCorrect": true
    }
  ],
  "score": 85.5,
  "startedAt": "2024-01-15T08:00:00Z",
  "completedAt": "2024-01-15T10:30:00Z"
}
```

---

### POST /simulados/:id/iniciar

Start a simulado.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "in_progress",
  "startedAt": "2024-01-15T08:00:00Z",
  "timeLimitMinutes": 180
}
```

---

### POST /simulados/:id/enviar

Submit simulado answers.

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "uuid",
      "selectedAlternative": 0,
      "timeSpentSeconds": 120
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "completed",
  "score": 85.5,
  "correctCount": 34,
  "wrongCount": 6,
  "report": {
    "bySubject": [
      {
        "subject": "Português",
        "correct": 10,
        "wrong": 2,
        "accuracy": 83.3
      }
    ]
  }
}
```

---

## Flashcards Endpoints

### POST /flashcards

Create a new flashcard.

**Request Body:**
```json
{
  "front": "What is the capital of France?",
  "back": "Paris",
  "deckName": "Geography",
  "questionId": "uuid-optional"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "front": "What is the capital of France?",
  "back": "Paris",
  "status": "new",
  "easeFactor": 2.5,
  "nextReviewAt": "2024-01-16T10:30:00Z"
}
```

---

### GET /flashcards/proximas-revisoes

Get flashcards due for review.

**Query Parameters:**
- `limit` (optional): Default 20

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "front": "...",
    "back": "...",
    "status": "learning",
    "reviewCount": 3,
    "lastReviewAt": "2024-01-12T10:30:00Z"
  }
]
```

---

### POST /flashcards/:id/revisar

Submit a flashcard review.

**Request Body:**
```json
{
  "quality": 4,
  "reviewTimeSeconds": 15
}
```

**Quality Levels:**
- 0: Complete blackout
- 1: Incorrect with serious errors
- 2: Incorrect but knew the right direction
- 3: Correct answer but took serious effort
- 4: Correct with some hesitation
- 5: Perfect response

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "learning",
  "easeFactor": 2.35,
  "interval": 1,
  "nextReviewAt": "2024-01-17T10:30:00Z"
}
```

---

## User Statistics Endpoints

### GET /usuarios/estatisticas

Get user statistics.

**Response (200 OK):**
```json
{
  "totalQuestionsSolved": 1234,
  "correctAnswers": 987,
  "wrongAnswers": 247,
  "accuracyPercentage": 80.2,
  "totalStudyMinutes": 4560,
  "totalSimuladosCompleted": 12,
  "averageSimuladoScore": 82.5,
  "streakDays": 15,
  "lastStudyDate": "2024-01-15"
}
```

---

### GET /usuarios/estatisticas/diarias

Get daily statistics.

**Query Parameters:**
- `days` (optional): Default 30, max 365

**Response (200 OK):**
```json
[
  {
    "date": "2024-01-15",
    "questionsSolved": 25,
    "correctAnswers": 20,
    "accuracy": 80,
    "studyMinutes": 120
  }
]
```

---

### GET /usuarios/estatisticas/por-materia

Get performance by subject.

**Response (200 OK):**
```json
[
  {
    "subject": "Português",
    "totalQuestions": 234,
    "correctAnswers": 198,
    "accuracy": 84.6,
    "trend": "up"
  }
]
```

---

## Payment Endpoints

### POST /pagamentos/criar-sessao

Create a payment session.

**Request Body:**
```json
{
  "planId": "uuid",
  "billingCycle": "monthly"
}
```

**Response (201 Created):**
```json
{
  "sessionId": "uuid",
  "paymentUrl": "https://cakto.com/pay/...",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "pixKey": "00020126580014br.gov.bcb.pix...",
  "expiresAt": "2024-01-15T11:30:00Z"
}
```

---

### POST /webhooks/cakto

Cakto webhook for payment confirmations.

**Headers:**
```
x-cakto-signature: hmac-sha256-signature
```

**Request Body:**
```json
{
  "event": "payment.completed",
  "data": {
    "transactionId": "txn_123456",
    "customerId": "uuid",
    "amount": 29.90,
    "currency": "BRL",
    "status": "completed"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## Admin Endpoints

### GET /admin/usuarios

List all users (admin only).

**Query Parameters:**
- `search` (optional): Filter by email/name
- `skip` (optional): Default 0
- `limit` (optional): Default 20

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "plan": "pro",
      "createdAt": "2024-01-10T10:30:00Z",
      "lastLoginAt": "2024-01-15T08:00:00Z",
      "questionsGenerated": 234
    }
  ],
  "total": 1234
}
```

---

### DELETE /admin/usuarios/:id

Delete a user (admin only).

**Response (204 No Content)**

---

### GET /admin/relatorios

Get system reports (admin only).

**Query Parameters:**
- `period` (optional): 'day' | 'week' | 'month' | 'year'

**Response (200 OK):**
```json
{
  "activeUsers": 234,
  "newUsers": 12,
  "totalRevenue": 5678.90,
  "averageAccuracy": 78.5,
  "topSubjects": [
    { "name": "Português", "count": 234 }
  ],
  "topBanks": [
    { "name": "ENEM", "count": 456 }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": {
    "field": "quantidade",
    "message": "Must be between 1 and 50"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Please sign in to continue"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "The requested resource was not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate Limited",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 202 | Accepted - Request accepted for processing |
| 204 | No Content - Successful deletion |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limiting

All endpoints are rate limited:

| Plan | Requests/Hour |
|------|----------------|
| Free | 60 |
| Pro | 600 |
| Premium | Unlimited |

Rate limit info is included in response headers:
```
x-ratelimit-limit: 60
x-ratelimit-remaining: 45
x-ratelimit-reset: 1642428000
```

---

## Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <token>
```

---

## Pagination

Paginated responses use:

```json
{
  "data": [...],
  "total": 1234,
  "skip": 0,
  "limit": 20,
  "hasMore": true
}
```

Navigate with `skip` and `limit` parameters.

---

**Last Updated:** 2024-01-15
**API Version:** 1.0.0
