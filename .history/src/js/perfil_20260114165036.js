/* =========================
   INIT
========================= */

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    carregarDocumentos();
    configurarFormularioDados();
    updateNavMenu();
    abrirSecaoInicialPerfil();
    carregarEquipa('tradutores');
    carregarEquipa('revisores');
});

/* =========================
   HELPERS
========================= */

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    console.log('Token:', token);
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
                    'documentos-equipa-tradutores'
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
                    'equipa-revisores'
                ),
                criarItem(
                    'fas fa-file-signature',
                    'Documentos da Equipa',
                    'documentos-equipa-revisores'
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

async function carregarEquipa(tipo) {
    try {
        const equipa = await apiFetch('/api/users/me/equipa');

        const formMembros = document.getElementById(`form-${tipo}`);
        formMembros.querySelector(`[name="nome_equipa1_${tipo}"]`).value = equipa.nome_equipa;
        formMembros.querySelector(`[name="tipo_equipa1_${tipo}"]`).value = equipa.tipo.charAt(0).toUpperCase() + equipa.tipo.slice(1);
        formMembros.querySelector(`[name="estado_equipa1_${tipo}"]`).value = equipa.ocupada ? 'Ocupada' : 'Livre';

        const tbodyMembros = document.querySelector(`#equipa-${tipo} table tbody`);
        renderTabela(tbodyMembros,
            equipa.membros.map(e => {
                return `
                    <tr>
                        <td>#${formatarId(e.id_conta)}</td>
                        <td>${e.nome_utilizador || '-'}</td>
                        <td>${e.email || '-'}</td>
                        <td>${e.linguas_membro || '-'}</td>
                    </tr>
                `;
            }),
            'Nenhum membro encontrado.',
            4
        );

        const formDocs = document.getElementById(`form2-${tipo}`);
        formDocs.querySelector(`[name="nome_equipa2_${tipo}"]`).value = equipa.nome_equipa;
        formDocs.querySelector(`[name="tipo_equipa2_${tipo}"]`).value = equipa.tipo.charAt(0).toUpperCase() + equipa.tipo.slice(1);
        formDocs.querySelector(`[name="estado_equipa2_${tipo}"]`).value = equipa.ocupada ? 'Ocupada' : 'Livre';

        const tbodyDocs = document.querySelector(`#documentos-equipa-${tipo} table tbody`);

        renderTabela(tbodyDocs,
            equipa.documentos.map(d => {
                const [l, c] = mapEstado(d.estado);

                // Quantos membros já assinaram
                const totalMembros = d.equipa?.membros?.length || 0;
                const assinaturas = d.equipa?.membros?.filter(m => m.assinou_documento).length || 0;

                return `
                    <tr>
                        <td>#TRX-${formatarId(d.id_documento)}</td>
                        <td>${d.nome_documento || '-'}</td>
                        <td>${d.cliente_nome || '-'}</td>
                        <td>${d.linguas_documento || '-'}</td>
                        <td><span class="badge bg-${c} ${c === 'light' ? 'text-dark' : ''}">${l}</span></td>
                        <td>${d.data_envio || '-'}</td>
                        <td>${d.valor != null ? d.valor.toFixed(2) + '€' : '-'}</td>
                        <td>${d.paginas || '-'}</td>
                        <td>${d.equipa_oposta ? `${d.equipa_oposta.nome_equipa} (${d.responsavel_upload_oposta?.email  || 'Não tem responsavel'})` : `Não tem equipa de ${tipo}`}</td>
                        <td>
                            <a href="${d.documento_link}" target="_blank" class="btn btn-sm btn-primary">Original</a>
                            ${d.documento_link_final ? ` <a href="${d.documento_link_final}" target="_blank" class="btn btn-sm btn-success ms-1">Final</a>` : ''}
                            ${d.documento_link_traduzido ? ` <a href="${d.documento_link_traduzido}" target="_blank" class="btn btn-sm btn-secondary ms-1">Traduzido</a>` : ''}
                             
                            <button class="btn btn-sm btn-info ms-1"
                                onclick="abrirFormAssinatura(${d.id_documento}, this, '${tipo}')">
                                Assinar
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


async function abrirFormAssinatura(id, btn, tipo) {
    const equipa = await apiFetch('/api/users/me/equipa');
    const user = await apiFetch('/api/users/me')

    const wrapper = tipo === 'tradutores' 
        ? document.getElementById('form-tradutor-wrapper') 
        : document.getElementById('form-revisor-wrapper');

    const form = tipo === 'tradutores' 
        ? document.getElementById('form-tradutor') 
        : document.getElementById('form-revisor');

    // Fechar
    const wrapperFechar = document.getElementById(`form2-${tipo}-wrapper`);
    if (wrapperFechar) wrapperFechar.style.display = 'none';

    const documento = equipa.documentos.find(d => d.id_documento === id);
    if (!documento) return;
    
    form.id_documento.value = documento.id_documento;
    form.nome_documento.value = '#TRX-' + formatarId(documento.id_documento) + ' ' + documento.nome_documento;
    form.nome_responsavel.value = documento.responsavel_upload_atual.nome_utilizador + ` (${documento.responsavel_upload_atual.email})`;
    

    const ul = tipo === 'tradutores' 
        ? document.getElementById('assinaturas-tradutores') 
        : document.getElementById('assinaturas-revisores');
    ul.innerHTML = '';

    if (tipo === 'revisores') {
        const inputErros = form.querySelector('[name="erros_encontrados"]');
        const checkboxSemErros = form.querySelector('#sem-erros');
        const btnValidar = document.getElementById('btn-validar-revisor');
        
        const isResponsavel = user.id_conta === documento.responsavel_upload_atual?.id_conta;
        if (isResponsavel) {
            inputErros.disabled = false;
            checkboxSemErros.disabled = false;
            inputErros.value = documento.erros_encontrados || '';
            checkboxSemErros.checked = documento.erros_encontrados === null || documento.erros_encontrados === '';

            checkboxSemErros.onchange = () => {
                if (checkboxSemErros.checked) {
                    inputErros.value = '';
                    inputErros.disabled = true;
                } else {
                    inputErros.disabled = false;
                }
            };
            console.log('chegou');
            console.log(btnValidar);
            btnValidar.style.display = 'inline-block';
            console.log(btnValidar);
            
            btnValidar.onclick = async () => {
                const erros = checkboxSemErros.checked
                    ? null
                    : inputErros.value.trim();

                await guardarRevisaoDocumento(documento.id_documento, erros);
                documento.erros_encontrados = erros;
            };
        } else {
            inputErros.disabled = true;
            checkboxSemErros.disabled = true;
            inputErros.value = documento.erros_encontrados || '';
            checkboxSemErros.checked = documento.erros_encontrados === null || documento.erros_encontrados === '';
        }
    }


    const membrosParaAssinatura = documento.equipa.membros.filter(
        m => m.id_conta !== documento.responsavel_upload_atual?.id_conta
    );

    if (membrosParaAssinatura.length === 0) {
        const li = document.createElement('li');
        li.className = 'list-group-item text-muted';
        li.textContent = 'Não há mais membros para assinar.';
        ul.appendChild(li);
    } else {
        membrosParaAssinatura.forEach(m => {
            const li = document.createElement('li');
            li.className = 'list-group-item';

            if (m.id_conta === user.id_conta) {
                li.innerHTML = `
                    <div class="form-check">
                        <input class="form-check-input me-2" type="checkbox" id="membro-${m.id_conta}" ${m.assinou_documento ? 'checked' : ''}>
                        <label class="form-check-label" for="membro-${m.id_conta}">
                            ${m.nome_utilizador}
                        </label>
                    </div>
                `;

                const checkbox = li.querySelector('input[type="checkbox"]');
                checkbox.onchange = async () => {
                    await assinarDocumento(documento.id_documento, m.id_conta, checkbox.checked);
                    m.assinou_documento = checkbox.checked;
                    atualizarUploadBotao(documento, tipo, user);
                };
            } else {
                li.textContent = `${m.nome_utilizador} - ${m.assinou_documento ? '✔ Assinado' : '❌ Pendente'}`;
            }

            ul.appendChild(li);
        });
    }

    let btnFechar = document.querySelector('.btn-fechar-form');
    btnFechar.onclick = () => {
        wrapper.style.display = 'none';
        form.reset();
        if (wrapperFechar) wrapperFechar.style.display = 'block';
    };

    tipo ==atualizarUploadBotao(documento, tipo, user);
    wrapper.style.display = 'block';
}
 
function atualizarUploadBotao(documento, user) {
    // Tradutores têm upload, revisores apenas "validar"
    const btn = tipoEquipa === 'tradutores' 
        ? document.getElementById('btn-upload-tradutor');

    const totalMembros = documento.equipa.membros?.length || 0;
    const assinaturas = documento.equipa?.membros?.filter(m => m.assinou_documento).length || 0;

    if (tipoEquipa === 'tradutores') {
        // Mostrar botão apenas se todos menos o responsável assinaram e o user for responsável
        if ((assinaturas >= totalMembros - 1) && (user.id_conta === documento.responsavel_upload_atual.id_conta)) {
            btn.style.display = 'inline-block';
            btn.onclick = () => uploadFicheiro(documento.id_documento);
        } else {
            btn.style.display = 'none';
        }
    } else {
        // Revisor: mostrar botão apenas se tradutor já assinou e enviou ficheiro traduzido
        if (documento.documento_link_traduzido) {
            btn.style.display = 'inline-block';
            btn.onclick = async () => {
                await assinarDocumento(documento.id_documento, user.id_conta, true);
                document.equipa.membros.find(m => m.id_conta === user.id_conta).assinou_documento = true;
                abrirFormAssinatura(documento, tipoEquipa);
            };
        } else {
            btn.style.display = 'none';
        }
    }
}

// Função para upload do ficheiro final
function uploadFicheiro(id_documento) {
    
}

async function assinarDocumento(idDocumento, idConta, assinou) {
    await apiFetch(`/api/users/documentos/${idDocumento}/assinatura`, {
        method: 'POST',
        body: JSON.stringify({ conta_id: idConta, assinou_documento: assinou ? 1 : 0 })
    });
}

async function guardarRevisaoDocumento(idDocumento, errosEncontrados) {
    console.log(errosEncontrados);
    await apiFetch(`/api/users/documentos/${idDocumento}/revisao`, {
        method: 'PUT',
        body: JSON.stringify({
            erros_encontrados: errosEncontrados
        })
    });
}




// Função auxiliar para ação do documento
function getAcaoHTML(doc) {
    if (doc.estado === 'a_pagar') {
        const nomeNovo = doc.nome_documento.replace(/'/g, "\\'");
        const linguaOrigem = typeof doc.lingua_origem === 'string' ? doc.lingua_origem : doc.lingua_origem?.nome_lingua || 'Desconhecida';
        const linguaDestino = typeof doc.lingua_destino === 'string' ? doc.lingua_destino : doc.lingua_destino?.nome_lingua || 'Desconhecida';
        return `    
            <button class="btn btn-sm btn-danger"
                onclick='irParaPagamento(
                    ${doc.id_documento}, 
                    "${nomeNovo}", 
                    "${doc.documento_link}", 
                    "${linguaOrigem}", 
                    "${linguaDestino}", 
                    ${doc.valor}, 
                    ${doc.paginas}
                )'>
                Pagar
            </button>
            <button class="btn btn-sm btn-secondary"
                onclick='cancelarFichaDocumento(${doc.id_documento})'>
                Cancelar
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
            <button class="btn btn-sm btn-secondary"
            onclick='cancelarFichaDocumento(${doc.id_documento})'>
            Cancelar Documento
            </button>
        `;
    }

    if (doc.estado === 'pago' || doc.estado === 'em_traducao' || doc.estado === 'em_revisao' || doc.estado === 'traduzido') {
        return `
            <button class="btn btn-sm btn-secondary" onclick='gerarReciboPDF(${doc.id_documento})'>
                Descarregar Recibo
            </button>
        `;
    }

    return `<span class="text-muted">Sem ações disponíveis</span>`;
}

function cancelarFichaDocumento(id_documento) {
    if (!confirm('Tem a certeza que deseja eliminar este documento? Esta ação é irreversível.')) {
        return;
    }

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/users/documento/${id_documento}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(async res => {
            if (!res.ok) {
                const text = await res.text();
                console.error('Erro delete:', text, 'Status:', res.status);
                throw new Error(`Erro ${res.status}: ${text}`);
            }
            return res.json();
        })
        .then(() => {
            alert('Documento eliminado com sucesso!');
            carregarDocumentos();
        })
        .catch(err => {
            console.error('Erro ao eliminar:', err);
            alert('Erro ao eliminar o documento: ' + err.message);
        });
}

function irParaPagamento(id_documento, nome, link, lingua_origem, lingua_destino, valor, paginas) {
    const pagamentoData = { id_documento, nome, link, lingua_origem, lingua_destino, valor, paginas };
    localStorage.setItem('pagamento', JSON.stringify(pagamentoData));
    window.location.href = 'pagamento.html';
}

function gerarReciboPDF(id_documento) {
    const token = localStorage.getItem('token');

    fetch(`http://localhost:5000/api/recibos/documento/${id_documento}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(async res => {
            if (!res.ok) {
                const text = await res.text();
                console.error('Erro ao buscar recibo:', text, 'Status:', res.status);
                throw new Error(`Status ${res.status}: ${text}`);
            }
            return res.json();
        })
        .then(recibo => {
            console.log('Recibo obtido:', recibo);

            // Gerar PDF no cliente com jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Cores
            const corPrimaria = [0, 102, 204];
            const corFundo = [240, 248, 255];

            // Dados da empresa
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text('Tradux - Serviços de Tradução', 14, 20);
            doc.text('Website: www.tradux.pt', 14, 26);

            // Linha separadora
            doc.setDrawColor(...corPrimaria);
            doc.line(14, 32, 196, 32);

            // Número e data do recibo
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`Recibo Nº: REC-${recibo.id_recibo}`, 14, 42);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.text(`Data de Emissão: ${new Date(recibo.data_emissao).toLocaleDateString('pt-PT')}`, 14, 48);

            // Dados do cliente
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('Emitido para:', 14, 60);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.text(`Nome: ${recibo.nome_cliente}`, 14, 66);
            doc.text(`Email: ${recibo.email_cliente}`, 14, 72);

            // Tabela de detalhes
            doc.autoTable({
                head: [['Descrição', 'Línguas', 'Quantidade', 'Valor']],
                body: [
                    [recibo.descricao, recibo.linguas, `${recibo.quantidade} páginas`, `€ ${parseFloat(recibo.valor_total).toFixed(2)}`]
                ],
                startY: 92,
                styles: {
                    fontSize: 10,
                    cellPadding: 6
                },
                headStyles: {
                    fillColor: corPrimaria,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fillColor: corFundo
                }
            });

            // Total
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFont(undefined, 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...corPrimaria);
            doc.text(`Total: € ${parseFloat(recibo.valor_total).toFixed(2)}`, 14, finalY);

            // Rodapé
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text('© 2025 Tradux. Todos os direitos reservados.', 14, 280);

            // Salvar
            doc.save(`recibo_documento_${id_documento}.pdf`);
        })
        .catch(err => {
            console.error('Erro ao descarregar recibo:', err);
            alert('Erro ao descarregar recibo: ' + err.message);
        });
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
