/* =========================
   INIT
========================= */

document.addEventListener('DOMContentLoaded', () => {
    sairLogin();
    inicializarSidebar();
    carregarTudo();
    initConfig();
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
        cancelado: ['Cancelado', 'light'],
        aguardando_assinaturas: ['Aguardando Assinaturas', 'warning'],
        aguardando_link: ['Aguardando Link', 'info']
    };
    return map[estado] || ['Desconhecido', 'secondary'];
}


function renderTabela(tbody, rows, vazio, colspan) {
    tbody.innerHTML = rows.length
        ? rows.join('')
        : `<tr><td colspan="${colspan}" class="text-center text-muted">${vazio}</td></tr>`;
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
}

/* =========================
   SIDEBAR
========================= */

function inicializarSidebar() {
    document.querySelectorAll('[data-section-id]').forEach(item => {
        item.addEventListener('click', () => {
            const secao = item.dataset.sectionId;
            document.getElementById('adminPageTitle').textContent = item.textContent.trim();
            document.querySelectorAll('#adminSidebar .nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.admin-page').forEach(p => p.style.display = 'none');
            document.getElementById(item.dataset.sectionId).style.display = 'block';
            carregarScriptAdmin(secao);
        });
    });
    document.getElementById('adminMenuToggle')?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.toggle('active');
    });
}

/* =========================
   CARREGAR OUTROS SCRIPTS
========================= */

const scriptsCarregados = new Set();

function carregarScriptAdmin(secao) {
    if (scriptsCarregados.has(secao)) return;
    if (secao == 'dashboard') return;

    const script = document.createElement('script');
    script.src = `../src/js/admin/admin-${secao}.js`;
    script.defer = true;

    script.onload = () => {
        scriptsCarregados.add(secao);
        if (window[`init${capitalize(secao)}`]) {
            window[`init${capitalize(secao)}`]();
        }
    };

    document.body.appendChild(script);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
   DOCUMENTOS
========================= */

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

/* =========================
   ALTERAR TODOS
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
        form.nome_documento.value = `#TRX-${formatarId(id)} - ${d.nome_documento} (${d.lingua_origem} → ${d.lingua_destino})`;
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
                            ${m.nome_utilizador}${(m.lingua_principal || m.lingua_secundaria) ? ' (' + 
                                [m.lingua_principal, m.lingua_secundaria].filter(Boolean).join(' e ') + 
                            ')' : ''}
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
                            #TRX-${formatarId(d.id_documento)} - ${d.nome_documento} ${(d.lingua_origem || d.lingua_destino) ? ' (' +
                                [d.lingua_origem, d.lingua_destino].filter(Boolean).join(' → ') +
                                ')' : ''}
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
   ELIMINAR
========================= */

async function eliminar(id, tipo) {
    if (!confirm('Confirmar eliminação?')) return;
    await apiFetch(`/api/admin/${tipo}s/${id}`, { method: 'DELETE' });
    carregarTudo();
}

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