
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
        
        const optionsHtml = allBois.map(b => `<option value="${escapeHtml(b.name)} [${b.id}]">`).join('');
        
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
        document.getElementById('tree-container').innerHTML = '<div class="tree-empty"><i class="fas fa-dna"></i><span>Selecione um animal para carregar a árvore.</span></div>'; treeSvg = null; treeG = null;
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
        showMessage('<span class="toast-title">Atenção</span>Selecione um animal (filho) válido da lista.', 'warning');
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
            const err = await res.json().catch(() => ({}));
            showMessage('<span class="toast-title">Erro</span>' + escapeHtml(err.error || 'Erro ao salvar.'), 'error');
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
        const paiName = escapeHtml(getNameFromId(boi.pai_id)) || '<span style="color:#ccc;">-</span>';
        const maeName = escapeHtml(getNameFromId(boi.mae_id)) || '<span style="color:#ccc;">-</span>';
        
        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${escapeHtml(boi.name)} <small style="color:#666;">[${boi.id}]</small></td>
                <td style="padding: 10px;">${paiName}</td>
                <td style="padding: 10px;">${maeName}</td>
                <td style="padding: 10px; text-align: center;">
                    <div class="row-actions">
                        <button class="btn-cancel" style="min-width:0; padding: 4px 12px; font-size: 0.85rem;" onclick="editGenealogy(${boi.id})">Editar</button>
                        <button class="btn-cancel" style="min-width:0; padding: 4px 12px; font-size: 0.85rem; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;" onclick="deleteGenealogy(${boi.id})">Excluir</button>
                    </div>
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
        showMessage('<span class="toast-title">Atenção</span>Selecione dois animais válidos da lista.', 'warning');
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
                Ancestrais comuns encontrados: ${names.map(escapeHtml).join(', ')}
            </div>`;
        } else {
             resultDiv.innerHTML = `<div class="alert alert-success">
                <strong>Sem consanguinidade detectada</strong> nas gerações analisadas.
            </div>`;
        }
    } catch (e) {
        console.error(e);
        showMessage('<span class="toast-title">Erro</span>Erro ao verificar consanguinidade.', 'error');
    }
}

// ---------------------------------------------------------------------------
// Árvore genealógica (D3) – cartões em SVG, zoom/pan (mouse e toque), ajuste à tela
// Todo o estilo é feito com atributos SVG (sem CSS externo) para a exportação em PDF.
// ---------------------------------------------------------------------------
const TREE_COLORS = {
    M: { main: '#2563eb', soft: '#dbeafe', text: '#1e3a8a', symbol: '♂' },
    F: { main: '#db2777', soft: '#fce7f3', text: '#9d174d', symbol: '♀' },
    U: { main: '#64748b', soft: '#e2e8f0', text: '#334155', symbol: '?' }
};
const NODE_W = 210, NODE_H = 70, LEVEL_GAP = 290, SIBLING_GAP = 92;
const FONT = "Inter, Arial, Helvetica, sans-serif";
let treeZoom = null, treeSvg = null, treeG = null;

const ROLE_LABELS = [
    { M: 'Animal', F: 'Animal', U: 'Animal' },
    { M: 'Pai', F: 'Mãe', U: 'Progenitor' },
    { M: 'Avô', F: 'Avó', U: 'Ancestral' },
    { M: 'Bisavô', F: 'Bisavó', U: 'Ancestral' },
    { M: 'Trisavô', F: 'Trisavó', U: 'Ancestral' }
];

function truncate(text, max) {
    text = String(text == null ? '' : text);
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

async function loadTree(boiId) {
    const container = document.getElementById('tree-container');
    container.innerHTML = '<div class="tree-empty"><i class="fas fa-spinner fa-spin"></i> Carregando árvore...</div>';

    try {
        const res = await fetch(`/api/genealogia/arvore/${boiId}`);
        if (!res.ok) throw new Error('Animal não encontrado');
        const data = await res.json();

        const build = (node) => {
            if (!node) return null;
            const d3Node = {
                id: node.id,
                name: node.name,
                brinco: node.brinco,
                sexo: node.sexo,
                generation: node.generation,
                children: []
            };
            if (node.parents) {
                if (node.parents.father) d3Node.children.push(build(node.parents.father));
                if (node.parents.mother) d3Node.children.push(build(node.parents.mother));
            }
            return d3Node;
        };

        renderTree(build(data));
    } catch (e) {
        container.innerHTML = `<div class="tree-empty" style="color:#dc2626">Erro ao carregar árvore: ${escapeHtml(e.message)}</div>`;
    }
}

function renderTree(treeData) {
    const container = document.getElementById('tree-container');
    container.innerHTML = '';

    const root = d3.hierarchy(treeData, d => d.children);
    d3.tree().nodeSize([SIBLING_GAP, LEVEL_GAP])(root);

    const hasAncestors = root.descendants().length > 1;

    treeSvg = d3.select(container).append('svg')
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('display', 'block')
        .style('touch-action', 'none')
        .style('cursor', 'grab');

    const defs = treeSvg.append('defs');
    const shadow = defs.append('filter').attr('id', 'card-shadow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '160%');
    shadow.append('feDropShadow').attr('dx', 0).attr('dy', 4).attr('stdDeviation', 5).attr('flood-color', '#0c2559').attr('flood-opacity', 0.18);

    treeG = treeSvg.append('g').attr('class', 'tree-root');

    // Ligações (curvas suaves, da esquerda para a direita)
    const linkGen = d3.linkHorizontal().x(d => d.y).y(d => d.x);
    treeG.append('g').attr('fill', 'none').selectAll('path')
        .data(root.links())
        .enter().append('path')
        .attr('d', d => linkGen({
            source: { x: d.source.x, y: d.source.y + NODE_W },
            target: { x: d.target.x, y: d.target.y }
        }))
        .attr('stroke', d => (TREE_COLORS[d.target.data.sexo] || TREE_COLORS.U).main)
        .attr('stroke-opacity', 0.55)
        .attr('stroke-width', 2.5)
        .attr('stroke-linecap', 'round');

    // Cartões
    const nodes = treeG.append('g').selectAll('g')
        .data(root.descendants())
        .enter().append('g')
        .attr('transform', d => `translate(${d.y},${d.x - NODE_H / 2})`)
        .style('cursor', d => d.depth === 0 ? 'default' : 'pointer')
        .on('click', (event, d) => {
            if (d.depth === 0 || !d.data.id) return;
            const input = document.getElementById('search-boi');
            input.value = `${d.data.name} [${d.data.id}]`;
            loadTree(d.data.id);
        });

    nodes.each(function (d) {
        const g = d3.select(this);
        const c = TREE_COLORS[d.data.sexo] || TREE_COLORS.U;
        const isRoot = d.depth === 0;
        const role = (ROLE_LABELS[d.depth] || ROLE_LABELS[4])[d.data.sexo] || 'Ancestral';

        g.append('rect')
            .attr('width', NODE_W).attr('height', NODE_H).attr('rx', 16)
            .attr('fill', isRoot ? '#0c2559' : '#ffffff')
            .attr('stroke', isRoot ? '#0c2559' : c.main)
            .attr('stroke-width', isRoot ? 0 : 1.5)
            .attr('filter', 'url(#card-shadow)');

        // Faixa lateral colorida
        if (!isRoot) {
            g.append('rect').attr('x', 0).attr('y', 14).attr('width', 5).attr('height', NODE_H - 28).attr('rx', 2.5).attr('fill', c.main);
        }

        // Selo de sexo
        g.append('circle').attr('cx', 34).attr('cy', NODE_H / 2).attr('r', 19)
            .attr('fill', isRoot ? 'rgba(255,255,255,0.14)' : c.soft);
        g.append('text').attr('x', 34).attr('y', NODE_H / 2 + 1)
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
            .attr('font-family', FONT).attr('font-size', 22).attr('font-weight', 700)
            .attr('fill', isRoot ? '#ffffff' : c.main)
            .text(c.symbol);

        // Papel (Pai / Mãe / Avô...)
        g.append('text').attr('x', 62).attr('y', 20)
            .attr('font-family', FONT).attr('font-size', 9.5).attr('font-weight', 700).attr('letter-spacing', 1)
            .attr('fill', isRoot ? '#93c5fd' : c.main)
            .text(role.toUpperCase());

        // Nome
        g.append('text').attr('x', 62).attr('y', 39)
            .attr('font-family', FONT).attr('font-size', 14).attr('font-weight', 700)
            .attr('fill', isRoot ? '#ffffff' : '#0f1f3d')
            .text(truncate(d.data.name, 17));

        // Brinco / geração
        const meta = [d.data.brinco ? `Brinco ${d.data.brinco}` : null, d.data.generation ? `Ger. ${d.data.generation}` : null]
            .filter(Boolean).join('  •  ');
        g.append('text').attr('x', 62).attr('y', 56)
            .attr('font-family', FONT).attr('font-size', 10.5)
            .attr('fill', isRoot ? '#bfdbfe' : '#64748b')
            .text(truncate(meta || 'Sem brinco', 26));

        g.append('title').text(`${d.data.name}${d.data.brinco ? ' – Brinco ' + d.data.brinco : ''}`);
    });

    // Zoom / pan (mouse, trackpad e toque com pinça)
    treeZoom = d3.zoom()
        .scaleExtent([0.25, 2.5])
        .on('start', () => treeSvg.style('cursor', 'grabbing'))
        .on('end', () => treeSvg.style('cursor', 'grab'))
        .on('zoom', (event) => treeG.attr('transform', event.transform));
    treeSvg.call(treeZoom).on('dblclick.zoom', null);

    addTreeControls(container, hasAncestors);
    fitTree(false);
}

function addTreeControls(container, hasAncestors) {
    const controls = document.createElement('div');
    controls.className = 'tree-controls';
    controls.innerHTML = `
        <button type="button" title="Aproximar" aria-label="Aproximar" data-act="in"><i class="fas fa-plus"></i></button>
        <button type="button" title="Afastar" aria-label="Afastar" data-act="out"><i class="fas fa-minus"></i></button>
        <button type="button" title="Ajustar à tela" aria-label="Ajustar à tela" data-act="fit"><i class="fas fa-expand"></i></button>`;
    controls.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const act = btn.dataset.act;
        if (act === 'fit') fitTree(true);
        else treeSvg.transition().duration(250).call(treeZoom.scaleBy, act === 'in' ? 1.3 : 1 / 1.3);
    });
    container.appendChild(controls);

    const legend = document.createElement('div');
    legend.className = 'tree-legend';
    legend.innerHTML = `
        <span><i style="background:#2563eb"></i> Macho</span>
        <span><i style="background:#db2777"></i> Fêmea</span>
        <span class="tree-hint">${hasAncestors ? 'Arraste para mover • pinça/scroll para zoom • toque num ancestral para abri-lo' : 'Este animal ainda não tem pais cadastrados'}</span>`;
    container.appendChild(legend);
}

function fitTree(animate) {
    if (!treeSvg || !treeG) return;
    const svgNode = treeSvg.node();
    const box = treeG.node().getBBox();
    const w = svgNode.clientWidth || 800;
    const h = svgNode.clientHeight || 500;
    const padL = 24, padR = 64, padT = 24, padB = 60; // reserva espaço p/ controles e legenda
    let scale = Math.min((w - padL - padR) / box.width, (h - padT - padB) / box.height, 1.15);
    let tx, ty;
    if (scale < 0.55) {
        // Telas pequenas: mantém legibilidade (zoom mínimo) começando pelo animal; o usuário arrasta
        scale = 0.55;
        tx = padL - box.x * scale;
    } else {
        tx = padL + (w - padL - padR - box.width * scale) / 2 - box.x * scale;
    }
    ty = padT + (h - padT - padB - box.height * scale) / 2 - box.y * scale;
    const t = d3.zoomIdentity.translate(tx, ty).scale(scale);
    (animate ? treeSvg.transition().duration(450) : treeSvg).call(treeZoom.transform, t);
}

window.addEventListener('resize', () => { if (treeSvg) fitTree(false); });

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
        showMessage('<span class="toast-title">Atenção</span>Não há dados para exportar.', 'warning');
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
    const svgElement = document.querySelector('#tree-container svg');
    if (!svgElement || !treeG) {
        showMessage('<span class="toast-title">Atenção</span>Gere uma árvore antes: selecione um animal.', 'warning');
        return;
    }

    // Clona o SVG em coordenadas "limpas" (sem zoom/pan) com o tamanho exato do conteúdo
    const box = treeG.node().getBBox();
    const pad = 30, scale = 2;
    const w = Math.ceil(box.width + pad * 2);
    const h = Math.ceil(box.height + pad * 2);

    const clone = svgElement.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', w);
    clone.setAttribute('height', h);
    clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
    clone.style.cssText = '';
    const g = clone.querySelector('g.tree-root');
    g.setAttribute('transform', `translate(${pad - box.x},${pad - box.y})`);

    const svgString = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));

    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        doc.setFontSize(16);
        doc.text('Árvore Genealógica', 14, 15);
        doc.setFontSize(11);
        doc.text(`Animal: ${document.getElementById('search-boi').value}`, 14, 22);
        doc.setFontSize(9);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - 14, 15, { align: 'right' });

        // Mantém a proporção da imagem dentro da área útil da página
        const areaW = pageW - 20, areaH = pageH - 38;
        const ratio = Math.min(areaW / w, areaH / h);
        const drawW = w * ratio, drawH = h * ratio;
        doc.addImage(imgData, 'PNG', (pageW - drawW) / 2, 28, drawW, drawH);

        doc.save(`ArvoreGenealogica_${getTimestampStr()}.pdf`);
    };
    img.onerror = function () {
        URL.revokeObjectURL(url);
        showMessage('<span class="toast-title">Erro</span>Não foi possível gerar o PDF da árvore.', 'error');
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

