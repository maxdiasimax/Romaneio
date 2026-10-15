const http = require('http');

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function verify() {
    console.log("Verifying Dashboard Endpoints...");

    try {
        console.log("\n1. Testing /api/dashboard/financial");
        const financial = await get('/api/dashboard/financial');
        console.log("Response:", JSON.stringify(financial, null, 2));
        if (typeof financial.totalInvested === 'number') console.log("✅ Financial data structure looks correct");
        else console.error("❌ Invalid Financial data");

        console.log("\n2. Testing /api/dashboard/weight-stats");
        const weight = await get('/api/dashboard/weight-stats');
        console.log("Response:", JSON.stringify(weight, null, 2));
        if (weight.weightDistribution && Array.isArray(weight.top5)) console.log("✅ Weight stats structure looks correct");
        else console.error("❌ Invalid Weight stats data");

        console.log("\n3. Testing /api/dashboard/baixas-stats");
        const baixas = await get('/api/dashboard/baixas-stats');
        console.log("Response:", JSON.stringify(baixas, null, 2));
        if (Array.isArray(baixas)) console.log("✅ Baixas stats structure looks correct");
        else console.error("❌ Invalid Baixas stats data");

    } catch (err) {
        console.error("Test execution failed:", err.message);
    }
}

verify();
