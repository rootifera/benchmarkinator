-- =====================================================
-- RETRO HARDWARE SEED (<= 2005-12-31)
-- Order: parents -> children; concrete samples last.
-- Note: These are plain INSERTs. Run once on a fresh DB,
-- or ensure unique(name) constraints to avoid duplicates.
-- =====================================================

START TRANSACTION;

-- =======================
-- CPU BRANDS
-- =======================
INSERT INTO cpubrand (name) VALUES
('AMD'),
('Broadcom'),
('Compaq'),
('Cyrix'),
('Digital Equipment Corporation (DEC)'),
('IBM'),
('Intel'),
('Motorola'),
('NexGen'),
('Qualcomm'),
('Rise'),
('Siemens'),
('SiS'),
('Sun Microsystems'),
('STMicroelectronics'),
('Texas Instruments'),
('Transmeta'),
('VIA'),
('Zilog'),
('IDT');

-- =======================
-- CPU FAMILIES
-- =======================
-- AMD
INSERT INTO cpufamily (name, cpu_brand_id) VALUES
('Am386', (SELECT id FROM cpubrand WHERE name='AMD')),
('Am486', (SELECT id FROM cpubrand WHERE name='AMD')),
('K5', (SELECT id FROM cpubrand WHERE name='AMD')),
('K6', (SELECT id FROM cpubrand WHERE name='AMD')),
('K6-II', (SELECT id FROM cpubrand WHERE name='AMD')),
('K6-III', (SELECT id FROM cpubrand WHERE name='AMD')),
('Athlon', (SELECT id FROM cpubrand WHERE name='AMD')),
('Athlon XP', (SELECT id FROM cpubrand WHERE name='AMD')),
('Athlon 64', (SELECT id FROM cpubrand WHERE name='AMD')),
('Sempron', (SELECT id FROM cpubrand WHERE name='AMD'));

-- Intel (pre-Core era)
INSERT INTO cpufamily (name, cpu_brand_id) VALUES
('286', (SELECT id FROM cpubrand WHERE name='Intel')),
('386', (SELECT id FROM cpubrand WHERE name='Intel')),
('486', (SELECT id FROM cpubrand WHERE name='Intel')),
('Pentium', (SELECT id FROM cpubrand WHERE name='Intel')),
('Pentium Pro', (SELECT id FROM cpubrand WHERE name='Intel')),
('Pentium MMX', (SELECT id FROM cpubrand WHERE name='Intel')),
('Pentium II', (SELECT id FROM cpubrand WHERE name='Intel')),
('Pentium III', (SELECT id FROM cpubrand WHERE name='Intel')),
('Pentium 4', (SELECT id FROM cpubrand WHERE name='Intel')),
('Pentium D', (SELECT id FROM cpubrand WHERE name='Intel')),
('Xeon', (SELECT id FROM cpubrand WHERE name='Intel'));

-- IBM / Motorola PowerPC & 68k
INSERT INTO cpufamily (name, cpu_brand_id) VALUES
('IBM 5x86', (SELECT id FROM cpubrand WHERE name='IBM')),
('IBM 6x86', (SELECT id FROM cpubrand WHERE name='IBM')),
('IBM 6x86MX', (SELECT id FROM cpubrand WHERE name='IBM')),
('IBM PowerPC 601', (SELECT id FROM cpubrand WHERE name='IBM')),
('IBM PowerPC 603', (SELECT id FROM cpubrand WHERE name='IBM')),
('IBM PowerPC 604', (SELECT id FROM cpubrand WHERE name='IBM')),
('IBM PowerPC 750 (G3)', (SELECT id FROM cpubrand WHERE name='IBM')),
('IBM PowerPC 7400 (G4)', (SELECT id FROM cpubrand WHERE name='IBM')),
('IBM PowerPC 970 (G5)', (SELECT id FROM cpubrand WHERE name='IBM'));

INSERT INTO cpufamily (name, cpu_brand_id) VALUES
('68000', (SELECT id FROM cpubrand WHERE name='Motorola')),
('68010', (SELECT id FROM cpubrand WHERE name='Motorola')),
('68020', (SELECT id FROM cpubrand WHERE name='Motorola')),
('68030', (SELECT id FROM cpubrand WHERE name='Motorola')),
('68040', (SELECT id FROM cpubrand WHERE name='Motorola')),
('68060', (SELECT id FROM cpubrand WHERE name='Motorola')),
('PowerPC 601', (SELECT id FROM cpubrand WHERE name='Motorola')),
('PowerPC 603', (SELECT id FROM cpubrand WHERE name='Motorola')),
('PowerPC 604', (SELECT id FROM cpubrand WHERE name='Motorola')),
('PowerPC 750 (G3)', (SELECT id FROM cpubrand WHERE name='Motorola')),
('PowerPC 7400 (G4)', (SELECT id FROM cpubrand WHERE name='Motorola'));

-- Cyrix / VIA / IDT
INSERT INTO cpufamily (name, cpu_brand_id) VALUES
('Cx486', (SELECT id FROM cpubrand WHERE name='Cyrix')),
('MediaGX', (SELECT id FROM cpubrand WHERE name='Cyrix')),
('6x86', (SELECT id FROM cpubrand WHERE name='Cyrix')),
('6x86MX', (SELECT id FROM cpubrand WHERE name='Cyrix')),
('MII', (SELECT id FROM cpubrand WHERE name='Cyrix'));

INSERT INTO cpufamily (name, cpu_brand_id) VALUES
('VIA 6x86', (SELECT id FROM cpubrand WHERE name='VIA')),
('VIA MediaGX', (SELECT id FROM cpubrand WHERE name='VIA')),
('VIA MII', (SELECT id FROM cpubrand WHERE name='VIA'));

INSERT INTO cpufamily (name, cpu_brand_id) VALUES
('IDT WinChip', (SELECT id FROM cpubrand WHERE name='IDT')),
('IDT WinChip 2', (SELECT id FROM cpubrand WHERE name='IDT'));

-- =======================
-- GPU MANUFACTURERS (AIB)
-- =======================
INSERT INTO gpumanufacturer (name) VALUES
('OEM'),
('Generic'),
('3dfx Interactive'),
('Ark Logic'),
('Asus'),
('ATI'),
('Cirrus Logic'),
('Diamond'),
('EVGA'),
('Gainward'),
('Gigabyte'),
('Hercules'),
('Inno3D'),
('Leadtek'),
('Matrox'),
('MSI'),
('Neomagic'),
('Palit'),
('PNY'),
('PowerColor'),
('S3'),
('SiS'),
('Trident'),
('VisionTek'),
('XFX');

-- =======================
-- GPU BRANDS (silicon)
-- =======================
INSERT INTO gpubrand (name) VALUES
('3dfx'),
('ARK Logic'),
('ATI'),
('Cirrus Logic'),
('Intel'),
('Matrox'),
('NVIDIA'),
('PowerVR'),
('S3'),
('SiS'),
('Trident');

-- =======================
-- GPU MODELS
-- =======================
-- 3dfx
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('Voodoo Graphics', (SELECT id FROM gpubrand WHERE name='3dfx')),
('Voodoo Rush', (SELECT id FROM gpubrand WHERE name='3dfx')),
('Voodoo 2', (SELECT id FROM gpubrand WHERE name='3dfx')),
('Voodoo Banshee', (SELECT id FROM gpubrand WHERE name='3dfx')),
('Velocity 100', (SELECT id FROM gpubrand WHERE name='3dfx')),
('Velocity 200', (SELECT id FROM gpubrand WHERE name='3dfx')),
('Voodoo3 1000', (SELECT id FROM gpubrand WHERE name='3dfx')),
('Voodoo3 2000', (SELECT id FROM gpubrand WHERE name='3dfx')),
('Voodoo3 3000', (SELECT id FROM gpubrand WHERE name='3dfx')),
('Voodoo3 3500 TV', (SELECT id FROM gpubrand WHERE name='3dfx')),
('Voodoo4 4500', (SELECT id FROM gpubrand WHERE name='3dfx')),
('Voodoo5 5500', (SELECT id FROM gpubrand WHERE name='3dfx'));

-- NVIDIA (up to GeForce 7)
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('RIVA 128', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('RIVA 128ZX', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('TNT', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('TNT2', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce 256', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce2 MX', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce2 GTS', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce2 Ultra', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce3', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce4 MX', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce4 Ti', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce FX 5200', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce FX 5600', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce FX 5900', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce 6 Series', (SELECT id FROM gpubrand WHERE name='NVIDIA')),
('GeForce 7 Series', (SELECT id FROM gpubrand WHERE name='NVIDIA'));

-- ATI (up to X1000)
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('Wonder', (SELECT id FROM gpubrand WHERE name='ATI')),
('Mach', (SELECT id FROM gpubrand WHERE name='ATI')),
('3D Rage', (SELECT id FROM gpubrand WHERE name='ATI')),
('Rage I', (SELECT id FROM gpubrand WHERE name='ATI')),
('Rage II', (SELECT id FROM gpubrand WHERE name='ATI')),
('Rage Pro', (SELECT id FROM gpubrand WHERE name='ATI')),
('Rage 128', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon 7000', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon 7200', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon 7500', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon 8500', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon 9000', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon 9200', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon 9600', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon 9800', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon X300', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon X600', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon X700', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon X800', (SELECT id FROM gpubrand WHERE name='ATI')),
('Radeon X1000', (SELECT id FROM gpubrand WHERE name='ATI'));

-- S3
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('S3 Trio', (SELECT id FROM gpubrand WHERE name='S3')),
('S3 Savage3D', (SELECT id FROM gpubrand WHERE name='S3')),
('S3 Savage4', (SELECT id FROM gpubrand WHERE name='S3')),
('S3 Virge', (SELECT id FROM gpubrand WHERE name='S3')),
('S3 ProSavage', (SELECT id FROM gpubrand WHERE name='S3')),
('S3 DeltaChrome', (SELECT id FROM gpubrand WHERE name='S3')),
('S3 Chrome', (SELECT id FROM gpubrand WHERE name='S3'));

-- Cirrus Logic
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('GD5400', (SELECT id FROM gpubrand WHERE name='Cirrus Logic')),
('GD5430', (SELECT id FROM gpubrand WHERE name='Cirrus Logic')),
('GD5434', (SELECT id FROM gpubrand WHERE name='Cirrus Logic')),
('GD5460', (SELECT id FROM gpubrand WHERE name='Cirrus Logic')),
('GD5464', (SELECT id FROM gpubrand WHERE name='Cirrus Logic')),
('GD5465', (SELECT id FROM gpubrand WHERE name='Cirrus Logic')),
('GD5480', (SELECT id FROM gpubrand WHERE name='Cirrus Logic')),
('GD5486', (SELECT id FROM gpubrand WHERE name='Cirrus Logic')),
('GD5446', (SELECT id FROM gpubrand WHERE name='Cirrus Logic'));

-- Matrox
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('Matrox MGA', (SELECT id FROM gpubrand WHERE name='Matrox')),
('Matrox G100', (SELECT id FROM gpubrand WHERE name='Matrox')),
('Matrox G200', (SELECT id FROM gpubrand WHERE name='Matrox')),
('Matrox G400', (SELECT id FROM gpubrand WHERE name='Matrox')),
('Matrox G450', (SELECT id FROM gpubrand WHERE name='Matrox')),
('Matrox G550', (SELECT id FROM gpubrand WHERE name='Matrox')),
('Matrox Parhelia', (SELECT id FROM gpubrand WHERE name='Matrox')),
('Matrox Millennium P650', (SELECT id FROM gpubrand WHERE name='Matrox'));

-- Intel (up to GMA 950)
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('i740', (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel 810', (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel 830M', (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel 845G', (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel 865G', (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel GMA 900', (SELECT id FROM gpubrand WHERE name='Intel')),
('Intel GMA 950', (SELECT id FROM gpubrand WHERE name='Intel'));

-- SiS (pre-2006)
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('SiS 530', (SELECT id FROM gpubrand WHERE name='SiS')),
('SiS 6326', (SELECT id FROM gpubrand WHERE name='SiS')),
('SiS 540', (SELECT id FROM gpubrand WHERE name='SiS')),
('SiS 650', (SELECT id FROM gpubrand WHERE name='SiS')),
('SiS 315', (SELECT id FROM gpubrand WHERE name='SiS')),
('SiS 650/740', (SELECT id FROM gpubrand WHERE name='SiS')),
('SiS 330', (SELECT id FROM gpubrand WHERE name='SiS'));

-- PowerVR 
INSERT INTO gpumodel (name, gpu_brand_id) VALUES
('PowerVR Series1', (SELECT id FROM gpubrand WHERE name='PowerVR')),
('PowerVR Series2', (SELECT id FROM gpubrand WHERE name='PowerVR')),
('PowerVR KYRO', (SELECT id FROM gpubrand WHERE name='PowerVR')),
('KYRO II', (SELECT id FROM gpubrand WHERE name='PowerVR'));

-- =======================
-- GPU VRAM TYPES
-- =======================
INSERT INTO gpuvramtype (name) VALUES
('SDR'),
('DDR'),
('GDDR'),
('GDDR2'),
('GDDR3');

-- =======================
-- MOTHERBOARD MANUFACTURERS
-- =======================
INSERT INTO motherboardmanufacturer (name) VALUES
('AOpen'),
('Abit'),
('Acer'),
('ASRock'),
('ASUS'),
('Biostar'),
('Chaintech'),
('Dell'),
('DFI'),
('ECS'),
('EVGA'),
('FIC'),
('Foxconn'),
('Gigabyte'),
('HP'),
('Intel'),
('MSI'),
('Sapphire'),
('Shuttle'),
('Supermicro'),
('Soyo'),
('Tyan');

-- =======================
-- MOTHERBOARD CHIPSETS
-- =======================
INSERT INTO motherboardchipset (name) VALUES
('Intel 440FX'),
('Intel 440LX'),
('Intel 440BX'),
('Intel 815'),
('Intel 845'),
('Intel 850'),
('Intel 865'),
('Intel 915'),
('Intel 945'),
('Intel 975X'),
('AMD 760'),
('VIA Apollo'),
('VIA KT133'),
('VIA KT266'),
('VIA KT333'),
('VIA KT400'),
('SiS 630'),
('SiS 735'),
('SiS 745'),
('NVIDIA nForce2'),
('NVIDIA nForce3'),
('NVIDIA nForce4'),
('ALi M1647'),
('ULi M1695');

-- =======================
-- RAM TYPES
-- =======================
INSERT INTO ram (name) VALUES
('SDRAM 66MHz'),
('SDRAM 100MHz'),
('SDRAM 133MHz'),
('DDR 200MHz'),
('DDR 266MHz'),
('DDR 333MHz'),
('DDR 400MHz'),
('DDR2 400MHz'),
('DDR2 533MHz'),
('DDR2 667MHz'),
('DDR2 800MHz');

-- =======================
-- DISK TYPES
-- =======================
INSERT INTO disk (name) VALUES
('IDE 5400 RPM'),
('IDE 7200 RPM'),
('SATA I 5400 RPM'),
('SATA I 7200 RPM'),
('SATA II 5400 RPM'),
('SATA II 7200 RPM'),
('SAS 7200 RPM'),
('SAS 10000 RPM'),
('SAS 15000 RPM'),
('SCSI 7200 RPM'),
('SCSI 10000 RPM'),
('SCSI 15000 RPM'),
('CFDisk'),
('SDCard');

-- =======================
-- OPERATING SYSTEMS (<=2005)
-- =======================
INSERT INTO os (name) VALUES
('MS-DOS'),
('PC DOS'),
('Windows 3.1'),
('Windows 95'),
('Windows 98'),
('Windows NT 4.0'),
('Windows 2000'),
('Windows XP'),
('OS/2'),
('UNIX'),
('Linux'),
('FreeBSD'),
('NetBSD'),
('OpenBSD'),
('AmigaOS'),
('Mac OS 7'),
('Mac OS 8'),
('Mac OS 9'),
('Mac OS X'),
('BeOS'),
('Minix'),
('CP/M'),
('Xenix'),
('DR DOS'),
('Solaris');

COMMIT;
