// Script de teste para verificar se os endpoints de vacinas estão funcionando
const http = require('http');

console.log('Testando endpoints da API de Vacinas...\n');

// Teste 1: GET /api/vacinas
const testGetVacinas = () => {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3000/api/vacinas', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✓ GET /api/vacinas - OK');
                    console.log(`  Resposta: ${data.substring(0, 100)}...`);
                    resolve();
                } else {
                    console.log(`✗ GET /api/vacinas - ERRO (Status: ${res.statusCode})`);
                    reject();
                }
            });
        }).on('error', (err) => {
            console.log('✗ GET /api/vacinas - ERRO:', err.message);
            reject(err);
        });
    });
};

// Teste 2: GET /api/vacinas/autocomplete
const testAutocomplete = () => {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3000/api/vacinas/autocomplete', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✓ GET /api/vacinas/autocomplete - OK');
                    console.log(`  Resposta: ${data}`);
                    resolve();
                } else {
                    console.log(`✗ GET /api/vacinas/autocomplete - ERRO (Status: ${res.statusCode})`);
                    reject();
                }
            });
        }).on('error', (err) => {
            console.log('✗ GET /api/vacinas/autocomplete - ERRO:', err.message);
            reject(err);
        });
    });
};

// Teste 3: GET /api/bois (necessário para o formulário)
const testGetBois = () => {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3000/api/bois', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const bois = JSON.parse(data);
                    console.log('✓ GET /api/bois - OK');
                    console.log(`  Total de animais cadastrados: ${bois.length}`);
                    resolve();
                } else {
                    console.log(`✗ GET /api/bois - ERRO (Status: ${res.statusCode})`);
                    reject();
                }
            });
        }).on('error', (err) => {
            console.log('✗ GET /api/bois - ERRO:', err.message);
            reject(err);
        });
    });
};

// Executar testes
(async () => {
    try {
        await testGetVacinas();
        await testAutocomplete();
        await testGetBois();
        console.log('\n✓ Todos os testes passaram! A API está funcionando corretamente.');
    } catch (err) {
        console.log('\n✗ Alguns testes falharam. Verifique se o servidor está rodando.');
    }
})();
