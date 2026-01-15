function initUtilizadores() {
    console.log('Utilizadores inicializados');
    carregarUtilizadores();
}

async function carregarUtilizadores() {
    const users = await apiFetch('/api/admin/users');
    const tbody = document.querySelector('#utilizadores tbody');

    renderTabela(tbody,
        users.map(u => `
            <tr>
                <td>#${formatarId(u.id_conta)}</td>
                <td>${u.nome_utilizador}</td>
                <td>${u.email}</td>
                <td>${u.username}</td>
                <td>${u.nome_cargo}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-alterar-cargo"
                        onclick="abrirFormAlterar(${u.id_conta}, this, 'cargo')">
                        Alterar Cargo
                    </button>
                    <button class="btn btn-sm btn-danger"
                        onclick="eliminar(${u.id_conta}, 'user')">
                        Eliminar
                    </button>
                </td>
            </tr>
        `),
        'Nenhum utilizador encontrado.',
        6
    );
}

async function carregarCargos() {
    const cargos = await apiFetch('/api/admin/cargos');
    const select = document.querySelector('#form-alterar-cargo select');
    select.innerHTML = '<option value="">Selecionar</option>';
    cargos.forEach(c =>
        select.innerHTML += `<option value="${c.id_cargo}">${c.nome_cargo}</option>`
    );
}

document.getElementById('form-alterar-cargo')?.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelectorAll('.btn-alterar-cargo').forEach(btn => {
        btn.textContent = 'Alterar Cargo';
        delete btn.dataset.open;
    });

    await apiFetch(`/api/admin/users/${e.target.id_conta.value}/cargo`, {
        method: 'PUT',
        body: JSON.stringify({ cargo_id: e.target.cargo_id.value })
    });
    carregarUtilizadores();
    document.getElementById('form-alterar-cargo-wrapper').style.display = 'none';
});