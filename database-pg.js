require('dotenv').config();
const { Pool, types } = require('pg');

// --- Tipos: devolve valores como SQLite/MySQL devolviam (números JS e datas em string) ---
types.setTypeParser(20, (v) => Number(v));        // bigint (ids, COUNT)
types.setTypeParser(1700, (v) => parseFloat(v));  // numeric (pesos, valores, SUM)
types.setTypeParser(1082, (v) => v);              // date -> 'YYYY-MM-DD'
types.setTypeParser(1114, (v) => v.replace(' ', 'T')); // timestamp -> 'YYYY-MM-DDTHH:MM:SS'
types.setTypeParser(1184, (v) => new Date(v).toISOString()); // timestamptz

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres',
    // DB_SSL=false só para banco local de testes. Com DB_CA (certificado CA do Supabase, texto PEM) o
    // certificado do servidor é validado; sem DB_CA mantém-se a compatibilidade (TLS sem validação).
    ssl: process.env.DB_SSL === 'false' ? false
        : process.env.DB_CA ? { ca: process.env.DB_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true }
        : { rejectUnauthorized: false },
    max: 10
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
});

// Converte placeholders "?" (SQLite/MySQL) em $1, $2... (PostgreSQL), ignorando literais '...'
function convertPlaceholders(sql) {
    let out = '';
    let n = 0;
    let inString = false;
    for (let i = 0; i < sql.length; i++) {
        const ch = sql[i];
        if (ch === "'") inString = !inString;
        if (ch === '?' && !inString) out += '$' + (++n);
        else out += ch;
    }
    return out;
}

function prepare(sql, params) {
    let text = convertPlaceholders(sql);
    // LIKE no Postgres diferencia maiúsculas; SQLite/MySQL não.
    text = text.replace(/\bLIKE\b/gi, 'ILIKE');
    // '' / undefined viram NULL (SQLite/MySQL aceitavam em colunas numéricas/data).
    const values = (params || []).map((p) => (p === undefined || p === '' ? null : p));
    return { text, values };
}

// Adaptador que imita a API do sqlite3 (run/get/all/serialize) usada pelo server.js
class Database {
    constructor() {
        this.pool = pool;
        this.initDb();
    }

    run(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        let { text, values } = prepare(sql, params);
        const isInsert = /^\s*insert\b/i.test(text);
        if (isInsert && !/\breturning\b/i.test(text)) text += ' RETURNING id';

        this.pool.query(text, values, (err, result) => {
            const context = {};
            if (result) {
                context.changes = result.rowCount;
                if (isInsert && result.rows && result.rows[0]) context.lastID = result.rows[0].id;
            }
            if (callback) callback.call(context, err || null);
        });
    }

    get(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        const { text, values } = prepare(sql, params);
        this.pool.query(text, values, (err, result) => {
            if (err) return callback(err);
            callback(null, result.rows[0]);
        });
    }

    all(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        const { text, values } = prepare(sql, params);
        this.pool.query(text, values, (err, result) => {
            if (err) return callback(err);
            callback(null, result.rows);
        });
    }

    serialize(callback) {
        if (callback) callback();
    }

    close() {
        return this.pool.end();
    }

    initDb() {
        console.log('Connecting to PostgreSQL (Supabase)...');
        // As tabelas são criadas por supabase_schema.sql / migrations/. Aqui só testa a conexão.
        // Não há mais usuário admin padrão: crie empresas e administradores com
        //   node scripts/create-tenant.js "Nome da Empresa" usuario "Nome do Admin" senha
        this.get('SELECT COUNT(*) AS n FROM tenants', [], (err, row) => {
            if (err) {
                console.error('Error connecting to database (a migração multi-tenant foi aplicada?):', err.message);
                return;
            }
            console.log(`Connected to PostgreSQL. Empresas cadastradas: ${row.n}`);
        });
    }
}

module.exports = new Database();
