// Teste de isolamento multi-tenant (rode SOMENTE em banco de teste/descartável!).
// Pré-requisitos: banco com supabase_schema.sql aplicado e VAZIO de empresas, servidor rodando
// contra ele (PORT=3999 JWT_SECRET=testsecret DB_SSL=false ...) e duas empresas criadas:
//   node scripts/create-tenant.js "Empresa A" admin_a "Admin A" senhaA1234
//   node scripts/create-tenant.js "Empresa B" admin_b "Admin B" senhaB1234
// Uso: DB_HOST=localhost DB_PORT=.. DB_USER=.. DB_PASSWORD=.. DB_NAME=.. node tests/tenant-isolation.test.js
const BASE = 'http://localhost:3999';
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL:', m); } };
async function call(tok, method, path, body) {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch (e) {}
  return { s: r.status, j };
}
const login = async (u, p) => (await call(null, 'POST', '/api/login', { username: u, password: p })).j;
(async () => {
  const A = await login('admin_a', 'senhaA1234'), B = await login('admin_b', 'senhaB1234');
  ok(A.token && B.token && A.user.tenant === 'Empresa A', 'login + tenant name');
  const a = A.token, b = B.token;
  // Seed A
  const faz = (await call(a, 'POST', '/api/fazendas', { name: 'FazA', address: 'x' })).j.id;
  const pas = (await call(a, 'POST', '/api/pastos', { name: 'PasA', fazenda_id: faz })).j.id;
  const boi = (await call(a, 'POST', '/api/bois', { name: 'BOTON-A', brinco: 'BR-A', vendedor: 'VendA', local_compra: 'LocA', initial_weight: 300, arrival_date: '2026-01-01', sexo: 'M' })).j.id;
  const boi2 = (await call(a, 'POST', '/api/bois', { name: 'BOTON-A2', sexo: 'F' })).j.id;
  const man = (await call(a, 'POST', '/api/manejo', { boi_id: boi, pasto_id: pas, fazenda_id: faz, initial_weight_manejo: 300, weight_01: 310, date_weight_01: '2026-02-01' })).j.id;
  const vac = (await call(a, 'POST', '/api/vacinas', { boi_id: boi, vacina: 'B19', data_vacina: '2026-02-01', chip: 'CHIPA', brinco: 'BR-A' })).j.id;
  const die = (await call(a, 'POST', '/api/dietas', { fazenda_id: faz, pasto_id: pas, qtd_bois: 1, data: '2026-02-01', dieta_tipo: 'X', qtd_kg: 10 })).j.id;
  const per = (await call(a, 'POST', '/api/perspectives', { boi_id: boi, fazenda_id: faz, pasto_id: pas, start_date: '2026-02-01', days: 10, daily_rate: 1, initial_weight: 300, final_weight: 310 })).j.id;
  const bxa = (await call(a, 'POST', '/api/baixas', { boi_id: boi2, boton: 'BOTON-A2', data_baixa: '2026-03-01', status: 'Vendido' })).j.id;
  ok(faz && pas && boi && man && vac && die && per && bxa, 'A seed ids ' + [faz, pas, boi, man, vac, die, per, bxa]);
  // sanity: A enxerga os seus dados
  ok((await call(a, 'GET', '/api/bois')).j.length === 2, 'A sees own bois');
  ok((await call(a, 'GET', '/api/vacinas')).j.length === 1, 'A sees own vacinas');
  ok((await call(a, 'GET', `/api/pastos/${pas}/count`)).j.count === 1, 'A pasto count');

  // B: listas vazias em TODA rota de listagem
  const lists = ['/api/fazendas', '/api/pastos', '/api/bois', '/api/manejo', '/api/manejo/bois-distinct', '/api/vacinas', '/api/baixas', '/api/dietas', '/api/perspectives', '/api/users', '/api/gmp/history', '/api/vacinas/chart', '/api/baixas/chart', '/api/dashboard/baixas-stats', '/api/dashboard/report/bois-fazenda', '/api/dashboard/report/bois-pasto', `/api/bois/pasto/${pas}`, `/api/pastos/fazenda/${faz}`];
  for (const p of lists) {
    const r = await call(b, 'GET', p);
    const arr = Array.isArray(r.j) ? r.j : [];
    const n = p === '/api/users' ? arr.filter(u => u.username !== 'admin_b').length : arr.length;
    ok(r.s === 200 && n === 0, `B ${p} -> ${r.s} len=${arr.length} ${JSON.stringify(r.j).slice(0,120)}`);
  }
  const st = (await call(b, 'GET', '/api/dashboard/stats')).j; ok(st.totalBois === 0 && st.totalFazendas === 0 && st.totalPastos === 0, 'B stats ' + JSON.stringify(st));
  const fin = (await call(b, 'GET', '/api/dashboard/financial')).j; ok(fin.activeCount === 0, 'B financial');
  const ws = (await call(b, 'GET', '/api/dashboard/weight-stats')).j; ok(ws.top5.length === 0, 'B weight-stats');
  for (const p of ['/api/gmp/autocomplete', '/api/vacinas/autocomplete', '/api/baixas/autocomplete']) {
    const j = (await call(b, 'GET', p)).j; ok(Object.values(j).every(x => x.length === 0), `B ${p} leak ${JSON.stringify(j)}`);
  }
  ok((await call(b, 'GET', `/api/vacinas/pendentes/BOTON-A`)).j.applied.length === 0, 'B pendentes leak');
  ok((await call(b, 'GET', `/api/baixas/last-weight/BOTON-A`)).j.last_weight === null, 'B last-weight leak');
  ok((await call(b, 'GET', `/api/pastos/${pas}/count`)).j.count === 0, 'B pasto count leak');
  const dc = (await call(b, 'GET', `/api/dashboard/dieta-consumption?pasto_id=${pas}&period=mensal`)).j; ok(dc.period_total === 0 && dc.cattle_count === 0, 'B dieta-consumption ' + JSON.stringify(dc));
  ok((await call(b, 'GET', `/api/bois/${boi}/weight`)).j.weight === 0, 'B boi weight leak');
  ok((await call(b, 'GET', `/api/bois/${boi}/last-manejo`)).j === null, 'B last-manejo leak');
  ok((await call(b, 'GET', `/api/manejo/${man}`)).s === 404, 'B manejo/:id');
  ok((await call(b, 'GET', `/api/manejo/history?boi_id=${boi}&fazenda_id=${faz}&pasto_id=${pas}`)).j === null, 'B manejo/history');
  ok((await call(b, 'GET', `/api/manejo/history-all/${boi}`)).j.length === 0, 'B history-all');
  ok((await call(b, 'GET', `/api/genealogia/arvore/${boi}`)).s === 404, 'B arvore');
  ok((await call(b, 'GET', `/api/genealogia/consanguinidade?pai_id=${boi}&mae_id=${boi2}`)).j.consanguineo === false, 'B consang');

  // B: escrita em ids de A não pode ter efeito
  const noEffect = async (m, p, body, label) => { const r = await call(b, m, p, body); ok(r.s === 404 || (r.j && r.j.changes === 0) || r.s >= 400, `B ${label} -> ${r.s} ${JSON.stringify(r.j)}`); };
  await noEffect('PUT', `/api/fazendas/${faz}`, { name: 'HACK' }, 'PUT fazenda');
  await noEffect('DELETE', `/api/fazendas/${faz}`, null, 'DEL fazenda');
  await noEffect('PUT', `/api/pastos/${pas}`, { name: 'HACK', fazenda_id: faz }, 'PUT pasto');
  await noEffect('DELETE', `/api/pastos/${pas}`, null, 'DEL pasto');
  await noEffect('PUT', `/api/bois/${boi}`, { name: 'HACK' }, 'PUT boi');
  await noEffect('DELETE', `/api/bois/${boi}`, null, 'DEL boi');
  await noEffect('PUT', `/api/manejo/${man}`, { boi_id: boi }, 'PUT manejo');
  await noEffect('DELETE', `/api/manejo/${man}`, null, 'DEL manejo');
  await noEffect('PUT', `/api/vacinas/${vac}`, { boi_id: boi, vacina: 'HACK', data_vacina: '2026-01-01' }, 'PUT vacina');
  await noEffect('DELETE', `/api/vacinas/${vac}`, null, 'DEL vacina');
  await noEffect('PUT', `/api/dietas/${die}`, { fazenda_id: faz, pasto_id: pas, data: '2026-01-01', dieta_tipo: 'H' }, 'PUT dieta');
  await noEffect('DELETE', `/api/dietas/${die}`, null, 'DEL dieta');
  await noEffect('PUT', `/api/perspectives/${per}`, { boi_id: boi }, 'PUT persp');
  await noEffect('DELETE', `/api/perspectives/${per}`, null, 'DEL persp');
  await noEffect('PUT', `/api/baixas/${bxa}`, { boi_id: boi2, boton: 'HACK', data_baixa: '2026-01-01', status: 'Morreu' }, 'PUT baixa');
  await noEffect('DELETE', `/api/baixas/${bxa}`, null, 'DEL baixa');
  const uidA = (await call(a, 'GET', '/api/users')).j[0].id;
  await noEffect('PUT', `/api/users/${uidA}`, { name: 'HACK', username: 'hacked', profile: 'Admin' }, 'PUT user');
  await noEffect('DELETE', `/api/users/${uidA}`, null, 'DEL user');

  // B: POST referenciando ids de A deve ser rejeitado pelas FKs compostas
  const rej = async (p, body, label) => { const r = await call(b, 'POST', p, body); ok(r.s >= 400, `B POST ${label} aceitou ref. cruzada -> ${r.s} ${JSON.stringify(r.j)}`); };
  await rej('/api/pastos', { name: 'x', fazenda_id: faz }, 'pasto->fazenda A');
  await rej('/api/manejo', { boi_id: boi, pasto_id: pas, fazenda_id: faz }, 'manejo->A');
  await rej('/api/vacinas', { boi_id: boi, vacina: 'x', data_vacina: '2026-01-01' }, 'vacina->boi A');
  await rej('/api/dietas', { fazenda_id: faz, pasto_id: pas, data: '2026-01-01', dieta_tipo: 'x' }, 'dieta->A');
  await rej('/api/baixas', { boi_id: boi, boton: 'x', data_baixa: '2026-01-01', status: 'Vendido' }, 'baixa->boi A');
  await rej('/api/perspectives', { boi_id: boi, fazenda_id: faz, pasto_id: pas }, 'persp->A');
  await rej('/api/bois', { name: 'x', pai_id: boi }, 'boi pai de A');
  const ownB = (await call(b, 'POST', '/api/bois', { name: 'B1' })).j.id;
  const r2 = await call(b, 'PUT', `/api/bois/${ownB}`, { pai_id: boi }); ok(r2.s >= 400, 'B PUT boi pai de A ' + r2.s);

  // Dados de A intactos
  ok((await call(a, 'GET', '/api/fazendas')).j[0].name === 'FazA', 'A fazenda intacta');
  ok((await call(a, 'GET', '/api/bois')).j.length === 2, 'A bois intactos');
  ok((await call(a, 'GET', '/api/baixas')).j.length === 1, 'A baixas intactas');
  ok((await call(a, 'GET', '/api/users')).j.length === 1, 'A users intactos');

  // Usuário criado por A pertence a A; B não o vê; token forjado/sem tid
  const nu = await call(a, 'POST', '/api/users', { name: 'U2', username: 'u2a', password: 'abcdef', profile: 'Usuário' });
  ok(nu.s === 200, 'A cria usuario'); ok((await call(b, 'GET', '/api/users')).j.length === 1, 'B nao ve u2a');
  const dup = await call(b, 'POST', '/api/users', { name: 'U2', username: 'u2a', password: 'abcdef', profile: 'Usuário' }); ok(dup.s === 409, 'username global unico ' + dup.s);
  // tenant_id no corpo é ignorado
  const sp = await call(b, 'POST', '/api/fazendas', { name: 'SpoofB', tenant_id: 1 }); ok(sp.s === 200, 'spoof post');
  ok((await call(a, 'GET', '/api/fazendas')).j.length === 1, 'A nao recebeu fazenda spoofada');
  ok((await call(b, 'GET', '/api/fazendas?tenant_id=1')).j.length === 1, 'query tenant_id ignorado');
  const jwt = require('jsonwebtoken');
  const old = jwt.sign({ id: 1, name: 'x', profile: 'Admin' }, 'testsecret'); ok((await call(old, 'GET', '/api/bois')).s === 401, 'token sem tid recusado');
  const forged = jwt.sign({ id: B.user.id, tid: 999, profile: 'Admin' }, 'testsecret'); ok((await call(forged, 'GET', '/api/bois')).s === 401, 'tid divergente recusado');
  ok((await call(null, 'GET', '/api/bois')).s === 401, 'sem token 401');
  // Suspensão
  const { Client } = require('pg');
  const c = new Client({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME }); await c.connect();
  await c.query("update tenants set active=false where name='Empresa B'");
  ok((await call(b, 'GET', '/api/bois')).s === 403, 'token de tenant suspenso -> 403');
  ok((await call(null, 'POST', '/api/login', { username: 'admin_b', password: 'senhaB1234' })).s === 403, 'login tenant suspenso -> 403');
  ok((await call(null, 'POST', '/api/login', { username: 'admin_b', password: 'errada' })).s === 401, 'senha errada continua 401');
  await c.query("update tenants set active=true where name='Empresa B'");
  // cascade de delete de fazenda por A não afeta B; delete fazenda A remove pastos/manejo/dietas de A
  const d = await call(a, 'DELETE', `/api/fazendas/${faz}`); ok(d.j.changes === 1, 'A deleta fazenda');
  ok((await call(a, 'GET', '/api/pastos')).j.length === 0, 'cascade pastos');
  ok((await call(b, 'GET', '/api/fazendas')).j.length === 1, 'B fazenda intacta');
  await c.end();
  console.log(`\n${passes} ok, ${fails} falhas`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
