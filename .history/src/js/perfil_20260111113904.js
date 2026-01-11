document.addEventListener('DOMContentLoaded', () => {
    inicializarSidebar();
    carregarPerfil();
    carregarDocumentos();
    configurarFormularioDados();
    sairLogin();

    // Atualiza menu quando a página carrega
    updateNavMenu();
});

// ===================== Menu dinâmico =====================
    const updateNavMenu = () => {
        const nav = document.getElementById('nav-menu');
        if (!nav) return;

        // Remove links dinâmicos antigos
        nav.querySelectorAll('.dynamic-link').forEach(link => link.remove());

        // Ler utilizador
        const user = JSON.parse(localStorage.getItem('user'));

        // Função helper para criar links com active automático
        const criarLink = (href, texto) => {
            const link = document.createElement('a');
            link.href = href;
            link.textContent = texto;
            link.className = 'nav-btn dynamic-link';

            if (paginaAtual === href) {
                link.classList.add('active');
            }

            return link;
        };

        if (user) {
           

            // Admin (apenas cargo_id === 1)
            if (user.cargo_id === 1) {
                // deve mostrar Alterar dados(sessao), sair
            } else if () {}if (user.cargo_id === 3) { 
                // Tradutor deve mostrar: Alterar dados(sessao), Tradução (que tem sub items com: Equipa de tradução (sessao), Documentos da equipa(sessao)), sair
                
            }

            // Logout
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.className = 'nav-btn dynamic-link';
            logoutLink.textContent = 'Logout';

            logoutLink.addEventListener('click', e => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login-signup.html';
            });

            nav.appendChild(logoutLink);
        } else {
            sairLogin();
        }
    };

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
        const res = await fetch('/api/users/me', { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Sessão inválida');

        const user = await res.json();

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
    try {
        const res = await fetch('/api/users/me/documentos', { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Erro ao carregar documentos');

        const documentos = await res.json();
        const tbody = document.querySelector('#meus-documentos tbody');
        tbody.innerHTML = '';

        if (!documentos.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted">Nenhum documento encontrado.</td>
                </tr>
            `;
            return;
        }

        documentos.forEach(doc => {
            const { label: estadoLabel, cor: corEstado } = getEstadoInfo(doc.estado);
            const acaoHTML = getAcaoHTML(doc);

            tbody.innerHTML += `
                <tr>
                    <td>#TRX-${doc.id_documento}</td>
                    <td>${doc.nome_documento}</td>
                    <td>${doc.documento_link}</td>
                    <td>${doc.lingua_origem} → ${doc.lingua_destino}</td>
                    <td>${doc.paginas}</td>
                    <td>${doc.valor}€</td>
                    <td><span class="badge bg-${corEstado}">${estadoLabel}</span></td>
                    <td>${new Date(doc.data_envio).toLocaleDateString('pt-PT')}</td>
                    <td>${acaoHTML}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}

// Função auxiliar para estado
function getEstadoInfo(estado) {
    const estados = {
        em_analise: { label: 'Em Análise', cor: 'secondary' },
        em_traducao: { label: 'Em Tradução', cor: 'warning' },
        em_revisao: { label: 'Em Revisão', cor: 'info' },
        finalizado: { label: 'Finalizado', cor: 'success' },
        traduzido: { label: 'Traduzido', cor: 'primary' },
        a_pagar: { label: 'A Pagar', cor: 'danger' },
        cancelado: { label: 'Cancelado', cor: 'dark' },
        pago: { label: 'Pago', cor: 'dark'}
    };
    return estados[estado] || { label: 'Desconhecido', cor: 'secondary' };
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
            const res = await fetch(`/api/users/me`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error();
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
    document.getElementById('logoutUserBtn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.getElementById('userNameDisplay').textContent = '';
        document.querySelector('.user-avatar').textContent = '';
        window.location.href = 'login-signup.html';
    });
}
