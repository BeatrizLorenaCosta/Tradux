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
    sigla VARCHAR(10) NOT NULL
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
    documento_link_final VARCHAR(255) DEFAULT NULL,
    documento_link_traduzido VARCHAR(255) DEFAULT NULL,

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
        'pago',
        'aguardando_assinaturas',
        'aguardando_link'
        ) DEFAULT 'em_analise',

    erros_encontrados TEXT DEFAULT NULL,
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

CREATE TABLE equipa_assinaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conta_id INT NOT NULL,
    documento_id INT NOT NULL,
    assinou_documento TINYINT DEFAULT 0,
    FOREIGN KEY (conta_id) REFERENCES contas(id_conta) ON DELETE CASCADE,
    FOREIGN KEY (documento_id) REFERENCES documentos(id_documento) ON DELETE CASCADE,
    UNIQUE(conta_id, documento_id)
);

CREATE TABLE equipa_documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipa_id INT NOT NULL,
    documento_id INT NOT NULL,
    responsavel_upload_id INT DEFAULT NULL,
    FOREIGN KEY (responsavel_upload_id) REFERENCES contas(id_conta),
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
    descricao VARCHAR(150) DEFAULT 'Serviço de tradução',
    email_cliente VARCHAR(150) NOT NULL,
    linguas VARCHAR(50),
    quantidade INT NOT NULL,  -- Ex: 12 páginas ou 1 serviço
    valor_total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (conta_id) REFERENCES contas(id_conta),
    FOREIGN KEY (documento_id) REFERENCES documentos(id_documento),
    UNIQUE (documento_id)
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
('Pedro Cliente', 'pedro@cliente.pt', 'pedrocli', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 3),
('Sofia Tradutora', 'sofia@tradux.pt', 'sofiatrad', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 3),
('Luís Tradutor', 'luis@tradux.pt', 'luistrad', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 3),
('Inês Revisora', 'ines@tradux.pt', 'inesrev', '$2b$10$0cwKx.evlf3jDJBuJ.9t/uky/O960QGblq5.Wy2HHhoKqUsEkkRMG', 4);

INSERT INTO perfis_linguisticos (conta_id, lingua_principal, lingua_secundaria) VALUES
(3, 1, 2),  -- João: Português → Inglês
(4, 2, 1),  -- Ana: Inglês → Português
(5, 1, 4),  -- Carlos: PT → FR
(9, 1, 3),  -- Luís: EN → ES
(10, 3, 1);  -- Inês: ES → PT


INSERT INTO equipas (nome_equipa, tipo) VALUES
('Equipa de Tradutores', 'tradutores'),
('Equipa de Revisores', 'revisores');

INSERT INTO equipa_membros (equipa_id, conta_id) VALUES
(1, 4),
(2, 5),
(2, 10),
(1, 8);