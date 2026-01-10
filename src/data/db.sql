DROP DATABASE IF EXISTS tradux;
CREATE DATABASE tradux
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE tradux;

DROP USER IF EXISTS 'tradux_user'@'localhost';
CREATE USER 'tradux_user'@'localhost' IDENTIFIED BY '12345';
GRANT SELECT, INSERT, UPDATE, DELETE ON tradux.* TO 'tradux_user'@'localhost';
FLUSH PRIVILEGES;


create table cargo (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    nome_cargo VARCHAR(20) NOT NULL UNIQUE
);

create table linguas (
    id_lingua INT AUTO_INCREMENT PRIMARY KEY,
    nome_lingua VARCHAR(50) NOT NULL UNIQUE,
    sigla VARCHAR(10),
    contagem INT DEFAULT 0
);

create table contas (
    id_conta INT AUTO_INCREMENT PRIMARY KEY,
    nome_utilizador VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    cargo_id INT NOT NULL DEFAULT 2,

    CONSTRAINT fk_contas_cargo FOREIGN KEY (cargo_id) REFERENCES cargo(id_cargo)
);

create table documentos (
    id_documento INT AUTO_INCREMENT PRIMARY KEY,
    nome_documento VARCHAR(100),
    documento_link VARCHAR(255) NOT NULL,
    documento_link_final VARCHAR(255),

    lingua_origem INT NOT NULL,
    lingua_destino INT NOT NULL,
    valor float,
    paginas INT,

    data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,

    estado ENUM(
        'em_analise',
        'em_traducao', 
        'em_revisao', 
        'traduzido', 
        'finalizado',
        'a_pagar',
        'cancelado',
        'pago'
        ) DEFAULT 'em_analise',

    erros_encontrados TEXT,
    conta_id INT NOT NULL,
    
    FOREIGN KEY (conta_id) REFERENCES contas(id_conta),
    FOREIGN KEY (lingua_origem) REFERENCES linguas(id_lingua),
    FOREIGN KEY (lingua_destino) REFERENCES linguas(id_lingua)
);

CREATE TABLE equipas (
    id_equipa INT AUTO_INCREMENT PRIMARY KEY,
    nome_equipa VARCHAR(100) NOT NULL,
    tipo ENUM('tradutores','revisores') NOT NULL
);

CREATE TABLE equipa_membros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipa_id INT NOT NULL,
    conta_id INT NOT NULL,
    FOREIGN KEY (equipa_id) REFERENCES equipas(id_equipa) ON DELETE CASCADE,
    FOREIGN KEY (conta_id) REFERENCES contas(id_conta) ON DELETE CASCADE
);

CREATE TABLE equipa_documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipa_id INT NOT NULL,
    documento_id INT NOT NULL,
    FOREIGN KEY (equipa_id) REFERENCES equipas(id_equipa) ON DELETE CASCADE,
    FOREIGN KEY (documento_id) REFERENCES documentos(id_documento) ON DELETE CASCADE,
    UNIQUE (equipa_id, documento_id)
);

CREATE TABLE recibos (
    id_recibo INT AUTO_INCREMENT PRIMARY KEY,
    conta_id INT NOT NULL,
    documento_id INT NOT NULL,
    data_emissao DATETIME NOT NULL,
    data_pagamento DATETIME NOT NULL,
    nome_cliente VARCHAR(100) NOT NULL,
    email_cliente VARCHAR(150) NOT NULL,
    linguas VARCHAR(50),
    quantidade VARCHAR(50),  -- Ex: 12 páginas ou 1 serviço
    valor_total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (conta_id) REFERENCES contas(id_conta),
    FOREIGN KEY (documento_id) REFERENCES documentos(id_documento)
);

create table perfis_linguisticos (
    id_perfil_linguistico INT AUTO_INCREMENT PRIMARY KEY,
    conta_id INT NOT NULL,

    lingua_principal INT NOT NULL,
    lingua_secundaria INT DEFAULT NULL,

    CONSTRAINT fk_perfis_conta FOREIGN KEY (conta_id) REFERENCES contas(id_conta) ON DELETE CASCADE,

    CONSTRAINT fk_perfis_lingua_principal FOREIGN KEY (lingua_principal) REFERENCES linguas(id_lingua),

    CONSTRAINT fk_perfis_lingua_secundaria FOREIGN KEY (lingua_secundaria) REFERENCES linguas(id_lingua),

    CONSTRAINT uq_perfil_unico_por_conta UNIQUE (conta_id)
);

--
-- INSERTS
-- 

INSERT INTO cargo (nome_cargo) VALUES 
('Admin'),
('Cliente'),
('Tradutor'),
('Revisor');

INSERT INTO linguas (nome_lingua, sigla) VALUES
('Português', 'PT'),
('Inglês', 'EN'),
('Espanhol', 'ES'),
('Francês', 'FR'),
('Alemão', 'DE');

INSERT INTO contas (nome_utilizador, email, username, senha_hash, cargo_id) VALUES
('Administrador', 'admin@tradux.pt', 'admin', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 1), -- password: 123123
('Maria Costa', 'adminMaria@tradux.pt', 'adminMaria', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 1), -- password: 123123
('João Cliente', 'joao@cliente.pt', 'joaocliente', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 2), -- password: 123123
('Ana Tradutora', 'ana@tradux.pt', 'anatrad', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 3), -- password: 123123
('Carlos Revisor', 'carlos@tradux.pt', 'carlosrev', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 4), -- password: 123123
('Beatriz Cliente', 'beatriz@cliente.pt', 'bea', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 2), -- password: 123123
('Pedro Cliente', 'pedro@cliente.pt', 'pedrocli', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 2),
('Sofia Tradutora', 'sofia@tradux.pt', 'sofiatrad', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 3),
('Luís Tradutor', 'luis@tradux.pt', 'luistrad', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 3),
('Inês Revisora', 'ines@tradux.pt', 'inesrev', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 4);

INSERT INTO perfis_linguisticos (conta_id, lingua_principal, lingua_secundaria) VALUES
(3, 1, 2),  -- Ana: Português → Inglês
(4, 2, 1),  -- Carlos: Inglês → Português
(7, 1, 4),  -- Sofia: PT → FR
(8, 2, 3),  -- Luís: EN → ES
(9, 3, 1);  -- Inês: ES → PT


INSERT INTO documentos (nome_documento, documento_link, documento_link_final, lingua_origem, lingua_destino, valor, paginas, estado, erros_encontrados, conta_id) VALUES
('Documento 1', '/uploads/doc1_original.pdf', NULL, 1, 2, 25.00, 5, 'a_pagar', NULL, 6),
('Documento 2', '/uploads/doc2_original.docx', '/uploads/doc2_final.docx', 2, 1, 40.00, 8, 'finalizado', 'Pequenos erros gramaticais corrigidos', 6),
('Documento 3', '/uploads/doc3_original.pdf', NULL, 1, 3, 0.00, 6, 'em_analise', NULL, 6),
('Documento 4', '/uploads/doc4_original.pdf', NULL, 1, 3, 35.00, 7, 'em_revisao', NULL, 6),
('Documento 5', '/uploads/doc5_original.pdf', NULL, 1, 3, 20.00, 4, 'traduzido', NULL, 6),
('Documento 6', '/uploads/doc6_original.pdf', NULL, 1, 3, 50.00, 10, 'pago', NULL, 6),
('Documento 7', '/uploads/doc7_original.pdf', NULL, 1, 3, 30.00, 3, 'cancelado', NULL, 6),
('Contrato Comercial', '/uploads/contrato_original.pdf', NULL, 1, 2, 60.00, 12, 'em_traducao', NULL, 7),
('Manual Técnico', '/uploads/manual_original.pdf', NULL, 2, 1, 80.00, 20, 'em_revisao', NULL, 7),
('Certidão', '/uploads/certidao_original.pdf', '/uploads/certidao_final.pdf', 1, 4, 30.00, 3, 'finalizado', NULL, 7),
('Relatório Financeiro', '/uploads/relatorio.pdf', NULL, 3, 1, 0.00, 15, 'em_analise', NULL, 7),
('Apresentação', '/uploads/apresentacao.pptx', '/uploads/apresentacao_final.pptx', 2, 3, 45.00, 9, 'a_pagar', NULL, 7);


INSERT INTO equipas (nome_equipa, tipo) VALUES
('Equipa de Tradutores', 'tradutores'),
('Equipa de Revisores', 'revisores'),
('Tradutores FR', 'tradutores'),
('Revisores Técnicos', 'revisores');

INSERT INTO equipa_membros (equipa_id, conta_id) VALUES
(1, 4),
(1, 5), -- Carlos Revisor é membro da equipa de revisores
(3, 7), -- Sofia na equipa Tradutores FR
(3, 8), -- Luís na equipa Tradutores FR
(4, 9); -- Inês na equipa Revisores Técnicos

INSERT INTO equipa_documentos (equipa_id, documento_id) VALUES
(1, 1), -- Equipa de tradutores trabalha no documento 1
(2, 2), -- Equipa de revisores trabalha no documento 2
(3, 8), -- Tradutores FR → Contrato Comercial
(4, 9), -- Revisores Técnicos → Manual Técnico
(4, 10);

-- INSERT INTO recibos (
--     conta_id,
--     documento_id,
--     numero_recibo,
--     data_emissao,
--     data_pagamento,
--     nome_cliente,
--     email_cliente,
--     descricao_servico,
--     id_servico,
--     linguas,
--     quantidade,
--     valor_servico,
--     valor_iva,
--     valor_total
-- ) VALUES (
--     2,                          -- ID da conta do cliente (ex: Maria João Silva)
--     7,                          -- ID do documento
--     'REC-2026-0048',            -- Número do recibo
--     '2026-01-06 00:00:00',      -- Data de emissão
--     '2026-01-06 00:00:00',      -- Data de pagamento
--     'Maria João Silva',         -- Nome do cliente
--     'maria.silva@email.com',    -- Email do cliente
--     'Tradução Certificada - Contrato Comercial',  -- Descrição do serviço
--     '#TRX-2048',                -- ID do serviço
--     'Português → Inglês',       -- Línguas
--     '12 páginas',               -- Quantidade
--     222.00,                     -- Valor do serviço
--     50.37,                      -- IVA (23%)
--     267.00                      -- Total pago
-- );