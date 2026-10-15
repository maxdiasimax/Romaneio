// Script completo de teste CRUD para Vacinas
const http = require('http');

let createdVacinaId = null;

// Função auxiliar para fazer requisições HTTP
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: responseData
                });
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Teste 1: CREATE (POST)
async function testCreate() {
    console.log('\n=== TESTE 1: CREATE (POST) ===');
    const testData = {
        boi_id: 1,
        chip: null,
        brinco: "TEST001",
        vacina: "Antiaftosa",
        data_vacina: "2025-12-09"
    };

    try {
        const response = await makeRequest('POST', '/api/vacinas', testData);
        console.log(`Status: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            const result = JSON.parse(response.data);
            createdVacinaId = result.id;
            console.log('✓ CREATE bem-sucedido!');
            console.log(`  ID criado: ${createdVacinaId}`);
            return true;
        } else {
            console.log('✗ CREATE falhou!');
            console.log(`  Resposta: ${response.data}`);
            return false;
        }
    } catch (err) {
        console.log('✗ Erro:', err.message);
        return false;
    }
}

// Teste 2: READ (GET)
async function testRead() {
    console.log('\n=== TESTE 2: READ (GET) ===');
    
    try {
        const response = await makeRequest('GET', '/api/vacinas');
        console.log(`Status: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            const vacinas = JSON.parse(response.data);
            console.log('✓ READ bem-sucedido!');
            console.log(`  Total de registros: ${vacinas.length}`);
            if (vacinas.length > 0) {
                console.log(`  Último registro: ID ${vacinas[0].id} - ${vacinas[0].vacina}`);
            }
            return true;
        } else {
            console.log('✗ READ falhou!');
            return false;
        }
    } catch (err) {
        console.log('✗ Erro:', err.message);
        return false;
    }
}

// Teste 3: UPDATE (PUT)
async function testUpdate() {
    console.log('\n=== TESTE 3: UPDATE (PUT) ===');
    
    if (!createdVacinaId) {
        console.log('✗ Não há ID para atualizar (CREATE falhou)');
        return false;
    }

    const updateData = {
        boi_id: 1,
        chip: null,
        brinco: "TEST001-UPDATED",
        vacina: "B19",
        data_vacina: "2025-12-10"
    };

    try {
        const response = await makeRequest('PUT', `/api/vacinas/${createdVacinaId}`, updateData);
        console.log(`Status: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            console.log('✓ UPDATE bem-sucedido!');
            console.log(`  Registro ${createdVacinaId} atualizado`);
            return true;
        } else {
            console.log('✗ UPDATE falhou!');
            return false;
        }
    } catch (err) {
        console.log('✗ Erro:', err.message);
        return false;
    }
}

// Teste 4: DELETE
async function testDelete() {
    console.log('\n=== TESTE 4: DELETE ===');
    
    if (!createdVacinaId) {
        console.log('✗ Não há ID para deletar (CREATE falhou)');
        return false;
    }

    try {
        const response = await makeRequest('DELETE', `/api/vacinas/${createdVacinaId}`);
        console.log(`Status: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            console.log('✓ DELETE bem-sucedido!');
            console.log(`  Registro ${createdVacinaId} deletado`);
            return true;
        } else {
            console.log('✗ DELETE falhou!');
            return false;
        }
    } catch (err) {
        console.log('✗ Erro:', err.message);
        return false;
    }
}

// Teste 5: Autocomplete
async function testAutocomplete() {
    console.log('\n=== TESTE 5: AUTOCOMPLETE ===');
    
    try {
        const response = await makeRequest('GET', '/api/vacinas/autocomplete');
        console.log(`Status: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            const data = JSON.parse(response.data);
            console.log('✓ AUTOCOMPLETE bem-sucedido!');
            console.log(`  Chips: ${data.chips.length}`);
            console.log(`  Brincos: ${data.brincos.length}`);
            console.log(`  Vacinas: ${data.vacinas.length}`);
            return true;
        } else {
            console.log('✗ AUTOCOMPLETE falhou!');
            return false;
        }
    } catch (err) {
        console.log('✗ Erro:', err.message);
        return false;
    }
}

// Executar todos os testes
(async () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║  TESTE COMPLETO CRUD - VACINAS         ║');
    console.log('╚════════════════════════════════════════╝');

    const results = {
        create: await testCreate(),
        read: await testRead(),
        update: await testUpdate(),
        delete: await testDelete(),
        autocomplete: await testAutocomplete()
    };

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  RESUMO DOS TESTES                     ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`CREATE:       ${results.create ? '✓ PASSOU' : '✗ FALHOU'}`);
    console.log(`READ:         ${results.read ? '✓ PASSOU' : '✗ FALHOU'}`);
    console.log(`UPDATE:       ${results.update ? '✓ PASSOU' : '✗ FALHOU'}`);
    console.log(`DELETE:       ${results.delete ? '✓ PASSOU' : '✗ FALHOU'}`);
    console.log(`AUTOCOMPLETE: ${results.autocomplete ? '✓ PASSOU' : '✗ FALHOU'}`);

    const totalPassed = Object.values(results).filter(r => r).length;
    const totalTests = Object.keys(results).length;

    console.log(`\nTotal: ${totalPassed}/${totalTests} testes passaram`);

    if (totalPassed === totalTests) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM! CRUD está funcionando perfeitamente!');
    } else {
        console.log('\n⚠️  ALGUNS TESTES FALHARAM. Verifique se o servidor foi reiniciado.');
    }
})();
