document.addEventListener('DOMContentLoaded', () => {
    carregarDocumentosRecentes();
    carregarDocumentos();
    inicializarSidebar();
    carrgarNomeAdmin();
    carregarEstatisticasAdmin();
    carregarUtilizadores();
    carregarEquipas();

});

// Lista de todos os forms e respectivos botões
const forms = [
    { btnId: 'toggle-form-criar-equipa', wrapperId: 'form-criar-equipa-wrapper', textoAberto: '+ Criar Equipa', textoFechado: 'Fechar Formulário' },
    { btnId: 'toggle-form-equipa-utilizador', wrapperId: 'form-equipa-utilizador-wrapper', textoAberto: '+ Adicionar Utilizador à Equipa', textoFechado: 'Fechar Formulário' },
    { btnId: 'toggle-form-doc-equipa-tradutores', wrapperId: 'form-doc-equipa-tradutores-wrapper', textoAberto: '+ Associar Documento a Equipa de Tradutores', textoFechado: 'Fechar Formulário' },
    { btnId: 'toggle-form-doc-equipa-revisores', wrapperId: 'form-doc-equipa-revisores-wrapper', textoAberto: '+ Associar Documento a Equipa de Revisores', textoFechado: 'Fechar Formulário' }
];

// Função de setup toggle exclusivo
forms.forEach(f => {
    const btn = document.getElementById(f.btnId);
    const wrapper = document.getElementById(f.wrapperId);

    btn.addEventListener('click', () => {
        const estaAberto = wrapper.style.display === 'block';

        // Fechar todos os forms
        forms.forEach(other => {
            const w = document.getElementById(other.wrapperId);
            const b = document.getElementById(other.btnId);
            if (w !== wrapper) {
                w.style.display = 'none';
                b.textContent = other.textoAberto;
            }
        });

        // Abrir/fechar o atual
        wrapper.style.display = estaAberto ? 'none' : 'block';
        btn.textContent = estaAberto ? f.textoAberto : f.textoFechado;
    });
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
    CARREGAR DOCUMENTOS
========================= */

async function carregarDocumentos() {
    try {
        const res = await fetch('/api/admin/documentos', {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error('Erro ao carregar documentos');

        const documentos = await res.json();
        const tbody = document.querySelector('#documentos tbody');
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

            const botaoEliminar =
            doc.estado === 'cancelado'
                ? `<button class="btn btn-sm btn-danger"
                        onclick="eliminarDocumento(${doc.id_documento})">
                    Eliminar Documento
                </button>`
                : '';


            switch (doc.estado) {
                case 'em_analise':
                    estadoLabel = 'Em Análise';
                    corEstado = 'secondary'; // cinza
                    break;

                case 'em_traducao':
                    estadoLabel = 'Em Tradução';
                    corEstado = 'warning'; // amarelo
                    break;

                case 'em_revisao':
                    estadoLabel = 'Em Revisão';
                    corEstado = 'info'; // azul claro
                    break;

                case 'traduzido':
                    estadoLabel = 'Traduzido';
                    corEstado = 'primary'; // azul
                    break;

                case 'finalizado':
                    estadoLabel = 'Finalizado';
                    corEstado = 'success'; // verde
                    break;

                case 'a_pagar':
                    estadoLabel = 'A Pagar';
                    corEstado = 'danger'; // vermelho
                    break;

                case 'pago':
                    estadoLabel = 'Pago';
                    corEstado = 'dark'; // preto
                    break;

                case 'cancelado':
                    estadoLabel = 'Cancelado';
                    corEstado = 'light'; // cinza claro
                    break;

                default:
                    estadoLabel = 'Desconhecido';
                    corEstado = 'secondary';
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
                        <span class="badge bg-${corEstado} ${corEstado === 'light' ? 'text-dark' : ''}">
                            ${estadoLabel}
                        </span>
                    </td>
                    <td>${doc.equipas || '—'}</td>
                    <td>${dataFormatada}</td>
                    <td>${doc.valor ? doc.valor + '€' : '—'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-alterar-valor" onclick="abrirFormAlterarValor(${doc.id_documento}, this)">
                            Alterar Valor
                        </button>
                        ${botaoEliminar}
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

abrirFormAlterarValor = async (docId, button) => {
    const wrapper = document.getElementById('form-alterar-valor-wrapper');
    const form = document.getElementById('form-alterar-valor');
    if (button.dataset.open === 'true') {
        wrapper.style.display = 'none';
        button.textContent = 'Alterar Valor';
        delete button.dataset.open;
        return;
    }

    document.querySelectorAll('.btn-alterar-valor').forEach(btn => {
        btn.textContent = 'Alterar Valor';
        delete btn.dataset.open;
    });

    const res = await fetch(`/api/admin/documentos/${docId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        alert('Erro ao carregar dados do documento');
        return;
    }
    const doc = await res.json();

    const idFormatado = String(doc.id_documento).padStart(4, '0');

    form.querySelector('input[type="hidden"]').value = docId;
    form.querySelector('input[type="text"]').value = `#TRX${idFormatado} - ${doc.nome_documento} (${doc.lingua_origem} → ${doc.lingua_destino})`;
    form.querySelector('input[type="number"]').value = doc.valor || '';

    wrapper.style.display = 'block';
    button.textContent = 'Fechar Formulário';
    button.dataset.open = 'true';
}

document.getElementById('form-alterar-valor')
    ?.addEventListener('submit', async e => {
        e.preventDefault();
        document
        .querySelectorAll('.btn-alterar-valor')
        .forEach(btn => btn.textContent = 'Alterar Valor');
        const form = e.target;
        const docId = form.querySelector('input[type="hidden"]').value;
        const valor = form.querySelector('input[type="number"]').value;
        const wrapper = document.getElementById('form-alterar-valor-wrapper');

        try {
            const res = await fetch(`/api/admin/documentos/${docId}/valor`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ valor })
            });
            if (!res.ok) throw new Error('Erro ao alterar valor do documento');
            form.reset();
            carregarDocumentos();
            alert('Valor do documento alterado com sucesso');
            wrapper.style.display = 'none';
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });

function eliminarDocumento(docId) {
    if (!confirm('Tem a certeza que deseja eliminar este documento?')) {
        return;
    }

    fetch(`/api/admin/documentos/${docId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    }).then(res => {
        if (!res.ok) throw new Error('Erro ao eliminar documento');
        carregarDocumentos();
        alert('Documento eliminado com sucesso');
    }).catch(err => {
        console.error(err);
        alert(err.message);
    });
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
        const tbody = document.querySelector('#utilizadores tbody');
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
            tbody.innerHTML += `
                <tr>
                    <td>#${String(user.id_conta).padStart(4, '0')}</td>
                    <td>${user.nome_utilizador}</td>
                    <td>${user.email}</td>
                    <td>${user.username}</td>
                    <td>${user.nome_cargo}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-alterar-cargo" onclick="abrirFormAlterarCargo(${user.id_conta}, this)">
                            Alterar Cargo
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarUtilizador(${user.id_conta})">
                            Eliminar Utilizador
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

async function carregarCardos(){
    const res = await fetch('/api/admin/cargos', {
        headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Erro ao carregar cargos');
    const cargos = await res.json();
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

abrirFormAlterarCargo = async (userId, button) => {
    const wrapper = document.getElementById('form-alterar-cargo-wrapper');
    const form = document.getElementById('form-alterar-cargo');

    if (button.dataset.open === 'true') {
        wrapper.style.display = 'none';
        button.textContent = 'Alterar Cargo';
        delete button.dataset.open;
        return;
    }

    document.querySelectorAll('.btn-alterar-cargo').forEach(btn => {
        btn.textContent = 'Alterar Cargo';
        delete btn.dataset.open;
    });

    await carregarCardos();

    const res = await fetch(`/api/admin/users/${userId}`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        alert('Erro ao carregar dados do utilizador');
        return;
    }

    const user = await res.json();

    form.querySelector('input[type="hidden"]').value = user.id_conta;
    form.querySelector('input[type="text"]').value = user.nome_utilizador;
    form.querySelector('select').value = user.cargo_id;
    wrapper.style.display = 'block';
    
    button.textContent = 'Fechar Formulário';
    button.dataset.open = 'true';
}

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
            const res = await fetch(`/api/admin/users/${userId}/cargo`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ cargo_id: cargoId })
            });
            if (!res.ok) throw new Error('Erro ao alterar cargo do utilizador');

            form.reset();
            carregarUtilizadores();
            alert('Cargo do utilizador alterado com sucesso');
            wrapper.style.display = 'none';
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });

function eliminarUtilizador(userId) {
    if (!confirm('Tem a certeza que deseja eliminar este utilizador?')) {
        return;
    }

    fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    }).then(res => {
        if (!res.ok) throw new Error('Erro ao eliminar utilizador');
        carregarUtilizadores();
        alert('Utilizador eliminado com sucesso');
    }).catch(err => {
        console.error(err);
        alert(err.message);
    });
}

/* =========================
    CARREGAR EQUIPAS
========================= */

async function carregarEquipas() {
    try {
        const res = await fetch('/api/admin/equipas', {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error('Erro ao carregar equipas');

        const equipas = await res.json();
        const tbody = document.querySelector('#equipas tbody');
        tbody.innerHTML = '';

        if (!equipas.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        Nenhuma equipa encontrada.
                    </td>
                </tr>
            `;
            return;
        }

        equipas.forEach(equipa => {
            const estadoBadge = equipa.ocupada
                ? `<span class="badge bg-danger">Ocupada</span>`
                : `<span class="badge bg-success">Livre</span>`;

            tbody.innerHTML += `
                <tr>
                    <td>#${String(equipa.id_equipa).padStart(4, '0')}</td>
                    <td>${equipa.nome_equipa}</td>
                    <td>${equipa.tipo}</td>
                    <td>${equipa.membros || '—'}</td>
                    <td>${equipa.linguas || '—'}</td>
                    <td>${equipa.documentos || '—'}</td>
                    <td>${estadoBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-primary">
                            Alterar Equipa
                        </button>
                        <button class="btn btn-sm btn-danger">
                            Eliminar Equipa
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}

async function carregarEquipasSelect(select) {
    const res = await fetch('/api/admin/equipas', {
        headers: getAuthHeaders()
    });
    const equipas = await res.json();

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
    const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders()
    });
    const users = await res.json();

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
    const res = await fetch('/api/admin/equipas', {
        headers: getAuthHeaders()
    });
    const equipas = await res.json();

    select.innerHTML = `<option value="">Selecionar</option>`;
    equipas
        .filter(e => e.tipo === tipo && !e.ocupada)
        .forEach(e => {
            select.innerHTML += `
                <option value="${e.id_equipa}">
                    ${e.nome_equipa} (${e.siglas_linguas})
                </option>
            `;
        });
}

async function carregarDocumentosSelect(select, tipo) {
    const res = await fetch('/api/admin/documentos', {
        headers: getAuthHeaders()
    });
    const docs = await res.json();
    console.log(docs);
    console.log(select);

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


document.getElementById('form-criar-equipa')
    ?.addEventListener('submit', async e => {
        e.preventDefault();

        const form = e.target;
        const tipo = form.querySelector('select').value;
        const nome_equipa = form.querySelector('input').value.trim();

        try {
            const res = await fetch('/api/admin/equipas', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ nome_equipa, tipo })
            });

            if (!res.ok) throw new Error('Erro ao criar equipa');

            form.reset();
            carregarEquipas();
            carregarDocumentosSelect();
            carregarEquipasLivres();
            carregarEquipasSelect();
            carregarUtilizadoresPorTipo();
            alert('Equipa criada com sucesso');
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });

const formEquipaUser = document.getElementById('form-equipa-utilizador');

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

        try {
            const res = await fetch(
                `/api/admin/equipas/${equipaId}/utilizadores`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ conta_id })
                }
            );

            if (!res.ok) throw new Error('Erro ao adicionar utilizador');

            formEquipaUser.reset();
            carregarEquipas();
            carregarDocumentosSelect();
            carregarEquipasLivres();
            carregarEquipasSelect();
            carregarUtilizadoresPorTipo();
            alert('Utilizador adicionado à equipa');
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });
}

const formDocEquipaTradutores = document.getElementById('form-doc-equipa-tradutores');
const formDocEquipaRevisores = document.getElementById('form-doc-equipa-revisores');

if (formDocEquipaTradutores) {
    carregarDocumentosSelect(selDoc, 'tradutores');
    carregarEquipasLivres(selTrad, 'tradutores');
    
}


formDocEquipaRevisores.addEventListener('submit', async e => {
    e.preventDefault();

    const documentoId = selDoc.value;
    const equipaId = selRev.value;

    try {
        const resPost = await fetch('/api/admin/documentos/associar', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                documento_id: documentoId,
                equipa: equipaId
            })
        });

        if (!resPost.ok) {
            const err = await resPost.json();
            throw new Error(err.message || 'Erro ao associar documento');
        }

        const resPut = await fetch(`/api/admin/documentos/${documentoId}/estado`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                estado: 'em_revisao'
            })
        });

        if (!resPut.ok) {
            const err = await resPut.json();
            throw new Error(err.message || 'Erro ao alterar estado');
        }

        formDocEquipaRevisores.reset();
        carregarEquipas();
        carregarDocumentos();
        carregarDocumentosSelect(selDoc, 'revisores');
        carregarEquipasLivres(selRev, 'revisores');
        carregarEquipasSelect();
        carregarUtilizadoresPorTipo();

        alert('Documento associado à equipa de revisores.');
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});



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