#!/usr/bin/env node
// Cria uma empresa (tenant) e o seu primeiro usuário Admin.
//   node scripts/create-tenant.js "Fazenda Boa Vista" joao.admin "João Silva" "senha-forte-123"
// Opcional: --senha-via-env  (lê a senha de ADMIN_PASSWORD, para não ficar no histórico do shell)
//
// Gerenciar empresas é uma operação da plataforma (você, vendedor do sistema), por isso
// é feita por script/banco e NÃO por uma rota da API: nenhum perfil "Admin" de cliente
// consegue enxergar ou criar outras empresas.
//
// Suspender/reativar:  update tenants set active = false where id = 2;
const bcrypt = require('bcrypt');
const db = require('../database-pg');

const args = process.argv.slice(2).filter(a => a !== '--senha-via-env');
const useEnv = process.argv.includes('--senha-via-env');
const [company, username, adminName, passArg] = args;
const password = useEnv ? process.env.ADMIN_PASSWORD : passArg;

function die(msg) { console.error(msg); process.exit(1); }

if (!company || !username || !adminName || !password) {
    die('Uso: node scripts/create-tenant.js "<Empresa>" <usuario> "<Nome do Admin>" <senha>');
}
if (password.length < 8) die('A senha deve ter pelo menos 8 caracteres.');

(async () => {
    const client = await db.pool.connect();
    try {
        const hash = await bcrypt.hash(password, 10);
        await client.query('BEGIN');
        const t = await client.query('INSERT INTO tenants (name) VALUES ($1) RETURNING id', [company.trim()]);
        const tenantId = t.rows[0].id;
        await client.query(
            "INSERT INTO users (tenant_id, name, username, password, profile) VALUES ($1, $2, $3, $4, 'Admin')",
            [tenantId, adminName.trim(), username.trim(), hash]
        );
        await client.query('COMMIT');
        console.log(`Empresa "${company.trim()}" criada (id ${tenantId}). Admin: ${username.trim()}`);
    } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        die(e.code === '23505' ? 'Esse nome de usuário já existe (usuários são únicos em todo o sistema).' : 'Erro: ' + e.message);
    } finally {
        client.release();
        await db.close();
    }
})();
