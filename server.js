const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database-pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// --- SEGURANÇA: configuração -------------------------------------------------
// Defina JWT_SECRET no ambiente (Hostinger / .env). Sem ele, um segredo aleatório
// é gerado a cada inicialização (todos os usuários precisarão logar de novo ao reiniciar).
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    JWT_SECRET = crypto.randomBytes(48).toString('hex');
    console.warn('[SEGURANÇA] JWT_SECRET não definido. Usando segredo temporário; defina JWT_SECRET no ambiente.');
}
const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '12h';

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Cabeçalhos de segurança básicos (sem dependência extra)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});

// CORS: o front é servido pelo próprio servidor (mesma origem). Origens extras via CORS_ORIGINS.
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false }));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Resposta de erro sem vazar detalhes internos do banco
function sendError(res, err) {
    console.error('[DB]', err && err.message);
    const code = err && err.code;
    if (code === '23505') return res.status(409).json({ error: 'Já existe um registro com esses dados.' });
    if (code === '23503') return res.status(409).json({ error: 'Operação não permitida: o registro está vinculado a outros dados ou a referência informada não existe.' });
    if (code === '23502' || code === '22P02' || code === '22007' || code === '22003' || code === '23514' || code === '22001') {
        return res.status(400).json({ error: 'Dados inválidos. Verifique os campos informados.' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor.' });
}

// Rate limit simples em memória (login)
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 10;
function loginLimiter(req, res, next) {
    const key = req.ip;
    const now = Date.now();
    const entry = loginAttempts.get(key);
    if (!entry || now - entry.start > LOGIN_WINDOW_MS) {
        loginAttempts.set(key, { start: now, count: 1 });
        return next();
    }
    entry.count++;
    if (entry.count > LOGIN_MAX) {
        const wait = Math.ceil((LOGIN_WINDOW_MS - (now - entry.start)) / 60000);
        return res.status(429).json({ error: `Muitas tentativas de login. Tente novamente em ${wait} min.` });
    }
    next();
}
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of loginAttempts) if (now - v.start > LOGIN_WINDOW_MS) loginAttempts.delete(k);
}, 10 * 60 * 1000).unref();

// --- AUTH ---
// MULTI-TENANT: a empresa (tenant) do usuário NUNCA vem do corpo/URL/cabeçalhos da requisição.
// Ela é lida do banco a partir do id do usuário contido no token assinado (JWT). Assim,
// perfil, empresa e suspensão de empresa valem imediatamente, sem esperar o token expirar.
// Todas as consultas das rotas devem filtrar por req.tenantId.
function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Não autenticado.' });
    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }
    // Tokens antigos (sem tid) são recusados: o usuário precisa logar de novo.
    if (!payload || !payload.id || !payload.tid) {
        return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }
    db.get(
        `SELECT u.id, u.name, u.profile, u.tenant_id, t.name AS tenant_name, t.active AS tenant_active
         FROM users u JOIN tenants t ON t.id = u.tenant_id
         WHERE u.id = ?`,
        [payload.id],
        (err, row) => {
            if (err) return sendError(res, err);
            if (!row || String(row.tenant_id) !== String(payload.tid)) {
                return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
            }
            if (!row.tenant_active) {
                return res.status(403).json({ error: 'Conta da empresa suspensa. Entre em contato com o suporte.' });
            }
            req.user = { id: row.id, name: row.name, profile: row.profile };
            req.tenantId = row.tenant_id;
            req.tenantName = row.tenant_name;
            next();
        }
    );
}
function requireAdmin(req, res, next) {
    if (!req.user || req.user.profile !== 'Admin') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    next();
}

// Dono da plataforma (você): único perfil que gerencia empresas. É uma flag no banco
// (users.is_platform_admin), concedida SOMENTE por SQL — nenhuma rota da API a define.
// Consultada aqui (e não em requireAuth) para o resto do sistema não depender da migração 002.
function requirePlatformAdmin(req, res, next) {
    db.get('SELECT is_platform_admin FROM users WHERE id = ? AND tenant_id = ?', [req.user.id, req.tenantId], (err, row) => {
        if (err) return sendError(res, err);
        if (!row || row.is_platform_admin !== true) {
            return res.status(403).json({ error: 'Acesso restrito ao administrador da plataforma.' });
        }
        next();
    });
}

const VALID_PROFILES = ['Admin', 'Usuário'];

app.post('/api/login', loginLimiter, (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return res.status(400).json({ error: 'Informe usuário e senha.' });
    }
    db.get(`SELECT u.*, t.name AS tenant_name, t.active AS tenant_active
            FROM users u JOIN tenants t ON t.id = u.tenant_id
            WHERE u.username = ?`, [username], async (err, user) => {
        if (err) return sendError(res, err);
        // Mensagem genérica: não revela se o usuário existe
        const invalid = () => res.status(401).json({ error: 'Usuário ou senha inválidos.' });
        if (!user) {
            await bcrypt.compare(password, '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali').catch(() => {});
            return invalid();
        }
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return invalid();

        // Só informa a suspensão depois de validar a senha (não revela contas a terceiros)
        if (!user.tenant_active) {
            return res.status(403).json({ error: 'Conta da empresa suspensa. Entre em contato com o suporte.' });
        }

        loginAttempts.delete(req.ip);
        // tid = empresa do usuário; é conferido contra o banco a cada requisição (requireAuth)
        const token = jwt.sign({ id: user.id, tid: user.tenant_id, name: user.name, profile: user.profile }, JWT_SECRET, { expiresIn: TOKEN_TTL });
        res.json({ message: "Login successful", token, user: { id: user.id, name: user.name, profile: user.profile, tenant: user.tenant_name, platform: user.is_platform_admin === true } });
    });
});

// Retorna o usuário da sessão atual (usado pelo front para validar o token)
app.get('/api/me', requireAuth, (req, res) => {
    res.json({ id: req.user.id, name: req.user.name, profile: req.user.profile, tenant: req.tenantName });
});

// A partir daqui, TODA a API exige autenticação
app.use('/api', requireAuth);

// Defesa em profundidade contra XSS armazenado: remove "<" e ">" de campos de texto
// (nomes, brincos, endereços etc.). Senhas não são alteradas.
function stripTags(value, key) {
    if (typeof value === 'string') return key === 'password' ? value : value.replace(/[<>]/g, '');
    if (Array.isArray(value)) return value.map(v => stripTags(v, key));
    if (value && typeof value === 'object') {
        const out = {};
        for (const k of Object.keys(value)) out[k] = stripTags(value[k], k);
        return out;
    }
    return value;
}
app.use('/api', (req, res, next) => {
    if (req.body && typeof req.body === 'object') req.body = stripTags(req.body, '');
    next();
});

// --- USERS MANAGEMENT (somente Admin) ---

function validateUserBody(body, { requirePassword }) {
    const { name, username, password, profile } = body || {};
    if (!name || typeof name !== 'string' || !name.trim()) return 'Informe o nome.';
    if (!username || typeof username !== 'string' || !username.trim()) return 'Informe o usuário.';
    if (!VALID_PROFILES.includes(profile)) return 'Perfil inválido.';
    if (requirePassword || (password && String(password).trim() !== '')) {
        if (typeof password !== 'string' || password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    }
    return null;
}

app.get('/api/users', requireAdmin, (req, res) => {
    db.all("SELECT id, name, username, celular, profile FROM users WHERE tenant_id = ? ORDER BY name", [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

app.post('/api/users', requireAdmin, async (req, res) => {
    const msg = validateUserBody(req.body, { requirePassword: true });
    if (msg) return res.status(400).json({ error: msg });
    const { name, username, password, celular, profile } = req.body;
    const hash = await bcrypt.hash(password, 10);

    db.run("INSERT INTO users (tenant_id, name, username, password, celular, profile) VALUES (?, ?, ?, ?, ?, ?)",
        [req.tenantId, name.trim(), username.trim(), hash, celular || null, profile],
        function(err) {
            if (err) return sendError(res, err);
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/users/:id', requireAdmin, async (req, res) => {
    const msg = validateUserBody(req.body, { requirePassword: false });
    if (msg) return res.status(400).json({ error: msg });
    const { name, username, password, celular, profile } = req.body;

    // Não permite rebaixar o próprio perfil (evita ficar sem administrador)
    if (String(req.params.id) === String(req.user.id) && profile !== 'Admin') {
        return res.status(400).json({ error: 'Você não pode remover o seu próprio perfil de administrador.' });
    }

    if (password && password.trim() !== '') {
        const hash = await bcrypt.hash(password, 10);
        db.run("UPDATE users SET name = ?, username = ?, password = ?, celular = ?, profile = ? WHERE id = ? AND tenant_id = ?",
            [name.trim(), username.trim(), hash, celular || null, profile, req.params.id, req.tenantId],
            function(err) {
                if (err) return sendError(res, err);
                res.json({ changes: this.changes });
            }
        );
    } else {
        db.run("UPDATE users SET name = ?, username = ?, celular = ?, profile = ? WHERE id = ? AND tenant_id = ?",
            [name.trim(), username.trim(), celular || null, profile, req.params.id, req.tenantId],
            function(err) {
                if (err) return sendError(res, err);
                res.json({ changes: this.changes });
            }
        );
    }
});

app.delete('/api/users/:id', requireAdmin, (req, res) => {
    if (String(req.params.id) === String(req.user.id)) {
        return res.status(400).json({ error: 'Você não pode excluir o seu próprio usuário.' });
    }
    db.run("DELETE FROM users WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

// --- GESTÃO DE EMPRESAS (somente dono da plataforma) ---

app.get('/api/platform/tenants', requirePlatformAdmin, (req, res) => {
    db.all(`SELECT t.id, t.name, t.active, t.created_at,
                   (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS users_count,
                   (SELECT COUNT(*) FROM bois b WHERE b.tenant_id = t.id) AS bois_count
            FROM tenants t ORDER BY t.id`, [], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

// Cria a empresa e o primeiro Admin dela, em uma transação
app.post('/api/platform/tenants', requirePlatformAdmin, async (req, res) => {
    const { name, admin_name, admin_username, admin_password } = req.body || {};
    const bad = [name, admin_name, admin_username].some(v => typeof v !== 'string' || !v.trim());
    if (bad) return res.status(400).json({ error: 'Informe o nome da empresa e o nome e usuário do administrador.' });
    if (typeof admin_password !== 'string' || admin_password.length < 8) {
        return res.status(400).json({ error: 'A senha do administrador deve ter pelo menos 8 caracteres.' });
    }
    let client;
    try {
        const hash = await bcrypt.hash(admin_password, 10);
        client = await db.pool.connect();
        await client.query('BEGIN');
        const t = await client.query('INSERT INTO tenants (name) VALUES ($1) RETURNING id', [name.trim()]);
        await client.query(
            "INSERT INTO users (tenant_id, name, username, password, profile) VALUES ($1, $2, $3, $4, 'Admin')",
            [t.rows[0].id, admin_name.trim(), admin_username.trim(), hash]
        );
        await client.query('COMMIT');
        res.json({ id: t.rows[0].id });
    } catch (err) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        sendError(res, err);
    } finally {
        if (client) client.release();
    }
});

// Renomeia e/ou suspende/reativa
app.put('/api/platform/tenants/:id', requirePlatformAdmin, (req, res) => {
    const { name, active } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || typeof active !== 'boolean') {
        return res.status(400).json({ error: 'Informe o nome e o status da empresa.' });
    }
    if (String(req.params.id) === String(req.tenantId) && active === false) {
        return res.status(400).json({ error: 'Você não pode suspender a sua própria empresa.' });
    }
    db.run('UPDATE tenants SET name = ?, active = ? WHERE id = ?', [name.trim(), active, req.params.id], function(err) {
        if (err) return sendError(res, err);
        if (this.changes === 0) return res.status(404).json({ error: 'Empresa não encontrada.' });
        res.json({ changes: this.changes });
    });
});

// Usuários de uma empresa (visão do dono da plataforma; nunca expõe hash de senha)
app.get('/api/platform/tenants/:id/users', requirePlatformAdmin, (req, res) => {
    db.all('SELECT id, name, username, celular, profile FROM users WHERE tenant_id = ? ORDER BY name', [req.params.id], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

// Redefine a senha de um usuário de qualquer empresa (suporte)
app.post('/api/platform/tenants/:id/users/:uid/password', requirePlatformAdmin, async (req, res) => {
    const { password } = req.body || {};
    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
    }
    const hash = await bcrypt.hash(password, 10);
    db.run('UPDATE users SET password = ? WHERE id = ? AND tenant_id = ?', [hash, req.params.uid, req.params.id], function(err) {
        if (err) return sendError(res, err);
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado nesta empresa.' });
        res.json({ changes: this.changes });
    });
});

// Exclusão DEFINITIVA de empresa e de todos os seus dados. Salvaguardas: a empresa precisa estar
// suspensa, não pode ser a do próprio usuário e o nome deve ser digitado como confirmação.
app.delete('/api/platform/tenants/:id', requirePlatformAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Empresa inválida.' });
    if (id === req.tenantId) return res.status(400).json({ error: 'Você não pode excluir a sua própria empresa.' });
    let client;
    try {
        client = await db.pool.connect();
        const t = await client.query('SELECT name, active FROM tenants WHERE id = $1', [id]);
        if (!t.rows[0]) return res.status(404).json({ error: 'Empresa não encontrada.' });
        if (t.rows[0].active) return res.status(400).json({ error: 'Suspenda a empresa antes de excluí-la.' });
        if (!req.body || req.body.confirm_name !== t.rows[0].name) {
            return res.status(400).json({ error: 'Confirmação inválida: digite o nome exato da empresa.' });
        }
        await client.query('BEGIN');
        // Ordem: filhos antes dos pais (as FKs compostas também fariam cascade, mas assim fica explícito)
        for (const table of ['dietas', 'perspectives', 'baixas', 'vacinas', 'manejo_pasto', 'bois', 'pastos', 'fazendas', 'users']) {
            await client.query(`DELETE FROM ${table} WHERE tenant_id = $1`, [id]);
        }
        await client.query('DELETE FROM tenants WHERE id = $1', [id]);
        await client.query('COMMIT');
        res.json({ deleted: true });
    } catch (err) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        sendError(res, err);
    } finally {
        if (client) client.release();
    }
});

// --- FAZENDAS ---

app.get('/api/fazendas', (req, res) => {
    db.all("SELECT * FROM fazendas WHERE tenant_id = ?", [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

app.post('/api/fazendas', (req, res) => {
    const { name, address } = req.body;
    db.run("INSERT INTO fazendas (tenant_id, name, address) VALUES (?, ?, ?)", [req.tenantId, name, address], function(err) {
        if (err) return sendError(res, err);
        res.json({ id: this.lastID });
    });
});

app.put('/api/fazendas/:id', (req, res) => {
    const { name, address } = req.body;
    db.run("UPDATE fazendas SET name = ?, address = ? WHERE id = ? AND tenant_id = ?", [name, address, req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

app.delete('/api/fazendas/:id', (req, res) => {
    db.run("DELETE FROM fazendas WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

// --- PASTOS ---

app.get('/api/pastos', (req, res) => {
    const sql = `SELECT p.*, f.name as fazenda_name FROM pastos p LEFT JOIN fazendas f ON p.fazenda_id = f.id AND f.tenant_id = p.tenant_id WHERE p.tenant_id = ? ORDER BY p.id DESC`;
    db.all(sql, [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

app.get('/api/pastos/fazenda/:id', (req, res) => {
    db.all("SELECT * FROM pastos WHERE fazenda_id = ? AND tenant_id = ?", [req.params.id, req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

app.post('/api/pastos', (req, res) => {
    const { name, fazenda_id } = req.body;
    db.run("INSERT INTO pastos (tenant_id, name, fazenda_id) VALUES (?, ?, ?)", [req.tenantId, name, fazenda_id], function(err) {
        if (err) return sendError(res, err);
        res.json({ id: this.lastID });
    });
});

app.put('/api/pastos/:id', (req, res) => {
    const { name, fazenda_id } = req.body;
    db.run("UPDATE pastos SET name = ?, fazenda_id = ? WHERE id = ? AND tenant_id = ?", [name, fazenda_id, req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

app.delete('/api/pastos/:id', (req, res) => {
    console.log(`Deleting pasto ${req.params.id}`);
    db.run("DELETE FROM pastos WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        if (this.changes === 0) return res.status(404).json({ error: "Pasto not found" });
        res.json({ changes: this.changes });
    });
});

// --- BOIS ---

// Valida pai/mãe: sem auto-parentesco, sexo coerente e sem ciclos na árvore.
function validateParents(tenantId, boiId, paiId, maeId, sexo, cb) {
    paiId = paiId ? parseInt(paiId) : null;
    maeId = maeId ? parseInt(maeId) : null;
    boiId = boiId ? parseInt(boiId) : null;
    if (!paiId && !maeId) return cb(null);
    if (boiId && (paiId === boiId || maeId === boiId)) return cb('Um animal não pode ser pai ou mãe de si mesmo.');
    if (paiId && maeId && paiId === maeId) return cb('Pai e mãe não podem ser o mesmo animal.');

    db.all("SELECT id, pai_id, mae_id, sexo FROM bois WHERE tenant_id = ?", [tenantId], (err, rows) => {
        if (err) return cb(null, err);
        const map = new Map(rows.map(r => [parseInt(r.id), r]));
        if (paiId) {
            const pai = map.get(paiId);
            if (!pai) return cb('Pai informado não encontrado.');
            if (pai.sexo === 'F') return cb('O pai selecionado está cadastrado como fêmea.');
        }
        if (maeId) {
            const mae = map.get(maeId);
            if (!mae) return cb('Mãe informada não encontrada.');
            if (mae.sexo === 'M') return cb('A mãe selecionada está cadastrada como macho.');
        }
        // Ciclo: o próprio animal não pode estar entre os ancestrais dos pais indicados
        if (boiId) {
            for (const parent of [paiId, maeId].filter(Boolean)) {
                const anc = getAncestorIds(parent, map, new Set());
                if (anc.has(boiId)) return cb('Parentesco inválido: o animal seria ancestral de si mesmo.');
            }
        }
        cb(null);
    });
}

app.get('/api/bois', (req, res) => {
    db.all("SELECT * FROM bois WHERE tenant_id = ? ORDER BY id DESC", [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

app.post('/api/bois', (req, res) => {
    if (!req.body || !req.body.name || !String(req.body.name).trim()) return res.status(400).json({ error: 'Informe o nome/botom do animal.' });
    validateParents(req.tenantId, null, req.body.pai_id, req.body.mae_id, req.body.sexo, (msg, e) => {
        if (e) return sendError(res, e);
        if (msg) return res.status(400).json({ error: msg });
        insertBoi(req, res);
    });
});

function insertBoi(req, res) {
    const { name, initial_weight, arrival_date, brinco, vendedor, local_compra, valor_boi, valor_comissao, valor_frete, raca, pai_id, mae_id, sexo, geracao, data_nascimento } = req.body;
    
    // Calculate valor_por_kg: (valor_boi + valor_comissao + valor_frete) / initial_weight
    let valor_por_kg = null;
    if (initial_weight && initial_weight > 0) {
        const totalValue = (parseFloat(valor_boi) || 0) + (parseFloat(valor_comissao) || 0) + (parseFloat(valor_frete) || 0);
        valor_por_kg = totalValue / parseFloat(initial_weight);
    }
    
    db.run("INSERT INTO bois (tenant_id, name, initial_weight, arrival_date, brinco, vendedor, local_compra, valor_boi, valor_comissao, valor_frete, valor_por_kg, raca, pai_id, mae_id, sexo, geracao, data_nascimento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
        [req.tenantId, name, initial_weight, arrival_date, brinco || null, vendedor || null, local_compra || null, valor_boi || null, valor_comissao || null, valor_frete || null, valor_por_kg, raca || null, pai_id || null, mae_id || null, sexo || null, geracao || null, data_nascimento || null], 
        function(err) {
            if (err) return sendError(res, err);
            res.json({ id: this.lastID });
        }
    );
}

const BOI_FIELDS = ['name', 'initial_weight', 'arrival_date', 'brinco', 'vendedor', 'local_compra', 'valor_boi', 'valor_comissao', 'valor_frete', 'raca', 'pai_id', 'mae_id', 'sexo', 'geracao', 'data_nascimento'];

app.put('/api/bois/:id', (req, res) => {
    // Campos ausentes no corpo preservam o valor atual (ex.: tela Bovinos não envia pai/mãe/sexo
    // e antes disso apagava a genealogia ao editar).
    db.get("SELECT * FROM bois WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], (e0, existing) => {
        if (e0) return sendError(res, e0);
        if (!existing) return res.status(404).json({ error: 'Animal não encontrado.' });

        const merged = {};
        BOI_FIELDS.forEach(f => { merged[f] = (req.body && req.body[f] !== undefined) ? req.body[f] : existing[f]; });
        req.body = merged;

        if (!merged.name || !String(merged.name).trim()) return res.status(400).json({ error: 'Informe o nome/botom do animal.' });
        validateParents(req.tenantId, req.params.id, merged.pai_id, merged.mae_id, merged.sexo, (msg, e) => {
            if (e) return sendError(res, e);
            if (msg) return res.status(400).json({ error: msg });
            updateBoi(req, res);
        });
    });
});

function updateBoi(req, res) {
    const { name, initial_weight, arrival_date, brinco, vendedor, local_compra, valor_boi, valor_comissao, valor_frete, raca, pai_id, mae_id, sexo, geracao, data_nascimento } = req.body;
    
    // Calculate valor_por_kg: (valor_boi + valor_comissao + valor_frete) / initial_weight
    let valor_por_kg = null;
    if (initial_weight && initial_weight > 0) {
        const totalValue = (parseFloat(valor_boi) || 0) + (parseFloat(valor_comissao) || 0) + (parseFloat(valor_frete) || 0);
        valor_por_kg = totalValue / parseFloat(initial_weight);
    }
    
    db.run("UPDATE bois SET name = ?, initial_weight = ?, arrival_date = ?, brinco = ?, vendedor = ?, local_compra = ?, valor_boi = ?, valor_comissao = ?, valor_frete = ?, valor_por_kg = ?, raca = ?, pai_id = ?, mae_id = ?, sexo = ?, geracao = ?, data_nascimento = ? WHERE id = ? AND tenant_id = ?", 
        [name, initial_weight, arrival_date, brinco || null, vendedor || null, local_compra || null, valor_boi || null, valor_comissao || null, valor_frete || null, valor_por_kg, raca || null, pai_id || null, mae_id || null, sexo || null, geracao || null, data_nascimento || null, req.params.id, req.tenantId], 
        function(err) {
            if (err) return sendError(res, err);
            res.json({ changes: this.changes });
        }
    );
}

app.delete('/api/bois/:id', (req, res) => {
    db.run("DELETE FROM bois WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

app.get('/api/bois/:id/last-manejo', (req, res) => {
    const sql = `
        SELECT fazenda_id, pasto_id, initial_weight_manejo 
        FROM manejo_pasto 
        WHERE boi_id = ? AND tenant_id = ?
        ORDER BY id DESC LIMIT 1
    `;
    db.get(sql, [req.params.id, req.tenantId], (err, row) => {
        if (err) return sendError(res, err);
        res.json(row || null);
    });
});

// --- MANEJO PASTO ---

app.get('/api/manejo', (req, res) => {
    const { page, limit, boi_name, fazenda_id, pasto_id } = req.query;
    
    const pageInt = page ? parseInt(page) : null;
    const limitInt = limit ? parseInt(limit) : null;
    
    // Base SQL
    let sql = `
        SELECT m.*, b.name as boi_name, b.baixa_status, p.name as pasto_name, f.name as fazenda_name 
        FROM manejo_pasto m
        LEFT JOIN bois b ON m.boi_id = b.id
        LEFT JOIN pastos p ON m.pasto_id = p.id
        LEFT JOIN fazendas f ON m.fazenda_id = f.id
        WHERE m.tenant_id = ?
    `;
    
    const params = [req.tenantId];

    // Add Filters
    if (boi_name) {
        sql += ` AND b.name LIKE ?`;
        params.push(`%${boi_name}%`);
    }
    if (fazenda_id) {
        sql += ` AND m.fazenda_id = ?`;
        params.push(fazenda_id);
    }
    if (pasto_id) {
        sql += ` AND m.pasto_id = ?`;
        params.push(pasto_id);
    }

    // Add Pagination if requested
    if (pageInt && limitInt) {
        const offset = (pageInt - 1) * limitInt;
        sql += ` ORDER BY m.id DESC LIMIT ? OFFSET ?`;
        params.push(limitInt, offset);
    } else {
        sql += ` ORDER BY m.id DESC`;
    }

    db.all(sql, params, (err, rows) => {
        if (err) return sendError(res, err);
        
        // Add last_weight_date and last_weight_value to each row
        const processedRows = rows.map(row => {
            let lastDate = null;
            let lastWeight = null;
            
            // Check all 10 weight date fields and find the most recent one
            for (let i = 1; i <= 10; i++) {
                const num = i.toString().padStart(2, '0');
                const dateField = row[`date_weight_${num}`];
                const weightField = row[`weight_${num}`];
                
                if (dateField) {
                    if (!lastDate || new Date(dateField) > new Date(lastDate)) {
                        lastDate = dateField;
                        lastWeight = weightField;
                    }
                }
            }
            
            return {
                ...row,
                last_weight_date: lastDate,
                last_weight_value: lastWeight
            };
        });
        
        // If pagination, also return total count
        if (pageInt && limitInt) {
             let countSql = `
                SELECT COUNT(*) as count 
                FROM manejo_pasto m
                LEFT JOIN bois b ON m.boi_id = b.id
                WHERE m.tenant_id = ?
            `;
            const countParams = [req.tenantId];
            if (boi_name) { countSql += ` AND b.name LIKE ?`; countParams.push(`%${boi_name}%`); }
            if (fazenda_id) { countSql += ` AND m.fazenda_id = ?`; countParams.push(fazenda_id); }
            if (pasto_id) { countSql += ` AND m.pasto_id = ?`; countParams.push(pasto_id); }

            db.get(countSql, countParams, (err, countRow) => {
                if (err) return sendError(res, err);
                res.json({
                    data: processedRows,
                    total: countRow.count,
                    page: pageInt,
                    limit: limitInt,
                    totalPages: Math.ceil(countRow.count / limitInt)
                });
            });
        } else {
            res.json(processedRows);
        }
    });
});

app.get('/api/manejo/history', (req, res) => {
    const { boi_id, fazenda_id, pasto_id } = req.query;
    if (!boi_id || !fazenda_id || !pasto_id) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    const sql = `
        SELECT * FROM manejo_pasto 
        WHERE boi_id = ? AND fazenda_id = ? AND pasto_id = ? AND tenant_id = ?
        ORDER BY id DESC LIMIT 1
    `;
    
    db.get(sql, [boi_id, fazenda_id, pasto_id, req.tenantId], (err, row) => {
        if (err) return sendError(res, err);
        if (!row) return res.json(null); // No history found
        res.json(row);
    });
});

app.get('/api/manejo/bois-distinct', (req, res) => {
    const sql = `
        SELECT id, name, baixa_status
        FROM bois
        WHERE tenant_id = ?
        ORDER BY name
    `;
    db.all(sql, [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

app.get('/api/manejo/:id', (req, res) => {
    const sql = `SELECT * FROM manejo_pasto WHERE id = ? AND tenant_id = ?`;
    db.get(sql, [req.params.id, req.tenantId], (err, row) => {
        if (err) return sendError(res, err);
        if (!row) return res.status(404).json({ error: "Manejo not found" });
        res.json(row);
    });
});

app.post('/api/manejo', (req, res) => {
    const { boi_id, pasto_id, fazenda_id, initial_weight_manejo, weights } = req.body;
    
    const params = [
        req.tenantId, boi_id, pasto_id, fazenda_id, initial_weight_manejo,
        req.body.weight_01 || null, req.body.date_weight_01 || null,
        req.body.weight_02 || null, req.body.date_weight_02 || null,
        req.body.weight_03 || null, req.body.date_weight_03 || null,
        req.body.weight_04 || null, req.body.date_weight_04 || null,
        req.body.weight_05 || null, req.body.date_weight_05 || null,
        req.body.weight_06 || null, req.body.date_weight_06 || null,
        req.body.weight_07 || null, req.body.date_weight_07 || null,
        req.body.weight_08 || null, req.body.date_weight_08 || null,
        req.body.weight_09 || null, req.body.date_weight_09 || null,
        req.body.weight_10 || null, req.body.date_weight_10 || null,
        req.body.total_weight_registered || 0,
        req.body.weights_count || 0
    ];

    const sql = `INSERT INTO manejo_pasto (
        tenant_id, boi_id, pasto_id, fazenda_id, initial_weight_manejo,
        weight_01, date_weight_01,
        weight_02, date_weight_02,
        weight_03, date_weight_03,
        weight_04, date_weight_04,
        weight_05, date_weight_05,
        weight_06, date_weight_06,
        weight_07, date_weight_07,
        weight_08, date_weight_08,
        weight_09, date_weight_09,
        weight_10, date_weight_10,
        total_weight_registered, weights_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, params, function(err) {
        if (err) return sendError(res, err);
        res.json({ id: this.lastID });
    });
});

app.put('/api/manejo/:id', (req, res) => {
    const { boi_id, pasto_id, fazenda_id, initial_weight_manejo } = req.body;
    
    const params = [
        boi_id, pasto_id, fazenda_id, initial_weight_manejo,
        req.body.weight_01 || null, req.body.date_weight_01 || null,
        req.body.weight_02 || null, req.body.date_weight_02 || null,
        req.body.weight_03 || null, req.body.date_weight_03 || null,
        req.body.weight_04 || null, req.body.date_weight_04 || null,
        req.body.weight_05 || null, req.body.date_weight_05 || null,
        req.body.weight_06 || null, req.body.date_weight_06 || null,
        req.body.weight_07 || null, req.body.date_weight_07 || null,
        req.body.weight_08 || null, req.body.date_weight_08 || null,
        req.body.weight_09 || null, req.body.date_weight_09 || null,
        req.body.weight_10 || null, req.body.date_weight_10 || null,
        req.body.total_weight_registered || 0,
        req.body.weights_count || 0,
        req.params.id, req.tenantId
    ];

    const sql = `UPDATE manejo_pasto SET
        boi_id = ?, pasto_id = ?, fazenda_id = ?, initial_weight_manejo = ?,
        weight_01 = ?, date_weight_01 = ?,
        weight_02 = ?, date_weight_02 = ?,
        weight_03 = ?, date_weight_03 = ?,
        weight_04 = ?, date_weight_04 = ?,
        weight_05 = ?, date_weight_05 = ?,
        weight_06 = ?, date_weight_06 = ?,
        weight_07 = ?, date_weight_07 = ?,
        weight_08 = ?, date_weight_08 = ?,
        weight_09 = ?, date_weight_09 = ?,
        weight_10 = ?, date_weight_10 = ?,
        total_weight_registered = ?, weights_count = ?
        WHERE id = ? AND tenant_id = ?`;

    db.run(sql, params, function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

app.delete('/api/manejo/:id', (req, res) => {
    db.run("DELETE FROM manejo_pasto WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});



app.get('/api/manejo/history-all/:id', (req, res) => {
    const sql = `
        SELECT m.*, f.name as fazenda_name, p.name as pasto_name, b.baixa_status,
               b.initial_weight as boi_initial_weight, b.arrival_date as boi_arrival_date,
               b.local_compra, b.vendedor
        FROM bois b
        LEFT JOIN manejo_pasto m ON m.boi_id = b.id AND m.tenant_id = b.tenant_id
        LEFT JOIN fazendas f ON m.fazenda_id = f.id
        LEFT JOIN pastos p ON m.pasto_id = p.id
        WHERE b.id = ? AND b.tenant_id = ?
        ORDER BY m.id ASC
    `;
    
    db.all(sql, [req.params.id, req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        
        let history = [];
        const processedDates = new Set(); // To avoid exact duplicates of date+weight

        // Helper to add entry safely
        const addEntry = (entry) => {
            const key = `${entry.date.split('T')[0]}_${entry.weight}`;
            if (!processedDates.has(key)) {
                history.push(entry);
                processedDates.add(key);
            }
        };

        // 1. Add Initial Purchase / Arrival Weight
        // We take the first row (if any) or query separately if rows is empty but boi exists.
        // Since we LEFT JOIN from bois, if the boi exists we should get at least one row (even if all m.* are null)
        // EXCEPT if the WHERE clause filters out the boi itself (which it does: WHERE b.id = ?).
        // Wait, if there are NO manejo records, the LEFT JOIN works?
        // Yes, if we start FROM bois.
        
        if (rows.length > 0) {
            const b = rows[0];
            if (b.boi_initial_weight && b.boi_arrival_date) {
                addEntry({
                    weight: b.boi_initial_weight,
                    date: b.boi_arrival_date,
                    fazenda: b.local_compra || 'Compra',
                    pasto: b.vendedor || 'Origem',
                    type: 'Compra',
                    original_id: 'initial'
                });
            }
        }

        // 2. Process Manejo Records
        rows.forEach(row => {
            if (!row.id) return; // Skip if no manejo record (just boi info)

            // Add initial weight of CURRENT manejo if exists
            // But we must check if this isn't just a repetition of the previous weight
            if (row.initial_weight_manejo) {
                // Find effective date for this initial weight
                // Usually it's slightly before the first measured weight
                let earliestDate = null;
                for (let i = 1; i <= 10; i++) {
                    const num = i.toString().padStart(2, '0');
                    const d = row[`date_weight_${num}`];
                    if (d) {
                        if (!earliestDate || new Date(d) < new Date(earliestDate)) {
                            earliestDate = d;
                        }
                    }
                }
                
                // If we have a date, add it.
                // NOTE: logic changed to avoid duplicate "dots" on the same day if weight is identical.
                if (earliestDate) {
                    addEntry({
                        weight: row.initial_weight_manejo,
                        date: earliestDate,
                        fazenda: row.fazenda_name,
                        pasto: row.pasto_name,
                        original_id: row.id,
                        type: 'Manejo Inicial'
                    });
                }
            }
            
            // Check all 10 slots
            for (let i = 1; i <= 10; i++) {
                const num = i.toString().padStart(2, '0');
                const w = row[`weight_${num}`];
                const d = row[`date_weight_${num}`];
                
                if (w && d) {
                     addEntry({
                        weight: w,
                        date: d,
                        fazenda: row.fazenda_name,
                        pasto: row.pasto_name,
                        original_id: row.id,
                        type: 'Pesagem'
                    });
                }
            }
        });

        // Sort by date
        history.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        res.json(history);
    });
});

// --- DASHBOARD ---

app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const getCount = (table) => new Promise((resolve, reject) => {
            // `table` é sempre uma constante literal abaixo (nunca vem da requisição)
            db.get(`SELECT COUNT(*) as count FROM ${table} WHERE tenant_id = ?`, [req.tenantId], (err, row) => {
                if(err) reject(err); else resolve(row.count);
            });
        });

        const totalBois = await getCount('bois');
        const totalFazendas = await getCount('fazendas');
        const totalPastos = await getCount('pastos');

        res.json({ totalBois, totalFazendas, totalPastos });
    } catch(err) {
        sendError(res, err);
    }
});

app.get('/api/dashboard/report/bois-fazenda', (req, res) => {
    // Count distinct bois in manejo per fazenda? Or just use current location? 
    // The prompt implies a relationship. 
    // Usually boi is in a pasto which is in a fazenda.
    // Or we rely on Manejo records.
    // Let's use Manejo records to see where bois are 'assigned' or just JOIN tables if possible.
    // Since 'Boi' table doesn't have valid field, only Manejo links Boi to Pasto/Fazenda. 
    // We will count based on *latest* manejo record or just all records?
    // Let's assume unique assignment per Boi in Manejo for simplicity or group by Fazenda in Manejo.
    // Or maybe we should add current_pasto_id to Boi?
    // Given the prompt structure, Manejo links them.
    // Let's count by Manejo entries for now (active entries?). 
    // Query: Count Bois grouped by Fazenda.
    const sql = `
        SELECT f.name as fazenda, COUNT(DISTINCT m.boi_id) as qtd_bois
        FROM manejo_pasto m
        JOIN fazendas f ON m.fazenda_id = f.id
        WHERE m.tenant_id = ?
        GROUP BY f.id
    `;
    db.all(sql, [req.tenantId], (err, rows) => {
        if(err) return sendError(res, err);
        res.json(rows);
    });
});

app.get('/api/dashboard/report/bois-pasto', (req, res) => {
    const sql = `
        SELECT p.name as pasto, COUNT(DISTINCT m.boi_id) as qtd_bois
        FROM manejo_pasto m
        JOIN pastos p ON m.pasto_id = p.id
        WHERE m.tenant_id = ?
        GROUP BY p.id
    `;
    db.all(sql, [req.tenantId], (err, rows) => {
        if(err) return sendError(res, err);
        res.json(rows);
    });
});

app.get('/api/dashboard/financial', async (req, res) => {
    try {
        const sql = `
            SELECT 
                COUNT(*) as "activeCattleCount",
                SUM(valor_boi) as "totalBoi",
                SUM(valor_comissao) as "totalComissao",
                SUM(valor_frete) as "totalFrete"
            FROM bois
            WHERE baixa_id IS NULL AND tenant_id = ?
        `;
        
        db.get(sql, [req.tenantId], (err, row) => {
            if (err) return sendError(res, err);
            
            const totalInvested = (row.totalBoi || 0) + (row.totalComissao || 0) + (row.totalFrete || 0);
            const avgCost = row.activeCattleCount > 0 ? totalInvested / row.activeCattleCount : 0;
            
            res.json({
                totalInvested: totalInvested,
                avgCost: avgCost,
                activeCount: row.activeCattleCount
            });
        });
    } catch(err) {
        sendError(res, err);
    }
});

app.get('/api/dashboard/weight-stats', (req, res) => {
    // 1. Get all active bois and their latest weight + initial weight + arrival date
    const sql = `
        SELECT b.id, b.name, b.initial_weight, b.arrival_date,
               (SELECT weight_10 FROM manejo_pasto m WHERE m.boi_id = b.id ORDER BY m.id DESC LIMIT 1) as w10,
               (SELECT weight_09 FROM manejo_pasto m WHERE m.boi_id = b.id ORDER BY m.id DESC LIMIT 1) as w09,
               (SELECT weight_08 FROM manejo_pasto m WHERE m.boi_id = b.id ORDER BY m.id DESC LIMIT 1) as w08,
               (SELECT weight_07 FROM manejo_pasto m WHERE m.boi_id = b.id ORDER BY m.id DESC LIMIT 1) as w07,
               (SELECT weight_06 FROM manejo_pasto m WHERE m.boi_id = b.id ORDER BY m.id DESC LIMIT 1) as w06,
               (SELECT weight_05 FROM manejo_pasto m WHERE m.boi_id = b.id ORDER BY m.id DESC LIMIT 1) as w05,
               (SELECT weight_04 FROM manejo_pasto m WHERE m.boi_id = b.id ORDER BY m.id DESC LIMIT 1) as w04,
               (SELECT weight_03 FROM manejo_pasto m WHERE m.boi_id = b.id ORDER BY m.id DESC LIMIT 1) as w03,
               (SELECT weight_02 FROM manejo_pasto m WHERE m.boi_id = b.id ORDER BY m.id DESC LIMIT 1) as w02,
               (SELECT weight_01 FROM manejo_pasto m WHERE m.boi_id = b.id ORDER BY m.id DESC LIMIT 1) as w01,
               (SELECT initial_weight_manejo FROM manejo_pasto m WHERE m.boi_id = b.id ORDER BY m.id DESC LIMIT 1) as w_init_manejo
        FROM bois b
        WHERE b.baixa_id IS NULL AND b.tenant_id = ?
    `;

    db.all(sql, [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);

        let totalGMD = 0;
        let gmdCount = 0;
        const weightDistribution = {
            under200: 0,
            between200and350: 0,
            between350and500: 0,
            over500: 0
        };
        const activeCattleWithWeight = [];

        rows.forEach(row => {
            // Determine current weight
            let currentWeight = null;
            const weights = [row.w10, row.w09, row.w08, row.w07, row.w06, row.w05, row.w04, row.w03, row.w02, row.w01, row.w_init_manejo];
            for (let w of weights) {
                if (w) {
                    currentWeight = w;
                    break;
                }
            }
            if (!currentWeight && row.initial_weight) currentWeight = row.initial_weight;

            if (currentWeight) {
                // Buckets
                if (currentWeight < 200) weightDistribution.under200++;
                else if (currentWeight < 350) weightDistribution.between200and350++;
                else if (currentWeight < 500) weightDistribution.between350and500++;
                else weightDistribution.over500++;

                activeCattleWithWeight.push({ name: row.name, weight: currentWeight });

                // GMD Calculation
                if (row.initial_weight && row.arrival_date) {
                    const arrival = new Date(row.arrival_date);
                    const now = new Date();
                    const days = Math.floor((now - arrival) / (1000 * 60 * 60 * 24));
                    if (days > 0) {
                        const gain = currentWeight - row.initial_weight;
                        const gmd = gain / days;
                        // Filter realistic GMDs (-1 to 3 kg/day for example)
                        if (gmd > -2 && gmd < 4) { 
                            totalGMD += gmd;
                            gmdCount++;
                        }
                    }
                }
            }
        });

        const avgGMD = gmdCount > 0 ? (totalGMD / gmdCount) : 0;
        
        // Sort for Top 5
        activeCattleWithWeight.sort((a, b) => b.weight - a.weight);
        const top5 = activeCattleWithWeight.slice(0, 5);

        res.json({
            avgGMD,
            weightDistribution,
            top5
        });
    });
});

app.get('/api/dashboard/baixas-stats', (req, res) => {
    const sql = `
        SELECT status, COUNT(*) as count 
        FROM baixas 
        WHERE tenant_id = ?
        GROUP BY status
    `;
    db.all(sql, [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

// --- HISTÓRICO G.M.P (Ganho Médio de Peso) ---

app.get('/api/gmp/autocomplete', (req, res) => {
    const sql = `
        SELECT DISTINCT 
            name as boton,
            brinco,
            vendedor,
            local_compra
        FROM bois
        WHERE tenant_id = ? AND (name IS NOT NULL OR brinco IS NOT NULL OR vendedor IS NOT NULL OR local_compra IS NOT NULL)
    `;
    
    db.all(sql, [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        
        // Extract unique values for each field
        const botonSet = new Set();
        const brincoSet = new Set();
        const vendedorSet = new Set();
        const localSet = new Set();
        
        rows.forEach(row => {
            if (row.boton) botonSet.add(row.boton);
            if (row.brinco) brincoSet.add(row.brinco);
            if (row.vendedor) vendedorSet.add(row.vendedor);
            if (row.local_compra) localSet.add(row.local_compra);
        });
        
        res.json({
            boton: Array.from(botonSet).sort(),
            brinco: Array.from(brincoSet).sort(),
            vendedor: Array.from(vendedorSet).sort(),
            local_compra: Array.from(localSet).sort()
        });
    });
});

app.get('/api/gmp/history', (req, res) => {
    const { boton, brinco, raca, data_chegada, vendedor, nome_vendedor, local_compra } = req.query;
    
    // Build WHERE clause based on filters (o filtro de empresa é sempre o primeiro)
    let whereClauses = ['b.tenant_id = ?'];
    let params = [req.tenantId];
    
    if (boton) {
        whereClauses.push('b.name LIKE ?');
        params.push(`%${boton}%`);
    }
    if (brinco) {
        whereClauses.push('b.brinco LIKE ?');
        params.push(`%${brinco}%`);
    }
    if (raca) {
        whereClauses.push('b.raca = ?');
        params.push(raca);
    }
    if (data_chegada) {
        whereClauses.push('b.arrival_date = ?');
        params.push(data_chegada);
    }
    if (vendedor || nome_vendedor) {
        // Use either vendedor or nome_vendedor (they're the same field)
        const vendedorValue = vendedor || nome_vendedor;
        whereClauses.push('b.vendedor LIKE ?');
        params.push(`%${vendedorValue}%`);
    }
    if (local_compra) {
        whereClauses.push('b.local_compra LIKE ?');
        params.push(`%${local_compra}%`);
    }
    
    const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    
    const sql = `
        SELECT b.*, m.*,
               f.name as fazenda_name,
               p.name as pasto_name,
               b.name as boi_name,
               b.id as boi_id_main
        FROM bois b
        LEFT JOIN manejo_pasto m ON b.id = m.boi_id AND m.tenant_id = b.tenant_id
        LEFT JOIN fazendas f ON m.fazenda_id = f.id
        LEFT JOIN pastos p ON m.pasto_id = p.id
        ${whereClause}
        ORDER BY b.id, m.id
    `;
    
    db.all(sql, params, (err, rows) => {
        if (err) return sendError(res, err);
        
        // Group by boi and flatten weight history
        const boisMap = new Map();
        
        rows.forEach(row => {
            const boiId = row.boi_id_main;
            
            if (!boisMap.has(boiId)) {
                boisMap.set(boiId, {
                    id: boiId,
                    name: row.boi_name,
                    brinco: row.brinco,
                    raca: row.raca,
                    vendedor: row.vendedor,
                    local_compra: row.local_compra,
                    arrival_date: row.arrival_date,
                    initial_weight: row.initial_weight,
                    history: []
                });
                
                // Add initial weight as first entry if exists
                if (row.initial_weight && row.arrival_date) {
                    boisMap.get(boiId).history.push({
                        date: row.arrival_date,
                        weight: row.initial_weight,
                        fazenda: null,
                        pasto: null,
                        isInitial: true
                    });
                }
            }
            
            // Add manejo weights if this row has manejo data
            if (row.id) { // manejo_pasto.id exists
                for (let i = 1; i <= 10; i++) {
                    const num = i.toString().padStart(2, '0');
                    const weight = row[`weight_${num}`];
                    const date = row[`date_weight_${num}`];
                    
                    if (weight && date) {
                        boisMap.get(boiId).history.push({
                            date: date,
                            weight: weight,
                            fazenda: row.fazenda_name,
                            pasto: row.pasto_name,
                            isInitial: false
                        });
                    }
                }
            }
        });
        
        // Convert map to array and sort history by date
        const result = Array.from(boisMap.values()).map(boi => {
            boi.history.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Calculate weight gain for each entry
            boi.history = boi.history.map((entry, index) => {
                if (index === 0) {
                    return { ...entry, weight_gain: 0 };
                }
                const previousWeight = boi.history[index - 1].weight;
                const weightGain = entry.weight - previousWeight;
                return { ...entry, weight_gain: weightGain };
            });
            
            // Calculate GMD (Ganho Médio Diário - Average Daily Gain)
            // GMD = (Last Weight - Initial Weight) / (Days from arrival to last weighing)
            let gmd = null;
            if (boi.history.length > 0 && boi.arrival_date) {
                const firstWeight = boi.history[0].weight;
                const lastEntry = boi.history[boi.history.length - 1];
                const lastWeight = lastEntry.weight;
                const lastDate = new Date(lastEntry.date);
                const arrivalDate = new Date(boi.arrival_date);
                
                // Calculate days difference
                const daysDiff = Math.floor((lastDate - arrivalDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff > 0) {
                    const totalWeightGain = lastWeight - firstWeight;
                    gmd = totalWeightGain / daysDiff;
                }
            }
            
            boi.gmd = gmd;
            
            return boi;
        });
        
        res.json(result);
    });
});

// --- VACINAS (VACCINES) ---

// Get all vaccines with filters
app.get('/api/vacinas', (req, res) => {
    const { chip, brinco, vacina, data, boton } = req.query;
    
    let whereClauses = ['v.tenant_id = ?'];
    let params = [req.tenantId];
    
    if (boton) {
        whereClauses.push('b.name LIKE ?');
        params.push(`%${boton}%`);
    }
    if (chip) {
        whereClauses.push('v.chip LIKE ?');
        params.push(`%${chip}%`);
    }
    if (brinco) {
        whereClauses.push('v.brinco LIKE ?');
        params.push(`%${brinco}%`);
    }
    if (vacina) {
        whereClauses.push('v.vacina = ?');
        params.push(vacina);
    }
    if (data) {
        whereClauses.push('v.data_vacina = ?');
        params.push(data);
    }
    
    const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    
    const sql = `
        SELECT v.*, b.name as boton
        FROM vacinas v
        LEFT JOIN bois b ON v.boi_id = b.id
        ${whereClause}
        ORDER BY v.data_vacina DESC, v.id DESC
    `;
    
    db.all(sql, params, (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

// Create new vaccine record
app.post('/api/vacinas', (req, res) => {
    const { boi_id, chip, brinco, vacina, data_vacina } = req.body;
    
    const sql = `INSERT INTO vacinas (tenant_id, boi_id, chip, brinco, vacina, data_vacina)
                 VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(sql, [req.tenantId, boi_id, chip || null, brinco || null, vacina, data_vacina], function(err) {
        if (err) return sendError(res, err);
        res.json({ id: this.lastID });
    });
});

// Update vaccine record
app.put('/api/vacinas/:id', (req, res) => {
    const { boi_id, chip, brinco, vacina, data_vacina } = req.body;
    
    const sql = `UPDATE vacinas 
                 SET boi_id = ?, chip = ?, brinco = ?, vacina = ?, data_vacina = ?
                 WHERE id = ? AND tenant_id = ?`;

    db.run(sql, [boi_id, chip || null, brinco || null, vacina, data_vacina, req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

// Delete vaccine record
app.delete('/api/vacinas/:id', (req, res) => {
    db.run("DELETE FROM vacinas WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

// Get autocomplete data for filters
app.get('/api/vacinas/autocomplete', (req, res) => {
    const sql = `
        SELECT DISTINCT chip, brinco, vacina
        FROM vacinas
        WHERE tenant_id = ? AND (chip IS NOT NULL OR brinco IS NOT NULL OR vacina IS NOT NULL)
    `;

    db.all(sql, [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        
        const chipSet = new Set();
        const brincoSet = new Set();
        const vacinaSet = new Set();
        
        rows.forEach(row => {
            if (row.chip) chipSet.add(row.chip);
            if (row.brinco) brincoSet.add(row.brinco);
            if (row.vacina) vacinaSet.add(row.vacina);
        });
        
        res.json({
            chips: Array.from(chipSet).sort(),
            brincos: Array.from(brincoSet).sort(),
            vacinas: Array.from(vacinaSet).sort()
        });
    });
});

// Get pending vaccines for a specific animal (by BOTON)
app.get('/api/vacinas/pendentes/:boton', (req, res) => {
    const boton = req.params.boton;
    
    // List of all available vaccines
    const allVaccines = [
        'Antiaftosa',
        'B19',
        'BVD',
        'Doenças Respiratórias',
        'IBR',
        'Leptospirose',
        'Pneumonias',
        'Polivalente',
        'RB51',
        'Toxina Botulínica',
        'Vacina Antirrábica'
    ];
    
    // Get vaccines already applied to this animal
    const sql = `
        SELECT DISTINCT v.vacina
        FROM vacinas v
        JOIN bois b ON v.boi_id = b.id
        WHERE b.name = ? AND v.tenant_id = ? AND b.tenant_id = ?
    `;

    db.all(sql, [boton, req.tenantId, req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        
        const appliedVaccines = rows.map(row => row.vacina);
        const pendingVaccines = allVaccines.filter(v => !appliedVaccines.includes(v));
        
        res.json({
            boton: boton,
            applied: appliedVaccines,
            pending: pendingVaccines
        });
    });
});

// Get chart data (vaccines count by date)
app.get('/api/vacinas/chart', (req, res) => {
    const { chip, brinco, vacina, data, boton } = req.query;
    
    let whereClauses = ['v.tenant_id = ?'];
    let params = [req.tenantId];
    
    if (boton) {
        whereClauses.push('b.name LIKE ?');
        params.push(`%${boton}%`);
    }
    if (chip) {
        whereClauses.push('v.chip LIKE ?');
        params.push(`%${chip}%`);
    }
    if (brinco) {
        whereClauses.push('v.brinco LIKE ?');
        params.push(`%${brinco}%`);
    }
    if (vacina) {
        whereClauses.push('v.vacina = ?');
        params.push(vacina);
    }
    if (data) {
        whereClauses.push('v.data_vacina = ?');
        params.push(data);
    }
    
    const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    
    const sql = `
        SELECT data_vacina as date, COUNT(*) as count
        FROM vacinas v
        LEFT JOIN bois b ON v.boi_id = b.id
        ${whereClause}
        GROUP BY data_vacina
        ORDER BY data_vacina ASC
    `;
    
    db.all(sql, params, (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

// --- BAIXAS (CATTLE DISCHARGE) ---

// Get all baixas with filters
app.get('/api/baixas', (req, res) => {
    const { boton, brinco, status, data_baixa } = req.query;

    let whereClauses = ['baixas.tenant_id = ?'];
    let params = [req.tenantId];

    if (boton) {
        whereClauses.push('baixas.boton LIKE ?');
        params.push(`%${boton}%`);
    }
    if (brinco) {
        whereClauses.push('baixas.brinco LIKE ?');
        params.push(`%${brinco}%`);
    }
    if (status) {
        whereClauses.push('baixas.status = ?');
        params.push(status);
    }
    if (data_baixa) {
        whereClauses.push('baixas.data_baixa = ?');
        params.push(data_baixa);
    }
    
    const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    
    const sql = `
        SELECT baixas.*
        FROM baixas
        ${whereClause}
        ORDER BY baixas.data_baixa DESC, baixas.id DESC
    `;
    
    db.all(sql, params, (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

// Create new baixa record
app.post('/api/baixas', (req, res) => {
    const { boi_id, boton, brinco, ultimo_peso, data_baixa, status, observacao } = req.body;
    
    const sql = `INSERT INTO baixas (tenant_id, boi_id, boton, brinco, ultimo_peso, data_baixa, status, observacao)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [req.tenantId, boi_id, boton, brinco || null, ultimo_peso || null, data_baixa, status, observacao || null], function(err) {
        if (err) return sendError(res, err);
        
        const baixaId = this.lastID;
        
        // Update bois table to mark this animal as discharged
        const updateBoiSql = `UPDATE bois SET baixa_id = ?, baixa_status = ? WHERE id = ? AND tenant_id = ?`;
        db.run(updateBoiSql, [baixaId, status, boi_id, req.tenantId], (updateErr) => {
            if (updateErr) {
                console.error('Error updating boi status:', updateErr.message);
            }
            res.json({ id: baixaId });
        });
    });
});

// Update baixa record
app.put('/api/baixas/:id', (req, res) => {
    const { boi_id, boton, brinco, ultimo_peso, data_baixa, status, observacao } = req.body;

    db.get("SELECT boi_id FROM baixas WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], (e0, old) => {
        if (e0) return sendError(res, e0);
        if (!old) return res.status(404).json({ error: 'Registro não encontrado.' });

        const sql = `UPDATE baixas
                     SET boi_id = ?, boton = ?, brinco = ?, ultimo_peso = ?, data_baixa = ?, status = ?, observacao = ?
                     WHERE id = ? AND tenant_id = ?`;

        db.run(sql, [boi_id, boton, brinco || null, ultimo_peso || null, data_baixa, status, observacao || null, req.params.id, req.tenantId], function(err) {
            if (err) return sendError(res, err);
            const changes = this.changes;

            const finish = () => res.json({ changes });
            const syncNew = () => {
                db.run("UPDATE bois SET baixa_id = ?, baixa_status = ? WHERE id = ? AND tenant_id = ?", [req.params.id, status, boi_id, req.tenantId], (updateErr) => {
                    if (updateErr) console.error('Error synchronizing boi status on update:', updateErr.message);
                    finish();
                });
            };
            // Se a baixa foi movida para outro animal, libera o animal anterior
            if (String(old.boi_id) !== String(boi_id)) {
                db.run("UPDATE bois SET baixa_id = NULL, baixa_status = NULL WHERE id = ? AND tenant_id = ?", [old.boi_id, req.tenantId], (revErr) => {
                    if (revErr) console.error('Error reverting previous boi status:', revErr.message);
                    syncNew();
                });
            } else {
                syncNew();
            }
        });
    });
});

// Delete baixa record
app.delete('/api/baixas/:id', (req, res) => {
    // First get the boi_id before deleting
    db.get("SELECT boi_id FROM baixas WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], (err, row) => {
        if (err) return sendError(res, err);
        if (!row) return res.status(404).json({ error: "Record not found" });

        const boiId = row.boi_id;

        db.run("DELETE FROM baixas WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], function(err) {
            if (err) return sendError(res, err);
            
            // Revert boi status
            db.run("UPDATE bois SET baixa_id = NULL, baixa_status = NULL WHERE id = ? AND tenant_id = ?", [boiId, req.tenantId], (updateErr) => {
                if (updateErr) console.error('Error reverting boi status:', updateErr.message);
                res.json({ message: "Deleted successfully" });
            });
        });
    });
});

// Get autocomplete data for filters
app.get('/api/baixas/autocomplete', (req, res) => {
    const sql = `
        SELECT DISTINCT boton, brinco
        FROM baixas
        WHERE tenant_id = ? AND (boton IS NOT NULL OR brinco IS NOT NULL)
    `;

    db.all(sql, [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        
        const botonSet = new Set();
        const brincoSet = new Set();
        
        rows.forEach(row => {
            if (row.boton) botonSet.add(row.boton);
            if (row.brinco) brincoSet.add(row.brinco);
        });
        
        res.json({
            botons: Array.from(botonSet).sort(),
            brincos: Array.from(brincoSet).sort()
        });
    });
});

// Get chart data (count by status)
app.get('/api/baixas/chart', (req, res) => {
    const { boton, brinco, status, data_baixa } = req.query;

    let whereClauses = ['tenant_id = ?'];
    let params = [req.tenantId];

    if (boton) {
        whereClauses.push('boton LIKE ?');
        params.push(`%${boton}%`);
    }
    if (brinco) {
        whereClauses.push('brinco LIKE ?');
        params.push(`%${brinco}%`);
    }
    if (status) {
        whereClauses.push('status = ?');
        params.push(status);
    }
    if (data_baixa) {
        whereClauses.push('data_baixa = ?');
        params.push(data_baixa);
    }
    
    const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    
    const sql = `
        SELECT status, COUNT(*) as count
        FROM baixas
        ${whereClause}
        GROUP BY status
    `;
    
    db.all(sql, params, (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

// Get last weight for a specific animal (by BOTON or boi_id)
app.get('/api/baixas/last-weight/:boton', (req, res) => {
    const boton = req.params.boton;
    
    // First, get the boi_id from boton
    const boiSql = `SELECT id FROM bois WHERE name = ? AND tenant_id = ?`;

    db.get(boiSql, [boton, req.tenantId], (err, boi) => {
        if (err) return sendError(res, err);
        if (!boi) return res.json({ last_weight: null });
        
        // Get the most recent weight from manejo_pasto
        const weightSql = `
            SELECT 
                weight_10, date_weight_10,
                weight_09, date_weight_09,
                weight_08, date_weight_08,
                weight_07, date_weight_07,
                weight_06, date_weight_06,
                weight_05, date_weight_05,
                weight_04, date_weight_04,
                weight_03, date_weight_03,
                weight_02, date_weight_02,
                weight_01, date_weight_01,
                initial_weight_manejo
            FROM manejo_pasto
            WHERE boi_id = ? AND tenant_id = ?
            ORDER BY id DESC
            LIMIT 1
        `;

        db.get(weightSql, [boi.id, req.tenantId], (err, manejo) => {
            if (err) return sendError(res, err);
            
            let lastWeight = null;
            
            if (manejo) {
                // Check weights from 10 to 1 to find the last recorded weight
                for (let i = 10; i >= 1; i--) {
                    const num = i.toString().padStart(2, '0');
                    const weight = manejo[`weight_${num}`];
                    if (weight) {
                        lastWeight = weight;
                        break;
                    }
                }
                
                // If no weight found in slots, use initial weight
                if (!lastWeight && manejo.initial_weight_manejo) {
                    lastWeight = manejo.initial_weight_manejo;
                }
            }
            
            // If no manejo found, try to get initial weight from bois table
            if (!lastWeight) {
                db.get('SELECT initial_weight FROM bois WHERE id = ? AND tenant_id = ?', [boi.id, req.tenantId], (err, boiData) => {
                    if (err) return sendError(res, err);
                    res.json({ last_weight: boiData?.initial_weight || null });
                });
            } else {
                res.json({ last_weight: lastWeight });
            }
        });
    });
});

// --- DIETAS ---

app.get('/api/dietas', (req, res) => {
    const sql = `
        SELECT d.*, f.name as fazenda_name, p.name as pasto_name 
        FROM dietas d
        LEFT JOIN fazendas f ON d.fazenda_id = f.id
        LEFT JOIN pastos p ON d.pasto_id = p.id
        WHERE d.tenant_id = ?
        ORDER BY d.data DESC, d.id DESC
    `;
    db.all(sql, [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

app.post('/api/dietas', (req, res) => {
    const { fazenda_id, pasto_id, qtd_bois, data, dieta_tipo, qtd_kg } = req.body;
    
    // Convert qtd_bois to integer just in case
    const qtdAnimals = parseInt(qtd_bois) || 0;
    
    const sql = `INSERT INTO dietas (tenant_id, fazenda_id, pasto_id, qtd_bois, data, dieta_tipo, qtd_kg) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [req.tenantId, fazenda_id, pasto_id, qtdAnimals, data, dieta_tipo, qtd_kg], function(err) {
        if (err) return sendError(res, err);
        res.json({ id: this.lastID });
    });
});

app.delete('/api/dietas/:id', (req, res) => {
    db.run("DELETE FROM dietas WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

app.put('/api/dietas/:id', (req, res) => {
    const { fazenda_id, pasto_id, qtd_bois, data, dieta_tipo, qtd_kg } = req.body;
    
    // Convert qtd_bois to integer just in case
    const qtdAnimals = parseInt(qtd_bois) || 0;
    
    const sql = `UPDATE dietas SET fazenda_id = ?, pasto_id = ?, qtd_bois = ?, data = ?, dieta_tipo = ?, qtd_kg = ? WHERE id = ? AND tenant_id = ?`;

    db.run(sql, [fazenda_id, pasto_id, qtdAnimals, data, dieta_tipo, qtd_kg, req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

app.get('/api/pastos/:id/count', (req, res) => {
    const pastoId = req.params.id;
    
    // Strategy: Find the latest manejo record for every boi, and check if it matches this pasto.
    const sql = `
        SELECT COUNT(*) as count 
        FROM (
            SELECT boi_id
            FROM manejo_pasto m1
            WHERE id = (
                SELECT MAX(id)
                FROM manejo_pasto m2
                WHERE m2.boi_id = m1.boi_id AND m2.tenant_id = m1.tenant_id
            )
            AND pasto_id = ? AND tenant_id = ?
        ) AS ultimos
    `;

    db.get(sql, [pastoId, req.tenantId], (err, row) => {
        if (err) return sendError(res, err);
        res.json({ count: row ? row.count : 0 });
    });
});

app.get('/api/dashboard/dieta-consumption', (req, res) => {
    const { fazenda_id, pasto_id, period, start_date, end_date } = req.query;

    if (!pasto_id) {
        return res.status(400).json({ error: "Pasto ID mandatory" });
    }

    // Determine calculation dates and total days
    const now = new Date();
    // Normalize "now" to end of day? Or just use "now"? 
    // Usually for reports "period" implies inclusive range.
    // Let's set end date to "now" if not custom.
    
    let dbStartDate;
    let dbEndDate = new Date().toISOString().split('T')[0]; // Default end is today
    let daysInPeriod = 1;

    if (period === 'dia') {
        dbStartDate = dbEndDate;
        daysInPeriod = 1;
    } else if (period === 'semana') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        dbStartDate = d.toISOString().split('T')[0];
        daysInPeriod = 7;
    } else if (period === 'quinzenal') {
        const d = new Date();
        d.setDate(d.getDate() - 15);
        dbStartDate = d.toISOString().split('T')[0];
        daysInPeriod = 15;
    } else if (period === 'mensal') {
        // Look back 30 days for better average than just 'since 1st of month'
        const d = new Date();
        d.setDate(d.getDate() - 30); 
        dbStartDate = d.toISOString().split('T')[0];
        
        const start = new Date(dbStartDate);
        const end = new Date(dbEndDate);
        const diffTime = Math.abs(end - start);
        daysInPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
    } else if (period === 'custom') {
        if(!start_date || !end_date) {
             return res.status(400).json({ error: "Custom period requires start_date and end_date" });
        }
        dbStartDate = start_date;
        dbEndDate = end_date;
        
        const start = new Date(dbStartDate);
        const end = new Date(dbEndDate);
        const diffTime = Math.abs(end - start);
        daysInPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    } else {
        // Default Mensal
        const d = new Date();
        d.setDate(d.getDate() - 30);
        dbStartDate = d.toISOString().split('T')[0];
        const start = new Date(dbStartDate);
        const end = new Date(dbEndDate);
        daysInPeriod = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    if (daysInPeriod < 1) daysInPeriod = 1;

    // Query: Get Total Consumption in this range
    const dietSql = `
        SELECT SUM(qtd_kg) as "totalKg"
        FROM dietas 
        WHERE tenant_id = ? AND pasto_id = ? AND data >= ? AND data <= ?
    `;

    db.get(dietSql, [req.tenantId, pasto_id, dbStartDate, dbEndDate], (err, row) => {
        if (err) return sendError(res, err);
        
        const totalKg = row ? row.totalKg : 0;
        
        // Get Cattle Count for this pasture
        // We use the current live count of the pasture as the divisor.
        // It's an approximation if the herd changed size during the period, 
        // but robust enough for "Current Dashboard".
        const countSql = `
            SELECT COUNT(*) as count 
            FROM (
                SELECT boi_id
                FROM manejo_pasto m1
                WHERE id = (
                    SELECT MAX(id)
                    FROM manejo_pasto m2
                    WHERE m2.boi_id = m1.boi_id AND m2.tenant_id = m1.tenant_id
                )
                AND pasto_id = ? AND tenant_id = ?
            ) AS ultimos
        `;

        db.get(countSql, [pasto_id, req.tenantId], (err, cRow) => {
            if (err) return sendError(res, err);
            
            // "Quantidade de bois do pasto selecionado de acordo com a fazenda"
            // Note: Our query uses pasto_id, which is unique enough.
            
            const cattleCount = cRow ? cRow.count : 0;
            
            // Formula: Média Consumo Kg/Boi = ("Soma dos kilos de ração" / "Bois") / "Total de dias"
            let avgConsumption = 0;
            if (cattleCount > 0 && daysInPeriod > 0) {
                avgConsumption = (totalKg / cattleCount) / daysInPeriod;
            }
            
            res.json({
                period: period,
                days_considered: daysInPeriod,
                cattle_count: cattleCount,
                period_total: totalKg || 0,
                period_consumption: avgConsumption // This is Kg / Boi / Dia
            });
        });
    });
});

// --- PERSPECTIVA DE PESO ---

app.get('/api/bois/pasto/:pastoId', (req, res) => {
    const pastoId = req.params.pastoId;
    const sql = `
        SELECT b.id, b.name 
        FROM bois b
        WHERE b.id IN (
            SELECT m1.boi_id
            FROM manejo_pasto m1
            WHERE m1.id = (
                SELECT MAX(id)
                FROM manejo_pasto m2
                WHERE m2.boi_id = m1.boi_id AND m2.tenant_id = m1.tenant_id
            )
            AND m1.pasto_id = ? AND m1.tenant_id = ?
        )
        AND b.tenant_id = ?
        AND (b.baixa_id IS NULL) -- Only active animals
        ORDER BY b.name
    `;
    db.all(sql, [pastoId, req.tenantId, req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

app.get('/api/bois/:id/weight', (req, res) => {
    const boiId = req.params.id;
    // Get the most recent weight from manejo_pasto
    const weightSql = `
        SELECT 
            weight_10, date_weight_10,
            weight_09, date_weight_09,
            weight_08, date_weight_08,
            weight_07, date_weight_07,
            weight_06, date_weight_06,
            weight_05, date_weight_05,
            weight_04, date_weight_04,
            weight_03, date_weight_03,
            weight_02, date_weight_02,
            weight_01, date_weight_01,
            initial_weight_manejo
        FROM manejo_pasto
        WHERE boi_id = ? AND tenant_id = ?
        ORDER BY id DESC
        LIMIT 1
    `;

    db.get(weightSql, [boiId, req.tenantId], (err, manejo) => {
        if (err) return sendError(res, err);
        
        let lastWeight = null;
        let lastDate = null;
        
        if (manejo) {
            for (let i = 10; i >= 1; i--) {
                const num = i.toString().padStart(2, '0');
                const weight = manejo[`weight_${num}`];
                const date = manejo[`date_weight_${num}`];
                if (weight) {
                    lastWeight = weight;
                    lastDate = date;
                    break;
                }
            }
            if (!lastWeight && manejo.initial_weight_manejo) {
                lastWeight = manejo.initial_weight_manejo;
                // We don't have a specific date here easily, use "Unknown" or null
            }
        }
        
        // If still no weight, check bois table initial_weight
        if (!lastWeight) {
            db.get('SELECT initial_weight, arrival_date FROM bois WHERE id = ? AND tenant_id = ?', [boiId, req.tenantId], (err, boi) => {
                if (err) return sendError(res, err);
                res.json({ weight: boi?.initial_weight || 0, date: boi?.arrival_date || null });
            });
        } else {
            res.json({ weight: lastWeight, date: lastDate });
        }
    });
});

app.get('/api/perspectives', (req, res) => {
    const sql = `
        SELECT p.*, b.name as boi_name, f.name as fazenda_name, pas.name as pasto_name
        FROM perspectives p
        LEFT JOIN bois b ON p.boi_id = b.id
        LEFT JOIN fazendas f ON p.fazenda_id = f.id
        LEFT JOIN pastos pas ON p.pasto_id = pas.id
        WHERE p.tenant_id = ?
        ORDER BY p.created_at DESC
    `;
    db.all(sql, [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        res.json(rows);
    });
});

app.post('/api/perspectives', (req, res) => {
    const { boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight } = req.body;
    const sql = `INSERT INTO perspectives (tenant_id, boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [req.tenantId, boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight], function(err) {
        if (err) return sendError(res, err);
        res.json({ id: this.lastID });
    });
});

app.put('/api/perspectives/:id', (req, res) => {
    const { boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight } = req.body;
    const sql = `UPDATE perspectives 
                 SET boi_id = ?, fazenda_id = ?, pasto_id = ?, start_date = ?, days = ?, daily_rate = ?, initial_weight = ?, final_weight = ?
                 WHERE id = ? AND tenant_id = ?`;
    db.run(sql, [boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight, req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

app.delete('/api/perspectives/:id', (req, res) => {
    db.run("DELETE FROM perspectives WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId], function(err) {
        if (err) return sendError(res, err);
        res.json({ changes: this.changes });
    });
});

// --- GENEALOGIA ---

// Helper to build ancestor tree recursively
const buildAncestorTree = (boiId, depth, maxDepth, allBoisMap) => {
    if (depth > maxDepth) return null;
    const boi = allBoisMap.get(parseInt(boiId));
    if (!boi) return null;

    const node = {
        id: boi.id,
        name: boi.name,
        brinco: boi.brinco,
        sexo: boi.sexo,
        parents: {},
        generation: boi.geracao // If stored
    };

    if (boi.pai_id) {
        node.parents.father = buildAncestorTree(boi.pai_id, depth + 1, maxDepth, allBoisMap);
    }
    if (boi.mae_id) {
        node.parents.mother = buildAncestorTree(boi.mae_id, depth + 1, maxDepth, allBoisMap);
    }
    
    // Prune empty parents object
    if (!node.parents.father && !node.parents.mother) {
        delete node.parents;
    }

    return node;
};

// Flatten ancestors to a Set of IDs for consanguinity check
const getAncestorIds = (boiId, allBoisMap, visited = new Set()) => {
    const boi = allBoisMap.get(parseInt(boiId));
    if (!boi) return visited;

    for (const parentId of [boi.pai_id, boi.mae_id]) {
        if (!parentId) continue;
        const pid = parseInt(parentId);
        if (visited.has(pid)) continue; // guarda contra ciclos e reprocessamento
        visited.add(pid);
        getAncestorIds(pid, allBoisMap, visited);
    }
    return visited;
};

app.get('/api/genealogia/arvore/:id', (req, res) => {
    const rootId = parseInt(req.params.id);
    
    // Efficiency: Fetch all bois to build tree in memory (assuming manageable dataset size for this prototype)
    // For very large datasets, we would use Recursive CTEs in SQL.
    db.all("SELECT id, name, brinco, pai_id, mae_id, sexo, geracao FROM bois WHERE tenant_id = ?", [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        
        const boisMap = new Map();
        rows.forEach(r => boisMap.set(r.id, r));
        
        const tree = buildAncestorTree(rootId, 0, 4, boisMap); // 4 generations deep
        if (!tree) return res.status(404).json({ error: "Boi not found" });
        
        res.json(tree);
    });
});

app.get('/api/genealogia/consanguinidade', (req, res) => {
    const { pai_id, mae_id } = req.query;
    if (!pai_id || !mae_id) return res.status(400).json({ error: "pai_id and mae_id are required" });
    
    db.all("SELECT id, pai_id, mae_id FROM bois WHERE tenant_id = ?", [req.tenantId], (err, rows) => {
        if (err) return sendError(res, err);
        
        const boisMap = new Map();
        
        // Ensure IDs are integers for consistent map keys
        rows.forEach(r => boisMap.set(parseInt(r.id), r));
        
        // Inclui os próprios animais: pai x filha (ou mãe x filho) também é consanguíneo
        const ancestorsPai = getAncestorIds(parseInt(pai_id), boisMap, new Set());
        const ancestorsMae = getAncestorIds(parseInt(mae_id), boisMap, new Set());
        ancestorsPai.add(parseInt(pai_id));
        ancestorsMae.add(parseInt(mae_id));
        
        // Check intersection
        const commonAncestors = [];
        for (const ancestorId of ancestorsPai) {
            if (ancestorsMae.has(ancestorId)) {
                commonAncestors.push(ancestorId);
            }
        }
        
        res.json({
            consanguineo: commonAncestors.length > 0,
            ancestrais_comuns: commonAncestors
        });
    });
});

// /api inexistente: JSON em vez da página padrão do Express
app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// Handler global: erros lançados fora do sendError (JSON inválido, exceções em rotas async)
// nunca devolvem stack trace nem mensagens internas ao cliente, independentemente de NODE_ENV.
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    console.error('[ERRO]', err && err.message);
    if (err && (err.type === 'entity.parse.failed' || err.status === 400)) {
        return res.status(400).json({ error: 'Requisição inválida.' });
    }
    if (err && err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Requisição grande demais.' });
    }
    res.status(500).json({ error: 'Erro interno do servidor.' });
});

process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason && reason.message || reason));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

