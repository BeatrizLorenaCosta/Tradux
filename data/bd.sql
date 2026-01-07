DROP DATABASE IF EXISTS traduxBd;
CREATE DATABASE traduxBd
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE traduxBd;

-- =========================
-- TABELA: cargo
-- =========================
CREATE TABLE cargo (
  ID_Cargo INT AUTO_INCREMENT PRIMARY KEY,
  cargo VARCHAR(20) NOT NULL
);

INSERT INTO cargo (cargo) VALUES
('admin'),
('cliente'),
('tradutor'),
('revisor');

-- =========================
-- TABELA: contas
-- =========================
CREATE TABLE contas (
  ID_conta INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(45) NOT NULL,
  nome VARCHAR(45),
  ID_Cargo INT DEFAULT 2,

  CONSTRAINT fk_contas_cargo
    FOREIGN KEY (ID_Cargo) REFERENCES cargo(ID_Cargo)
);

-- =========================
-- TABELA: linguas
-- =========================
CREATE TABLE linguas (
  ID_linguas INT AUTO_INCREMENT PRIMARY KEY,
  lingua VARCHAR(45) NOT NULL,
  contagem INT DEFAULT 0
);

INSERT INTO linguas (lingua) VALUES
('Português'),
('Inglês'),
('Alemão'),
('Francês'),
('Espanhol'),
('Italiano');

-- =========================
-- TABELA: documentos_sistema
-- =========================
CREATE TABLE documentos_sistema (
  ID_Documento INT AUTO_INCREMENT PRIMARY KEY,
  ID_conta INT NOT NULL,
  linguas_ID_linguas INT NOT NULL,
  lingua_original VARCHAR(45) NOT NULL,

  documento_url VARCHAR(255) NOT NULL,
  documento_traduzido_url VARCHAR(255),

  doc_enviado TINYINT(1) DEFAULT 0,
  doc_traduzido TINYINT(1) DEFAULT 0,
  doc_revisado TINYINT(1) DEFAULT 0,
  doc_finalizado TINYINT(1) DEFAULT 0,

  erros_revisao VARCHAR(255),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_documento_conta
    FOREIGN KEY (ID_conta) REFERENCES contas(ID_conta),

  CONSTRAINT fk_documento_lingua
    FOREIGN KEY (linguas_ID_linguas) REFERENCES linguas(ID_linguas)
);

-- =========================
-- TABELA: tradutores
-- =========================
CREATE TABLE tradutores (
  ID_tradutor INT AUTO_INCREMENT PRIMARY KEY,
  ID_conta INT NOT NULL,
  lingua_principal VARCHAR(45) NOT NULL,
  lingua_secundaria VARCHAR(45),

  CONSTRAINT fk_tradutor_conta
    FOREIGN KEY (ID_conta) REFERENCES contas(ID_conta)
);

-- =========================
-- TABELA: revisores
-- =========================
CREATE TABLE revisores (
  ID_revisor INT AUTO_INCREMENT PRIMARY KEY,
  ID_conta INT NOT NULL,
  lingua_principal VARCHAR(45) NOT NULL,
  lingua_secundaria VARCHAR(45),

  CONSTRAINT fk_revisor_conta
    FOREIGN KEY (ID_conta) REFERENCES contas(ID_conta)
);

-- =========================
-- TABELA: equipas
-- =========================
CREATE TABLE equipas (
  ID_equipa INT AUTO_INCREMENT PRIMARY KEY,
  ID_Documento INT NOT NULL,
  ID_conta INT NOT NULL,
  ID_Cargo INT NOT NULL,
  ocupada TINYINT(1) DEFAULT 0,

  CONSTRAINT fk_equipa_documento
    FOREIGN KEY (ID_Documento) REFERENCES documentos_sistema(ID_Documento),

  CONSTRAINT fk_equipa_conta
    FOREIGN KEY (ID_conta) REFERENCES contas(ID_conta),

  CONSTRAINT fk_equipa_cargo
    FOREIGN KEY (ID_Cargo) REFERENCES cargo(ID_Cargo)
);
