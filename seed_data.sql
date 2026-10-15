-- Script para popular dados de teste com datas de peso

-- Inserir registro de manejo com datas de peso
INSERT INTO
    manejo_pasto (
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
        total_weight_registered,
        weights_count
    )
VALUES (
        1,
        1,
        1,
        350.00,
        355.50,
        '2025-12-01',
        360.20,
        '2025-12-05',
        365.80,
        '2025-12-08',
        1081.50,
        3
    );