const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check authentication (Simplified for prototype, ideally use JWT or Sessions)
// For this task, we'll verify password on login and frontend can store a flag/token.
// For a real app, use express-session or jsonwebtoken.
// We will focus on the API logic first.

// --- AUTH ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: "User not found" });

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(401).json({ error: "Invalid password" });

        res.json({ message: "Login successful", user: { id: user.id, name: user.name, profile: user.profile } });
    });
});

app.post('/api/register', (req, res) => {
    const { name, username, password, profile, celular } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    db.run("INSERT INTO users (name, username, password, profile, celular) VALUES (?, ?, ?, ?, ?)",
        [name, username, hash, profile, celular || null],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: "User registered successfully" });
        }
    );
});

// --- USERS MANAGEMENT ---

app.get('/api/users', (req, res) => {
    db.all("SELECT id, name, username, celular, profile FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/users', (req, res) => {
    const { name, username, password, celular, profile } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    db.run("INSERT INTO users (name, username, password, celular, profile) VALUES (?, ?, ?, ?, ?)",
        [name, username, hash, celular || null, profile],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/users/:id', (req, res) => {
    const { name, username, password, celular, profile } = req.body;
    
    // If password is provided, hash it; otherwise, keep the existing password
    if (password && password.trim() !== '') {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        db.run("UPDATE users SET name = ?, username = ?, password = ?, celular = ?, profile = ? WHERE id = ?",
            [name, username, hash, celular || null, profile, req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ changes: this.changes });
            }
        );
    } else {
        db.run("UPDATE users SET name = ?, username = ?, celular = ?, profile = ? WHERE id = ?",
            [name, username, celular || null, profile, req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ changes: this.changes });
            }
        );
    }
});

app.delete('/api/users/:id', (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

// --- FAZENDAS ---

app.get('/api/fazendas', (req, res) => {
    db.all("SELECT * FROM fazendas", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/fazendas', (req, res) => {
    const { name, address } = req.body;
    db.run("INSERT INTO fazendas (name, address) VALUES (?, ?)", [name, address], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.put('/api/fazendas/:id', (req, res) => {
    const { name, address } = req.body;
    db.run("UPDATE fazendas SET name = ?, address = ? WHERE id = ?", [name, address, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

app.delete('/api/fazendas/:id', (req, res) => {
    db.run("DELETE FROM fazendas WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

// --- PASTOS ---

app.get('/api/pastos', (req, res) => {
    const sql = `SELECT p.*, f.name as fazenda_name FROM pastos p LEFT JOIN fazendas f ON p.fazenda_id = f.id ORDER BY p.id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/pastos/fazenda/:id', (req, res) => {
    db.all("SELECT * FROM pastos WHERE fazenda_id = ?", [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/pastos', (req, res) => {
    const { name, fazenda_id } = req.body;
    db.run("INSERT INTO pastos (name, fazenda_id) VALUES (?, ?)", [name, fazenda_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.put('/api/pastos/:id', (req, res) => {
    const { name, fazenda_id } = req.body;
    db.run("UPDATE pastos SET name = ?, fazenda_id = ? WHERE id = ?", [name, fazenda_id, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

app.delete('/api/pastos/:id', (req, res) => {
    console.log(`Deleting pasto ${req.params.id}`);
    db.run("DELETE FROM pastos WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Pasto not found" });
        res.json({ changes: this.changes });
    });
});

// --- BOIS ---

app.get('/api/bois', (req, res) => {
    db.all("SELECT * FROM bois ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/bois', (req, res) => {
    const { name, initial_weight, arrival_date, brinco, vendedor, local_compra, valor_boi, valor_comissao, valor_frete, raca } = req.body;
    
    // Calculate valor_por_kg: (valor_boi + valor_comissao + valor_frete) / initial_weight
    let valor_por_kg = null;
    if (initial_weight && initial_weight > 0) {
        const totalValue = (parseFloat(valor_boi) || 0) + (parseFloat(valor_comissao) || 0) + (parseFloat(valor_frete) || 0);
        valor_por_kg = totalValue / parseFloat(initial_weight);
    }
    
    db.run("INSERT INTO bois (name, initial_weight, arrival_date, brinco, vendedor, local_compra, valor_boi, valor_comissao, valor_frete, valor_por_kg, raca) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
        [name, initial_weight, arrival_date, brinco || null, vendedor || null, local_compra || null, valor_boi || null, valor_comissao || null, valor_frete || null, valor_por_kg, raca || null], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/bois/:id', (req, res) => {
    const { name, initial_weight, arrival_date, brinco, vendedor, local_compra, valor_boi, valor_comissao, valor_frete, raca } = req.body;
    
    // Calculate valor_por_kg: (valor_boi + valor_comissao + valor_frete) / initial_weight
    let valor_por_kg = null;
    if (initial_weight && initial_weight > 0) {
        const totalValue = (parseFloat(valor_boi) || 0) + (parseFloat(valor_comissao) || 0) + (parseFloat(valor_frete) || 0);
        valor_por_kg = totalValue / parseFloat(initial_weight);
    }
    
    db.run("UPDATE bois SET name = ?, initial_weight = ?, arrival_date = ?, brinco = ?, vendedor = ?, local_compra = ?, valor_boi = ?, valor_comissao = ?, valor_frete = ?, valor_por_kg = ?, raca = ? WHERE id = ?", 
        [name, initial_weight, arrival_date, brinco || null, vendedor || null, local_compra || null, valor_boi || null, valor_comissao || null, valor_frete || null, valor_por_kg, raca || null, req.params.id], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ changes: this.changes });
        }
    );
});

app.delete('/api/bois/:id', (req, res) => {
    db.run("DELETE FROM bois WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

app.get('/api/bois/:id/last-manejo', (req, res) => {
    const sql = `
        SELECT fazenda_id, pasto_id, initial_weight_manejo 
        FROM manejo_pasto 
        WHERE boi_id = ? 
        ORDER BY id DESC LIMIT 1
    `;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
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
        WHERE 1=1
    `;
    
    const params = [];

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
        if (err) return res.status(500).json({ error: err.message });
        
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
                WHERE 1=1
            `;
            const countParams = [];
            if (boi_name) { countSql += ` AND b.name LIKE ?`; countParams.push(`%${boi_name}%`); }
            if (fazenda_id) { countSql += ` AND m.fazenda_id = ?`; countParams.push(fazenda_id); }
            if (pasto_id) { countSql += ` AND m.pasto_id = ?`; countParams.push(pasto_id); }

            db.get(countSql, countParams, (err, countRow) => {
                if (err) return res.status(500).json({ error: err.message });
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
        WHERE boi_id = ? AND fazenda_id = ? AND pasto_id = ?
        ORDER BY id DESC LIMIT 1
    `;
    
    db.get(sql, [boi_id, fazenda_id, pasto_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.json(null); // No history found
        res.json(row);
    });
});

app.get('/api/manejo/bois-distinct', (req, res) => {
    const sql = `
        SELECT id, name, baixa_status
        FROM bois
        ORDER BY name
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/manejo/:id', (req, res) => {
    const sql = `SELECT * FROM manejo_pasto WHERE id = ?`;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Manejo not found" });
        res.json(row);
    });
});

app.post('/api/manejo', (req, res) => {
    const { boi_id, pasto_id, fazenda_id, initial_weight_manejo, weights } = req.body;
    
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
        req.body.weights_count || 0
    ];

    const sql = `INSERT INTO manejo_pasto (
        boi_id, pasto_id, fazenda_id, initial_weight_manejo,
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
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
        req.params.id
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
        WHERE id = ?`;

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

app.delete('/api/manejo/:id', (req, res) => {
    db.run("DELETE FROM manejo_pasto WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});



app.get('/api/manejo/history-all/:id', (req, res) => {
    const sql = `
        SELECT m.*, f.name as fazenda_name, p.name as pasto_name, b.baixa_status,
               b.initial_weight as boi_initial_weight, b.arrival_date as boi_arrival_date,
               b.local_compra, b.vendedor
        FROM bois b
        LEFT JOIN manejo_pasto m ON m.boi_id = b.id
        LEFT JOIN fazendas f ON m.fazenda_id = f.id
        LEFT JOIN pastos p ON m.pasto_id = p.id
        WHERE b.id = ?
        ORDER BY m.id ASC
    `;
    
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
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
            db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
                if(err) reject(err); else resolve(row.count);
            });
        });

        const totalBois = await getCount('bois');
        const totalFazendas = await getCount('fazendas');
        const totalPastos = await getCount('pastos');

        res.json({ totalBois, totalFazendas, totalPastos });
    } catch(err) {
        res.status(500).json({ error: err.message });
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
        GROUP BY f.id
    `;
    db.all(sql, [], (err, rows) => {
        if(err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/dashboard/report/bois-pasto', (req, res) => {
    const sql = `
        SELECT p.name as pasto, COUNT(DISTINCT m.boi_id) as qtd_bois
        FROM manejo_pasto m
        JOIN pastos p ON m.pasto_id = p.id
        GROUP BY p.id
    `;
    db.all(sql, [], (err, rows) => {
        if(err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/dashboard/financial', async (req, res) => {
    try {
        const sql = `
            SELECT 
                COUNT(*) as activeCattleCount,
                SUM(valor_boi) as totalBoi,
                SUM(valor_comissao) as totalComissao,
                SUM(valor_frete) as totalFrete
            FROM bois
            WHERE baixa_id IS NULL
        `;
        
        db.get(sql, [], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const totalInvested = (row.totalBoi || 0) + (row.totalComissao || 0) + (row.totalFrete || 0);
            const avgCost = row.activeCattleCount > 0 ? totalInvested / row.activeCattleCount : 0;
            
            res.json({
                totalInvested: totalInvested,
                avgCost: avgCost,
                activeCount: row.activeCattleCount
            });
        });
    } catch(err) {
        res.status(500).json({ error: err.message });
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
        WHERE b.baixa_id IS NULL
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

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
        GROUP BY status
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
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
        WHERE name IS NOT NULL OR brinco IS NOT NULL OR vendedor IS NOT NULL OR local_compra IS NOT NULL
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
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
    
    // Build WHERE clause based on filters
    let whereClauses = [];
    let params = [];
    
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
        LEFT JOIN manejo_pasto m ON b.id = m.boi_id
        LEFT JOIN fazendas f ON m.fazenda_id = f.id
        LEFT JOIN pastos p ON m.pasto_id = p.id
        ${whereClause}
        ORDER BY b.id, m.id
    `;
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
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
    
    let whereClauses = [];
    let params = [];
    
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
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create new vaccine record
app.post('/api/vacinas', (req, res) => {
    const { boi_id, chip, brinco, vacina, data_vacina } = req.body;
    
    const sql = `INSERT INTO vacinas (boi_id, chip, brinco, vacina, data_vacina) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [boi_id, chip || null, brinco || null, vacina, data_vacina], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Update vaccine record
app.put('/api/vacinas/:id', (req, res) => {
    const { boi_id, chip, brinco, vacina, data_vacina } = req.body;
    
    const sql = `UPDATE vacinas 
                 SET boi_id = ?, chip = ?, brinco = ?, vacina = ?, data_vacina = ?
                 WHERE id = ?`;
    
    db.run(sql, [boi_id, chip || null, brinco || null, vacina, data_vacina, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

// Delete vaccine record
app.delete('/api/vacinas/:id', (req, res) => {
    db.run("DELETE FROM vacinas WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

// Get autocomplete data for filters
app.get('/api/vacinas/autocomplete', (req, res) => {
    const sql = `
        SELECT DISTINCT chip, brinco, vacina
        FROM vacinas
        WHERE chip IS NOT NULL OR brinco IS NOT NULL OR vacina IS NOT NULL
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
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
        WHERE b.name = ?
    `;
    
    db.all(sql, [boton], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
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
    
    let whereClauses = [];
    let params = [];
    
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
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- BAIXAS (CATTLE DISCHARGE) ---

// Get all baixas with filters
app.get('/api/baixas', (req, res) => {
    const { boton, brinco, status, data_baixa } = req.query;
    
    let whereClauses = [];
    let params = [];
    
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
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create new baixa record
app.post('/api/baixas', (req, res) => {
    const { boi_id, boton, brinco, ultimo_peso, data_baixa, status, observacao } = req.body;
    
    const sql = `INSERT INTO baixas (boi_id, boton, brinco, ultimo_peso, data_baixa, status, observacao) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [boi_id, boton, brinco || null, ultimo_peso || null, data_baixa, status, observacao || null], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const baixaId = this.lastID;
        
        // Update bois table to mark this animal as discharged
        const updateBoiSql = `UPDATE bois SET baixa_id = ?, baixa_status = ? WHERE id = ?`;
        db.run(updateBoiSql, [baixaId, status, boi_id], (updateErr) => {
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
    
    const sql = `UPDATE baixas 
                 SET boi_id = ?, boton = ?, brinco = ?, ultimo_peso = ?, data_baixa = ?, status = ?, observacao = ?
                 WHERE id = ?`;
    
    db.run(sql, [boi_id, boton, brinco || null, ultimo_peso || null, data_baixa, status, observacao || null, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Also update the bois status in case it changed
        const updateBoiSql = `UPDATE bois SET baixa_status = ? WHERE id = ?`;
        db.run(updateBoiSql, [status, boi_id], (updateErr) => {
             if (updateErr) console.error('Error synchronizing boi status on update:', updateErr.message);
             res.json({ changes: this.changes });
        });
    });
});

// Delete baixa record
app.delete('/api/baixas/:id', (req, res) => {
    // First get the boi_id before deleting
    db.get("SELECT boi_id FROM baixas WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Record not found" });

        const boiId = row.boi_id;

        db.run("DELETE FROM baixas WHERE id = ?", [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Revert boi status
            db.run("UPDATE bois SET baixa_id = NULL, baixa_status = NULL WHERE id = ?", [boiId], (updateErr) => {
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
        WHERE boton IS NOT NULL OR brinco IS NOT NULL
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
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
    
    let whereClauses = [];
    let params = [];
    
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
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get last weight for a specific animal (by BOTON or boi_id)
app.get('/api/baixas/last-weight/:boton', (req, res) => {
    const boton = req.params.boton;
    
    // First, get the boi_id from boton
    const boiSql = `SELECT id FROM bois WHERE name = ?`;
    
    db.get(boiSql, [boton], (err, boi) => {
        if (err) return res.status(500).json({ error: err.message });
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
            WHERE boi_id = ?
            ORDER BY id DESC
            LIMIT 1
        `;
        
        db.get(weightSql, [boi.id], (err, manejo) => {
            if (err) return res.status(500).json({ error: err.message });
            
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
                db.get('SELECT initial_weight FROM bois WHERE id = ?', [boi.id], (err, boiData) => {
                    if (err) return res.status(500).json({ error: err.message });
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
        ORDER BY d.data DESC, d.id DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/dietas', (req, res) => {
    const { fazenda_id, pasto_id, qtd_bois, data, dieta_tipo, qtd_kg } = req.body;
    
    // Convert qtd_bois to integer just in case
    const qtdAnimals = parseInt(qtd_bois) || 0;
    
    const sql = `INSERT INTO dietas (fazenda_id, pasto_id, qtd_bois, data, dieta_tipo, qtd_kg) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [fazenda_id, pasto_id, qtdAnimals, data, dieta_tipo, qtd_kg], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.delete('/api/dietas/:id', (req, res) => {
    db.run("DELETE FROM dietas WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

app.put('/api/dietas/:id', (req, res) => {
    const { fazenda_id, pasto_id, qtd_bois, data, dieta_tipo, qtd_kg } = req.body;
    
    // Convert qtd_bois to integer just in case
    const qtdAnimals = parseInt(qtd_bois) || 0;
    
    const sql = `UPDATE dietas SET fazenda_id = ?, pasto_id = ?, qtd_bois = ?, data = ?, dieta_tipo = ?, qtd_kg = ? WHERE id = ?`;
    
    db.run(sql, [fazenda_id, pasto_id, qtdAnimals, data, dieta_tipo, qtd_kg, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
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
                WHERE m2.boi_id = m1.boi_id
            )
            AND pasto_id = ?
        )
    `;
    
    db.get(sql, [pastoId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
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
        SELECT SUM(qtd_kg) as totalKg
        FROM dietas 
        WHERE pasto_id = ? AND data >= ? AND data <= ?
    `;

    db.get(dietSql, [pasto_id, dbStartDate, dbEndDate], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
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
                    WHERE m2.boi_id = m1.boi_id
                )
                AND pasto_id = ?
            )
        `;
        
        db.get(countSql, [pasto_id], (err, cRow) => {
            if (err) return res.status(500).json({ error: err.message });
            
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
                WHERE m2.boi_id = m1.boi_id
            )
            AND m1.pasto_id = ?
        )
        AND (b.baixa_id IS NULL) -- Only active animals
        ORDER BY b.name
    `;
    db.all(sql, [pastoId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
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
        WHERE boi_id = ?
        ORDER BY id DESC
        LIMIT 1
    `;
    
    db.get(weightSql, [boiId], (err, manejo) => {
        if (err) return res.status(500).json({ error: err.message });
        
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
            db.get('SELECT initial_weight, arrival_date FROM bois WHERE id = ?', [boiId], (err, boi) => {
                if (err) return res.status(500).json({ error: err.message });
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
        ORDER BY p.created_at DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/perspectives', (req, res) => {
    const { boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight } = req.body;
    const sql = `INSERT INTO perspectives (boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.put('/api/perspectives/:id', (req, res) => {
    const { boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight } = req.body;
    const sql = `UPDATE perspectives 
                 SET boi_id = ?, fazenda_id = ?, pasto_id = ?, start_date = ?, days = ?, daily_rate = ?, initial_weight = ?, final_weight = ?
                 WHERE id = ?`;
    db.run(sql, [boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

app.delete('/api/perspectives/:id', (req, res) => {
    db.run("DELETE FROM perspectives WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

