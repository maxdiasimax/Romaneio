const http = require('http');

function testEndpoint(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3001${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        console.log(`[PASS] ${path} returned ${Array.isArray(json) ? json.length + ' items' : 'object'}`);
                        resolve(json);
                    } catch (e) {
                        console.error(`[FAIL] ${path} invalid JSON`);
                        reject(e);
                    }
                } else {
                    console.error(`[FAIL] ${path} status ${res.statusCode}`);
                    reject(new Error(`Status ${res.statusCode}`));
                }
            });
        }).on('error', (err) => {
            console.error(`[FAIL] ${path} connection error:`, err.message);
            reject(err);
        });
    });
}

async function runTests() {
    console.log("Running Verification Tests...");
    try {
        await testEndpoint('/api/fazendas');
        await testEndpoint('/api/pastos');
        await testEndpoint('/api/users');
        console.log("All tests passed!");
    } catch (err) {
        console.error("Tests failed.");
        process.exit(1);
    }
}

runTests();
