function initConfig() {
    console.log('Config inicializado');
    carregarConfig();
}

// =======================
// INICIALIZAR
// =======================
async function carregarConfig() {
    await Promise.all([
        carregarCargosTabela(),
        carregarLinguas()
    ]);
}

// =======================
// ABRIR / FECHAR FORMS
// =======================
function abrirFormConfig(tipo) {
    const formsConfig = ['cargo', 'linguas', 'precos', 'geral'];

    formsConfig.forEach(f => {
        const wrapper = document.getElementById(`form-config-${f}`);
        const btn = document.querySelector(`button[onclick="abrirFormConfig('${f}')"]`);
        if (!wrapper || !btn) return;

        if (f === tipo) {
            const estaAberto = wrapper.style.display === 'block';
            wrapper.style.display = estaAberto ? 'none' : 'block';
            btn.textContent = estaAberto ? 'Editar' : 'Fechar Formulário';
        } else {
            wrapper.style.display = 'none';
            btn.textContent = 'Editar';
        }
    });
}



// =======================
// PREENCHER TABELAS
// =======================

async function carregarCargosTabela() {
    const tbody = document.querySelector('#tabela-cargos tbody');
    tbody.innerHTML = '';

    const cargos = await apiFetch('/api/admin/cargos');
    cargos.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.nome_cargo}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editarCargo(${c.id_cargo}, '${c.nome_cargo}')">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarCargo(${c.id_cargo})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function carregarLinguas() {
    const tbody = document.querySelector('#tabela-linguas tbody');
    tbody.innerHTML = '';

    const linguas = await apiFetch('/api/admin/linguas');
    linguas.forEach(l => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${l.nome_lingua}</td>
            <td>${l.sigla}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editarLingua(${l.id_lingua}, '${l.nome_lingua}', '${l.sigla}')">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarLingua(${l.id_lingua})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// =======================
// EVENTOS DOS FORMS
// =======================

// Cargos
const formAdicionarCargo = document.getElementById('form-adicionar-cargos');
const formAdicionarLingua = document.getElementById('form-adicionar-linguas');
const formEditarCargo = document.getElementById('form-alterar-cargos');
const formEditarLingua = document.getElementById('form-alterar-linguas');

formAdicionarCargo.addEventListener('submit', async e => {
    e.preventDefault();
    const nome = e.target.nome_cargo.value.trim();
    if (!nome) return;

    await apiFetch('/api/admin/cargos', { method: 'POST', body: JSON.stringify({ nome_cargo: nome }) });
    e.target.reset();
    carregarCargosTabela();
});

formAdicionarLingua.addEventListener('submit', async e => {
    e.preventDefault();
    const nome = e.target.nome_lingua.value.trim();
    const sigla = e.target.sigla.value.trim();
    if (!nome || !sigla) return;

    await apiFetch('/api/admin/linguas', { method: 'POST', body: JSON.stringify({ nome_lingua: nome, sigla }) });
    e.target.reset();
    carregarLinguas();
});

// =======================
// FUNÇÕES EDITAR / ELIMINAR
// =======================

// Exemplo Cargos
function editarCargo(id, nome) {
    // Preencher form de edição
    formEditarCargo.nome_cargo.value = nome;
    formEditarCargo.id_cargo.value = id;

    // Mostrar form de edição e esconder form de adicionar
    formEditarCargo.style.display = 'flex';
    formAdicionarCargo.style.display = 'none';

    formEditarCargo.onsubmit = async e => {
        e.preventDefault();
        const novoNome = formEditarCargo.nome_cargo.value.trim();
        if (!novoNome) return;

        await apiFetch(`/api/admin/cargos/${id}`, { method: 'PUT', body: JSON.stringify({ nome_cargo: novoNome }) });

        // Resetar e alternar forms
        formEditarCargo.reset();
        formEditarCargo.style.display = 'none';
        formAdicionarCargo.style.display = 'flex';
        formEditarCargo.onsubmit = null;

        carregarCargosTabela();
    };
}

async function eliminarCargo(id) {
    if (!confirm('Tem certeza que quer eliminar este cargo?')) return;
    await apiFetch(`/api/admin/cargos/${id}`, { method: 'DELETE' });
    carregarCargosTabela();
}

function editarLingua(id, nome, sigla) {
    formEditarLingua.nome_lingua.value = nome;
    formEditarLingua.sigla.value = sigla;
    formEditarLingua.id_lingua.value = id;

    formEditarLingua.style.display = 'flex';
    formAdicionarLingua.style.display = 'none';

    formEditarLingua.onsubmit = async e => {
        e.preventDefault();
        const novoNome = formEditarLingua.nome_lingua.value.trim();
        const novaSigla = formEditarLingua.sigla.value.trim();
        if (!novoNome || !novaSigla) return;

        await apiFetch(`/api/admin/linguas/${id}`, { method: 'PUT', body: JSON.stringify({ nome_lingua: novoNome, sigla: novaSigla }) });
        formEditarLingua.reset();
        formEditarLingua.style.display = 'none';
        formAdicionarLingua.style.display = 'flex';
        formEditarLingua.onsubmit = null;
        carregarLinguas();
    };
}

async function eliminarLingua(id) {
    if (!confirm('Tem certeza que quer eliminar esta língua?')) return;
    await apiFetch(`/api/admin/linguas/${id}`, { method: 'DELETE' });
    carregarLinguas();
}
