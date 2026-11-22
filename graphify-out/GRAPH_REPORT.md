# Graph Report - Romaneio  (2026-11-22)

## Corpus Check
- 73 files · ~58,671 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 382 nodes · 518 edges · 31 communities (21 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Debug e Testes da API
- Dependências npm
- Genealogia
- Servidor Express
- Banco MySQL
- Banco SQLite
- Dashboard e Relatórios
- Scripts de Checagem SQLite
- Banco PostgreSQL
- Checagem de Bois
- Histórico GMP
- Multi-tenancy
- Bovinos e Histórico de Pesos
- Baixas e Vacinas
- Fazendas e Manejo
- Sidebar
- Filtros de Bovinos
- Pastos e Dieta
- Histórico de Manejo
- Dietas
- Pastos por Fazenda
- Valor por Kg
- Debug Contagem
- Debug Exclusão
- Consumo de Dieta
- Fazendas Dieta
- README

## God Nodes (most connected - your core abstractions)
1. `Multi-tenancy design` - 19 edges
2. `Romaneio - Manejo de Pasto` - 13 edges
3. `Romaneio - Perspectiva de Peso` - 13 edges
4. `historico_gmp.html (Histórico G.M.P page)` - 12 edges
5. `Romaneio - Vacinas` - 10 edges
6. `Genealogia page (genealogia.html)` - 9 edges
7. `Romaneio - Baixa de Bois` - 9 edges
8. `Database` - 8 edges
9. `Database` - 8 edges
10. `jsPDF library` - 8 edges

## Surprising Connections (you probably didn't know these)
- `login-form submit handler` --calls--> `Login JWT with tid`  [INFERRED]
  public/index.html → MULTITENANT.md
- `Romaneio - Baixa de Bois` --conceptually_related_to--> `Multi-tenancy design`  [INFERRED]
  public/baixas.html → MULTITENANT.md
- `Romaneio - Fazendas` --conceptually_related_to--> `Multi-tenancy design`  [INFERRED]
  public/fazendas.html → MULTITENANT.md
- `Romaneio - Manejo de Pasto` --conceptually_related_to--> `Multi-tenancy design`  [INFERRED]
  public/manejo.html → MULTITENANT.md
- `Romaneio - Pastos` --conceptually_related_to--> `Multi-tenancy design`  [INFERRED]
  public/pastos.html → MULTITENANT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Dashboard data loading and rendering flow** — public_dashboard_loadstats, public_dashboard_loadreports, public_dashboard_loadbaixas, public_dashboard_makechart, public_dashboard_api_dashboard_endpoints [EXTRACTED 1.00]
- **Pages sharing sidebar, header-utils and style.css shell** — public_dashboard_page, public_genealogia_page, public_js_sidebar, public_js_header_utils, public_style_css [EXTRACTED 1.00]
- **Historico weight view flow (select boi, load history, table and chart)** — public_historico_onboiinput, public_historico_loadhistory, public_historico_updatetable, public_historico_updatechart [EXTRACTED 1.00]
- **Client-side pagination pattern** — public_historico_gmp_renderpage [INFERRED 0.85]
- **Cattle farm management pages** — public_fazendas, public_pastos, public_manejo, public_baixas, public_vacinas [INFERRED 0.75]
- **Tenant administration** — public_empresas, public_usuarios, multitenant [INFERRED 0.75]

## Communities (31 total, 10 thin omitted)

### Community 0 - "Debug e Testes da API"
Cohesion: 0.06
Nodes (25): http, options, req, http, options, req, http, makeRequest() (+17 more)

### Community 1 - "Dependências npm"
Cohesion: 0.07
Nodes (32): author, dependencies, body-parser@^2.2.1, cors@^2.8.5, dotenv@^17.2.3, express@^5.2.1, jsonwebtoken@^9.0.3, node@^25.3.0 (+24 more)

### Community 2 - "Genealogia"
Cohesion: 0.14
Nodes (29): addTreeControls(), allBois, checkConsanguinity(), clearRegisterForm(), closeModal(), deleteGenealogy(), editGenealogy(), exportGenealogyGridPDF() (+21 more)

### Community 3 - "Servidor Express"
Cohesion: 0.09
Nodes (21): allowedOrigins, app, bcrypt, bodyParser, BOI_FIELDS, buildAncestorTree(), cors, crypto (+13 more)

### Community 4 - "Banco MySQL"
Cohesion: 0.09
Nodes (15): bcrypt, Database, db, fs, mysql, path, pool, dbSqlite (+7 more)

### Community 5 - "Banco SQLite"
Cohesion: 0.12
Nodes (16): bcrypt, db, dbPath, initDb(), path, sqlite3, bcrypt@^6.0.0, bcrypt (+8 more)

### Community 6 - "Dashboard e Relatórios"
Cohesion: 0.13
Nodes (21): /api/dashboard/* endpoints (stats, financial, weight-stats, report, baixas-stats), Chart plugins (centerText, barValueLabels, pieSliceLabels), Chart.js library, horizontalBar, loadBaixas, loadReports, loadStats, makeChart (+13 more)

### Community 7 - "Scripts de Checagem SQLite"
Cohesion: 0.12
Nodes (16): db, dbPath, path, sqlite3, Instructions to Restart Server, Stale Node server lacks vacinas endpoints (Cannot POST /api/vacinas), Vacinas API endpoints in server.js, vacinas.html screen (+8 more)

### Community 8 - "Banco PostgreSQL"
Cohesion: 0.15
Nodes (8): convertPlaceholders(), Database, pool, { Pool, types }, prepare(), args, bcrypt, useEnv

### Community 9 - "Checagem de Bois"
Cohesion: 0.12
Nodes (13): db, dbPath, path, sqlite3, data, db, dbPath, path (+5 more)

### Community 10 - "Histórico GMP"
Cohesion: 0.23
Nodes (15): API /api/gmp/autocomplete, API /api/gmp/history, Chart.js library, jsPDF + autotable library, historico_gmp.html (Histórico G.M.P page), applyFilters, Status dot (Vendido/Morreu) tooltip, clearFilters (+7 more)

### Community 11 - "Multi-tenancy"
Cohesion: 0.17
Nodes (15): Multi-tenancy design, Composite FKs (tenant_id,id), Deploy order: backup, migrate, deploy code, Login JWT with tid, Migration 001_multitenant.sql, Migration 002_platform_admin.sql, Platform admin flag (is_platform_admin), requireAuth tenant resolution (+7 more)

### Community 12 - "Bovinos e Histórico de Pesos"
Cohesion: 0.15
Nodes (14): Chart.js library, jsPDF library, bovinos.html (Gerenciar Bovinos page), exportToPDF (bovinos), historico.html (Historico de Pesos page), exportToPDF (historico), Romaneio - Perspectiva de Peso, API /api/bois/:id/weight (+6 more)

### Community 13 - "Baixas e Vacinas"
Cohesion: 0.20
Nodes (10): Romaneio - Baixa de Bois, API /api/baixas, API /api/baixas/last-weight/:boton, API /api/bois, Romaneio - Vacinas, API /api/bois, API /api/vacinas, API /api/vacinas/:id (+2 more)

### Community 14 - "Fazendas e Manejo"
Cohesion: 0.20
Nodes (10): Romaneio - Fazendas, API /api/fazendas, API /api/fazendas/:id, Romaneio - Manejo de Pasto, API /api/bois, API /api/fazendas, API /api/manejo, API /api/manejo/:id (+2 more)

### Community 15 - "Sidebar"
Cohesion: 0.31
Nodes (7): currentPage(), enhanceTables(), getUser(), initials(), isMobile(), labelRows(), renderLayout()

### Community 16 - "Filtros de Bovinos"
Cohesion: 0.22
Nodes (8): applyFilters (bovinos), deleteBoi, boi form submit handler (POST/PUT), loadBois, populateAutocomplete (bovinos), renderPage (bovinos), showConfirmModal, showMessage (bovinos toast)

### Community 17 - "Pastos e Dieta"
Cohesion: 0.22
Nodes (8): dieta.html (Controle de Dieta page), Romaneio - Pastos, API /api/fazendas, API /api/pastos, API /api/pastos/:id, Romaneio - Cadastro de Usuários, API /api/users, API /api/users/:id

### Community 18 - "Histórico de Manejo"
Cohesion: 0.29
Nodes (7): API /api/manejo (bois-distinct, history-all/:id), init (historico), loadHistory, onBoiInput, renderPagination (historico), updateChart (historico weight bar chart), updateTable (historico, weight gain calc)

### Community 19 - "Dietas"
Cohesion: 0.33
Nodes (6): API /api/dietas, deleteDieta, loadDietas, renderTable (dieta), showToast (dieta), Dieta types (Proteinado 01/03/05, Dieta 1%, Dieta Total)

### Community 20 - "Pastos por Fazenda"
Cohesion: 0.67
Nodes (3): API /api/pastos (fazenda/:id, :id/count), editDieta, Fazenda to Pasto cascading select and cattle count

## Knowledge Gaps
- **64 isolated node(s):** `vacinas.html screen`, `romaneio.db (SQLite)`, `applyFilters (bovinos)`, `populateAutocomplete (bovinos)`, `editBoi` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 187 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Multi-tenancy design` connect `Multi-tenancy` to `Dependências npm`, `Banco PostgreSQL`, `Bovinos e Histórico de Pesos`, `Baixas e Vacinas`, `Fazendas e Manejo`, `Pastos e Dieta`?**
  _High betweenness centrality (0.372) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `Multi-tenancy design` (e.g. with `Romaneio - Baixa de Bois` and `Romaneio - Gestão de Empresas`) actually correct?**
  _`Multi-tenancy design` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `vacinas.html screen`, `romaneio.db (SQLite)`, `applyFilters (bovinos)` to the rest of the system?**
  _64 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Debug e Testes da API` be split into smaller, more focused modules?**
  _Cohesion score 0.06401137980085349 - nodes in this community are weakly interconnected._
- **Why does `bcrypt` connect `Banco SQLite` to `Banco PostgreSQL`, `Dependências npm`, `Servidor Express`, `Banco MySQL`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Romaneio - Manejo de Pasto` (e.g. with `Multi-tenancy design` and `Romaneio - Fazendas`) actually correct?**
  _`Romaneio - Manejo de Pasto` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dependências npm` be split into smaller, more focused modules?**
  _Cohesion score 0.06685633001422475 - nodes in this community are weakly interconnected._