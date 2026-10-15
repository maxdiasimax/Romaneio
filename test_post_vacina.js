// Script para testar POST de vacina
const http = require('http');

const testData = {
    boi_id: 1,
    chip: null,
    brinco: "001",
    vacina: "Antiaftosa",
    data_vacina: "2025-12-09"
};

const postData = JSON.stringify(testData);

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

console.log('Testando POST /api/vacinas...');
console.log('Dados:', testData);
console.log('');

const req = http.request(options, (res) => {
    let data = '';
    
    console.log(`Status: ${res.statusCode}`);
    console.log('Headers:', res.headers);
    console.log('');
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Resposta:', data);
        
        if (res.statusCode === 200) {
            console.log('\n✓ Vacina cadastrada com sucesso!');
            
            // Testar GET para verificar se foi salvo
            setTimeout(() => {
                http.get('http://localhost:3000/api/vacinas', (getRes) => {
                    let getData = '';
                    getRes.on('data', chunk => getData += chunk);
                    getRes.on('end', () => {
                        console.log('\nVerificando registros salvos:');
                        const vacinas = JSON.parse(getData);
                        console.log(`Total de vacinas: ${vacinas.length}`);
                        if (vacinas.length > 0) {
                            console.log('Última vacina:', vacinas[0]);
                        }
                    });
                });
            }, 500);
        } else {
            console.log('\n✗ Erro ao cadastrar vacina');
        }
    });
});

req.on('error', (e) => {
    console.error(`✗ Erro na requisição: ${e.message}`);
});

req.write(postData);
req.end();
