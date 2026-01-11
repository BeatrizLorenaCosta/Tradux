/* =========================
   INIT
========================= */

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    carregarDocumentos();
    configurarFormularioDados();
    updateNavMenu();
    abrirSecaoInicialPerfil();
    carregarEquipa();
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

/* =========================
   Menu dinâmico (Perfil)
========================= */

const updateNavMenu = () => {
    const nav = document.querySelector('#userSidebar .nav-menu');
    if (!nav) return;

    nav.innerHTML = '';

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        sairLogin();
        return;
    }

    const criarItem = (icon, texto, sectionId) => {
        const div = document.createElement('div');
        div.className = 'nav-item';
        div.dataset.sectionId = sectionId;
        div.innerHTML = `<i class="${icon} me-3"></i>${texto}`;
        return div;
    };

    // ================= ADMIN =================
    if (user.cargo_id === 1) {
        nav.appendChild(criarItem(
            'fas fa-user-edit',
            'Alterar Dados',
            'alterar-dados'
        ));
    }

    // ================= CLIENTE =================
    else if (user.cargo_id === 2) {
        nav.appendChild(criarItem(
            'fas fa-file-alt',
            'Meus Documentos',
            'meus-documentos'
        ));
        nav.appendChild(criarItem(
            'fas fa-user-edit',
            'Alterar Dados',
            'alterar-dados'
        ));
    }

    // ================= TRADUTOR =================
    else if (user.cargo_id === 3) {
        nav.appendChild(criarItem(
            'fas fa-user-edit',
            'Alterar Dados',
            'alterar-dados'
        ));

        const grupoTraducao = criarGrupoMenu(
            'fas fa-language',
            'Tradução',
            [
                criarItem(
                    'fas fa-users',
                    'Minha Equipa',
                    'equipa-tradutores'
                ),
                criarItem(
                    'fas fa-file-signature',
                    'Documentos da Equipa',
                    'documentos-equipa'
                )
            ]
        );

        nav.appendChild(grupoTraducao);
    }

    // ================= REVISOR =================
    else if (user.cargo_id === 4) {
        nav.appendChild(criarItem(
            'fas fa-user-edit',
            'Alterar Dados',
            'alterar-dados'
        ));

        const grupoRevisao = criarGrupoMenu(
            'fas fa-clipboard-check',
            'Revisão',
            [
                criarItem(
                    'fas fa-users',
                    'Minha Equipa',
                    'equipa-revisao'
                ),
                criarItem(
                    'fas fa-file-check',
                    'Documentos da Equipa',
                    'documentos-equipa'
                )
            ]
        );

        nav.appendChild(grupoRevisao);
    }

    // ================= LOGOUT =================
    const logout = document.createElement('div');
    logout.className = 'nav-item';
    logout.id = 'logoutUserBtn';
    logout.innerHTML = `<i class="fas fa-sign-out-alt me-3"></i>Sair`;
    logout.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.getElementById('userNameDisplay').textContent = '';
        document.querySelector('.user-avatar').textContent = '';
        window.location.href = 'login-signup.html';
    });

    nav.appendChild(logout);

    // reativar listeners
    inicializarSidebar();
};

function abrirSecaoInicialPerfil() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    if (user.cargo_id === 2) {
        abrirSecaoPerfil('meus-documentos');
    } else {
        abrirSecaoPerfil('alterar-dados');
    }
}

function abrirSecaoPerfil(sectionId) {
    document.querySelectorAll('.user-page')
        .forEach(p => p.style.display = 'none');

    const secao = document.getElementById(sectionId);
    if (secao) secao.style.display = 'block';

    const itemMenu = document.querySelector(
        `#userSidebar .nav-item[data-section-id="${sectionId}"]`
    );
    if (itemMenu) {
        document.getElementById('userPageTitle').textContent =
            itemMenu.textContent.trim();

        document.querySelectorAll('#userSidebar .nav-item')
            .forEach(i => i.classList.remove('active'));
        itemMenu.classList.add('active');
    }
}

function criarGrupoMenu(icon, texto, filhos) {
    const wrapper = document.createElement('div');

    const pai = document.createElement('div');
    pai.className = 'nav-item nav-parent d-flex justify-content-between align-items-center';

    pai.innerHTML = `
        <span>
            <i class="${icon} me-3"></i>${texto}
        </span>
        <i class="fas fa-chevron-right toggle-icon"></i>
    `;

    const toggleIcon = pai.querySelector('.toggle-icon');

    const submenu = document.createElement('div');
    submenu.className = 'nav-submenu';
    submenu.style.display = 'none';

    filhos.forEach(f => submenu.appendChild(f));

    pai.addEventListener('click', () => {
        // fechar outros submenus
        document.querySelectorAll('.nav-submenu').forEach(sm => {
            if (sm !== submenu) {
                sm.style.display = 'none';
                const icon = sm.previousElementSibling?.querySelector('.toggle-icon');
                if (icon) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                }
            }
        });

        const aberto = submenu.style.display === 'block';
        submenu.style.display = aberto ? 'none' : 'block';

        toggleIcon.classList.toggle('fa-chevron-right', aberto);
        toggleIcon.classList.toggle('fa-chevron-down', !aberto);
    });

    wrapper.appendChild(pai);
    wrapper.appendChild(submenu);

    return wrapper;
}

/* =========================
   CONFIGURAÇÕES GERAIS
========================= */

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) sairLogin();

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

/* =========================
   SIDEBAR / NAVEGAÇÃO
========================= */

function inicializarSidebar() {
    document.querySelectorAll('#userSidebar .nav-item[data-section-id]')
        .forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.dataset.sectionId;

                document.getElementById('userPageTitle').textContent = item.textContent.trim();

                document.querySelectorAll('#userSidebar .nav-item')
                    .forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                document.querySelectorAll('.user-page')
                    .forEach(p => p.style.display = 'none');

                document.getElementById(sectionId).style.display = 'block';
            });
        });
    document.getElementById('userMenuToggle')?.addEventListener('click', () => {
        document.getElementById('userSidebar').classList.toggle('active');
    });
}

/* =========================
   PERFIL DO UTILIZADOR
========================= */

async function carregarPerfil() {
    try {
        const user = await apiFetch('/api/users/me');

        document.getElementById('userNameDisplay').textContent = `Olá, ${user.nome_utilizador}`;
        document.querySelector('.user-avatar').textContent = user.nome_utilizador.substring(0, 2).toUpperCase();

        document.getElementById('perfil-nome').value = user.nome_utilizador;
        document.getElementById('perfil-email').value = user.email;

    } catch (err) {
        sairLogin();
    }
}

/* =========================
   DOCUMENTOS DO UTILIZADOR
========================= */

async function carregarDocumentos() {
    const documentos = await apiFetch('/api/users/me/documentos');
    const tbody = document.querySelector('#meus-documentos tbody');
    
    renderTabela(tbody, 
        documentos.map(doc => {
            const [l, c] = mapEstado(doc.estado);
            const acaoHTML = getAcaoHTML(doc);

            return `
                <tr>
                    <td>#TRX-${doc.id_documento}</td>
                    <td>${doc.nome_documento}</td>
                    <td>${doc.documento_link}</td>
                    <td>${doc.lingua_origem} → ${doc.lingua_destino}</td>
                    <td>${doc.paginas}</td>
                    <td>${doc.valor}€</td>
                    <td><span class="badge bg-${c} ${c === 'light' ? 'text-dark' : ''}">${l}</span></td>
                    <td>${new Date(doc.data_envio).toLocaleDateString('pt-PT')}</td>
                    <td>${acaoHTML}</td>
                </tr>
            `;
        }),
        'Nenhum documento encontrado.',
        9
    );
}

async function carregarEquipa() {
    try {
        const equipa = await apiFetch('/api/users/me/equipa');
        console.log(equipa);

        // === 1. Preencher formulário de membros ===
        const formMembros = document.getElementById('form-tradutores');
        formMembros.nome_equipa.value = equipa.nome_equipa;
        formMembros.tipo_equipa.value = equipa.tipo.charAt(0).toUpperCase() + equipa.tipo.slice(1);
        formMembros.estado_equipa.value = equipa.ocupada ? 'Ocupada' : 'Livre';

        const tbodyMembros = document.querySelector('#equipa-tradutores table tbody');
        renderTabela(tbodyMembros, 
            equipa.membros.map(e => {
                return `
                    <tr>
                        <td>#${formatarId(e.id_conta)}</td>
                        <td>${e.nome_utilizador}</td>
                        <td>${e.email}</td>
                        <td>${e.linguas_membro}</td>
                    </tr>
                `;
            }),
            'Nenhum membro encontrado.',
            4
        );

        // === 2. Preencher formulário de documentos ===
        const formDocs = document.getElementById('form-traducao2');
        document.getElementById('nome_equipa2').value = equipa.nome_equipa;
        document.getElementById('tipo_equipa2').value = equipa.tipo.charAt(0).toUpperCase() + equipa.tipo.slice(1);
        document.getElementById('estado_equipa2').value = equipa.ocupada ? 'Ocupada' : 'Livre';

        const tbodyDocs = document.querySelector('#documentos-equipa table tbody');

        renderTabela(tbodyDocs, 
            equipa.documentos.map(d => {
                const [l, c] = mapEstado(d.estado);

                return `
                    <tr>
                        <td>#TRX-${formatarId(d.id_documento)}</td>
                        <td>${d.cliente_nome || '-'}</td>
                        <td>${d.linguas_documento || '-'}</td>
                        <td><span class="badge bg-${c} ${c === 'light' ? 'text-dark' : ''}">${l}</span></td>
                        <td>${d.data_envio || '-'}</td>
                        <td>${d.valor != null ? d.valor.toFixed(2) + '€' : '-'}</td>
                        <td>${d.paginas || '-'}</td>
                        <td>
                            
                             <button class="btn btn-sm btn-primary">
                                <a href="${d.documento_link}" target="_blank">Original</a>
                                ${d.documento_link_final ? ` | <a href="${d.documento_link_final}" target="_blank">Final</a>` : ''}
                                Alterar Equipa
                            </button>
                        </td>
                    </tr>
                `;
            }),
            'Nenhum documento encontrado.',
            8
        );

    } catch (err) {
        console.error('Erro ao carregar equipa:', err);
    }
}




// Função auxiliar para ação do documento
function getAcaoHTML(doc) {
    if (doc.estado === 'a_pagar') {
        const nomeNovo = doc.nome_documento.replace(/'/g, "\\'");
        return `    
            <button class="btn btn-sm btn-danger"
                onclick='irParaPagamento(
                    ${doc.id_documento}, 
                    "${nomeNovo}", 
                    "${doc.documento_link}", 
                    "${doc.lingua_origem}", 
                    "${doc.lingua_destino}", 
                    ${doc.valor}, 
                    ${doc.paginas}
                )'>
                Pagar
            </button>
        `;
    }

    if (doc.estado === 'finalizado' && doc.documento_link_final) {
        return `
            <a href="${doc.documento_link_final}" class="btn btn-sm btn-success">
                Descarregar documento
            </a>
        `;
    }

    if (doc.estado === 'cancelado') {
        return `
            <span class="text-muted">Admin pode eliminar esse documento</span>
        `;
    }

    return `<span class="text-muted">Sem ações disponíveis</span>`;
}


function irParaPagamento(id_documento, nome, link, lingua_origem, lingua_destino, valor, paginas) {
    const pagamentoData = { id_documento, nome, link, lingua_origem, lingua_destino, valor, paginas };
    localStorage.setItem('pagamento', JSON.stringify(pagamentoData));
    window.location.href = 'pagamento.html';
}


/* =========================
   ALTERAR DADOS
========================= */

function configurarFormularioDados() {
    const form = document.getElementById('form-dados');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const nome = document.getElementById('perfil-nome').value.trim();
        const email = document.getElementById('perfil-email').value.trim();
        const password = document.getElementById('perfil-password').value.trim();

        if (!nome || !email) {
            alert('Nome e email são obrigatórios.');
            return;
        }

        const body = { nome_utilizador: nome, email };
        if (password) body.password = password;

        try {
            await apiFetch(`/api/users/me`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });

            alert('Dados atualizados com sucesso.');
            document.getElementById('perfil-password').value = '';
            carregarPerfil();

        } catch {
            alert('Erro ao atualizar os dados.');
        }
    });
}

/* =========================
   LOGOUT
========================= */

function sairLogin() {
    localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.getElementById('userNameDisplay').textContent = '';
        document.querySelector('.user-avatar').textContent = '';
        window.location.href = 'login-signup.html';
}
