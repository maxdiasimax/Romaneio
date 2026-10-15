
// State
let selectedBoiId = null;
let allBois = []; // Store fetched bois for lookups
// Pagination State
let currentPage = 1;
const itemsPerPage = 10;
let filteredBois = []; // Store processed for pagination
let isEditingMode = false; // Flag to distinguish Save/Edit toast

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadBoisAutocomplete();
    loadGenealogyTable();
});

// Load Bois for Autocomplete
async function loadBoisAutocomplete() {
    try {
        const res = await fetch('/api/bois'); 
        allBois = await res.json();
        
        const optionsHtml = allBois.map(b => `<option value="${b.name} [${b.id}]" data-id="${b.id}">`).join('');
        
        document.getElementById('bois-list').innerHTML = optionsHtml;
        document.getElementById('bois-list-consang').innerHTML = optionsHtml;
        document.getElementById('bois-list-reg').innerHTML = optionsHtml;

        setupSearchInput();
    } catch (e) {
        console.error("Error loading bois:", e);
    }
}

function getIdFromInput(val) {
    const match = val.match(/\[(\d+)\]/);
    return match ? match[1] : null;
}

function getNameFromId(id) {
    if(!id) return '';
    const boi = allBois.find(b => b.id == id);
    return boi ? `${boi.name} [${boi.id}]` : '';
}

function setupSearchInput() {
    const input = document.getElementById('search-boi');
    input.addEventListener('change', () => {
        const val = input.value;
        const id = getIdFromInput(val);
        if (id) {
            selectedBoiId = id;
            loadTree(id);
        }
    });
}

function clearSearch(elementId) {
    const el = document.getElementById(elementId);
    if(el) el.value = '';
    
    // Specific behavior if clearing the main search
    if(elementId === 'search-boi') {
        document.getElementById('tree-container').innerHTML = '<p style="text-align:center; padding-top: 250px; color: #999;">Selecione um animal para carregar a árvore.</p>';
    }
}

// --- Genealogy Registration ---

async function loadParentsForEdit() {
    const val = document.getElementById('reg-filho').value;
    const id = getIdFromInput(val);
    if (!id) return;

    // We can fetch the boi details again or find in `allBois` if loaded fully.
    // However, `allBois` might not have pai_id/mae_id up to date or included? 
    // Let's assume `api/bois` returns everything OR fetch specifically.
    // Let's fetch specifically to be safe.
    
    try {
        const res = await fetch(`/api/bois`); // Ideally /api/bois/:id but we don't have that endpoint implemented cleanly for single get? Actually we do usually or can filter.
        // Wait, current server.js has /api/bois returning all. 
        // Optimization: Find in `allBois` first.
        let boi = allBois.find(b => b.id == id);
        
        if (boi) {
            document.getElementById('reg-pai').value = getNameFromId(boi.pai_id);
            document.getElementById('reg-mae').value = getNameFromId(boi.mae_id);
        }
    } catch(e) { console.error(e); }
}

async function saveGenealogy() {
    const filhoVal = document.getElementById('reg-filho').value;
    const paiVal = document.getElementById('reg-pai').value;
    const maeVal = document.getElementById('reg-mae').value;
    
    const filhoId = getIdFromInput(filhoVal);
    const paiId = getIdFromInput(paiVal);
    const maeId = getIdFromInput(maeVal);
    
    if(!filhoId) {
        alert("Selecione um animal (filho) válido da lista.");
        return;
    }
    
    // Fetch current data to preserve other fields?
    // The PUT endpoint usually updates what is passed or we need the whole object?
    // Looking at server.js: 
    // UPDATE bois SET name=?, ... WHERE id=?
    // It expects ALL fields or at least doesn't dynamic patch well if fields are missing (might set NULL).
    // Let's check server.js implementation...
    // It updates ALL fields: `name = ?, initial_weight = ?, ...`
    // So we MUST send all other fields back otherwise they become null?? 
    // Wait, the updated PUT I wrote handles: `req.body.initial_weight` etc.
    // If I send only pai_id, the server code: `const { name, ... } = req.body`.
    // Then `db.run(..., [name, ...])`. If `name` is undefined, `?` gets undefined -> NULL (or depends on driver).
    // SQLite driver often treats undefined as NULL or error.
    // CRITICAL: We need to get the existing object first!
    
    try {
        // 1. Get current object
        // Use logic similar to 'loadParentsForEdit' but robust
        let boiToUpdate = allBois.find(b => b.id == filhoId);
        if(!boiToUpdate) throw new Error("Animal not found locally");
        
        // 2. Prepare payload merging existing data + new parents
        const payload = {
            ...boiToUpdate,
            pai_id: paiId || null,
            mae_id: maeId || null
        };
        
        // 3. Send PUT
        const res = await fetch(`/api/bois/${filhoId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        if(res.ok) {
            if (isEditingMode) {
                showMessage('<span class="toast-title">Atenção</span>Registro alterado com sucesso!', 'warning');
            } else {
                showMessage('<span class="toast-title">Sucesso</span>Registro salvo com sucesso!', 'success');
            }
            
            // RELOAD data locally
            await loadBoisAutocomplete(); 
            
            // If the tree is currently showing this animal or related, refresh it
            // If the modified animal is the one in search:
            const searchVal = document.getElementById('search-boi').value;
            const searchId = getIdFromInput(searchVal);
            if(searchId == filhoId) {
                loadTree(filhoId);
            }

            // Refresh table
            loadGenealogyTable();
            clearRegisterForm();
            
        } else {
            alert("Erro ao salvar.");
        }
    } catch(e) {
        console.error(e);
        showMessage('<span class="toast-title">Erro</span>Erro ao salvar parentesco: ' + e.message, 'error');
    }
}

function clearRegisterForm() {
    document.getElementById('reg-filho').value = '';
    document.getElementById('reg-pai').value = '';
    document.getElementById('reg-mae').value = '';
    isEditingMode = false;
}


// --- Genealogy Grid Functions ---

function loadGenealogyTable() {
    const tbody = document.getElementById('genealogia-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Carregando...</td></tr>';

    // We can use 'allBois' if it's already populated, but for safety in case of race condition on load, 
    // let's ensure we have data. loadBoisAutocomplete fetches 'allBois'.
    // If allBois is empty, wait or fetch.
    if(allBois.length === 0) {
        fetch('/api/bois').then(res => res.json()).then(data => {
            allBois = data;
            renderGenealogyTable(tbody);
        });
    } else {
        renderGenealogyTable(tbody);
    }
}

function renderGenealogyTable(tbody) {
    // Filter bois that have at least one parent
    const boisWithParents = allBois.filter(b => b.pai_id || b.mae_id);
    
    if (boisWithParents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #777;">Nenhum parentesco cadastrado.</td></tr>';
        document.getElementById('pagination-controls').innerHTML = '';
        filteredBois = [];
        return;
    }

    // Sort by name for better display
    boisWithParents.sort((a, b) => a.name.localeCompare(b.name));
    filteredBois = boisWithParents;

    // Pagination Logic
    const totalPages = Math.ceil(filteredBois.length / itemsPerPage);
    if(currentPage > totalPages) currentPage = 1;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredBois.slice(startIndex, endIndex);

    tbody.innerHTML = pageData.map(boi => {
        const paiName = getNameFromId(boi.pai_id) || '<span style="color:#ccc;">-</span>';
        const maeName = getNameFromId(boi.mae_id) || '<span style="color:#ccc;">-</span>';
        
        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${boi.name} <small style="color:#666;">[${boi.id}]</small></td>
                <td style="padding: 10px;">${paiName}</td>
                <td style="padding: 10px;">${maeName}</td>
                <td style="padding: 10px; text-align: center;">
                    <button class="btn-cancel" style="padding: 2px 8px; font-size: 0.8rem; margin-right: 5px;" onclick="editGenealogy(${boi.id})">Editar</button>
                    <button class="btn-cancel" style="padding: 2px 8px; font-size: 0.8rem; background: #ffebee; color: #c62828; border: 1px solid #ef9a9a;" onclick="deleteGenealogy(${boi.id})">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination-controls');
    let html = '';
    
    if (totalPages > 1) {
        html += `<button class="pagination-btn" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>`;
        html += `<span style="padding: 0 10px;">Página ${currentPage} de ${totalPages}</span>`;
        html += `<button class="pagination-btn" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Próxima</button>`;
    }
    container.innerHTML = html;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredBois.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    const tbody = document.getElementById('genealogia-table-body');
    renderGenealogyTable(tbody);
}

function editGenealogy(id) {
    const boi = allBois.find(b => b.id == id);
    if (boi) {
        isEditingMode = true;
        document.getElementById('reg-filho').value = `${boi.name} [${boi.id}]`;
        // Trigger onchange manually or call logic
        loadParentsForEdit().then(() => {
             // Scroll to form
            document.getElementById('reg-filho').scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.getElementById('reg-filho').focus();
        });
    }
}

async function deleteGenealogy(id) {
    showConfirmModal(
        'Confirmação',
        'Deseja excluir o registro?',
        async () => {
            try {
                let boiToUpdate = allBois.find(b => b.id == id);
                if(!boiToUpdate) throw new Error("Animal não encontrado localmente");

                // Set parents to null
                const payload = {
                    ...boiToUpdate,
                    pai_id: null,
                    mae_id: null
                };

                const res = await fetch(`/api/bois/${id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });

                if(res.ok) {
                    showMessage('<span class="toast-title">Sucesso</span>Registro excluído com sucesso!', 'error');
                    await loadBoisAutocomplete(); // Refresh data
                    loadGenealogyTable(); // Refresh table
                } else {
                    showMessage('<span class="toast-title">Erro</span>Erro ao excluir parentesco.', 'error');
                }
            } catch(e) {
                console.error(e);
                showMessage('<span class="toast-title">Erro</span>Erro: ' + e.message, 'error');
            }
        }
    );
}


// --- Consanguinity Check ---

async function checkConsanguinity() {
    const p1Input = document.getElementById('pag-boi1');
    const p2Input = document.getElementById('pag-boi2');
    
    const id1 = getIdFromInput(p1Input.value);
    const id2 = getIdFromInput(p2Input.value);
    
    if (!id1 || !id2) {
        alert("Selecione dois animais válidos da lista.");
        return;
    }
    
    try {
        const res = await fetch(`/api/genealogia/consanguinidade?pai_id=${id1}&mae_id=${id2}`);
        const data = await res.json();
        
        const resultDiv = document.getElementById('consanguinity-result');
        if (data.consanguineo) {
            const names = data.ancestrais_comuns.map(id => {
                const b = allBois.find(x => x.id == id);
                return b ? b.name : id;
            });
            
            resultDiv.innerHTML = `<div class="alert alert-danger">
                <strong>Alerta de Consanguinidade!</strong><br>
                Ancestrais comuns encontrados: ${names.join(', ')}
            </div>`;
        } else {
             resultDiv.innerHTML = `<div class="alert alert-success">
                <strong>Sem consanguinidade detectada</strong> nas gerações analisadas.
            </div>`;
        }
    } catch (e) {
        console.error(e);
        alert("Erro ao verificar consanguinidade");
    }
}

// Tree Visualization with D3
async function loadTree(boiId) {
    const container = document.getElementById('tree-container');
    container.innerHTML = 'Carregando árvore...';
    
    try {
        const res = await fetch(`/api/genealogia/arvore/${boiId}`);
        if (!res.ok) throw new Error("Boi not found");
        const data = await res.json();
        
        const buildD3Data = (node) => {
            if (!node) return null;
            const d3Node = {
                name: node.name,
                attributes: {
                    Brinco: node.brinco,
                    Sexo: node.sexo,
                    Geração: node.generation
                },
                children: []
            };
            
            if (node.parents) {
                if (node.parents.father) d3Node.children.push(buildD3Data(node.parents.father));
                if (node.parents.mother) d3Node.children.push(buildD3Data(node.parents.mother));
            }
            return d3Node;
        };
        
        const treeData = buildD3Data(data);
        renderTree(treeData);
        
    } catch (e) {
        container.innerHTML = `<div style="color:red">Erro ao carregar árvore: ${e.message}</div>`;
    }
}

function renderTree(treeData) {
    document.getElementById('tree-container').innerHTML = ''; // Clear
    let i = 0;
    
    // Dimensions
    const width = 800;
    const height = 600;
    
    // Create SVG and Group first
    const svg = d3.select("#tree-container").append("svg")
        .attr("width", width)
        .attr("height", height);

    const outerG = svg.append("g").attr("transform", "translate(0,0)");
    const g = outerG.append("g");

    // Zoom behavior
    const zoom = d3.zoom().on("zoom", function (event) {
        g.attr("transform", event.transform);
    });

    // Attach zoom and set initial transform
    svg.call(zoom)
       .call(zoom.transform, d3.zoomIdentity.translate(100, 50));


    const treeMap = d3.tree().size([height - 100, width - 200]);
    const root = d3.hierarchy(treeData, function(d) { return d.children; });
    
    const treeDataNodes = treeMap(root);
    
    const nodes = treeDataNodes.descendants();
    const links = treeDataNodes.descendants().slice(1);

    nodes.forEach(function(d){ d.y = d.depth * 180 });

    const node = g.selectAll('g.node')
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 10)
        .style("fill", d => d.data.attributes.Sexo === 'F' ? "#ffb6c1" : "#add8e6") // Pink for female, Blue for male
        .style("stroke", "#333");

    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", function(d) {
            return d.children || d._children ? -13 : 13;
        })
        .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function(d) { return d.data.name; });

    const link = g.selectAll('path.link')
        .data(links, function(d) { return d.id; });

    const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr("d", function(d){
            return "M" + d.y + "," + d.x
             + "C" + (d.y + d.parent.y) / 2 + "," + d.x
             + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
             + " " + d.parent.y + "," + d.parent.x;
         })
         .style("fill", "none")
         .style("stroke", "#ccc")
         .style("stroke-width", "2px");
}

// --- PDF Exports ---

function getTimestampStr() {
    const now = new Date();
    // Format: ddmmaaaahhmm
    return String(now.getDate()).padStart(2, '0') +
           String(now.getMonth() + 1).padStart(2, '0') +
           now.getFullYear() +
           String(now.getHours()).padStart(2, '0') +
           String(now.getMinutes()).padStart(2, '0');
}

function exportGenealogyGridPDF() {
    if (!filteredBois || filteredBois.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Genealogias Cadastradas', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

    const tableRows = filteredBois.map(boi => {
        return [
            `${boi.name} [${boi.id}]`,
            getNameFromId(boi.pai_id) || '-',
            getNameFromId(boi.mae_id) || '-'
        ];
    });

    doc.autoTable({
        head: [['Filho(a)', 'Pai', 'Mãe']],
        body: tableRows,
        startY: 30
    });

    const filename = `GenealogiasCadastradas_${getTimestampStr()}.pdf`;
    doc.save(filename);
}

async function exportTreePDF() {
    const svgElement = document.querySelector("#tree-container svg");
    if (!svgElement) {
        alert("Nenhuma árvore gerada para exportar. Selecione um animal primeiro.");
        return;
    }

    // Setup Canvas
    const canvas = document.createElement("canvas");
    // We use established dimensions from renderTree (800x600) or dynamic
    const width = 800; 
    const height = 600;
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
    // Serialize SVG
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgElement);

    // Create Image from SVG
    const img = new Image();
    const svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
        // Draw white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0);
        
        const imgData = canvas.toDataURL("image/png");
        
        // Create PDF
        const { jsPDF } = window.jspdf;
        // Landscape might be better for trees
        const doc = new jsPDF({ orientation: 'landscape' }); 
        
        doc.setFontSize(16);
        doc.text('Árvore Genealógica', 14, 15);
        
        const searchVal = document.getElementById('search-boi').value;
        doc.setFontSize(12);
        doc.text(`Animal: ${searchVal}`, 14, 22);

        // Add Image
        doc.addImage(imgData, 'PNG', 15, 30, 260, 195); // Adjust sizes to fit A4 Landscape

        const filename = `ArvoreGenealogica_${getTimestampStr()}.pdf`;
        doc.save(filename);
        
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
}


// --- Notification & Helpers ---

function showMessage(msg, type) {
    // Remove any existing message
    const existingMsg = document.querySelector('.success-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Create new message
    const msgDiv = document.createElement('div');
    
    let className = 'success-message';
    if (type === 'success') className += ' toast-success';
    else if (type === 'warning') className += ' toast-warning';
    else if (type === 'error') className += ' toast-error';
    
    msgDiv.className = className;
    msgDiv.innerHTML = msg;
    
    document.body.appendChild(msgDiv);
    
    // Remove after 5 seconds with animation
    setTimeout(() => {
        msgDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            msgDiv.remove();
        }, 300);
    }, 5000);
}

function showConfirmModal(title, message, onConfirm) {
    const overlay = document.getElementById('confirmation-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    titleEl.textContent = title;
    bodyEl.textContent = message;

    // Show modal
    overlay.classList.add('active');

    // Handle Confirm
    const handleConfirm = () => {
        onConfirm();
        closeModal();
        cleanup();
    };

    // Handle Cancel
    const handleCancel = () => {
        closeModal();
        cleanup();
    };

    const cleanup = () => {
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
    };

    confirmBtn.onclick = handleConfirm;
    cancelBtn.onclick = handleCancel;
}

function closeModal() {
    document.getElementById('confirmation-modal').classList.remove('active');
}

