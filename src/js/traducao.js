const API_LINGUAS = 'http://localhost:5000/api/traducao/linguas';

// ELEMENTOS DOM
const origemSelect = document.getElementById('origem');
const destinoSelect = document.getElementById('destino');
const inputFile = document.getElementById('documento');
const status = document.getElementById('traducao-status');
const btnEnviar = document.getElementById('btn-enviar');

// ESTADO
let linguas = [];
let origemSelecionada = '';

// =======================
// CARREGAR LÍNGUAS
// =======================
async function carregarLinguas() {
  try {
    const res = await fetch(API_LINGUAS);
    if (!res.ok) throw new Error('Erro ao buscar línguas');
    linguas = await res.json();

    preencherOrigem();
    destinoSelect.disabled = true;
    btnEnviar.disabled = true;
  } catch (err) {
    console.error(err);
    alert('Não foi possível carregar as línguas.');
  }
}

// =======================
// SELECT ORIGEM
// =======================
function preencherOrigem() {
  origemSelect.innerHTML = '<option value="">Selecione a língua</option>';

  linguas.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.id_linguas;
    opt.textContent = l.nome_lingua;
    origemSelect.appendChild(opt);
  });
}

// =======================
// SELECT DESTINO
// =======================
function atualizarDestino() {
  destinoSelect.innerHTML = '<option value="">Selecione a língua</option>';

  if (!origemSelecionada) {
    destinoSelect.disabled = true;
    validarLinguas();
    return;
  }

  destinoSelect.disabled = false;

  linguas.forEach(l => {
    if (l.nome_lingua !== origemSelecionada) {
      const opt = document.createElement('option');
      opt.value = l.id_linguas;
      opt.textContent = l.nome_lingua;
      destinoSelect.appendChild(opt);
    }
  });

  validarLinguas();
}

// =======================
// VALIDAÇÃO DAS LÍNGUAS
// =======================
function validarLinguas() {
  const origemValida = origemSelect.value !== '';
  const destinoValida = destinoSelect.value !== '';

  btnEnviar.disabled = !(origemValida && destinoValida);
}

// =======================
// EVENTOS DOS SELECTS
// =======================
origemSelect.addEventListener('change', () => {
  origemSelecionada =
    origemSelect.options[origemSelect.selectedIndex].text;

  atualizarDestino();
});

destinoSelect.addEventListener('change', validarLinguas);

// =======================
// UPLOAD PDF
// =======================
async function uploadPDF() {
  if (!origemSelect.value || !destinoSelect.value) {
    alert('Seleciona a língua de origem e destino.');
    return;
  }

  const file = inputFile.files[0];

  if (!file) {
    alert('Seleciona um ficheiro PDF.');
    return;
  }

  status.innerText = 'A enviar ficheiro...';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('origem', origemSelect.value);
  formData.append('destino', destinoSelect.value);

  try {
    const res = await fetch(
      'http://localhost:5000/api/traducao/upload',
      {
        method: 'POST',
        headers: {
          Authorization: localStorage.getItem('token') || ''
        },
        body: formData
      }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    console.log('Upload OK:', data);
    status.innerText = 'Ficheiro enviado com sucesso ✅';
  } catch (err) {
    console.error(err);
    status.innerText = 'Erro ao enviar ficheiro ❌';
  }
}

// =======================
// FILE CHANGE
// =======================
inputFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    status.innerText = `Ficheiro selecionado: ${file.name}`;
  }
});

// =======================
// LOGIN CHECK + INIT
// =======================
function bloquearCamposSeNaoLogado() {
  const token = localStorage.getItem('token');

  if (!token) {
    document
      .querySelectorAll('select, input, button')
      .forEach(el => {
        el.disabled = true;
        el.style.opacity = '0.6';
      });

    const aviso = document.createElement('div');
    aviso.className = 'alert alert-warning text-center mt-4';
    aviso.innerText =
      'É necessário iniciar sessão para usar a tradução.';
    document.querySelector('main').prepend(aviso);
  }
}

// =======================
// INIT
// =======================
document.addEventListener('DOMContentLoaded', () => {
  bloquearCamposSeNaoLogado();
  carregarLinguas();
  btnEnviar.addEventListener('click', uploadPDF);
});
