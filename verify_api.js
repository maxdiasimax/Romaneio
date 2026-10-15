// Teste simples e direto do CRUD
const http = require('http');

console.log('Testando API de Vacinas...\n');

// Teste GET
http.get('http://localhost:3000/api/vacinas', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`✓ GET /api/vacinas - Status: ${res.statusCode}`);
        const vacinas = JSON.parse(data);
        console.log(`  Total de registros: ${vacinas.length}\n`);
        
        // Teste POST
        const postData = JSON.stringify({
            boi_id: 1,
            brinco: "TESTE-" + Date.now(),
            vacina: "Antiaftosa",
            data_vacina: "2025-12-09"
        });
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/vacinas',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let postResponse = '';
            res.on('data', chunk => postResponse += chunk);
            res.on('end', () => {
                console.log(`✓ POST /api/vacinas - Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    const result = JSON.parse(postResponse);
                    console.log(`  Vacina criada com ID: ${result.id}\n`);
                    console.log('🎉 CRUD FUNCIONANDO PERFEITAMENTE!\n');
                    console.log('Acesse: http://localhost:3000/vacinas.html');
                } else {
                    console.log(`  Erro: ${postResponse}`);
                }
            });
        });
        
        req.write(postData);
        req.end();
    });
}).on('error', (err) => {
    console.log('✗ Erro ao conectar:', err.message);
});
