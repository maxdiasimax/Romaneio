--
-- Arquivo gerado com SQLiteStudio v3.4.18 em qui dez 18 20:13:48 2025
--
-- Codificação de texto usada: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Tabela: baixas
CREATE TABLE baixas (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    boi_id      INTEGER NOT NULL,
    boton       TEXT    NOT NULL,
    brinco      TEXT,
    ultimo_peso REAL,
    data_baixa  TEXT    NOT NULL,
    status      TEXT    CHECK (status IN ('Vendido', 'Morreu') ) 
                        NOT NULL,
    observacao  TEXT,
    created_at  TEXT    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (
        boi_id
    )
    REFERENCES bois (id) ON DELETE CASCADE
);

INSERT INTO baixas (
                       id,
                       boi_id,
                       boton,
                       brinco,
                       ultimo_peso,
                       data_baixa,
                       status,
                       observacao,
                       created_at
                   )
                   VALUES (
                       1,
                       1,
                       'TEST_BOTON',
                       NULL,
                       NULL,
                       '2025-12-09',
                       'Vendido',
                       'Debug insert',
                       '2025-12-09 21:52:42'
                   );

INSERT INTO baixas (
                       id,
                       boi_id,
                       boton,
                       brinco,
                       ultimo_peso,
                       data_baixa,
                       status,
                       observacao,
                       created_at
                   )
                   VALUES (
                       3,
                       13,
                       'TEST-NEW-001500',
                       '1234',
                       500.0,
                       '2025-12-10',
                       'Morreu',
                       'Aftosa',
                       '2025-12-10 13:33:12'
                   );

INSERT INTO baixas (
                       id,
                       boi_id,
                       boton,
                       brinco,
                       ultimo_peso,
                       data_baixa,
                       status,
                       observacao,
                       created_at
                   )
                   VALUES (
                       4,
                       12,
                       '963000406431356',
                       '3181',
                       300.0,
                       '2025-12-10',
                       'Vendido',
                       NULL,
                       '2025-12-10 15:01:58'
                   );

INSERT INTO baixas (
                       id,
                       boi_id,
                       boton,
                       brinco,
                       ultimo_peso,
                       data_baixa,
                       status,
                       observacao,
                       created_at
                   )
                   VALUES (
                       5,
                       4,
                       'B04',
                       '41254',
                       410.0,
                       '2025-12-13',
                       'Vendido',
                       NULL,
                       '2025-12-13 15:31:03'
                   );

INSERT INTO baixas (
                       id,
                       boi_id,
                       boton,
                       brinco,
                       ultimo_peso,
                       data_baixa,
                       status,
                       observacao,
                       created_at
                   )
                   VALUES (
                       6,
                       22,
                       'Princesa (Mãe)',
                       '4321',
                       550.0,
                       '2025-12-18',
                       'Vendido',
                       'Teste',
                       '2025-12-18 18:57:50'
                   );

INSERT INTO baixas (
                       id,
                       boi_id,
                       boton,
                       brinco,
                       ultimo_peso,
                       data_baixa,
                       status,
                       observacao,
                       created_at
                   )
                   VALUES (
                       7,
                       4,
                       'B04',
                       NULL,
                       410.0,
                       '2025-12-19',
                       'Vendido',
                       'Alterado para teste',
                       '2025-12-18 19:02:30'
                   );


-- Tabela: bois
CREATE TABLE bois (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    initial_weight  REAL,
    arrival_date    TEXT,
    brinco          TEXT,
    vendedor        TEXT,
    local_compra    TEXT,
    valor_boi       REAL,
    valor_comissao  REAL,
    valor_frete     REAL,
    valor_por_kg    REAL,
    raca            TEXT,
    baixa_id        INTEGER,
    baixa_status    TEXT,
    pai_id          INTEGER,
    mae_id          INTEGER,
    sexo            TEXT    CHECK (sexo IN ('M', 'F') ),
    geracao         INTEGER,
    data_nascimento TEXT
);

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     1,
                     'B01',
                     350.0,
                     '2025-12-07',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     'Vendido',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     2,
                     'B02',
                     365.0,
                     '2025-12-07',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     3,
                     'B03',
                     400.0,
                     '2025-12-07',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     0.0,
                     NULL,
                     NULL,
                     NULL,
                     1,
                     2,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     4,
                     'B04',
                     410.0,
                     '2025-12-07',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     7,
                     'Vendido',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     5,
                     'B05',
                     550.0,
                     '2025-12-07',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     6,
                     'TEST-001',
                     450.0,
                     '2025-12-08',
                     'BR-12345',
                     'João Silva',
                     'São Paulo/SP',
                     5000.0,
                     300.0,
                     150.0,
                     12.11111111111111,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     7,
                     'TEST-001',
                     500.0,
                     '2025-12-08',
                     NULL,
                     NULL,
                     NULL,
                     5000.0,
                     500.0,
                     300.0,
                     11.6,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     8,
                     'TEST-002',
                     600.0,
                     '2025-12-08',
                     NULL,
                     NULL,
                     NULL,
                     6000.0,
                     600.0,
                     400.0,
                     11.66666666666667,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     9,
                     'VERIFY-001',
                     450.0,
                     '2025-12-08',
                     NULL,
                     NULL,
                     NULL,
                     4500.0,
                     450.0,
                     250.0,
                     11.55555555555556,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     10,
                     '2025-12-08FINAL-TEST',
                     400.0,
                     '2025-12-08',
                     NULL,
                     NULL,
                     NULL,
                     4000.0,
                     400.0,
                     200.0,
                     11.5,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     11,
                     '963000406431344',
                     333.0,
                     '2025-12-01',
                     '2807',
                     'João Silva',
                     'São Paulo/SP',
                     500.0,
                     100.0,
                     10.0,
                     1.83183183183183,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     12,
                     '963000406431356',
                     300.0,
                     '2025-12-09',
                     '3181',
                     'João Silva',
                     'São Paulo/SP',
                     300.0,
                     50.0,
                     25.0,
                     NULL,
                     NULL,
                     4,
                     'Vendido',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     13,
                     'TEST-NEW-001500',
                     500.0,
                     '2025-12-09',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     3,
                     'Morreu',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     14,
                     '963000406431344',
                     200.0,
                     '2025-12-01',
                     '3181',
                     'João Silva',
                     'Araguari / MG',
                     200.0,
                     50.0,
                     50.0,
                     1.5,
                     'Red Angus',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     15,
                     'GMDTeste',
                     300.0,
                     '2025-12-01',
                     '1234',
                     'João Silva',
                     'Araguari / MG',
                     300.0,
                     50.0,
                     25.0,
                     1.25,
                     'Cruzado',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     16,
                     'FINAL-TEST',
                     400.0,
                     '2024-03-03',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     0.0,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     17,
                     'Rei (Avô P)',
                     800.0,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     'M',
                     1,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     18,
                     'Rainha (Avó P)',
                     600.0,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     'F',
                     1,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     19,
                     'Duque (Avô M)',
                     850.0,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     0.0,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     'M',
                     1,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     20,
                     'Duquesa (Avó M)',
                     650.0,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     'F',
                     1,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     21,
                     'Príncipe (Pai)',
                     700.0,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     17,
                     18,
                     'M',
                     2,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     22,
                     'Princesa (Mãe)',
                     550.0,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     6,
                     'Vendido',
                     19,
                     20,
                     'F',
                     2,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     23,
                     'Herdeiro (Filho)',
                     200.0,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     21,
                     22,
                     'M',
                     3,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     24,
                     'Irmão',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     21,
                     22,
                     'M',
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     25,
                     'Irmã',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     21,
                     22,
                     'F',
                     NULL,
                     NULL
                 );

INSERT INTO bois (
                     id,
                     name,
                     initial_weight,
                     arrival_date,
                     brinco,
                     vendedor,
                     local_compra,
                     valor_boi,
                     valor_comissao,
                     valor_frete,
                     valor_por_kg,
                     raca,
                     baixa_id,
                     baixa_status,
                     pai_id,
                     mae_id,
                     sexo,
                     geracao,
                     data_nascimento
                 )
                 VALUES (
                     26,
                     '987',
                     150.0,
                     '2025-12-18',
                     '987',
                     'Fabiano',
                     'Prata / MG',
                     200.0,
                     20.0,
                     25.0,
                     1.63333333333333,
                     'Aberdeen',
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL,
                     NULL
                 );


-- Tabela: dietas
CREATE TABLE dietas (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    fazenda_id INTEGER NOT NULL,
    pasto_id   INTEGER NOT NULL,
    qtd_bois   INTEGER,
    data       TEXT    NOT NULL,
    dieta_tipo TEXT    NOT NULL,
    qtd_kg     REAL,
    created_at TEXT    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (
        fazenda_id
    )
    REFERENCES fazendas (id) ON DELETE CASCADE,
    FOREIGN KEY (
        pasto_id
    )
    REFERENCES pastos (id) ON DELETE CASCADE
);

INSERT INTO dietas (
                       id,
                       fazenda_id,
                       pasto_id,
                       qtd_bois,
                       data,
                       dieta_tipo,
                       qtd_kg,
                       created_at
                   )
                   VALUES (
                       1,
                       3,
                       8,
                       1,
                       '2025-12-12',
                       'Proteinado 01',
                       1000.0,
                       '2025-12-12 23:21:56'
                   );

INSERT INTO dietas (
                       id,
                       fazenda_id,
                       pasto_id,
                       qtd_bois,
                       data,
                       dieta_tipo,
                       qtd_kg,
                       created_at
                   )
                   VALUES (
                       2,
                       1,
                       2,
                       2,
                       '2025-12-12',
                       'Proteinado 05',
                       150.0,
                       '2025-12-12 23:22:38'
                   );

INSERT INTO dietas (
                       id,
                       fazenda_id,
                       pasto_id,
                       qtd_bois,
                       data,
                       dieta_tipo,
                       qtd_kg,
                       created_at
                   )
                   VALUES (
                       3,
                       1,
                       2,
                       2,
                       '2025-12-12',
                       'Dieta Total',
                       500.0,
                       '2025-12-12 23:25:01'
                   );

INSERT INTO dietas (
                       id,
                       fazenda_id,
                       pasto_id,
                       qtd_bois,
                       data,
                       dieta_tipo,
                       qtd_kg,
                       created_at
                   )
                   VALUES (
                       4,
                       1,
                       2,
                       2,
                       '2025-12-13',
                       'Proteinado 05',
                       50.0,
                       '2025-12-13 15:30:25'
                   );

INSERT INTO dietas (
                       id,
                       fazenda_id,
                       pasto_id,
                       qtd_bois,
                       data,
                       dieta_tipo,
                       qtd_kg,
                       created_at
                   )
                   VALUES (
                       5,
                       2,
                       5,
                       2,
                       '2025-12-14',
                       'Dieta 1%',
                       100.0,
                       '2025-12-14 18:39:15'
                   );

INSERT INTO dietas (
                       id,
                       fazenda_id,
                       pasto_id,
                       qtd_bois,
                       data,
                       dieta_tipo,
                       qtd_kg,
                       created_at
                   )
                   VALUES (
                       7,
                       1,
                       2,
                       2,
                       '2025-12-17',
                       'Dieta Total',
                       35.0,
                       '2025-12-16 05:07:24'
                   );

INSERT INTO dietas (
                       id,
                       fazenda_id,
                       pasto_id,
                       qtd_bois,
                       data,
                       dieta_tipo,
                       qtd_kg,
                       created_at
                   )
                   VALUES (
                       8,
                       1,
                       14,
                       1,
                       '2025-12-17',
                       'Proteinado 01',
                       30.0,
                       '2025-12-17 15:36:56'
                   );

INSERT INTO dietas (
                       id,
                       fazenda_id,
                       pasto_id,
                       qtd_bois,
                       data,
                       dieta_tipo,
                       qtd_kg,
                       created_at
                   )
                   VALUES (
                       9,
                       1,
                       2,
                       1,
                       '2025-12-01',
                       'Dieta Total',
                       10.0,
                       '2025-12-17 19:16:46'
                   );

INSERT INTO dietas (
                       id,
                       fazenda_id,
                       pasto_id,
                       qtd_bois,
                       data,
                       dieta_tipo,
                       qtd_kg,
                       created_at
                   )
                   VALUES (
                       10,
                       1,
                       2,
                       1,
                       '2025-12-18',
                       'Dieta 1%',
                       10.0,
                       '2025-12-18 03:43:58'
                   );


-- Tabela: fazendas
CREATE TABLE fazendas (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT    NOT NULL,
    address TEXT
);

INSERT INTO fazendas (
                         id,
                         name,
                         address
                     )
                     VALUES (
                         1,
                         'Nossa Senhora',
                         'BR497 KM35'
                     );

INSERT INTO fazendas (
                         id,
                         name,
                         address
                     )
                     VALUES (
                         2,
                         'Aparecida',
                         'BR365 KM58'
                     );

INSERT INTO fazendas (
                         id,
                         name,
                         address
                     )
                     VALUES (
                         3,
                         'Galo Campeão',
                         'MG497 KM15'
                     );

INSERT INTO fazendas (
                         id,
                         name,
                         address
                     )
                     VALUES (
                         5,
                         'Fazenda Teste Editada',
                         'Rua Teste'
                     );

INSERT INTO fazendas (
                         id,
                         name,
                         address
                     )
                     VALUES (
                         7,
                         'Santa Rita',
                         'Cumming / GA'
                     );


-- Tabela: manejo_pasto
CREATE TABLE manejo_pasto (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    boi_id                  INTEGER NOT NULL,
    pasto_id                INTEGER NOT NULL,
    fazenda_id              INTEGER NOT NULL,
    initial_weight_manejo   REAL,
    weight_01               REAL,
    date_weight_01          TEXT,
    weight_02               REAL,
    date_weight_02          TEXT,
    weight_03               REAL,
    date_weight_03          TEXT,
    weight_04               REAL,
    date_weight_04          TEXT,
    weight_05               REAL,
    date_weight_05          TEXT,
    weight_06               REAL,
    date_weight_06          TEXT,
    weight_07               REAL,
    date_weight_07          TEXT,
    weight_08               REAL,
    date_weight_08          TEXT,
    weight_09               REAL,
    date_weight_09          TEXT,
    weight_10               REAL,
    date_weight_10          TEXT,
    total_weight_registered REAL,-- Sum of weights
    weights_count           INTEGER,-- Count of weights registered
    FOREIGN KEY (
        boi_id
    )
    REFERENCES bois (id) ON DELETE CASCADE,
    FOREIGN KEY (
        pasto_id
    )
    REFERENCES pastos (id) ON DELETE CASCADE,
    FOREIGN KEY (
        fazenda_id
    )
    REFERENCES fazendas (id) ON DELETE CASCADE
);

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             4,
                             3,
                             8,
                             3,
                             400.0,
                             450.0,
                             '2025-12-01',
                             475.0,
                             '2025-12-03',
                             500.0,
                             '2025-12-05',
                             515.0,
                             '2025-12-08',
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             1940.0,
                             4
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             6,
                             5,
                             7,
                             3,
                             550.0,
                             575.0,
                             '2025-12-08',
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             575.0,
                             1
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             8,
                             5,
                             5,
                             2,
                             550.0,
                             610.0,
                             '2025-12-12',
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             610.0,
                             1
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             9,
                             14,
                             3,
                             2,
                             200.0,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             0.0,
                             0
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             10,
                             1,
                             2,
                             1,
                             350.0,
                             750.0,
                             '2025-12-09',
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             750.0,
                             1
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             11,
                             15,
                             3,
                             2,
                             300.0,
                             350.0,
                             '2025-12-01',
                             360.0,
                             '2025-12-02',
                             375.0,
                             '2025-12-03',
                             390.0,
                             '2025-12-04',
                             385.0,
                             '2025-12-05',
                             410.0,
                             '2025-12-06',
                             425.0,
                             '2025-12-07',
                             475.0,
                             '2025-12-08',
                             512.0,
                             '2025-12-09',
                             NULL,
                             NULL,
                             3682.0,
                             9
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             12,
                             12,
                             5,
                             2,
                             350.0,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             0.0,
                             0
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             13,
                             13,
                             2,
                             1,
                             500.0,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             0.0,
                             0
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             14,
                             1,
                             14,
                             1,
                             350.0,
                             365.0,
                             '2025-12-16',
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             365.0,
                             1
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             15,
                             3,
                             3,
                             2,
                             400.0,
                             423.0,
                             '2025-12-16',
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             423.0,
                             1
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             16,
                             3,
                             6,
                             3,
                             400.0,
                             410.0,
                             '2025-12-08',
                             425.0,
                             '2025-12-09',
                             448.0,
                             '2025-12-11',
                             433.0,
                             '2025-12-13',
                             455.0,
                             '2025-12-14',
                             473.0,
                             '2025-12-15',
                             475.0,
                             '2025-12-16',
                             468.0,
                             '2025-12-17',
                             465.0,
                             '2025-12-18',
                             486.0,
                             '2025-12-19',
                             4538.0,
                             10
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             17,
                             3,
                             3,
                             2,
                             400.0,
                             423.0,
                             '2025-12-16',
                             436.0,
                             '2025-12-17',
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             36.0,
                             2
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             18,
                             16,
                             9,
                             1,
                             400.0,
                             425.0,
                             '2025-12-16',
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             25.0,
                             1
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             19,
                             14,
                             3,
                             2,
                             200.0,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             0.0,
                             0
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             20,
                             14,
                             3,
                             2,
                             200.0,
                             225.0,
                             '2025-12-10',
                             238.0,
                             '2025-12-13',
                             268.0,
                             '2025-12-17',
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             68.0,
                             3
                         );

INSERT INTO manejo_pasto (
                             id,
                             boi_id,
                             pasto_id,
                             fazenda_id,
                             initial_weight_manejo,
                             weight_01,
                             date_weight_01,
                             weight_02,
                             date_weight_02,
                             weight_03,
                             date_weight_03,
                             weight_04,
                             date_weight_04,
                             weight_05,
                             date_weight_05,
                             weight_06,
                             date_weight_06,
                             weight_07,
                             date_weight_07,
                             weight_08,
                             date_weight_08,
                             weight_09,
                             date_weight_09,
                             weight_10,
                             date_weight_10,
                             total_weight_registered,
                             weights_count
                         )
                         VALUES (
                             21,
                             25,
                             17,
                             7,
                             250.0,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             NULL,
                             0.0,
                             0
                         );


-- Tabela: pastos
CREATE TABLE pastos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    fazenda_id INTEGER NOT NULL,
    FOREIGN KEY (
        fazenda_id
    )
    REFERENCES fazendas (id) ON DELETE CASCADE
);

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       2,
                       'NS02',
                       1
                   );

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       3,
                       'AP01',
                       2
                   );

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       4,
                       'AP02',
                       2
                   );

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       5,
                       'AP03',
                       2
                   );

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       6,
                       'GA01',
                       3
                   );

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       7,
                       'GA02',
                       3
                   );

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       8,
                       'GA04',
                       3
                   );

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       9,
                       'Max',
                       1
                   );

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       10,
                       'Apagar',
                       3
                   );

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       11,
                       'Pasto Teste Verify Edit',
                       1
                   );

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       14,
                       'Pasto Prova',
                       1
                   );

INSERT INTO pastos (
                       id,
                       name,
                       fazenda_id
                   )
                   VALUES (
                       17,
                       ' SR',
                       7
                   );


-- Tabela: perspectives
CREATE TABLE perspectives (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    boi_id         INTEGER NOT NULL,
    fazenda_id     INTEGER,
    pasto_id       INTEGER,
    start_date     TEXT,
    days           INTEGER,
    daily_rate     REAL,
    initial_weight REAL,
    final_weight   REAL,
    created_at     TEXT    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (
        boi_id
    )
    REFERENCES bois (id) ON DELETE CASCADE
);

INSERT INTO perspectives (
                             id,
                             boi_id,
                             fazenda_id,
                             pasto_id,
                             start_date,
                             days,
                             daily_rate,
                             initial_weight,
                             final_weight,
                             created_at
                         )
                         VALUES (
                             1,
                             2,
                             1,
                             1,
                             '2025-12-16',
                             30,
                             1.5,
                             380.0,
                             425.0,
                             '2025-12-16 15:42:36'
                         );

INSERT INTO perspectives (
                             id,
                             boi_id,
                             fazenda_id,
                             pasto_id,
                             start_date,
                             days,
                             daily_rate,
                             initial_weight,
                             final_weight,
                             created_at
                         )
                         VALUES (
                             2,
                             3,
                             2,
                             3,
                             '2025-12-17',
                             60,
                             1.8,
                             436.0,
                             543.9999999999997,
                             '2025-12-17 03:07:20'
                         );

INSERT INTO perspectives (
                             id,
                             boi_id,
                             fazenda_id,
                             pasto_id,
                             start_date,
                             days,
                             daily_rate,
                             initial_weight,
                             final_weight,
                             created_at
                         )
                         VALUES (
                             3,
                             16,
                             1,
                             9,
                             '2025-12-17',
                             30,
                             23.71,
                             425.0,
                             1136.3000000000009,
                             '2025-12-17 15:46:55'
                         );

INSERT INTO perspectives (
                             id,
                             boi_id,
                             fazenda_id,
                             pasto_id,
                             start_date,
                             days,
                             daily_rate,
                             initial_weight,
                             final_weight,
                             created_at
                         )
                         VALUES (
                             4,
                             16,
                             1,
                             9,
                             '2025-12-17',
                             4530,
                             23.71,
                             425.0,
                             107831.30000000932,
                             '2025-12-17 15:46:56'
                         );

INSERT INTO perspectives (
                             id,
                             boi_id,
                             fazenda_id,
                             pasto_id,
                             start_date,
                             days,
                             daily_rate,
                             initial_weight,
                             final_weight,
                             created_at
                         )
                         VALUES (
                             6,
                             16,
                             1,
                             9,
                             '2025-12-17',
                             30,
                             1.75,
                             425.0,
                             477.5,
                             '2025-12-17 19:28:56'
                         );

INSERT INTO perspectives (
                             id,
                             boi_id,
                             fazenda_id,
                             pasto_id,
                             start_date,
                             days,
                             daily_rate,
                             initial_weight,
                             final_weight,
                             created_at
                         )
                         VALUES (
                             7,
                             16,
                             1,
                             9,
                             '2025-12-17',
                             30,
                             1.75,
                             425.0,
                             477.5,
                             '2025-12-17 19:44:20'
                         );

INSERT INTO perspectives (
                             id,
                             boi_id,
                             fazenda_id,
                             pasto_id,
                             start_date,
                             days,
                             daily_rate,
                             initial_weight,
                             final_weight,
                             created_at
                         )
                         VALUES (
                             8,
                             25,
                             7,
                             17,
                             '2025-12-18',
                             30,
                             1.2,
                             250.0,
                             285.99999999999966,
                             '2025-12-18 03:44:35'
                         );


-- Tabela: users
CREATE TABLE users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    username TEXT    UNIQUE
                     NOT NULL,
    password TEXT    NOT NULL,
    profile  TEXT    CHECK (profile IN ('Admin', 'Usuário') ) 
                     NOT NULL,
    celular  TEXT
);

INSERT INTO users (
                      id,
                      name,
                      username,
                      password,
                      profile,
                      celular
                  )
                  VALUES (
                      1,
                      'Administrador',
                      'admin',
                      '$2b$10$XsBPLqkq4b0uAiYXWkYXLOyVQsauGLSYut6ZB0ys5ofj6dqSO9uXu',
                      'Admin',
                      NULL
                  );

INSERT INTO users (
                      id,
                      name,
                      username,
                      password,
                      profile,
                      celular
                  )
                  VALUES (
                      2,
                      'Max Dias',
                      'maxdias',
                      '$2b$10$mY0Hd7mNRvCekbuJf22/HOlOuZAZ9wyuUliYY7jVrCxsHF0BROZHK',
                      'Admin',
                      NULL
                  );

INSERT INTO users (
                      id,
                      name,
                      username,
                      password,
                      profile,
                      celular
                  )
                  VALUES (
                      3,
                      'João Silva',
                      'joao.silva',
                      '$2b$10$iFfQftzw1qsMu6l284LggeWckTfmGjpi98Pxvmt7evrCK.sojI1nG',
                      'Usuário',
                      '(11) 98765-4321'
                  );

INSERT INTO users (
                      id,
                      name,
                      username,
                      password,
                      profile,
                      celular
                  )
                  VALUES (
                      4,
                      'Test User',
                      'usuario',
                      '$2b$10$bCbX10rm8l6u64pKffxqd.f0mn8Qv.FoLwiSQs66lr5j3t0pvF332',
                      'Admin',
                      '123456789'
                  );


-- Tabela: vacinas
CREATE TABLE vacinas (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    boi_id      INTEGER NOT NULL,
    chip        TEXT,
    brinco      TEXT,
    vacina      TEXT    NOT NULL,
    data_vacina TEXT    NOT NULL,
    created_at  TEXT    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (
        boi_id
    )
    REFERENCES bois (id) ON DELETE CASCADE
);

INSERT INTO vacinas (
                        id,
                        boi_id,
                        chip,
                        brinco,
                        vacina,
                        data_vacina,
                        created_at
                    )
                    VALUES (
                        4,
                        1,
                        NULL,
                        'TESTE-1765304236347',
                        'Antiaftosa',
                        '2025-12-09',
                        '2025-12-09 18:17:16'
                    );

INSERT INTO vacinas (
                        id,
                        boi_id,
                        chip,
                        brinco,
                        vacina,
                        data_vacina,
                        created_at
                    )
                    VALUES (
                        5,
                        15,
                        NULL,
                        '1234',
                        'Antiaftosa',
                        '2025-12-01',
                        '2025-12-09 19:42:17'
                    );

INSERT INTO vacinas (
                        id,
                        boi_id,
                        chip,
                        brinco,
                        vacina,
                        data_vacina,
                        created_at
                    )
                    VALUES (
                        6,
                        15,
                        NULL,
                        '1234',
                        'BVD',
                        '2025-12-04',
                        '2025-12-09 19:42:38'
                    );

INSERT INTO vacinas (
                        id,
                        boi_id,
                        chip,
                        brinco,
                        vacina,
                        data_vacina,
                        created_at
                    )
                    VALUES (
                        7,
                        15,
                        NULL,
                        '1234',
                        'Doenças Respiratórias',
                        '2025-12-08',
                        '2025-12-09 19:42:58'
                    );

INSERT INTO vacinas (
                        id,
                        boi_id,
                        chip,
                        brinco,
                        vacina,
                        data_vacina,
                        created_at
                    )
                    VALUES (
                        8,
                        3,
                        NULL,
                        '1234',
                        'Polivalente',
                        '2025-12-03',
                        '2025-12-10 14:59:52'
                    );

INSERT INTO vacinas (
                        id,
                        boi_id,
                        chip,
                        brinco,
                        vacina,
                        data_vacina,
                        created_at
                    )
                    VALUES (
                        9,
                        1,
                        NULL,
                        '1234',
                        'Vacina Antirrábica',
                        '2025-12-10',
                        '2025-12-10 15:00:40'
                    );

INSERT INTO vacinas (
                        id,
                        boi_id,
                        chip,
                        brinco,
                        vacina,
                        data_vacina,
                        created_at
                    )
                    VALUES (
                        10,
                        1,
                        NULL,
                        '1234',
                        'Pneumonias',
                        '2025-12-13',
                        '2025-12-13 15:29:12'
                    );

INSERT INTO vacinas (
                        id,
                        boi_id,
                        chip,
                        brinco,
                        vacina,
                        data_vacina,
                        created_at
                    )
                    VALUES (
                        11,
                        1,
                        NULL,
                        '1234',
                        'Doenças Respiratórias',
                        '2025-12-14',
                        '2025-12-14 18:38:17'
                    );

INSERT INTO vacinas (
                        id,
                        boi_id,
                        chip,
                        brinco,
                        vacina,
                        data_vacina,
                        created_at
                    )
                    VALUES (
                        12,
                        14,
                        NULL,
                        '3181',
                        'Antiaftosa',
                        '2025-12-17',
                        '2025-12-17 19:43:05'
                    );


-- Visualizar: 
CREATE VIEW "" AS
    SELECT *
      FROM users;


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
