-- =====================================================
-- MODERN HARDWARE SEED (2009 → present)
-- Standalone file: safe order (parents -> children).
-- No concrete samples; lookup tables only.
-- =====================================================

START TRANSACTION;

-- =======================
-- CPU BRANDS (ensure present)
-- =======================
INSERT INTO cpubrand (name) VALUES
('AMD'),
('Intel')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =======================
-- CPU FAMILIES (modern era)
-- =======================
-- Intel Core & related
INSERT INTO cpufamily (name, cpu_brand_id) VALUES
('Core i3', (SELECT id FROM cpubrand WHERE name='Intel')),
('Core i5', (SELECT id FROM cpubrand WHERE name='Intel')),
('Core i7', (SELECT id FROM cpubrand WHERE name='Intel')),
('Core i9', (SELECT id FROM cpubrand WHERE name='Intel')),
('Core M',  (SELECT id FROM cpubrand WHERE name='Intel')),
('Pentium Gold', (SELECT id FROM cpubrand WHERE name='Intel')),
('Pentium Silver', (SELECT id FROM cpubrand WHERE name='Intel')),
('Celeron', (SELECT id FROM cpubrand WHERE name='Intel')),
('Atom',    (SELECT id FROM cpubrand WHERE name='Intel')),
('Xeon E3', (SELECT id FROM cpubrand WHERE name='Intel')),
('Xeon E5', (SELECT id FROM cpubrand WHERE name='Intel')),
('Xeon E7', (SELECT id FROM cpubrand WHERE name='Intel')),
('Xeon W',  (SELECT id FROM cpubrand WHERE name='Intel')),
('Xeon Scalable', (SELECT id FROM cpubrand WHERE name='Intel'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- AMD families (post-2008)
INSERT INTO cpufamily (name, cpu_brand_id) VALUES
('Phenom II', (SELECT id FROM cpubrand WHERE name='AMD')),
('Athlon II', (SELECT id FROM cpubrand WHERE name='AMD')),
('FX',        (SELECT id FROM cpubrand WHERE name='AMD')),
('A-Series',  (SELECT id FROM cpubrand WHERE name='AMD')),
('Ryzen 3',   (SELECT id FROM cpubrand WHERE name='AMD')),
('Ryzen 5',   (SELECT id FROM cpubrand WHERE name='AMD')),
('Ryzen 7',   (SELECT id FROM cpubrand WHERE name='AMD')),
('Ryzen 9',   (SELECT id FROM cpubrand WHERE name='AMD')),
('Threadripper',     (SELECT id FROM cpubrand WHERE name='AMD')),
('Threadripper Pro', (SELECT id FROM cpubrand WHERE name='AMD')),
('EPYC',             (SELECT id FROM cpubrand WHERE name='AMD'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =======================
-- GPU MANUFACTURERS (AIB/board partners)
-- =======================
INSERT INTO gpumanufacturer (name) VALUES
('ASRock'),
('Asus'),
('Biostar'),
('Colorful'),
('Diamond'),
('EVGA'),
('Gainward'),
('Galax'),
('Gigabyte'),
('HIS'),
('Inno3D'),
('KFA2'),
('Leadtek'),
('MSI'),
('Palit'),
('PNY'),
('PowerColor'),
('Sapphire'),
('VisionTek'),
('XFX'),
('Zotac')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =======================
-- GPU BRANDS (silicon vendors)
-- =======================
INSERT INTO gpubrand (name) VALUES
('AMD'),
('Intel'),
('NVIDIA')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =======================
-- GPU MODELS / SERIES (modern)
-- Keep at series/umbrella granularity for simplicity.
-- =======================
-- NVIDIA (DX12+ era)
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('GeForce 10 Series', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce 16 Series', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce 20 Series (RTX 2000)', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce 30 Series (RTX 3000)', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce 40 Series (RTX 4000)', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce 40 Series (RTX 5000)', (SELECT id FROM gpubrand WHERE name='NVIDIA'))

ON DUPLICATE KEY UPDATE name = VALUES(name);

-- AMD Radeon
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('Radeon HD 4000', (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon HD 5000', (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon HD 6000', (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon HD 7000', (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon R7 200 Series', (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon R9 200 Series', (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon R9 300 Series', (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon RX 400 Series', (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon RX 500 Series', (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon RX Vega',       (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon RX 5000 Series', (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon RX 6000 Series', (SELECT id FROM gpubrand WHERE name='AMD')),
('Radeon RX 7000 Series', (SELECT id FROM gpubrand WHERE name='AMD'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Intel graphics (modern/discrete & iGPU)
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('Intel HD Graphics (Gen 5+)', (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel UHD Graphics',         (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel Iris',                 (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel Iris Pro',             (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel Iris Xe',              (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel Arc A-Series',         (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel Arc Pro A-Series',     (SELECT id FROM gpubrand WHERE name='Intel'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =======================
-- GPU VRAM TYPES (modern)
-- =======================
INSERT INTO gpuvramtype (name) VALUES
('GDDR4'),
('GDDR5'),
('GDDR5X'),
('GDDR6'),
('GDDR6X'),
('HBM'),
('HBM2'),
('HBM2e'),
('HBM3'),
('HBM3e')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =======================
-- MOTHERBOARD MANUFACTURERS (ensure present/new)
-- =======================
INSERT INTO motherboardmanufacturer (name) VALUES
('ASRock'),
('ASUS'),
('Biostar'),
('Gigabyte'),
('Intel'),
('MSI'),
('NZXT'),
('Supermicro')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =======================
-- MOTHERBOARD CHIPSETS (modern)
-- Intel desktop/mainstream
INSERT INTO motherboardchipset (name) VALUES
('Intel X58'),
('Intel P55'), ('Intel H55'),
('Intel H61'), ('Intel H67'), ('Intel P67'), ('Intel Z68'),
('Intel B75'), ('Intel H77'), ('Intel Z77'),
('Intel B85'), ('Intel H87'), ('Intel Z87'),
('Intel H97'), ('Intel Z97'),
('Intel H110'), ('Intel B150'), ('Intel H170'), ('Intel Z170'),
('Intel B250'), ('Intel H270'), ('Intel Z270'),
('Intel H310'), ('Intel B360'), ('Intel H370'), ('Intel Z370'), ('Intel Z390'),
('Intel H410'), ('Intel B460'), ('Intel H470'), ('Intel Z490'),
('Intel H510'), ('Intel B560'), ('Intel H570'), ('Intel Z590'),
('Intel H610'), ('Intel B660'), ('Intel H670'), ('Intel Z690'),
('Intel B760'), ('Intel H770'), ('Intel Z790')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Intel HEDT/workstation
INSERT INTO motherboardchipset (name) VALUES
('Intel X79'),
('Intel X99'),
('Intel X299')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- AMD desktop/mainstream
INSERT INTO motherboardchipset (name) VALUES
('AMD 870'), ('AMD 880G'), ('AMD 890GX'), ('AMD 890FX'),
('AMD 970'), ('AMD 990X'), ('AMD 990FX'),
('AMD A320'), ('AMD B350'), ('AMD X370'),
('AMD B450'), ('AMD X470'),
('AMD A520'), ('AMD B550'), ('AMD X570'), ('AMD X570S'),
('AMD A620'), ('AMD B650'), ('AMD B650E'), ('AMD X670'), ('AMD X670E')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- AMD HEDT/workstation
INSERT INTO motherboardchipset (name) VALUES
('AMD X399'),
('AMD TRX40'),
('AMD WRX80')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =======================
-- RAM TYPES (DDR3/DDR4/DDR5 common speeds)
-- =======================
-- DDR3 (common)
INSERT INTO ram (name) VALUES
('DDR3 1333MHz'),
('DDR3 1600MHz'),
('DDR3 1866MHz'),
('DDR3 2133MHz')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- DDR4
INSERT INTO ram (name) VALUES
('DDR4 2133MHz'),
('DDR4 2400MHz'),
('DDR4 2666MHz'),
('DDR4 2933MHz'),
('DDR4 3200MHz'),
('DDR4 3600MHz'),
('DDR4 4000MHz')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- DDR5
INSERT INTO ram (name) VALUES
('DDR5 4800MHz'),
('DDR5 5200MHz'),
('DDR5 5600MHz'),
('DDR5 6000MHz'),
('DDR5 6400MHz'),
('DDR5 6800MHz'),
('DDR5 7200MHz'),
('DDR5 7600MHz'),
('DDR5 8000MHz')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =======================
-- DISK / STORAGE TYPES (modern)
-- =======================
INSERT INTO disk (name) VALUES
('SATA III 5400 RPM'),
('SATA III 7200 RPM'),
('SATA III (SSD)'),
('M.2 SATA'),
('M.2 NVMe PCIe 3.0 x4'),
('M.2 NVMe PCIe 4.0 x4'),
('M.2 NVMe PCIe 5.0 x4'),
('U.2 NVMe'),
('External USB 3.0'),
('External USB 3.1'),
('External USB 3.2 Gen 2'),
('External USB 3.2 Gen 2x2'),
('Thunderbolt 3 SSD'),
('Thunderbolt 4 SSD'),
('eMMC'),
('microSD UHS-I'),
('microSD UHS-II')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =======================
-- OPERATING SYSTEMS (modern)
-- =======================
INSERT INTO os (name) VALUES
('Windows Vista'),
('Windows 7'),
('Windows 8'),
('Windows 8.1'),
('Windows 10'),
('Windows 11'),
('macOS'),
('ChromeOS'),
('Linux')
ON DUPLICATE KEY UPDATE name = VALUES(name);

COMMIT;
