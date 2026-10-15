
// Native fetch is available in Node 18+

async function testDelete() {
    const baseUrl = 'http://localhost:3000/api';
    
    console.log("1. Creating 'Pasto Backend Test'...");
    const createRes = await fetch(`${baseUrl}/pastos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Pasto Backend Test', fazenda_id: 1 })
    });
    
    if (!createRes.ok) {
        console.error("Failed to create test item");
        return;
    }
    const createData = await createRes.json();
    const id = createData.id;
    console.log(`   Created with ID: ${id}`);

    console.log("2. Verifying existence...");
    const listRes = await fetch(`${baseUrl}/pastos`);
    const list = await listRes.json();
    const exists = list.find(p => p.id === id);
    console.log(`   Item exists in list: ${!!exists}`);

    console.log("3. Deleting item...");
    const delRes = await fetch(`${baseUrl}/pastos/${id}`, { method: 'DELETE' });
    console.log(`   DELETE Response Status: ${delRes.status} ${delRes.statusText}`);
    const delData = await delRes.json();
    console.log(`   DELETE Response Body:`, delData);

    console.log("4. Verifying deletion...");
    const listRes2 = await fetch(`${baseUrl}/pastos`);
    const list2 = await listRes2.json();
    const stillExists = list2.find(p => p.id === id);
    console.log(`   Item exists in list: ${!!stillExists}`);
    
    if (!stillExists && delRes.ok) {
        console.log("SUCCESS: Item was correctly deleted.");
    } else {
        console.error("FAILURE: Item was not deleted or API error.");
    }
}

testDelete();
