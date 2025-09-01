-- =====================================================
-- EXTENDED HARDWARE SEED (adds 2006–2008 to retro base)
-- If you run ONLY this file on a fresh DB, you should
-- prepend the retro sections or run retro first.
-- =====================================================

START TRANSACTION;

-- =======================
-- CPU FAMILIES (2006–2008 add-ons)
-- =======================
-- Intel Core era
INSERT INTO cpufamily (name, cpu_brand_id) VALUES
('Core Solo', (SELECT id FROM cpubrand WHERE name='Intel')),
('Core 2 Duo', (SELECT id FROM cpubrand WHERE name='Intel')),
('Core 2 Quad', (SELECT id FROM cpubrand WHERE name='Intel')),
('Atom', (SELECT id FROM cpubrand WHERE name='Intel'));

-- AMD (late retro)
INSERT INTO cpufamily (name, cpu_brand_id) VALUES
('Phenom', (SELECT id FROM cpubrand WHERE name='AMD'));

-- =======================
-- GPU MODELS (2006–2008)
-- =======================
-- NVIDIA DX10 era
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('GeForce 8 Series', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce 9 Series', (SELECT id FROM gpubrand WHERE name='NVIDIA'));

-- ATI/AMD Radeon HD era
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('Radeon HD 2000', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon HD 3000', (SELECT id FROM gpubrand WHERE name='ATI'));

-- Intel graphics
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('Intel GMA X3000', (SELECT id FROM gpubrand WHERE name='Intel'));

-- SiS late models
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('SiS Mirage 3', (SELECT id FROM gpubrand WHERE name='SiS')),
('SiS 672/771', (SELECT id FROM gpubrand WHERE name='SiS'));

-- Matrox
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('Matrox M-Series', (SELECT id FROM gpubrand WHERE name='Matrox'));

-- =======================
-- GPU VRAM TYPES (adds)
-- =======================
INSERT INTO gpuvramtype (name) VALUES
('GDDR4'),
('GDDR5');

-- =======================
-- MOTHERBOARD CHIPSETS (adds 2006–2008)
-- =======================
INSERT INTO motherboardchipset (name) VALUES
('Intel 965'),
('Intel P35'),
('Intel P45'),
('NVIDIA nForce5'),
('AMD 770'),
('AMD 790X');

-- =======================
-- RAM TYPES (adds early DDR3)
-- =======================
INSERT INTO ram (name) VALUES
('DDR3 1066MHz'),
('DDR3 1333MHz');

-- =======================
-- OPERATING SYSTEMS (adds)
-- =======================
INSERT INTO os (name) VALUES
('Windows Vista');

COMMIT;
