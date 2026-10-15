-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile ENUM('Admin', 'Usuário') NOT NULL,
    celular VARCHAR(20)
);

-- Fazendas Table
CREATE TABLE IF NOT EXISTS fazendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT
);

-- Pastos Table
CREATE TABLE IF NOT EXISTS pastos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    fazenda_id INT NOT NULL,
    FOREIGN KEY (fazenda_id) REFERENCES fazendas (id) ON DELETE CASCADE
);

-- Bois Table
CREATE TABLE IF NOT EXISTS bois (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    initial_weight DECIMAL(10, 2),
    arrival_date DATE,
    brinco VARCHAR(50),
    vendedor VARCHAR(255),
    local_compra VARCHAR(255),
    valor_boi DECIMAL(10, 2),
    valor_comissao DECIMAL(10, 2),
    valor_frete DECIMAL(10, 2),
    valor_por_kg DECIMAL(10, 2),
    raca VARCHAR(100),
    baixa_id INT,
    baixa_status VARCHAR(50),
    pai_id INT,
    mae_id INT,
    sexo ENUM('M', 'F'),
    geracao INT,
    data_nascimento DATE
);

-- Manejo Pasto Table
CREATE TABLE IF NOT EXISTS manejo_pasto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    boi_id INT NOT NULL,
    pasto_id INT NOT NULL,
    fazenda_id INT NOT NULL,
    initial_weight_manejo DECIMAL(10, 2),
    weight_01 DECIMAL(10, 2),
    date_weight_01 DATETIME,
    weight_02 DECIMAL(10, 2),
    date_weight_02 DATETIME,
    weight_03 DECIMAL(10, 2),
    date_weight_03 DATETIME,
    weight_04 DECIMAL(10, 2),
    date_weight_04 DATETIME,
    weight_05 DECIMAL(10, 2),
    date_weight_05 DATETIME,
    weight_06 DECIMAL(10, 2),
    date_weight_06 DATETIME,
    weight_07 DECIMAL(10, 2),
    date_weight_07 DATETIME,
    weight_08 DECIMAL(10, 2),
    date_weight_08 DATETIME,
    weight_09 DECIMAL(10, 2),
    date_weight_09 DATETIME,
    weight_10 DECIMAL(10, 2),
    date_weight_10 DATETIME,
    total_weight_registered DECIMAL(10, 2),
    weights_count INT,
    FOREIGN KEY (boi_id) REFERENCES bois (id) ON DELETE CASCADE,
    FOREIGN KEY (pasto_id) REFERENCES pastos (id) ON DELETE CASCADE,
    FOREIGN KEY (fazenda_id) REFERENCES fazendas (id) ON DELETE CASCADE
);

-- Vacinas Table
CREATE TABLE IF NOT EXISTS vacinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    boi_id INT NOT NULL,
    chip VARCHAR(50),
    brinco VARCHAR(50),
    vacina VARCHAR(255) NOT NULL,
    data_vacina DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (boi_id) REFERENCES bois (id) ON DELETE CASCADE
);

-- Dietas Table
CREATE TABLE IF NOT EXISTS dietas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fazenda_id INT NOT NULL,
    pasto_id INT NOT NULL,
    qtd_bois INT,
    data DATE NOT NULL,
    dieta_tipo VARCHAR(100) NOT NULL,
    qtd_kg DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fazenda_id) REFERENCES fazendas (id) ON DELETE CASCADE,
    FOREIGN KEY (pasto_id) REFERENCES pastos (id) ON DELETE CASCADE
);

-- Baixas Table
CREATE TABLE IF NOT EXISTS baixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    boi_id INT NOT NULL,
    boton VARCHAR(50) NOT NULL,
    brinco VARCHAR(50),
    ultimo_peso DECIMAL(10, 2),
    data_baixa DATE NOT NULL,
    status ENUM('Vendido', 'Morreu') NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (boi_id) REFERENCES bois (id) ON DELETE CASCADE
);

-- Perspectives Table
CREATE TABLE IF NOT EXISTS perspectives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    boi_id INT NOT NULL,
    fazenda_id INT,
    pasto_id INT,
    start_date DATE,
    days INT,
    daily_rate DECIMAL(10, 2),
    initial_weight DECIMAL(10, 2),
    final_weight DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (boi_id) REFERENCES bois (id) ON DELETE CASCADE
);