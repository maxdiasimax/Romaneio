# Graph Report - Romaneio  (2026-11-22)

## Corpus Check
- 71 files · ~55,494 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 437 nodes · 655 edges · 23 communities (15 shown, 8 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Páginas de Baixas e Multi-tenancy
- Dependências (package.json)
- API Vacinas/Baixas/Bois/Dietas
- API Pesos/GMP/Pastos
- API Fazendas/Manejo/Dieta
- Scripts SQLite de checagem
- Genealogia (front)
- Scripts de debug HTTP
- Servidor Express (server.js)
- Banco PostgreSQL (database-pg)
- Banco SQLite (database.js)
- Checagem de vacinas e reinício
- Schema Supabase e RLS
- Dashboard e Gráficos
- Wrapper Database
- Testes CRUD Vacinas
- Cálculo Valor por Kg
- Debug de contagem
- Debug de exclusão

## God Nodes (most connected - your core abstractions)
1. `manejo.html (Manejo de Pasto page)` - 21 edges
2. `perspectiva_peso.html (Perspectiva de Peso page)` - 18 edges
3. `vacinas.html (Gerenciar Vacinas page)` - 18 edges
4. `historico_gmp.html (Histórico G.M.P page)` - 12 edges
5. `pastos.html (Gerenciar Pastos page)` - 12 edges
6. `Genealogia page (genealogia.html)` - 9 edges
7. `Database` - 8 edges
8. `Database` - 8 edges
9. `API /api/bois` - 8 edges
10. `API /api/pastos (fazenda/:id, :id/count)` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Usuarios page (usuarios.html)` --references--> `Multi-tenancy Guide`  [INFERRED]
  public/usuarios.html → MULTITENANT.md
- `login-form submit handler` --calls--> `/api/login JWT with id and tid`  [INFERRED]
  public/index.html → MULTITENANT.md
- `/api/users endpoints` --references--> `requireAuth middleware`  [INFERRED]
  public/usuarios.html → MULTITENANT.md
- `renderPagination (historico)` --semantically_similar_to--> `renderPage (baixas)`  [INFERRED] [semantically similar]
  public/historico.html → public/baixas.html
- `renderPage` --semantically_similar_to--> `renderPage`  [INFERRED] [semantically similar]
  public/pastos.html → public/historico_gmp.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Tenant isolation mechanisms** — multitenant_login_jwt, multitenant_requireauth, multitenant_composite_fks, multitenant_rls_no_policies [EXTRACTED 1.00]
- **Dashboard data loading and rendering flow** — public_dashboard_loadstats, public_dashboard_loadreports, public_dashboard_loadbaixas, public_dashboard_makechart, public_dashboard_api_dashboard_endpoints [EXTRACTED 1.00]
- **Pages sharing sidebar, header-utils and style.css shell** — public_dashboard_page, public_fazendas_page, public_genealogia_page, public_usuarios_page, public_js_sidebar, public_js_header_utils, public_style_css [EXTRACTED 1.00]
- **CRUD pages sharing pagination, filtering, toast and PDF export patterns** — public_baixas, public_bovinos, public_dieta, public_historico [INFERRED 0.75]
- **Baixa registration flow (BOTON lookup, submit, reload)** — public_baixas_boton_lookup, public_baixas_form_submit, public_baixas_loadbaixas, public_baixas_applyfilters [EXTRACTED 1.00]
- **Historico weight view flow (select boi, load history, table and chart)** — public_historico_onboiinput, public_historico_loadhistory, public_historico_updatetable, public_historico_updatechart [EXTRACTED 1.00]
- **Client-side pagination pattern** — public_historico_gmp_renderpage, public_pastos_renderpage, public_vacinas_renderpage [INFERRED 0.85]
- **Manejo weighing/save flow** — public_manejo_checkandloadhistory, public_manejo_calculatetotals, public_manejo_submit_handler, public_manejo_loadmanejohistorytable [INFERRED 0.75]
- **Toast and confirm-modal feedback pattern** — public_manejo_showmessage, public_pastos_showmessage, public_vacinas_showtoast, public_perspectiva_peso_showtoast [INFERRED 0.75]

## Communities (23 total, 8 thin omitted)

### Community 0 - "Páginas de Baixas e Multi-tenancy"
Cohesion: 0.07
Nodes (41): Baixa status (Vendido / Morreu), Chart.js, jsPDF + autoTable (PDF export library), Multi-tenancy Guide, baixas.html (Baixa de Bois page), applyFilters (baixas), exportChartToPDF, exportGridToPDF (baixas) (+33 more)

### Community 1 - "Dependências (package.json)"
Cohesion: 0.07
Nodes (32): author, dependencies, body-parser@^2.2.1, cors@^2.8.5, dotenv@^17.2.3, express@^5.2.1, jsonwebtoken@^9.0.3, node@^25.3.0 (+24 more)

### Community 2 - "API Vacinas/Baixas/Bois/Dietas"
Cohesion: 0.08
Nodes (37): API /api/baixas (and /last-weight), API /api/bois, API /api/dietas, API /api/vacinas, API /api/vacinas/autocomplete, API /api/vacinas/pendentes/:boton, BOTON selection handler (auto-fill brinco and last weight), deleteBaixa (+29 more)

### Community 3 - "API Pesos/GMP/Pastos"
Cohesion: 0.10
Nodes (34): API /api/bois/pasto/:id, API /api/bois/:id/weight, API /api/dashboard/dieta-consumption, API /api/gmp/autocomplete, API /api/gmp/history, API /api/pastos/fazenda/:id, API /api/perspectives, Chart.js library (+26 more)

### Community 4 - "API Fazendas/Manejo/Dieta"
Cohesion: 0.11
Nodes (35): API /api/fazendas, API /api/manejo (bois-distinct, history-all/:id), API /api/manejo/history, API /api/pastos (fazenda/:id, :id/count), editDieta, loadFazendas (dieta), Fazenda to Pasto cascading select and cattle count, manejo.html (Manejo de Pasto page) (+27 more)

### Community 5 - "Scripts SQLite de checagem"
Cohesion: 0.06
Nodes (27): db, dbPath, path, sqlite3, bcrypt, db, fs, mysql (+19 more)

### Community 6 - "Genealogia (front)"
Cohesion: 0.14
Nodes (29): addTreeControls(), allBois, checkConsanguinity(), clearRegisterForm(), closeModal(), deleteGenealogy(), editGenealogy(), exportGenealogyGridPDF() (+21 more)

### Community 7 - "Scripts de debug HTTP"
Cohesion: 0.07
Nodes (18): http, options, req, http, options, req, http, runTests() (+10 more)

### Community 8 - "Servidor Express (server.js)"
Cohesion: 0.09
Nodes (20): allowedOrigins, app, bcrypt, bodyParser, BOI_FIELDS, buildAncestorTree(), cors, crypto (+12 more)

### Community 9 - "Banco PostgreSQL (database-pg)"
Cohesion: 0.11
Nodes (12): convertPlaceholders(), Database, pool, { Pool, types }, prepare(), Globally unique username, /api/login JWT with id and tid, migrations/001_multitenant.sql (+4 more)

### Community 10 - "Banco SQLite (database.js)"
Cohesion: 0.12
Nodes (16): bcrypt, db, dbPath, initDb(), path, sqlite3, bcrypt@^6.0.0, bcrypt (+8 more)

### Community 11 - "Checagem de vacinas e reinício"
Cohesion: 0.12
Nodes (16): db, dbPath, path, sqlite3, Instructions to Restart Server, Stale Node server lacks vacinas endpoints (Cannot POST /api/vacinas), Vacinas API endpoints in server.js, vacinas.html screen (+8 more)

### Community 12 - "Schema Supabase e RLS"
Cohesion: 0.17
Nodes (14): Composite FKs (tenant_id, id), requireAuth middleware, RLS enabled without policies, supabase_schema.sql (new DB), /api/fazendas endpoints, confirmDeleteFazenda, fazenda-form submit handler, loadFazendas (+6 more)

### Community 13 - "Dashboard e Gráficos"
Cohesion: 0.19
Nodes (15): /api/dashboard/* endpoints (stats, financial, weight-stats, report, baixas-stats), Chart plugins (centerText, barValueLabels, pieSliceLabels), Chart.js library, horizontalBar, loadBaixas, loadReports, loadStats, makeChart (+7 more)

### Community 15 - "Testes CRUD Vacinas"
Cohesion: 0.43
Nodes (7): http, makeRequest(), testAutocomplete(), testCreate(), testDelete(), testRead(), testUpdate()

## Ambiguous Edges - Review These
- `exportToPDF` → `chartInstance (referenced but undefined in vacinas.html; exportToPDF never wired)`  [AMBIGUOUS]
  public/vacinas.html · relation: references

## Knowledge Gaps
- **32 isolated node(s):** `RLS enabled without policies`, `migrations/001_multitenant.sql`, `supabase_schema.sql (new DB)`, `Globally unique username`, `vacinas.html screen` (+27 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 157 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Shared schema with tenant_id model` connect `Schema Supabase e RLS` to `Páginas de Baixas e Multi-tenancy`, `Dependências (package.json)`?**
  _High betweenness centrality (0.424) - this node is a cross-community bridge._
- **What connects `RLS enabled without policies`, `migrations/001_multitenant.sql`, `supabase_schema.sql (new DB)` to the rest of the system?**
  _32 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Páginas de Baixas e Multi-tenancy` be split into smaller, more focused modules?**
  _Cohesion score 0.06956521739130435 - nodes in this community are weakly interconnected._
- **Why does `Multi-tenancy Guide` connect `Páginas de Baixas e Multi-tenancy` to `Schema Supabase e RLS`?**
  _High betweenness centrality (0.398) - this node is a cross-community bridge._
- **Should `Dependências (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.06685633001422475 - nodes in this community are weakly interconnected._
- **Should `API Vacinas/Baixas/Bois/Dietas` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `exportToPDF` and `chartInstance (referenced but undefined in vacinas.html; exportToPDF never wired)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._