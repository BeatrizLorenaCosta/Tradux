const API_LINGUAS = 'http://localhost:5000/api/traducao/linguas';

const origemSelect = document.getElementById('origem');
const destinoSelect = document.getElementById('destino');

let linguas = [];
let origemSelecionada = ''; // texto selecionado pelo usuário

// Carrega línguas do servidor
async function carregarLinguas() {
    try {
        const res = await fetch(API_LINGUAS);
        if (!res.ok) throw new Error('Erro ao buscar línguas');
        linguas = await res.json();

        preencherOrigem();
        destinoSelect.disabled = true; // desativa destino até selecionar origem
    } catch (err) {
        console.error('Erro ao carregar línguas:', err);
        alert('Não foi possível carregar as línguas. Tenta novamente.');
    }
}

// Preenche select de origem
function preencherOrigem() {
    origemSelect.innerHTML = '<option value="">Selecione a língua</option>';
    linguas.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id_linguas; // pode manter o id como value
        opt.textContent = l.nome_lingua; // texto da opção
        origemSelect.appendChild(opt);
    });
}

// Atualiza select de destino filtrando a origem
function atualizarDestino() {
    destinoSelect.innerHTML = '<option value="">Selecione a língua</option>';

    if (!origemSelecionada) {
        destinoSelect.disabled = true;
        return;
    }

    destinoSelect.disabled = false;

    linguas.forEach(l => {
        // filtra pelo texto da língua
        if (l.nome_lingua !== origemSelecionada) {
            const opt = document.createElement('option');
            opt.value = l.id_linguas;
            opt.textContent = l.nome_lingua;
            destinoSelect.appendChild(opt);
        }
    });

    console.log("Destino atualizado. Origem ignorada:", origemSelecionada);
}

// Evento de mudança na origem
origemSelect.addEventListener('change', () => {
    origemSelecionada = origemSelect.options[origemSelect.selectedIndex].text;
    atualizarDestino();
});

// Bloqueia campos se não estiver logado
function bloquearCamposSeNaoLogado() {
    const token = localStorage.getItem('token');
    const elementos = document.querySelectorAll('select, input, button');

    if (!token) {
        elementos.forEach(el => {
            el.disabled = true;
            el.style.cursor = 'not-allowed';
            el.style.opacity = '0.6';
        });

        const aviso = document.createElement('div');
        aviso.className = 'alert alert-warning text-center mt-4';
        aviso.innerText = 'É necessário iniciar sessão para usar a tradução.';
        document.querySelector('main').prepend(aviso);
    } else {
        elementos.forEach(el => el.disabled = false);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    bloquearCamposSeNaoLogado();
    carregarLinguas();
});
