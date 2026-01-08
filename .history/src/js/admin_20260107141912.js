document.addEventListener('DOMContentLoaded', () => {
    carregarDocumentosRecentes();
    inicializarSidebar();
    
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
    try {}