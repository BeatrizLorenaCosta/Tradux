function initEquipas() {
    console.log('Equipas inicializado');
    carregarEquipas();
}
/* =========================
   TOGGLE FORMULÁRIOS
========================= */

const forms = [
    { btnId: 'toggle-form-criar-equipa', wrapperId: 'form-criar-equipa-wrapper', textoAberto: '+ Criar Equipa', textoFechado: 'Fechar Formulário' },
    { btnId: 'toggle-form-equipa-utilizador', wrapperId: 'form-equipa-utilizador-wrapper', textoAberto: '+ Adicionar Utilizador à Equipa', textoFechado: 'Fechar Formulário' },
    { btnId: 'toggle-form-doc-equipa-tradutores', wrapperId: 'form-doc-equipa-tradutores-wrapper', textoAberto: '+ Associar Documento a Equipa de Tradutores', textoFechado: 'Fechar Formulário' },
    { btnId: 'toggle-form-doc-equipa-revisores', wrapperId: 'form-doc-equipa-revisores-wrapper', textoAberto: '+ Associar Documento a Equipa de Revisores', textoFechado: 'Fechar Formulário' }
];

forms.forEach(f => {
    const btn = document.getElementById(f.btnId);
    const wrapper = document.getElementById(f.wrapperId);

    btn.addEventListener('click', () => {
        const estaAberto = wrapper.style.display === 'block';

        fecharTodosOsForms();

        if (!estaAberto) {
            wrapper.style.display = 'block';
            btn.textContent = f.textoFechado;
        }
    });
});

function fecharTodosOsForms() {
    forms.forEach(f => {
        const wrapper = document.getElementById(f.wrapperId);
        const btn = document.getElementById(f.btnId);

        if (wrapper) wrapper.style.display = 'none';
        if (btn) btn.textContent = f.textoAberto;
    });

    const wrapperEquipa = document.getElementById('form-alterar-equipa-wrapper');
    if (wrapperEquipa) wrapperEquipa.style.display = 'none';
    
    document.querySelectorAll('.btn-alterar-equipa').forEach(btn => {
        btn.textContent = 'Alterar Equipa';
        delete btn.dataset.open;
    });
}

/* =========================
   INICIALIZAR CAMPOS DEPENDENTES
========================= */

function initCamposDependentes(formId, primeiroSeletor, segundoSeletor, carregarSegundo) {
    const form = document.getElementById(formId);
    if (!form) return;

    const primeiro = form.querySelector(primeiroSeletor);
    const segundo = form.querySelector(segundoSeletor);
    if (!primeiro || !segundo) return;

    const atualizar = () => {
        if (!primeiro.value) {
            segundo.disabled = true;
            if (segundo.tagName === 'SELECT') segundo.value = '';
            else if (segundo.tagName === 'INPUT') segundo.value = '';
        } else {
            segundo.disabled = false;
            if (typeof carregarSegundo === 'function') carregarSegundo(segundo, primeiro);
        }
    };

    // estado inicial
    atualizar();

    // quando muda o primeiro
    primeiro.addEventListener('change', atualizar);

    // quando o form é resetado
    form.addEventListener('reset', () => setTimeout(atualizar));
}

function initCamposDependentes3(formId, primeiroSel, segundoSel, terceiroSel, carregarSegundo, carregarTerceiro) {
    const form = document.getElementById(formId);
    if (!form) return;

    const primeiro = form.querySelector(primeiroSel);
    const segundo = form.querySelector(segundoSel);
    const terceiro = form.querySelector(terceiroSel);
    if (!primeiro || !segundo || !terceiro) return;

    const atualizar = () => {
        
        if (!primeiro.value) {
            segundo.disabled = true;
            segundo.value = '';
            terceiro.disabled = true;
            terceiro.value = '';
        } else {
            segundo.disabled = false;
            if (typeof carregarSegundo === 'function') carregarSegundo(segundo, primeiro);

            if (!segundo.value) {
                terceiro.disabled = true;
                terceiro.value = '';
            } else {
                terceiro.disabled = false;
                if (typeof carregarTerceiro === 'function') carregarTerceiro(terceiro, segundo);
            }
        }
    };

    // estado inicial
    atualizar();

    // listeners
    primeiro.addEventListener('change', atualizar);
    segundo.addEventListener('change', atualizar);
    form.addEventListener('reset', () => setTimeout(atualizar));
}


/* =========================
   APLICAR AOS FORMS
========================= */

// form-equipa-utilizador: primeiro select = equipa, segundo select = utilizador
initCamposDependentes(
    'form-equipa-utilizador',
    'select[name="equipa_id"]',
    'select[name="conta_id"]',
    (segundo, primeiro) => {
        const tipo = primeiro.selectedOptions[0]?.dataset.tipo;
        if (!tipo) return;
        carregarUtilizadoresPorTipo(segundo, tipo);
    }
);

// form-doc-equipa-tradutores
initCamposDependentes3(
    'form-doc-equipa-tradutores',
    'select[name="documento_id"]',
    'select[name="equipa_id"]',
    'select[name="responsavel_id"]',
    (equipaSel, docSel) => onDocumentoChange(docSel, equipaSel, 'tradutores'),
    (responsavelSel, equipaSel) => carregarResponsaveisPorEquipa(responsavelSel, equipaSel.value)
);

// form-doc-equipa-revisores
initCamposDependentes3(
    'form-doc-equipa-revisores',
    'select[name="documento_id"]',
    'select[name="equipa_id"]',
    'select[name="responsavel_id"]',
    (equipaSel, docSel) => onDocumentoChange(docSel, equipaSel, 'revisores'),
    (responsavelSel, equipaSel) => carregarResponsaveisPorEquipa(responsavelSel, equipaSel.value)
);



// form-criar-equipa: primeiro select = tipo, segundo input = nome_equipa
initCamposDependentes(
    'form-criar-equipa',
    'select[name="tipo"]',
    'input[name="nome_equipa"]'
);

/* =========================
   SUBMITS
========================= */

const formEquipaUser = document.getElementById('form-equipa-utilizador');
const formDocEquipaTradutores = document.getElementById('form-doc-equipa-tradutores');
const formDocEquipaRevisores = document.getElementById('form-doc-equipa-revisores');
const formCriarEquipa = document.getElementById('form-criar-equipa');

/* -------------------------
   Inicializações dos forms
------------------------- */

// carregar selects iniciais
formEquipaUser && carregarEquipasSelect(formEquipaUser.querySelector('select[name="equipa_id"]'));
formDocEquipaTradutores && carregarDocumentosSelect(formDocEquipaTradutores.querySelector('select[name="documento_id"]'), 'tradutores');
formDocEquipaRevisores && carregarDocumentosSelect(formDocEquipaRevisores.querySelector('select[name="documento_id"]'), 'revisores');

/* -------------------------
   SUBMITS
------------------------- */


document.getElementById('form-alterar-equipa')?.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelectorAll('.btn-alterar-equipa').forEach(btn => {
        btn.textContent = 'Alterar Equipa';
        delete btn.dataset.open;
    });

    await apiFetch(`/api/admin/equipas/${e.target.id_equipa.value}`, {
        method: 'PUT',
        body: JSON.stringify({ nome_equipa: e.target.nome_equipa.value })
    });
    carregarEquipas();
    document.getElementById('form-alterar-equipa-wrapper').style.display = 'none';
});

/* -------------------------
   Forms com selects dependentes
------------------------- */

formCriarEquipa?.addEventListener('submit', async e => {
    e.preventDefault();
    const estaAberto = document.getElementById('form-criar-equipa-wrapper').style.display === 'block';

    await apiFetch('/api/admin/equipas', { method:'POST', body:JSON.stringify({ nome_equipa:e.target.nome_equipa.value, tipo:e.target.tipo.value }) });

    e.target.reset();
    carregarTudo();
    document.getElementById('form-criar-equipa-wrapper').style.display = estaAberto ? 'none' : 'block';
    document.getElementById('toggle-form-criar-equipa').textContent = estaAberto ? '+ Criar Equipa':'Fechar Formulário';
});

formEquipaUser?.addEventListener('submit', async e => {
    e.preventDefault();
    const estaAberto = document.getElementById('form-equipa-utilizador-wrapper').style.display === 'block';

    await apiFetch(`/api/admin/equipas/${formEquipaUser.equipa_id.value}/utilizadores`, { method:'POST', body:JSON.stringify({ conta_id: formEquipaUser.conta_id.value }) });

    formEquipaUser.reset();
    carregarTudo();
    document.getElementById('form-equipa-utilizador-wrapper').style.display = estaAberto ? 'none' : 'block';
    document.getElementById('toggle-form-equipa-utilizador').textContent = estaAberto ? '+ Adicionar Utilizador à Equipa': 'Fechar Formulário';
});

formDocEquipaTradutores?.addEventListener('submit', async e => {
    e.preventDefault();
    const estaAberto = document.getElementById('form-doc-equipa-tradutores-wrapper').style.display === 'block';

    await apiFetch('/api/admin/documentos/associar', { method:'POST', body:JSON.stringify({ documento_id: formDocEquipaTradutores.documento_id.value, equipa: formDocEquipaTradutores.equipa_id.value, responsavel_id: formDocEquipaTradutores.responsavel_id.value }) });
    await apiFetch(`/api/admin/documentos/${formDocEquipaTradutores.documento_id.value}/estado`, { method:'PUT', body:JSON.stringify({ estado:'pago' }) });

    formDocEquipaTradutores.reset();
    carregarTudo();
    carregarDocumentosSelect(formDocEquipaTradutores.querySelector('select[name="documento_id"]'), 'tradutores');

    document.getElementById('form-doc-equipa-tradutores-wrapper').style.display = estaAberto ? 'none' : 'block';
    document.getElementById('toggle-form-doc-equipa-tradutores').textContent = estaAberto ? '+ Associar Documento a Equipa de Tradutores':'Fechar Formulário';
});

formDocEquipaRevisores?.addEventListener('submit', async e => {
    e.preventDefault();
    const estaAberto = document.getElementById('form-doc-equipa-revisores-wrapper').style.display === 'block';

    await apiFetch('/api/admin/documentos/associar', { method:'POST', body:JSON.stringify({ documento_id: formDocEquipaRevisores.documento_id.value, equipa: formDocEquipaRevisores.equipa_id.value, responsavel_id: formDocEquipaRevisores.responsavel_id.value }) });
    await apiFetch(`/api/admin/documentos/${formDocEquipaRevisores.documento_id.value}/estado`, { method:'PUT', body:JSON.stringify({ estado:'traduzido' }) });

    formDocEquipaRevisores.reset();
    carregarTudo();
    carregarDocumentosSelect(formDocEquipaRevisores.querySelector('select[name="documento_id"]'), 'revisores');
    carregarEquipasLivres(formDocEquipaRevisores.querySelector('select[name="equipa_id"]'), 'revisores');

    document.getElementById('form-doc-equipa-revisores-wrapper').style.display = estaAberto ? 'none' : 'block';
    document.getElementById('toggle-form-doc-equipa-revisores').textContent = estaAberto ? '+ Associar Documento a Equipa de Revisores':'Fechar Formulário';
});


/* =========================
   EQUIPAS
========================= */

async function carregarEquipas() {
    const equipas = await apiFetch('/api/admin/equipas');
    const tbody = document.querySelector('#equipas tbody');

    if (formEquipaUser) {
        const selectEquipa = formEquipaUser.querySelector('select[name="equipa_id"]');
        carregarEquipasSelect(selectEquipa);
        // resetar e bloquear select de utilizadores
        const selectUser = formEquipaUser.querySelector('select[name="conta_id"]');
        selectUser.value = '';
        selectUser.disabled = true;
    }

    if (formDocEquipaTradutores) {
        const selDoc = formDocEquipaTradutores.querySelector('select[name="documento_id"]');
        carregarDocumentosSelect(selDoc, 'tradutores');
    }

    if (formDocEquipaRevisores) {
        const selDoc2 = formDocEquipaRevisores.querySelector('select[name="documento_id"]');
        carregarDocumentosSelect(selDoc2, 'revisores');
    }


    renderTabela(tbody,
        equipas.map(e => `
            <tr>
                <td>#${formatarId(e.id_equipa)}</td>
                <td>${e.nome_equipa}</td>
                <td>${e.tipo.charAt(0).toUpperCase() + e.tipo.slice(1)}</td>
                <td>${e.membros || 'Não tem membros associados'}</td>
                <td>${e.linguas || 'Não tem linguas'}</td>
                <td>${e.documentos || 'Não tem documento associados'}</td>
                <td>
                    <span class="badge bg-${e.ocupada ? 'danger' : 'success'}">
                        ${e.ocupada ? 'Ocupada' : 'Livre'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary btn-alterar-equipa"
                        onclick="abrirFormAlterar(${e.id_equipa}, this, 'equipa')">
                        Alterar Equipa
                    </button>
                    ${!e.documentos || e.documentos === 0 ? `
                    <button class="btn btn-sm btn-danger"
                        onclick="eliminar(${e.id_equipa}, 'equipa')">
                        Eliminar
                    </button>` : ''}
                </td>
            </tr>
        `),
        'Nenhuma equipa encontrada.',
        7
    );
}

async function carregarEquipasSelect(select) {
    const equipas = await apiFetch('/api/admin/equipas');

    select.innerHTML = `<option value="">Selecionar equipa</option>`;
    equipas.forEach(e => {
        select.innerHTML += `
            <option value="${e.id_equipa}" data-tipo="${e.tipo}">
                ${e.nome_equipa}
            </option>
        `;
    });
}

async function carregarEquipasLivres(select, tipo) {
    const equipas = await apiFetch('/api/admin/equipas');
    const linguasDoc = JSON.parse(select.dataset.linguasDocumento || '[]');

    const equipasFiltradas = equipas.filter(e => {
        if (e.tipo !== tipo) return false;
        if (e.ocupada) return false;
        if (!linguasDoc.length) return true;
        if (!e.siglas_linguas) return false;

        const linguasEquipa = e.siglas_linguas.split(',').map(l => l.trim());
        return linguasDoc.every(l => linguasEquipa.includes(l));
    });

    const valorAtual = select.value;

    select.innerHTML = '';

    if (equipasFiltradas.length === 0) {
        select.innerHTML = `<option value="">Nenhuma equipa encontrada</option>`;
        select.disabled = true;
        return;
    }

    select.innerHTML = `<option value="">Selecionar equipa livre</option>`;
    equipasFiltradas.forEach(e => {
        select.innerHTML += `
            <option value="${e.id_equipa}">
                ${e.nome_equipa} (${e.siglas_linguas})
            </option>
        `;
    });

    if (equipasFiltradas.some(e => e.id_equipa == valorAtual)) {
        select.value = valorAtual;
    } else {
        select.value = '';
    }

    select.disabled = false;
}



async function carregarResponsaveisPorEquipa(selectResponsavel, equipaId) {
    if (!equipaId) {
        selectResponsavel.innerHTML = '<option value="">Selecionar responsável</option>';
        selectResponsavel.disabled = true;
        return;
    }

    const equipa = await apiFetch(`/api/admin/equipas/${equipaId}`);

    const membros = Array.isArray(equipa.membros)
        ? equipa.membros
        : JSON.parse(equipa.membros || '[]');

    selectResponsavel.innerHTML = '<option value="">Selecionar responsável</option>';

    membros.forEach(m => {
        selectResponsavel.innerHTML += `
            <option value="${m.id_conta}">
                ${m.nome_utilizador} (${m.lingua_principal}${m.lingua_secundaria ? ' / ' + m.lingua_secundaria : ''})
            </option>
        `;
    });

    selectResponsavel.disabled = membros.length === 0;
}

/* =========================
   UTILIZADORES
========================= */

async function carregarUtilizadoresPorTipo(select, tipo) {
    const [users, equipas] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/equipas')
    ]);

    const cargoId = tipo === 'tradutores' ? 3 : 4;

    const idsEmEquipa = new Set();
    equipas.forEach(e => {
        if (e.membros) {
            e.membros.split(',').forEach(nome => {
                const u = users.find(u => u.nome_utilizador === nome.trim());
                if (u) idsEmEquipa.add(u.id_conta);
            });
        }
    });

    const utilizadoresFiltrados = users.filter(u => u.cargo_id === cargoId && !idsEmEquipa.has(u.id_conta));

    select.innerHTML = '';

    if (utilizadoresFiltrados.length === 0) {
        select.innerHTML = `<option value="">Nenhum utilizador disponível</option>`;
        select.disabled = true;
        return;
    }

    select.innerHTML = `<option value="">Selecionar utilizador</option>`;
    utilizadoresFiltrados.forEach(u => {
        select.innerHTML += `
            <option value="${u.id_conta}">
                ${u.nome_utilizador}
            </option>
        `;
    });

    select.disabled = false;
}


/* =========================
   DOCUMENTOS
========================= */

async function onDocumentoChange(selectDoc, selectEquipa, tipo) {
    const docId = selectDoc.value;

    if (!docId) {
        selectEquipa.innerHTML = `<option value="">Selecionar documento primeiro</option>`;
        selectEquipa.disabled = true;

        const form = selectEquipa.closest('form');
        const responsavel = form?.querySelector('select[name="responsavel_id"]');
        if (responsavel) {
            responsavel.innerHTML = `<option value="">Selecionar equipa primeiro</option>`;
            responsavel.disabled = true;
        }
        return;
    }

    const doc = await apiFetch(`/api/admin/documentos/${docId}`);

    selectEquipa.dataset.linguasDocumento = JSON.stringify([doc.lingua_origem, doc.lingua_destino]);

    await carregarEquipasLivres(selectEquipa, tipo);

    selectEquipa.disabled = selectEquipa.options.length <= 1;

    const form = selectEquipa.closest('form');
    const responsavel = form?.querySelector('select[name="responsavel_id"]');
    if (responsavel) {
        if (!selectEquipa.value) {
            responsavel.innerHTML = `<option value="">Selecionar equipa primeiro</option>`;
            responsavel.disabled = true;
        } else {
            await carregarResponsaveisPorEquipa(responsavel, selectEquipa.value);
        }
    }
}



async function carregarDocumentosSelect(select, tipo) {
    const docs = await apiFetch('/api/admin/documentos');

    select.innerHTML = `<option value="">Selecionar documento</option>`;

    const filtrados = (tipo === 'tradutores')
        ? docs.filter(d => d.estado === 'pago')
        : docs.filter(d => d.estado === 'traduzido');

    filtrados.forEach(d => {
        select.innerHTML += `
            <option value="${d.id_documento}">
                #TRX-${String(d.id_documento).padStart(4, '0')} - ${d.nome_documento} (${d.lingua_origem} → ${d.lingua_destino})
            </option>
        `;
    });
    
    if (filtrados.length === 0) {
        select.innerHTML = `<option value="">Nenhum documento disponível</option>`;
        select.disabled = true;
    } else {
        select.disabled = false;
    }
}


/* =========================
   ELIMINAR
========================= */

document.getElementById('btn-remover-membros').addEventListener('click', async () => {
    const form = document.getElementById('form-alterar-equipa');

    if (!form.id_equipa.value) return;
    if (!confirm('Confirmar eliminação?')) return;

    const lista = document.getElementById('lista-membros');
    const btn = document.getElementById('btn-remover-membros');

    const checkboxes = document.querySelectorAll('#lista-membros input[type="checkbox"]:checked');

    for (const cb of checkboxes) {
        await apiFetch(`/api/admin/equipas/${form.id_equipa.value}/utilizadores/${cb.value}`, {
            method: 'DELETE' 
        });
        cb.closest('li').remove();
    }

    carregarTudo();

    const restantes = lista.querySelectorAll('input[type="checkbox"]');

    if (restantes.length === 0) {
        const li = document.createElement('li');
        li.className = 'list-group-item text-muted fst-italic';
        li.textContent = 'Esta equipa não tem membros associados.';
        lista.appendChild(li);

        btn.disabled = true;
    }
});

document.getElementById('btn-remover-documentos').addEventListener('click', async () => {
    const form = document.getElementById('form-alterar-equipa');

    if (!form.id_equipa.value) return;
    if (!confirm('Confirmar eliminação?')) return;

    const lista = document.getElementById('lista-documentos');
    const btn = document.getElementById('btn-remover-documentos');

    const checkboxes = document.querySelectorAll('#lista-documentos input[type="checkbox"]:checked');

    for (const cb of checkboxes) {
        await apiFetch(`/api/admin/documentos/${cb.value}/desassociar`, {
            method: 'DELETE',
            body: JSON.stringify({ equipa: form.id_equipa.value })
        });
        cb.closest('li').remove();
    }

    carregarTudo();

    const restantes = lista.querySelectorAll('input[type="checkbox"]');

    if (restantes.length === 0) {
        const li = document.createElement('li');
        li.className = 'list-group-item text-muted fst-italic';
        li.textContent = 'Não existem documentos associados a esta equipa.';
        lista.appendChild(li);

        btn.disabled = true;
    }
});
