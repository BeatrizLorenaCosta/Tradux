function initDocumentos() {
    console.log('Documentos inicializados');
    carregarDocumentos();
}

async function carregarDocumentos() {
    const docs = await apiFetch('/api/admin/documentos');
    const tbody = document.querySelector('#documentos tbody');

    renderTabela(tbody,
        docs.map(d => {
            const [l, c] = mapEstado(d.estado);
            return `
            <tr>
                <td>#TRX-${formatarId(d.id_documento)}</td>
                <td>${d.cliente_nome}</td>
                <td>${d.lingua_origem} → ${d.lingua_destino}</td>
                <td><span class="badge bg-${c} ${c === 'light' ? 'text-dark' : ''}">${l}</span></td>
                <td>${d.equipas || 'Não tem equipas associadas'}</td>
                <td>${d.valor ? d.valor + '€' : 'Não tem valor'}</td>
                <td>${formatarData(d.data_envio)}</td>
                <td>
                    ${d.estado === 'em_analise'
                        ? `<button class="btn btn-sm btn-primary btn-alterar-valor"
                            onclick="abrirFormAlterar(${d.id_documento}, this, 'valor')">
                            Alterar Valor
                          </button>` : ''}
                    ${d.estado === 'cancelado'
                        ? `<button class="btn btn-sm btn-danger"
                            onclick="eliminar(${d.id_documento}, 'documento')">
                            Eliminar
                          </button>` : ''}
                </td>
            </tr>`;
        }),
        'Nenhum documento encontrado.',
        8
    );
}

document.getElementById('form-alterar-valor')?.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelectorAll('.btn-alterar-valor').forEach(btn => {
        btn.textContent = 'Alterar Valor';
        delete btn.dataset.open;
    });

    await apiFetch(`/api/admin/documentos/${e.target.id_documento.value}/valor`, {
        method: 'PUT',
        body: JSON.stringify({ valor: e.target.valor.value })
    });
    await apiFetch(`/api/admin/documentos/${e.target.id_documento.value}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'em_analise' })
    });
    carregarDocumentos();
    document.getElementById('form-alterar-valor-wrapper').style.display = 'none';
});