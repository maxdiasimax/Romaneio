const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'romaneio.db');
const db = new sqlite3.Database(dbPath);

console.log('Updating valor_por_kg for existing records...\n');

// Get all bois records
db.all("SELECT * FROM bois", [], (err, rows) => {
    if (err) {
        console.error('Error:', err.message);
        db.close();
        return;
    }
    
    console.log(`Found ${rows.length} bovine records\n`);
    
    let updated = 0;
    let processed = 0;
    
    rows.forEach((row, index) => {
        const { id, initial_weight, valor_boi, valor_comissao, valor_frete } = row;
        
        // Calculate valor_por_kg if we have the necessary data
        let valor_por_kg = null;
        if (initial_weight && initial_weight > 0) {
            const totalValue = (parseFloat(valor_boi) || 0) + (parseFloat(valor_comissao) || 0) + (parseFloat(valor_frete) || 0);
            if (totalValue > 0) {
                valor_por_kg = totalValue / parseFloat(initial_weight);
            }
        }
        
        // Update the record
        db.run(
            "UPDATE bois SET valor_por_kg = ? WHERE id = ?",
            [valor_por_kg, id],
            function(err) {
                processed++;
                
                if (err) {
                    console.error(`Error updating record ${id}:`, err.message);
                } else if (valor_por_kg !== null) {
                    updated++;
                    console.log(`✓ Updated record ${id} (${row.name}): R$ ${valor_por_kg.toFixed(2)}/kg`);
                } else {
                    console.log(`- Skipped record ${id} (${row.name}): No valor data available`);
                }
                
                // Close database when all records are processed
                if (processed === rows.length) {
                    console.log(`\n\nSummary: Updated ${updated} out of ${rows.length} records`);
                    db.close();
                }
            }
        );
    });
    
    if (rows.length === 0) {
        console.log('No records to update');
        db.close();
    }
});
