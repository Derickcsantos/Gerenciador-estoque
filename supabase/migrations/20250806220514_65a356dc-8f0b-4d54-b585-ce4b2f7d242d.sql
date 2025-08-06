-- Inserir produtos de exemplo com diferentes status
WITH model_ids AS (
  SELECT 
    m1.id as thinkpad_id,
    m2.id as dell_id,
    m3.id as macbook_id,
    m4.id as mx_master_id,
    m5.id as magic_mouse_id,
    m6.id as mx_keys_id,
    m7.id as office_id,
    m8.id as windows_id
  FROM 
    (SELECT id FROM public.models WHERE name = 'ThinkPad X1 Carbon' LIMIT 1) m1,
    (SELECT id FROM public.models WHERE name = 'Latitude 7420' LIMIT 1) m2,
    (SELECT id FROM public.models WHERE name = 'MacBook Pro 14"' LIMIT 1) m3,
    (SELECT id FROM public.models WHERE name = 'MX Master 3' LIMIT 1) m4,
    (SELECT id FROM public.models WHERE name = 'Magic Mouse' LIMIT 1) m5,
    (SELECT id FROM public.models WHERE name = 'MX Keys' LIMIT 1) m6,
    (SELECT id FROM public.models WHERE name = 'Office 365' LIMIT 1) m7,
    (SELECT id FROM public.models WHERE name = 'Windows 11 Pro' LIMIT 1) m8
),
category_ids AS (
  SELECT 
    c1.id as notebook_cat,
    c2.id as periferico_cat,
    c3.id as software_cat
  FROM 
    (SELECT id FROM public.categories WHERE name = 'Notebooks' LIMIT 1) c1,
    (SELECT id FROM public.categories WHERE name = 'Periféricos' LIMIT 1) c2,
    (SELECT id FROM public.categories WHERE name = 'Software' LIMIT 1) c3
)
INSERT INTO public.products (name, model_id, category_id, quantity, min_quantity, expiry_date)
SELECT * FROM (
  VALUES 
    -- Notebooks com estoque normal
    ('Notebook Desenvolvimento #001', (SELECT thinkpad_id FROM model_ids), (SELECT notebook_cat FROM category_ids), 5, 2, '2026-12-31'::date),
    ('Notebook Desenvolvimento #002', (SELECT dell_id FROM model_ids), (SELECT notebook_cat FROM category_ids), 3, 2, '2025-06-30'::date),
    ('Notebook Design #001', (SELECT macbook_id FROM model_ids), (SELECT notebook_cat FROM category_ids), 2, 1, '2027-03-15'::date),
    
    -- Periféricos com estoque baixo
    ('Mouse Bluetooth Logitech #001', (SELECT mx_master_id FROM model_ids), (SELECT periferico_cat FROM category_ids), 1, 3, NULL),
    ('Mouse Apple Magic', (SELECT magic_mouse_id FROM model_ids), (SELECT periferico_cat FROM category_ids), 0, 2, NULL),
    ('Teclado Sem Fio Logitech', (SELECT mx_keys_id FROM model_ids), (SELECT periferico_cat FROM category_ids), 2, 5, NULL),
    
    -- Software com vencimento próximo
    ('Licença Office 365 - Equipe Dev', (SELECT office_id FROM model_ids), (SELECT software_cat FROM category_ids), 10, 3, '2025-02-15'::date),
    ('Licença Office 365 - Equipe Design', (SELECT office_id FROM model_ids), (SELECT software_cat FROM category_ids), 8, 3, '2025-01-30'::date),
    ('Windows 11 Pro - Licenças Corporativas', (SELECT windows_id FROM model_ids), (SELECT software_cat FROM category_ids), 15, 5, '2025-12-31'::date)
) AS t(name, model_id, category_id, quantity, min_quantity, expiry_date);