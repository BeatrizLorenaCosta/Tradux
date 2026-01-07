document.addEventListener('DOMContentLoaded', () => {
    inicializarSidebar();
    carregarPerfil();
    carregarDocumentos();
    configurarFormularioDados();
    sairLogin();
});

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

                document.getElementById('userPageTitle').textContent =
                    item.textContent.trim();

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
        const res = await fetch('/api/users/me', {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error('Sessão inválida');

        const user = await res.json();

        // Header
        document.getElementById('userNameDisplay').textContent =
            `Olá, ${user.nome_utilizador}`;

        document.querySelector('.user-avatar').textContent =
            user.nome_utilizador.substring(0, 2).toUpperCase();

        // Formulário
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
        const res = await fetch('/api/users/me/documentos', {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error('Erro ao carregar documentos');

        const documentos = await res.json();
        const tbody = document.querySelector('#ultimos-documentos tbody');
        tbody.innerHTML = '';

        if (!documentos.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        Nenhum documento encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        documentos.forEach(doc => {
            let corEstado = '';
            let estadoLabel = '';

            switch (doc.estado) {
                case 'em_analise':
                    estadoLabel = 'Em Análise';
                    corEstado = 'secondary';
                    break;
                case 'em_traducao':
                    estadoLabel = 'Em Tradução';
                    corEstado = 'warning';
                    break;
                case 'em_revisao':
                    estadoLabel = 'Em Revisão';
                    corEstado = 'info';
                    break;
                case 'finalizado':
                    estadoLabel = 'Finalizado';
                    corEstado = 'success';
                    break;
                case 'traduzido':
                    estadoLabel = 'Traduzido';
                    corEstado = 'primary';
                    break;
                case 'a_pagar':
                    estadoLabel = 'A Pagar';
                    corEstado = 'danger';
                    break;
                case 'cancelado':
                    estadoLabel = 'Cancelado';
                    corEstado = 'dark';
                    break;
            }

            

            tbody.innerHTML += `
                <tr>
                    <td>#TRX-${doc.id_documento}</td>
                    <td>${doc.documento_link}</td>
                    <td>${doc.lingua_origem} → ${doc.lingua_destino}</td>
                    <td>
                        <span class="badge bg-${corEstado}">
                            ${estadoLabel}
                        </span>
                    </td>
                    <td>${new Date(doc.data_envio).toLocaleDateString('pt-PT')}</td>
                    <td>
                        ${acaoHTML}
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
    }
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

        const body = {
            nome_utilizador: nome,
            email
        };

        if (password) {
            body.password = password;
        }

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
        // Remove token / sessão
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Opcional: limpar dados visuais do utilizador
        document.getElementById('userNameDisplay').textContent = '';
        document.querySelector('.user-avatar').textContent = '';
        
        // Redirecionar para login
        window.location.href = 'login-signup.html';
    });
}