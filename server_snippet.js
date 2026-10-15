
// --- PERSPECTIVES (WEIGHT PROJECTION) ---

// Get cattle in a specific pasture
app.get('/api/bois/pasto/:pasto_id', (req, res) => {
    const pastoId = req.params.pasto_id;
    // Strategy: Get bois where the LATEST handling record is in this pasture
    const sql = `
        SELECT b.id, b.name, b.brinco 
        FROM bois b
        JOIN (
            SELECT boi_id, pasto_id
            FROM manejo_pasto m1
            WHERE id = (
                SELECT MAX(id) 
                FROM manejo_pasto m2 
                WHERE m2.boi_id = m1.boi_id
            )
        ) current_loc ON b.id = current_loc.boi_id
        WHERE current_loc.pasto_id = ?
        ORDER BY b.name
    `;
    
    db.all(sql, [pastoId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Save a perspective calculation
app.post('/api/perspectives', (req, res) => {
    const { boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight } = req.body;
    
    const sql = `
        INSERT INTO perspectives 
        (boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [boi_id, fazenda_id, pasto_id, start_date, days, daily_rate, initial_weight, final_weight], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Get saved perspectives
app.get('/api/perspectives', (req, res) => {
    const sql = `
        SELECT p.*, b.name as boi_name, f.name as fazenda_name, pa.name as pasto_name
        FROM perspectives p
        LEFT JOIN bois b ON p.boi_id = b.id
        LEFT JOIN fazendas f ON p.fazenda_id = f.id
        LEFT JOIN pastos pa ON p.pasto_id = pa.id
        ORDER BY p.created_at DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Delete perspective
app.delete('/api/perspectives/:id', (req, res) => {
    db.run("DELETE FROM perspectives WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});
