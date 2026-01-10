document.addEventListener('DOMContentLoaded', () => {
    carregarTudo();
    inicializarSidebar();
    sairLogin();
});

/* =========================
   HELPERS GERAIS
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

function renderTabela(tbody, rows, vazioMsg, colSpan) {
    tbody.innerHTML = rows.length
        ? rows.join('')
        : `<tr><td colspan="${colSpan}" class="text-center text-muted">${vazioMsg}</td></tr>`;
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

        forms.forEach(other => {
            const w = document.getElementById(other.wrapperId);
            const b = document.getElementById(other.btnId);
            if (w !== wrapper) {
                w.style.display = 'none';
                b.textContent = other.textoAberto;
            }
        });

        wrapper.style.display = estaAberto ? 'none' : 'block';
        btn.textContent = estaAberto ? f.textoAberto : f.textoFechado;
    });
});

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
   CARREGAMENTO INICIAL
========================= */

async function carregarTudo() {
    await Promise.all([
        carregarNomeAdmin(),
        carregarEstatisticasAdmin(),
        carregarDocumentosRecentes(),
        carregarDocumentos(),
        carregarUtilizadores(),
        carregarEquipas(),
        inicializarSidebar()
    ]);
}

async function carregarNomeAdmin() {
    const admin = await apiFetch('/api/admin/me');

    document.getElementById('adminNameDisplay').textContent =
            `Olá, ${admin.nome_utilizador}`;

    const nome = admin.nome_utilizador.trim();
        const partes = nome.split(/\s+/);
        let iniciais = '';

        if (partes.length >= 2) {
            iniciais = partes[0][0] + partes[1][0];
        } else {
            iniciais = nome.substring(0, 2);
        }

        document.querySelector('.user-avatar').textContent = iniciais.toUpperCase();
}

async function carregarEstatisticasAdmin() {
    const stats = await apiFetch('/api/admin/estatisticas');

    document.getElementById('documentos-hoje').textContent =
        stats.documentos_hoje;
    document.getElementById('total_documentos').textContent =
        stats.total_documentos;
    document.getElementById('total_utilizadores').textContent =
        stats.total_utilizadores;
    document.getElementById('documentos-em-analise').textContent =
        stats.documentos_em_analise;
    
}

async function carregarCargos() {
    const cargos = await apiFetch('/api/admin/cargos');
     const select = document.querySelector('#form-alterar-cargo select');

    select.innerHTML = '<option value="">Selecionar</option>';
    
    cargos.forEach(cargo => {
        select.innerHTML += `
            <option value="${cargo.id_cargo}">
                ${cargo.nome_cargo}
            </option>
        `;
    });
}


/* =========================
   DOCUMENTOS
========================= */

async function carregarDocumentosRecentes() {
    const docs = await apiFetch('/api/admin/ultimos-documentos');
    const tbody = document.querySelector('#ultimos-documentos tbody');

    const rows = docs.map(d => {
        const [label, cor] = mapEstado(d.estado);
        return `
        <tr>
            <td>#TRX-${formatarId(d.id_documento)}</td>
            <td>${d.cliente_nome}</td>
            <td>${d.lingua_origem} → ${d.lingua_destino}</td>
            <td><span class="badge bg-${cor} ${cor === 'light' ? 'text-dark' : ''}">${label}</span></td>
            <td>${formatarData(d.data_envio)}</td>
        </tr>`;
    });

    renderTabela(tbody, rows, 'Nenhum documento encontrado.', 5);
}

async function carregarDocumentos() {
    const docs = await apiFetch('/api/admin/documentos');
    const tbody = document.querySelector('#documentos tbody');

    const rows = docs.map(d => {
        const [label, cor] = mapEstado(d.estado);
        const btnEliminar = d.estado === 'cancelado'
            ? `<button class="btn btn-sm btn-danger" onclick="eliminar(${d.id_documento}, 'documento')">Eliminar</button>`
            : '';
        const btnAlterarValor = d.estado === 'em_analise'
            ? `<button class="btn btn-sm btn-primary btn-alterar-valor" onclick="abrirFormAlterar(${d.id_documento}, this, 'valor')"> Alterar Valor</button>`
            : '';

        return `
        <tr>
            <td>#TRX-${formatarId(d.id_documento)}</td>
            <td>${d.cliente_nome}</td>
            <td>${d.lingua_origem} → ${d.lingua_destino}</td>
            <td><span class="badge bg-${cor} ${cor === 'light' ? 'text-dark' : ''}">${label}</span></td>
            <td>${d.equipas || '—'}</td>
            <td>${formatarData(d.data_envio)}</td>
            <td>${d.valor ? d.valor + '€' : '—'}</td>
            <td>
                ${btnAlterarValor}
                ${btnEliminar}
            </td>
        </tr>`;
    });

    renderTabela(tbody, rows, 'Nenhum documento encontrado.', 8);
}


/* =========================
   UTILIZADORES / EQUIPAS
========================= */

async function carregarUtilizadores() {
    const users = await apiFetch('/api/admin/users');
    const tbody = document.querySelector('#utilizadores tbody');

    const rows = users.map(u => `
        <tr>
            <td>#${formatarId(u.id_conta)}</td>
            <td>${u.nome_utilizador}</td>
            <td>${u.email}</td>
            <td>${u.username}</td>
            <td>${u.nome_cargo}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-alterar-cargo" onclick="abrirFormAlterar(${u.id_conta}, this, 'cargo')">
                    Alterar Cargo
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminar(${u.id_conta}, 'utilizador')">
                    Eliminar
                </button>
            </td>
        </tr>`);

    renderTabela(tbody, rows, 'Nenhum utilizador encontrado.', 6);
}

async function carregarEquipas() {
    const equipas = await apiFetch('/api/admin/equipas');
    const tbody = document.querySelector('#equipas tbody');

    const rows = equipas.map(e => `
        <tr>
            <td>#${formatarId(e.id_equipa)}</td>
            <td>${e.nome_equipa}</td>
            <td>${e.tipo}</td>
            <td>${e.membros || '—'}</td>
            <td>${e.linguas || '—'}</td>
            <td>${e.documentos || '—'}</td>
            <td>
                <span class="badge bg-${e.ocupada ? 'danger' : 'success'}">
                    ${e.ocupada ? 'Ocupada' : 'Livre'}
                </span>
            </td>
             <td>
                <button class="btn btn-sm btn-primary btn-alterar-equipa" onclick="abrirFormAlterar(${e.id_equipa}, this, 'equipa')">
                    Alterar Equipa
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminar(${e.id_equipa}, 'equipa')">
                    Eliminar Equipa
                </button>
            </td>
        </tr>`);

    renderTabela(tbody, rows, 'Nenhuma equipa encontrada.', 7);
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

async function carregarEquipasLivres(select, tipo) {
    const equipas = await apiFetch('/api/admin/equipas');

    select.innerHTML = `<option value="">Selecionar</option>`;
    equipas
        .filter(e => e.tipo === tipo && !e.ocupada)
        .forEach(e => {
            select.innerHTML += `
                <option value="${e.id_equipa}">
                    ${e.nome_equipa} (${e.siglas_linguas ? e.siglas_linguas : '—'})
                </option>
            `;
        });
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
   CRIAR
========================= */

document.getElementById('form-criar-equipa')
    ?.addEventListener('submit', async e => {
        e.preventDefault();

        const form = e.target;
        const tipo = form.querySelector('select').value;
        const nome_equipa = form.querySelector('input').value.trim();

        const wrapper = document.getElementById('form-criar-equipa-wrapper');
        const btn = document.getElementById('toggle-form-criar-equipa');
        const estaAberto = wrapper.style.display === 'block';

        try {
            await apiFetch('/api/admin/equipas', {
                method: 'POST',
                body: JSON.stringify({ nome_equipa, tipo })
            });

            form.reset();
            carregarEquipas();
            alert('Equipa criada com sucesso');

            wrapper.style.display = estaAberto ? 'none' : 'block';
            btn.textContent = estaAberto ? '+ Criar Equipa': 'Fechar Formulário';

        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });
    

const formEquipaUser = document.getElementById('form-equipa-utilizador');
const formDocEquipaTradutores = document.getElementById('form-doc-equipa-tradutores');
const formDocEquipaRevisores = document.getElementById('form-doc-equipa-revisores');

if (formEquipaUser) {
    const selectEquipa = formEquipaUser.querySelectorAll('select')[0];
    const selectUser = formEquipaUser.querySelectorAll('select')[1];

    carregarEquipasSelect(selectEquipa);

    selectEquipa.addEventListener('change', e => {
        const tipo = e.target.selectedOptions[0].dataset.tipo;
        carregarUtilizadoresPorTipo(selectUser, tipo);
    });

    formEquipaUser.addEventListener('submit', async e => {
        e.preventDefault();

        const equipaId = selectEquipa.value;
        const conta_id = selectUser.value;

        const wrapper = document.getElementById('form-equipa-utilizador-wrapper');
        const btn = document.getElementById('toggle-form-equipa-utilizador');
        const estaAberto = wrapper.style.display === 'block';

        try {

            await apiFetch(`/api/admin/equipas/${equipaId}/utilizadores`, {
                method: 'POST',
                body: JSON.stringify({ conta_id })
            });

            formEquipaUser.reset();

            carregarTudo();
            carregarEquipasSelect(selectEquipa);
            alert('Utilizador adicionado à equipa');

            wrapper.style.display = estaAberto ? 'none' : 'block';
            btn.textContent = estaAberto ? '+ Adicionar Utilizador à Equipa': 'Fechar Formulário';
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });
}


if (formDocEquipaTradutores) {
    const selects = formDocEquipaTradutores.querySelectorAll('select');

    const selDoc = selects[0];
    const selTrad = selects[1];

    carregarDocumentosSelect(selDoc, 'tradutores');
    carregarEquipasLivres(selTrad, 'tradutores');

   formDocEquipaTradutores.addEventListener('submit', async e => {
        e.preventDefault();

        const documentoId = selDoc.value;
        const equipaId = selTrad.value;

        const wrapper = document.getElementById('form-doc-equipa-tradutores-wrapper');
        const btn = document.getElementById('toggle-form-doc-equipa-tradutores');
        const estaAberto = wrapper.style.display === 'block';

        try {
            await apiFetch('/api/admin/documentos/associar', {
                method: 'POST',
                body: JSON.stringify({ documento_id: documentoId, equipa: equipaId })
            });

            await apiFetch(`/api/admin/documentos/${documentoId}/estado`, {
                method: 'PUT',
                body: JSON.stringify({ estado: 'pago' })
            });

            formDocEquipaTradutores.reset();
            carregarTudo();
            carregarDocumentosSelect(selDoc, 'tradutores');
            carregarEquipasLivres(selTrad, 'tradutores');
            alert('Documento associado à equipa de tradutores.');

            wrapper.style.display = estaAberto ? 'none' : 'block';
            btn.textContent = estaAberto ? '+ Associar Documento a Equipa de Tradutores': 'Fechar Formulário';
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });

}

if (formDocEquipaRevisores) {
    const selects = formDocEquipaRevisores.querySelectorAll('select');

    const selDoc = selects[0];
    const selRev = selects[1];

    carregarDocumentosSelect(selDoc, 'revisores');
    carregarEquipasLivres(selRev, 'revisores');

    formDocEquipaRevisores.addEventListener('submit', async e => {
        e.preventDefault();

        const documentoId = selDoc.value;
        const equipaId = selRev.value;

        const wrapper = document.getElementById('form-doc-equipa-revisores-wrapper');
        const btn = document.getElementById('toggle-form-doc-equipa-revisores');
        const estaAberto = wrapper.style.display === 'block';

        try {
            await apiFetch('/api/admin/documentos/associar', {
                method: 'POST',
                body: JSON.stringify({ documento_id: documentoId, equipa: equipaId })
            });

            await apiFetch(`/api/admin/documentos/${documentoId}/estado`, {
                method: 'PUT',
                body: JSON.stringify({ estado: 'traduzido' })
            });

            formDocEquipaRevisores.reset();
            carregarTudo();
            carregarDocumentosSelect(selDoc, 'revisores');
            carregarEquipasLivres(selRev, 'revisores');
            alert('Documento associado à equipa de revisores.');

            wrapper.style.display = estaAberto ? 'none' : 'block';
            btn.textContent = estaAberto ? '+ Associar Documento a Equipa de Revisores': 'Fechar Formulário';
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });

}

    /* =========================
   ALTERAR E ELIMINAR
========================= */

async function abrirFormAlterar(id, button, tipo) {
    const wrapper = document.getElementById(`form-alterar-${tipo}-wrapper`);
    const form = document.getElementById(`form-alterar-${tipo}`);
    if (!wrapper || !form) return;

    // Se estava aberto, fecha e sai
    if (button.dataset.open === 'true') {
        wrapper.style.display = 'none';
        button.textContent = tipo === 'valor' ? 'Alterar Valor' : 'Alterar Cargo';
        button.textContent = tipo === 'cargo' ? 'Alterar Cargo' : 'Alterar Equipa';
        delete button.dataset.open;
        return;
    }

    // Fechar todos os forms do tipo
    document.querySelectorAll(`.btn-alterar-${tipo}`).forEach(btn => {
        btn.textContent = tipo === 'valor' ? 'Alterar Valor' : 'Alterar Cargo';
        btn.textContent = tipo === 'cargo' ? 'Alterar Cargo' : 'Alterar Equipa';
        btn.dataset.open = 'false';
        delete btn.dataset.open;
    });

    // Preenche o form de acordo com o tipo
    if (tipo === 'valor') {
        const doc = await apiFetch(`/api/admin/documentos/${id}`);
        const idFormatado = String(doc.id_documento).padStart(4, '0');
        form.querySelector('input[type="hidden"]').value = id;
        form.querySelector('input[type="text"]').value =
            `#TRX-${idFormatado} - ${doc.nome_documento} (${doc.lingua_origem} → ${doc.lingua_destino})`;
        form.querySelector('input[type="number"]').value = doc.valor || '';
    } else if (tipo === 'cargo') {
        await carregarCargos();
        const user = await apiFetch(`/api/admin/users/${id}`);
        form.querySelector('input[type="hidden"]').value = user.id_conta;
        form.querySelector('input[type="text"]').value = user.nome_utilizador;
        form.querySelector('select').value = user.cargo_id;
    } else if (tipo === 'equipa') {
        const equipa = await apiFetch(`/api/admin/equipas/${id}`);
        // Preencher form de alterar equipa

    } else {
        console.warn('Tipo de form desconhecido:', tipo);
        return;
    }

    // Abrir o form e marcar botão
    wrapper.style.display = 'block';
    button.textContent = 'Fechar Formulário';
    button.dataset.open = 'true';
}

document.getElementById('form-alterar-valor')
    ?.addEventListener('submit', async e => {
        e.preventDefault();

        const form = e.target;
        const docId = form.querySelector('input[type="hidden"]').value;
        const valor = form.querySelector('input[type="number"]').value;
        const wrapper = document.getElementById('form-alterar-valor-wrapper');

        // Resetar todos os botões
        document.querySelectorAll('.btn-alterar-valor').forEach(btn => {
            btn.textContent = 'Alterar Valor';
            delete btn.dataset.open;
        });

        try {
            await apiFetch(`/api/admin/documentos/${docId}/valor`, {
                method: 'PUT',
                body: JSON.stringify({ valor })
            });

            await apiFetch(`/api/admin/documentos/${docId}/estado`, {
                method: 'PUT',
                body: JSON.stringify({ estado: 'em_analise' })
            });

            form.reset();
            wrapper.style.display = 'none';
            carregarDocumentos();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });

document.getElementById('form-alterar-cargo')
    ?.addEventListener('submit', async e => {
        e.preventDefault();

        document
        .querySelectorAll('.btn-alterar-cargo')
        .forEach(btn => btn.textContent = 'Alterar Cargo');

        const form = e.target;
        const userId = form.querySelector('input[type="hidden"]').value;
        const cargoId = form.querySelector('select').value;
        const wrapper = document.getElementById('form-alterar-cargo-wrapper');


        try {
            await apiFetch(`/api/admin/users/${userId}/cargo`, {
                method: 'PUT',
                body: JSON.stringify({ cargo_id: cargoId })
            });

            form.reset();
            carregarUtilizadores();
            alert('Cargo do utilizador alterado com sucesso');
            wrapper.style.display = 'none';
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });

async function eliminar(id, tipo) {
    const idFormatado = String(id).padStart(4, '0');
    let text = ``;
    if (tipo == 'documento')
        text = `este documento com id: #TRX-${idFormatado}`;
    else if (tipo == 'utilizador')
        text = `este utilizador com id: #${idFormatado}`;
    else if (tipo == 'equipa')
        text = `esta equipa com id: #${idFormatado}`;
    else
        return;

    if (!confirm(`Tem a certeza que deseja eliminar este ${text}?`)) {
        return;
    }

    if (tipo == 'documento') {
        try {
            await apiFetch(`/api/admin/documentos/${id}`, {
                method: 'DELETE'
            });

            await carregarDocumentos();
            alert('Documento eliminado com sucesso');
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    } else if (tipo == 'utilizador') {
        try {
            await apiFetch(`/api/admin/users/${id}`, {
                method: 'DELETE'
            });

            await carregarUtilizadores();
            alert('Utilizador eliminado com sucesso');
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    } else if (tipo == 'equipa') {
        try {
            await apiFetch(`/api/admin/equipas/${id}`, {
                method: 'DELETE'
            });

            await carregarEquipas();
            alert('Utilizador eliminado com sucesso');
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    } else {
        console.warn('Tipo desconhecido:', tipo);
        return;
    }
}


/* =========================
   LOGOUT
========================= */

function sairLogin() {
    document.getElementById('logoutUserBtn')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login-signup.html';
    });
}
