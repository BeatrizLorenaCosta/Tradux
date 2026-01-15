document.addEventListener('DOMContentLoaded', () => {
    const reciboId = localStorage.getItem('reciboId');
    if (!reciboId) {
        alert('Nenhum recibo encontrado');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = 'login-signup.html';
        return;
    }

    fetch(`http://localhost:5000/api/recibos/${reciboId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(res => {
            if (!res.ok) throw new Error('Erro ao carregar recibo');
            return res.json();
        })
        .then(data => {
            console.log('Dados do recibo:', data);
            // Preenche os elementos da página com os dados
            document.getElementById('recibo-numero').textContent = `REC-${data.id_recibo}`;
            document.getElementById('nome-cliente').textContent = data.nome_cliente;
            document.getElementById('email-cliente').textContent = data.email_cliente;
            document.getElementById('data-emissao').textContent = new Date(data.data_emissao).toLocaleDateString('pt-PT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('data-pagamento').textContent = new Date(data.data_pagamento).toLocaleDateString('pt-PT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('descricao-servico').textContent = data.descricao;
            document.getElementById('id-documento').textContent = `#${data.id_documento}`;
            document.getElementById('linguas').textContent = data.linguas;
            document.getElementById('quantidade').textContent = data.quantidade + ' páginas';
            document.getElementById('valor-total').textContent = `€ ${parseFloat(data.valor_total).toFixed(2)}`;
            document.getElementById('total-final').textContent = `€ ${parseFloat(data.valor_total).toFixed(2)}`;

            // Mostrar método de pagamento
            const metodoPagamento = localStorage.getItem('metodoPagamento');
            const metodoElem = document.getElementById('metodo-pagamento');
            if (metodoPagamento === 'cartao') {
                metodoElem.textContent = 'Cartão de Crédito (**** 4242)';
            } else if (metodoPagamento === 'mbway') {
                metodoElem.textContent = 'MBWay';
            }
        })
        .catch(err => {
            console.error('Erro ao carregar recibo:', err);
            alert('Erro ao carregar o recibo: ' + err.message);
        });
});

function gerarPDF() {
    const nomeCliente = document.getElementById('nome-cliente').textContent;
    const emailCliente = document.getElementById('email-cliente').textContent;
    const reciboNumero = document.getElementById('recibo-numero').textContent;
    const dataEmissao = document.getElementById('data-emissao').textContent;
    const descricao = document.getElementById('descricao-servico').textContent;
    const linguas = document.getElementById('linguas').textContent;
    const quantidade = document.getElementById('quantidade').textContent;
    const valorTotal = document.getElementById('valor-total').textContent;
    const metodoPagamento = document.getElementById('metodo-pagamento').textContent;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Adicionar logo
    const logoImg = '../src/img/titulo.png'; // Caminho da logo
    doc.addImage(logoImg, 'PNG', 150, 10, 50, 30); // x, y, width, height

    // Cores
    const corPrimaria = [0, 102, 204];
    const corFundo = [240, 248, 255];

    // Dados da empresa
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Tradux - Serviços de Tradução', 14, 30);
    doc.text('Website: www.tradux.pt', 14, 36);

    // Linha separadora
    doc.setDrawColor(...corPrimaria);
    doc.line(14, 42, 196, 42);

    // Número e data do recibo
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Recibo Nº: ${reciboNumero}`, 14, 52);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Data de Emissão: ${dataEmissao}`, 14, 58);

    // Dados do cliente
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Emitido para:', 14, 70);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${nomeCliente}`, 14, 76);
    doc.text(`Email: ${emailCliente}`, 14, 82);

    // Tabela de detalhes
    doc.autoTable({
        head: [['Descrição', 'Línguas', 'Quantidade', 'Valor']],
        body: [
            [descricao, linguas, quantidade, valorTotal]
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
    doc.text(`Total: ${valorTotal}`, 14, finalY);

    // Método de pagamento
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Método de Pagamento: ${metodoPagamento}`, 14, finalY + 8);

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('© 2025 Tradux. Todos os direitos reservados.', 14, 280);

    // Salvar
    doc.save(`${reciboNumero}.pdf`);
}
