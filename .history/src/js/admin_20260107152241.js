document.addEventListener('DOMContentLoaded', () => {
    carregarDocumentosRecentes();
    inicializarSidebar();
    carrgarNomeAdmin();
    carregarEstatisticasAdmin();
    carregarUtilizadores();
    
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
    document.querySelectorAll('#adminSidebar .nav-item[data-section-id]').forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.sectionId;

            document.getElementById('adminPageTitle').textContent =
                item.textContent.trim();

            document.querySelectorAll('#adminSidebar .nav-item')
                .forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.admin-page')
                .forEach(p => p.style.display = 'none');

            document.getElementById(sectionId).style.display = 'block';
        });
    });

    document.getElementById('adminMenuToggle')?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.toggle('active');
    });
}

/* =========================
    DOCUMENTOS RECENTES
========================= */

async function carregarDocumentosRecentes() {
    try {
        console.log('Carregando documentos recentes...');
        const res = await fetch('/api/admin/ultimos-documentos', {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error('Erro ao carregar documentos recentes');

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

            const idFormatado = String(doc.id_documento).padStart(4, '0');

            const dataFormatada = new Date(doc.data_envio).toLocaleString('pt-PT', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            tbody.innerHTML += `
                <tr>
                    <td>#TRX-${idFormatado}</td>
                    <td>${doc.cliente_nome}</td>
                    <td>${doc.lingua_origem} → ${doc.lingua_destino}</td>
                    <td>
                        <span class="badge bg-${corEstado}">
                            ${estadoLabel}
                        </span>
                    </td>
                    <td>${dataFormatada}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}

/* =========================
    CARREGAR NOME DO ADMIN
========================= */

async function carrgarNomeAdmin() {
    try {
        const res = await fetch('/api/admin/me', {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Erro ao carregar nome do admin');

        const admin = await res.json();
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

        
    } catch (err) {
        console.error(err);
    }
}

/* =========================
    CARREGAR ESTATÍSTICAS DO ADMIN
========================= */

async function carregarEstatisticasAdmin() {
    try {
        const res = await fetch('/api/admin/estatisticas', {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Erro ao carregar estatísticas do admin');
        const stats = await res.json();

        document.getElementById('documentos-hoje').textContent =
            stats.documentos_hoje;
        document.getElementById('total_documentos').textContent =
            stats.total_documentos;
        document.getElementById('total_utilizadores').textContent =
            stats.total_utilizadores;
        document.getElementById('documentos-em-analise').textContent =
            stats.documentos_em_analise;
    }
    catch (err) {
        console.error(err);
    }
}

/* =========================
    CARREGAR UTILIZADORES
========================= */

async function carregarUtilizadores() {
    try {
        const res = await fetch('/api/admin/users', {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Erro ao carregar utilizadores');
        const users = await res.json();
        const tbody = document.querySelector('#user-list-table tbody');
        tbody.innerHTML = '';
        if (!users.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        Nenhum utilizador encontrado.
                    </td>
                </tr>
            `;
            return;
        }
        users.forEach(user => {
            

/* =========================
   LOGOUT
========================= */

function sairLogin() {
    document.getElementById('logoutUserBtn')?.addEventListener('click', () => {
        // Remove token / sessão
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirecionar para login
        window.location.href = 'login-signup.html';
    });
}