const db = require('./database');

// Wait for DB (simple timeout)
setTimeout(() => {
    console.log("Seeding Genealogy Data...");
    
    db.serialize(() => {
        // Create Grandparents
        db.run(`INSERT INTO bois (name, initial_weight, sexo, geracao) VALUES 
            ('Rei (Avô P)', 800, 'M', 1),
            ('Rainha (Avó P)', 600, 'F', 1),
            ('Duque (Avô M)', 850, 'M', 1),
            ('Duquesa (Avó M)', 650, 'F', 1)
        `);

        // Create Parents (linked to GPs)
        // We need IDs, so we'll do this in callbacks or assume IDs if table was empty, but it's not.
        // Let's use nested lookups or a more complex script.
        // For simplicity in this environment, I'll fetch them by name.
        
        db.all("SELECT id, name FROM bois WHERE name IN ('Rei (Avô P)', 'Rainha (Avó P)', 'Duque (Avô M)', 'Duquesa (Avó M)')", (err, rows) => {
            if(err) { console.error(err); return; }
            
            const map = {};
            rows.forEach(r => map[r.name] = r.id);
            
            if(!map['Rei (Avô P)']) return console.log("Failed to insert GPs");

            // Insert Parents
            const paiStmt = db.prepare("INSERT INTO bois (name, initial_weight, sexo, pai_id, mae_id, geracao) VALUES (?, ?, ?, ?, ?, ?)");
            paiStmt.run('Príncipe (Pai)', 700, 'M', map['Rei (Avô P)'], map['Rainha (Avó P)'], 2);
            paiStmt.run('Princesa (Mãe)', 550, 'F', map['Duque (Avô M)'], map['Duquesa (Avó M)'], 2);
            paiStmt.finalize(() => {
                 // Insert Child
                 db.all("SELECT id, name FROM bois WHERE name IN ('Príncipe (Pai)', 'Princesa (Mãe)')", (err, rows2) => {
                     const map2 = {};
                     rows2.forEach(r => map2[r.name] = r.id);
                     
                     db.run("INSERT INTO bois (name, initial_weight, sexo, pai_id, mae_id, geracao) VALUES (?, ?, ?, ?, ?, ?)", 
                        ['Herdeiro (Filho)', 200, 'M', map2['Príncipe (Pai)'], map2['Princesa (Mãe)'], 3],
                        (err) => {
                            if(err) console.error(err);
                            else console.log("Genealogy Tree Created: Herdeiro -> Pais -> Avós");
                        }
                     );
                     
                     // Insert Consanguinity Case
                     // Create a child of siblings (Incesto)
                     // Sibling 1 (M) from Prince/Princess
                     // Sibling 2 (F) from Prince/Princess
                     
                     db.run("INSERT INTO bois (name, sexo, pai_id, mae_id) VALUES ('Irmão', 'M', ?, ?)", [map2['Príncipe (Pai)'], map2['Princesa (Mãe)']]);
                     db.run("INSERT INTO bois (name, sexo, pai_id, mae_id) VALUES ('Irmã', 'F', ?, ?)", [map2['Príncipe (Pai)'], map2['Princesa (Mãe)']]);
                     
                     console.log("Consanguinity test candidates created: 'Irmão' and 'Irmã'");
                 });
            });
        });
    });
}, 1000);
