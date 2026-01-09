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

const formsConfig = [
    ['toggle-form-criar-equipa', 'form-criar-equipa-wrapper', '+ Criar Equipa'],
    ['toggle-form-equipa-utilizador', 'form-equipa-utilizador-wrapper', '+ Adicionar Utilizador à Equipa'],
    ['toggle-form-doc-equipa-tradutores', 'form-doc-equipa-tradutores-wrapper', '+ Associar Documento a Tradutores'],
    ['toggle-form-doc-equipa-revisores', 'form-doc-equipa-revisores-wrapper', '+ Associar Documento a Revisores']
];

formsConfig.forEach(([btnId, wrapId, texto]) => {
    const btn = document.getElementById(btnId);
    const wrap = document.getElementById(wrapId);

    btn?.addEventListener('click', () => {
        formsConfig.forEach(([b, w, t]) => {
            document.getElementById(w).style.display = 'none';
            document.getElementById(b).textContent = t;
        });
        wrap.style.display = 'block';
        btn.textContent = 'Fechar Formulário';
    });
});

const abrirFormAlterarValor = async (docId, button) => {
    const wrapper = document.getElementById('form-alterar-valor-wrapper');
    const form = document.getElementById('form-alterar-valor');

    const aberto = button.dataset.open === 'true';

    // Fecha todos os botões antes de abrir outro
    document.querySelectorAll('.btn-alterar-valor').forEach(btn => {
        btn.textContent = 'Alterar Valor';
        delete btn.dataset.open;
    });

    if (aberto) {
        wrapper.style.display = 'none';
        return;
    }

    // Buscar dados do documento
    const doc = await apiFetch(`/api/admin/documentos/${docId}`);

    const idFormatado = String(doc.id_documento).padStart(4, '0');
    form.querySelector('input[type="hidden"]').value = docId;
    form.querySelector('input[type="text"]').value =
        `#TRX${idFormatado} - ${doc.nome_documento} (${doc.lingua_origem} → ${doc.lingua_destino})`;
    form.querySelector('input[type="number"]').value = doc.valor || '';

    wrapper.style.display = 'block';
    button.textContent = 'Fechar Formulário';
    button.dataset.open = 'true';
};


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
            ? `<button class="btn btn-sm btn-danger" onclick="eliminarDocumento(${d.id_documento})">Eliminar</button>`
            : '';
        const btnAlterarValor = d.estado === 'em_analise'
            ? `<button class="btn btn-sm btn-primary btn-alterar-valor" onclick="abrirFormAlterarValor(${d.id_documento}, this)"> Alterar Valor</button>`
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
                ${btn}
                ${btnEliminar}
            </td>
        </tr>`;
    });

    renderTabela(tbody, rows, 'Nenhum documento encontrado.', 8);
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

            await apiFetch(`/api/admin/documentos/${documentoId}/estado`, {
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
                <button class="btn btn-sm btn-primary" onclick="abrirFormAlterarCargo(${u.id_conta}, this)">
                    Alterar Cargo
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarUtilizador(${u.id_conta})">
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
        </tr>`);

    renderTabela(tbody, rows, 'Nenhuma equipa encontrada.', 7);
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
