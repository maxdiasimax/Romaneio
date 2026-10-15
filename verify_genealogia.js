const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function verify() {
    try {
        console.log("Verifying Genealogy Implementation...");
        
        // 1. Find 'Herdeiro (Filho)'
        const bois = await get('http://localhost:3000/api/bois');
        const herdeiro = bois.find(b => b.name === 'Herdeiro (Filho)');
        
        if (!herdeiro) throw new Error("Herdeiro not found. Seeding failed?");
        console.log(`[PASS] Herdeiro found (ID: ${herdeiro.id})`);
        
        // 2. Fetch Tree
        const tree = await get(`http://localhost:3000/api/genealogia/arvore/${herdeiro.id}`);
        
        if (tree.name !== 'Herdeiro (Filho)') throw new Error("Tree root mismatch");
        if (!tree.parents || !tree.parents.father || !tree.parents.mother) throw new Error("Missing parents in tree");
        if (tree.parents.father.name !== 'Príncipe (Pai)') throw new Error("Father mismatch");
        if (tree.parents.father.parents.father.name !== 'Rei (Avô P)') throw new Error("Grandfather mismatch");
        console.log("[PASS] Tree structure verified (3 generations)");
        
        // 3. Check Consanguinity (Siblings)
        const irmao = bois.find(b => b.name === 'Irmão');
        const irma = bois.find(b => b.name === 'Irmã');
        
        if (irmao && irma) {
            const check = await get(`http://localhost:3000/api/genealogia/consanguinidade?pai_id=${irmao.id}&mae_id=${irma.id}`);
            if (!check.consanguineo) throw new Error("Consanguinity NOT detected for siblings!");
            console.log(`[PASS] Consanguinity detected: ${check.consanguineo}, Common Ancestors: ${check.ancestrais_comuns.length}`);
        } else {
            console.warn("[WARN] Siblings for consanguinity test not found.");
        }
        
    } catch (e) {
        console.error("[FAIL]", e.message);
        process.exit(1);
    }
}

verify();
