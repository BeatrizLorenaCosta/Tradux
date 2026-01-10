/* =========================
   INIT
========================= */

document.addEventListener('DOMContentLoaded', () => {
    sairLogin();
    inicializarSidebar();
    carregarTudo();
});

/* =========================
   HELPERS
========================= */

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) sairLogin();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        headers: getAuthHeaders(),
        ...options
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erro na operação');
    }
    return res.json();
}

const formatarId = id => String(id).padStart(4, '0');

const formatarData = data =>
    new Date(data).toLocaleString('pt-PT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

function mapEstado(estado) {
    const map = {
        em_analise: ['Em Análise', 'secondary'],
        em_traducao: ['Em Tradução', 'warning'],
        em_revisao: ['Em Revisão', 'info'],
        traduzido: ['Traduzido', 'primary'],
        finalizado: ['Finalizado', 'success'],
        a_pagar: ['A Pagar', 'danger'],
        pago: ['Pago', 'dark'],
        cancelado: ['Cancelado', 'light']
    };
    return map[estado] || ['Desconhecido', 'secondary'];
}

function renderTabela(tbody, rows, vazio, colspan) {
    tbody.innerHTML = rows.length
        ? rows.join('')
        : `<tr><td colspan="${colspan}" class="text-center text-muted">${vazio}</td></tr>`;
}

function idFormatado(id) {
    return String(id).padStart(4, '0');
}

/* =========================
   LOAD GERAL
========================= */

async function carregarTudo() {
    await Promise.all([
        carregarNomeAdmin(),
        carregarEstatisticasAdmin(),
        carregarUtilizadores(),
        carregarEquipas(),
        carregarDocumentos(),
        carregarDocumentosRecentes()
    ]);

    const formEquipaUser = document.getElementById('form-equipa-utilizador');
    const formDocEquipaTradutores = document.getElementById('form-doc-equipa-tradutores');
    const formDocEquipaRevisores = document.getElementById('form-doc-equipa-revisores');

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
        const selTrad = formDocEquipaTradutores.querySelector('select[name="equipa_id"]');
        carregarDocumentosSelect(selDoc, 'tradutores');
        carregarEquipasLivres(selTrad, 'tradutores');
    }

    if (formDocEquipaRevisores) {
        const selDoc2 = formDocEquipaRevisores.querySelector('select[name="documento_id"]');
        const selRev = formDocEquipaRevisores.querySelector('select[name="equipa_id"]');
        carregarDocumentosSelect(selDoc2, 'revisores');
        carregarEquipasLivres(selRev, 'revisores');
    }
}

/* =========================
   SIDEBAR
========================= */

function inicializarSidebar() {
    document.querySelectorAll('[data-section-id]').forEach(item => {
        item.addEventListener('click', () => {
            document.getElementById('adminPageTitle').textContent = item.textContent.trim();
            document.querySelectorAll('#adminSidebar .nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.admin-page').forEach(p => p.style.display = 'none');
            document.getElementById(item.dataset.sectionId).style.display = 'block';
            
        });
    });
    document.getElementById('adminMenuToggle')?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.toggle('active');
    });
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
   ADMIN
========================= */

async function carregarNomeAdmin() {
    const a = await apiFetch('/api/admin/me');
    document.getElementById('adminNameDisplay').textContent = `Olá, ${a.nome_utilizador}`;
    const nome = a.nome_utilizador.trim();
    const partes = nome.split(/\s+/);
    let iniciais = '';
    if (partes.length >= 2) iniciais = partes[0][0] + partes[1][0];
    else iniciais = nome.substring(0, 2);
    document.querySelector('.user-avatar').textContent = iniciais.toUpperCase();
}

async function carregarEstatisticasAdmin() {
    const s = await apiFetch('/api/admin/estatisticas');
    document.getElementById('documentos-hoje').textContent = s.documentos_hoje;
    document.getElementById('total_documentos').textContent = s.total_documentos;
    document.getElementById('total_utilizadores').textContent = s.total_utilizadores;
    document.getElementById('documentos-em-analise').textContent = s.documentos_em_analise;
}

/* =========================
   UTILIZADORES
========================= */

async function carregarUtilizadores() {
    const users = await apiFetch('/api/admin/users');
    const tbody = document.querySelector('#utilizadores tbody');

    renderTabela(tbody,
        users.map(u => `
            <tr>
                <td>#${formatarId(u.id_conta)}</td>
                <td>${u.nome_utilizador}</td>
                <td>${u.email}</td>
                <td>${u.username}</td>
                <td>${u.nome_cargo}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-alterar-cargo"
                        onclick="abrirFormAlterar(${u.id_conta}, this, 'cargo')">
                        Alterar Cargo
                    </button>
                    <button class="btn btn-sm btn-danger"
                        onclick="eliminar(${u.id_conta}, 'user')">
                        Eliminar
                    </button>
                </td>
            </tr>
        `),
        'Nenhum utilizador encontrado.',
        6
    );
}

async function carregarCargos() {
    const cargos = await apiFetch('/api/admin/cargos');
    const select = document.querySelector('#form-alterar-cargo select');
    select.innerHTML = '<option value="">Selecionar</option>';
    cargos.forEach(c =>
        select.innerHTML += `<option value="${c.id_cargo}">${c.nome_cargo}</option>`
    );
}

async function carregarUtilizadoresPorTipo(select, tipo) {
    const users = await apiFetch('/api/admin/users');
    const cargoId = tipo === 'tradutores' ? 3 : 4;

    select.innerHTML = `<option value="">Selecionar</option>`;
    users
        .filter(u => u.cargo_id === cargoId)
        .forEach(u => {
            select.innerHTML += `
                <option value="${u.id_conta}">
                    ${u.nome_utilizador}
                </option>
            `;
        });
}

/* =========================
   EQUIPAS
========================= */

async function carregarEquipas() {
    const equipas = await apiFetch('/api/admin/equipas');
    const tbody = document.querySelector('#equipas tbody');

    renderTabela(tbody,
        equipas.map(e => `
            <tr>
                <td>#${formatarId(e.id_equipa)}</td>
                <td>${e.nome_equipa}</td>
                <td>${e.tipo}</td>
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
                    <button class="btn btn-sm btn-danger"
                        onclick="eliminar(${e.id_equipa}, 'equipa')">
                        Eliminar
                    </button>
                </td>
            </tr>
        `),
        'Nenhuma equipa encontrada.',
        7
    );
}

async function carregarEquipasSelect(select) {
    const equipas = await apiFetch('/api/admin/equipas');

    select.innerHTML = `<option value="">Selecionar</option>`;
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
    console.log(linguasDoc);

    select.innerHTML = `<option value="">Selecionar</option>`;

    equipas
        .filter(e => {
            if (e.tipo !== tipo) return false;
            if (e.ocupada) return false;
            if (!linguasDoc.length) return true;

                // se o documento não tem linguas definidas, não filtra
                if (!linguasDoc.length || !e.siglas_linguas) return true;

            const linguasEquipa = e.siglas_linguas
                .split(',')
                .map(l => l.trim());

            // equipa tem TODAS as linguas do documento?
            return linguasDoc.every(l => linguasEquipa.includes(l));
        })
        .forEach(e => {
            select.innerHTML += `
                <option value="${e.id_equipa}">
                    ${e.nome_equipa} (${e.siglas_linguas})
                </option>
            `;
        });
}

/* =========================
   DOCUMENTOS
========================= */

async function onDocumentoChange(selectDoc, selectEquipa, tipo) {
    const docId = selectDoc.value;
    if (!docId) {
        selectEquipa.innerHTML = `<option value="">Selecionar</option>`;
        return;
    }

    const doc = await apiFetch(`/api/admin/documentos/${docId}`);

    selectEquipa.dataset.linguasDocumento = JSON.stringify([
        doc.lingua_origem,
        doc.lingua_destino
    ]);

    await carregarEquipasLivres(selectEquipa, tipo);
}


async function carregarDocumentosRecentes() {
    const docs = await apiFetch('/api/admin/ultimos-documentos');
    const tbody = document.querySelector('#ultimos-documentos tbody');

    renderTabela(tbody,
        docs.map(d => {
            const [l, c] = mapEstado(d.estado);
            return `
            <tr>
                <td>#TRX-${formatarId(d.id_documento)}</td>
                <td>${d.cliente_nome}</td>
                <td>${d.lingua_origem} → ${d.lingua_destino}</td>
                <td><span class="badge bg-${c} ${c === 'light' ? 'text-dark' : ''}">${l}</span></td>
                <td>${formatarData(d.data_envio)}</td>
            </tr>`;
        }),
        'Nenhum documento encontrado.',
        4
    );
}

async function carregarDocumentos() {
    const docs = await apiFetch('/api/admin/documentos');
    const tbody = document.querySelector('#documentos tbody');

    renderTabela(tbody,
        docs.map(d => {
            const [l, c] = mapEstado(d.estado);
            return `
            <tr>
                <td>#TRX-${formatarId(d.id_documento)}</td>
                <td>${d.cliente_nome}</td>
                <td>${d.lingua_origem} → ${d.lingua_destino}</td>
                <td><span class="badge bg-${c} ${c === 'light' ? 'text-dark' : ''}">${l}</span></td>
                <td>${d.equipas || 'Não tem equipas associadas'}</td>
                <td>${d.valor ? d.valor + '€' : 'Não tem valor'}</td>
                <td>${formatarData(d.data_envio)}</td>
                <td>
                    ${d.estado === 'em_analise'
                        ? `<button class="btn btn-sm btn-primary btn-alterar-valor"
                            onclick="abrirFormAlterar(${d.id_documento}, this, 'valor')">
                            Alterar Valor
                          </button>` : ''}
                    ${d.estado === 'cancelado'
                        ? `<button class="btn btn-sm btn-danger"
                            onclick="eliminar(${d.id_documento}, 'documento')">
                            Eliminar
                          </button>` : ''}
                </td>
            </tr>`;
        }),
        'Nenhum documento encontrado.',
        8
    );
}

async function carregarDocumentosSelect(select, tipo) {
    const docs = await apiFetch('/api/admin/documentos');

    select.innerHTML = `<option value="">Selecionar</option>`;

    if (tipo === 'tradutores') {
        docs
        .filter(d => d.estado === 'pago')
        .forEach(d => {
            select.innerHTML += `
                <option value="${d.id_documento}">
                    #TRX-${String(d.id_documento).padStart(4, '0')} - ${d.nome_documento} (${d.lingua_origem} → ${d.lingua_destino})
                </option>
            `;
        });
    } else if (tipo === 'revisores') {
        docs
        .filter(d => d.estado === 'traduzido')
        .forEach(d => {
            select.innerHTML += `
                <option value="${d.id_documento}">
                    #TRX-${String(d.id_documento).padStart(4, '0')} - ${d.nome_documento} (${d.lingua_origem} → ${d.lingua_destino})
                </option>
            `;
        });
    }
}


/* =========================
   ALTERAR (FORM)
========================= */

async function abrirFormAlterar(id, btn, tipo) {
    const wrapper = document.getElementById(`form-alterar-${tipo}-wrapper`);
    const form = document.getElementById(`form-alterar-${tipo}`);

    const jaAberto = btn.dataset.open === 'true';
    fecharTodosOsForms();
    if (jaAberto) return;

    // Se estava aberto, fecha e sai
    if (btn.dataset.open === 'true') {
        wrapper.style.display = 'none';
        btn.textContent = tipo === 'valor' ? 'Alterar Valor' : 'Alterar Cargo';
        btn.textContent = tipo === 'cargo' ? 'Alterar Cargo' : 'Alterar Equipa';
        delete btn.dataset.open;
        return;
    }

    // Fechar todos os forms do tipo
    document.querySelectorAll(`.btn-alterar-${tipo}`).forEach(btn => {
        btn.textContent = tipo === 'valor' ? 'Alterar Valor' : 'Alterar Cargo';
        btn.textContent = tipo === 'cargo' ? 'Alterar Cargo' : 'Alterar Equipa';
        btn.dataset.open = 'false';
        delete btn.dataset.open;
    });

    if (tipo === 'valor') {
        const d = await apiFetch(`/api/admin/documentos/${id}`);
        form.id_documento.value = id;
        form.nome_documento.value = `#TRX-${idFormatado(id)} - ${d.nome_documento} (${d.lingua_origem} → ${d.lingua_destino})`;
        form.valor.value = d.valor || '';
    }

    if (tipo === 'cargo') {
        await carregarCargos();
        const u = await apiFetch(`/api/admin/users/${id}`);
        form.id_conta.value = id;
        form.nome_utilizador.value = u.nome_utilizador;
        form.cargo_id.value = u.cargo_id;
    }

    if (tipo === 'equipa') {
        const e = await apiFetch(`/api/admin/equipas/${id}`);
        form.id_equipa.value = id;
        form.nome_equipa.value = e.nome_equipa;

        const listaMembros = document.getElementById('lista-membros');
        const listaDocs = document.getElementById('lista-documentos');
        listaMembros.innerHTML = '';
        listaDocs.innerHTML = '';

        document.getElementById('btn-remover-membros').disabled = !e.membros.length;
        document.getElementById('btn-remover-documentos').disabled = !e.documentos.length;

        // Membros
        if (!e.membros || e.membros.length === 0) {
            const li = document.createElement('li');
            li.className = 'list-group-item text-muted fst-italic';
            li.textContent = 'Esta equipa não tem membros associados.';
            listaMembros.appendChild(li);
            
        } else {

            e.membros.forEach(m => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.innerHTML = `
                    <div class="form-check">
                        <input class="form-check-input me-2" type="checkbox" value="${m.id_conta}" id="membro-${m.id_conta}">
                        <label class="form-check-label" for="membro-${m.id_conta}">
                            ${m.nome_utilizador}
                        </label>
                    </div>
                `;
                listaMembros.appendChild(li);
            });
        }
        
        // Documentos
        if (!e.documentos || e.documentos.length === 0) {
            const li = document.createElement('li');
            li.className = 'list-group-item text-muted fst-italic';
            li.textContent = 'Não existem documentos associados a esta equipa.';
            listaDocs.appendChild(li);
            
        } else {
            e.documentos.forEach(d => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.innerHTML = `
                    <div class="form-check">
                        <input class="form-check-input me-2" type="checkbox" value="${d.id_documento}" id="doc-${d.id_documento}" >
                        <label class="form-check-label" for="doc-${d.id_documento}">
                            #TRX-${idFormatado(d.id_documento)} - ${d.nome_documento}
                        </label>
                    </div>
                `;
                listaDocs.appendChild(li);
            });
        }
    }

    wrapper.style.display = 'block';
    btn.textContent = 'Fechar Formulário';
    btn.dataset.open = 'true';
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

// form-doc-equipa-tradutores: primeiro select = documento, segundo select = equipa
initCamposDependentes(
    'form-doc-equipa-tradutores',
    'select[name="documento_id"]',
    'select[name="equipa_id"]',
    (equipaSel, docSel) => onDocumentoChange(docSel, equipaSel, 'tradutores')
);

initCamposDependentes(
    'form-doc-equipa-revisores',
    'select[name="documento_id"]',
    'select[name="equipa_id"]',
    (equipaSel, docSel) => onDocumentoChange(docSel, equipaSel, 'revisores')
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
formDocEquipaTradutores && carregarEquipasLivres(formDocEquipaTradutores.querySelector('select[name="equipa_id"]'), 'tradutores');
formDocEquipaRevisores && carregarDocumentosSelect(formDocEquipaRevisores.querySelector('select[name="documento_id"]'), 'revisores');
formDocEquipaRevisores && carregarEquipasLivres(formDocEquipaRevisores.querySelector('select[name="equipa_id"]'), 'revisores');

/* -------------------------
   SUBMITS
------------------------- */

document.getElementById('form-alterar-valor')?.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelectorAll('.btn-alterar-valor').forEach(btn => {
        btn.textContent = 'Alterar Valor';
        delete btn.dataset.open;
    });

    await apiFetch(`/api/admin/documentos/${e.target.id_documento.value}/valor`, {
        method: 'PUT',
        body: JSON.stringify({ valor: e.target.valor.value })
    });
    await apiFetch(`/api/admin/documentos/${e.target.id_documento.value}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'em_analise' })
    });
    carregarDocumentos();
    document.getElementById('form-alterar-valor-wrapper').style.display = 'none';
});

document.getElementById('form-alterar-cargo')?.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelectorAll('.btn-alterar-cargo').forEach(btn => {
        btn.textContent = 'Alterar Cargo';
        delete btn.dataset.open;
    });

    await apiFetch(`/api/admin/users/${e.target.id_conta.value}/cargo`, {
        method: 'PUT',
        body: JSON.stringify({ cargo_id: e.target.cargo_id.value })
    });
    carregarUtilizadores();
    document.getElementById('form-alterar-cargo-wrapper').style.display = 'none';
});

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

    await apiFetch('/api/admin/documentos/associar', { method:'POST', body:JSON.stringify({ documento_id: formDocEquipaTradutores.documento_id.value, equipa: formDocEquipaTradutores.equipa_id.value }) });
    await apiFetch(`/api/admin/documentos/${formDocEquipaTradutores.documento_id.value}/estado`, { method:'PUT', body:JSON.stringify({ estado:'pago' }) });

    formDocEquipaTradutores.reset();
    carregarTudo();
    carregarDocumentosSelect(formDocEquipaTradutores.querySelector('select[name="documento_id"]'), 'tradutores');
    carregarEquipasLivres(formDocEquipaTradutores.querySelector('select[name="equipa_id"]'), 'tradutores');

    document.getElementById('form-doc-equipa-tradutores-wrapper').style.display = estaAberto ? 'none' : 'block';
    document.getElementById('toggle-form-doc-equipa-tradutores').textContent = estaAberto ? '+ Associar Documento a Equipa de Tradutores':'Fechar Formulário';
});

formDocEquipaRevisores?.addEventListener('submit', async e => {
    e.preventDefault();
    const estaAberto = document.getElementById('form-doc-equipa-revisores-wrapper').style.display === 'block';

    await apiFetch('/api/admin/documentos/associar', { method:'POST', body:JSON.stringify({ documento_id: formDocEquipaRevisores.documento_id.value, equipa: formDocEquipaRevisores.equipa_id.value }) });
    await apiFetch(`/api/admin/documentos/${formDocEquipaRevisores.documento_id.value}/estado`, { method:'PUT', body:JSON.stringify({ estado:'traduzido' }) });

    formDocEquipaRevisores.reset();
    carregarTudo();
    carregarDocumentosSelect(formDocEquipaRevisores.querySelector('select[name="documento_id"]'), 'revisores');
    carregarEquipasLivres(formDocEquipaRevisores.querySelector('select[name="equipa_id"]'), 'revisores');

    document.getElementById('form-doc-equipa-revisores-wrapper').style.display = estaAberto ? 'none' : 'block';
    document.getElementById('toggle-form-doc-equipa-revisores').textContent = estaAberto ? '+ Associar Documento a Equipa de Revisores':'Fechar Formulário';
});

/* =========================
   ELIMINAR
========================= */

async function eliminar(id, tipo) {
    if (!confirm('Confirmar eliminação?')) return;
    await apiFetch(`/api/admin/${tipo}s/${id}`, { method: 'DELETE' });
    carregarTudo();
}

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


/* =========================
   LOGOUT
========================= */

function sairLogin() {
    document.getElementById('logoutUserBtn')
        ?.addEventListener('click', () => {
            localStorage.clear();
            location.href = 'login-signup.html';
        });
}
