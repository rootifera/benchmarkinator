-- MySQL dump 10.13  Distrib 8.4.10, for Linux (x86_64)
--
-- Host: localhost    Database: benchmarkinator
-- ------------------------------------------------------
-- Server version	8.4.10

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `benchmark`
--

DROP TABLE IF EXISTS `benchmark`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `benchmark` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `lower_is_better` tinyint(1) NOT NULL,
  `benchmark_target_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `benchmark_target_id` (`benchmark_target_id`),
  CONSTRAINT `benchmark_ibfk_1` FOREIGN KEY (`benchmark_target_id`) REFERENCES `benchmarktarget` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `benchmark`
--

LOCK TABLES `benchmark` WRITE;
/*!40000 ALTER TABLE `benchmark` DISABLE KEYS */;
INSERT INTO `benchmark` (`id`, `name`, `lower_is_better`, `benchmark_target_id`) VALUES (1,'3DMark99',0,2),(2,'3DMark2000',0,2),(3,'CPU Compression',1,1);
/*!40000 ALTER TABLE `benchmark` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `benchmarkresult`
--

DROP TABLE IF EXISTS `benchmarkresult`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `benchmarkresult` (
  `id` int NOT NULL AUTO_INCREMENT,
  `benchmark_id` int NOT NULL,
  `config_id` int NOT NULL,
  `result` float NOT NULL,
  `timestamp` varchar(255) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `benchmark_id` (`benchmark_id`),
  KEY `config_id` (`config_id`),
  CONSTRAINT `benchmarkresult_ibfk_1` FOREIGN KEY (`benchmark_id`) REFERENCES `benchmark` (`id`),
  CONSTRAINT `benchmarkresult_ibfk_2` FOREIGN KEY (`config_id`) REFERENCES `config` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `benchmarkresult`
--

LOCK TABLES `benchmarkresult` WRITE;
/*!40000 ALTER TABLE `benchmarkresult` DISABLE KEYS */;
INSERT INTO `benchmarkresult` (`id`, `benchmark_id`, `config_id`, `result`, `timestamp`, `notes`) VALUES (1,1,1,2745,'2026-07-11T22:10:29.351Z',''),(2,2,1,1256,'2026-07-11T22:10:45.045Z',''),(3,3,1,1333,'2026-07-11T22:10:56.581Z',''),(4,1,2,3622,'2026-07-11T22:11:15.103Z',''),(5,2,2,5021,'2026-07-11T22:11:27.535Z',''),(6,3,2,312,'2026-07-11T22:11:42.017Z','');
/*!40000 ALTER TABLE `benchmarkresult` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `benchmarktarget`
--

DROP TABLE IF EXISTS `benchmarktarget`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `benchmarktarget` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `benchmarktarget`
--

LOCK TABLES `benchmarktarget` WRITE;
/*!40000 ALTER TABLE `benchmarktarget` DISABLE KEYS */;
INSERT INTO `benchmarktarget` (`id`, `name`) VALUES (1,'CPU'),(2,'GPU');
/*!40000 ALTER TABLE `benchmarktarget` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `cpu_id` int DEFAULT NULL,
  `cpu_quantity` int NOT NULL,
  `cpu_component_ids` varchar(255) DEFAULT NULL,
  `motherboard_id` int DEFAULT NULL,
  `gpu_id` int DEFAULT NULL,
  `gpu_quantity` int NOT NULL,
  `gpu_component_ids` varchar(255) DEFAULT NULL,
  `disk_id` int DEFAULT NULL,
  `os_id` int DEFAULT NULL,
  `ram_id` int DEFAULT NULL,
  `ram_size` varchar(255) NOT NULL,
  `cpu_driver_version` varchar(255) DEFAULT NULL,
  `mb_chipset_driver_version` varchar(255) DEFAULT NULL,
  `gpu_driver_version` varchar(255) DEFAULT NULL,
  `cpu_overclock` tinyint(1) NOT NULL,
  `cpu_baseclock` int DEFAULT NULL,
  `cpu_currentclock` int DEFAULT NULL,
  `gpu_core_overclock` tinyint(1) NOT NULL,
  `gpu_core_baseclock` int DEFAULT NULL,
  `gpu_core_currentclock` int DEFAULT NULL,
  `gpu_vram_overclock` tinyint(1) NOT NULL,
  `gpu_vram_baseclock` int DEFAULT NULL,
  `gpu_vram_currentclock` int DEFAULT NULL,
  `ram_overclock` tinyint(1) NOT NULL,
  `ram_baseclock` int DEFAULT NULL,
  `ram_currentclock` int DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `cpu_id` (`cpu_id`),
  KEY `motherboard_id` (`motherboard_id`),
  KEY `gpu_id` (`gpu_id`),
  KEY `disk_id` (`disk_id`),
  KEY `os_id` (`os_id`),
  KEY `ram_id` (`ram_id`),
  CONSTRAINT `config_ibfk_1` FOREIGN KEY (`cpu_id`) REFERENCES `cpu` (`id`),
  CONSTRAINT `config_ibfk_2` FOREIGN KEY (`motherboard_id`) REFERENCES `motherboard` (`id`),
  CONSTRAINT `config_ibfk_3` FOREIGN KEY (`gpu_id`) REFERENCES `gpu` (`id`),
  CONSTRAINT `config_ibfk_4` FOREIGN KEY (`disk_id`) REFERENCES `disk` (`id`),
  CONSTRAINT `config_ibfk_5` FOREIGN KEY (`os_id`) REFERENCES `os` (`id`),
  CONSTRAINT `config_ibfk_6` FOREIGN KEY (`ram_id`) REFERENCES `ram` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config`
--

LOCK TABLES `config` WRITE;
/*!40000 ALTER TABLE `config` DISABLE KEYS */;
INSERT INTO `config` (`id`, `name`, `cpu_id`, `cpu_quantity`, `cpu_component_ids`, `motherboard_id`, `gpu_id`, `gpu_quantity`, `gpu_component_ids`, `disk_id`, `os_id`, `ram_id`, `ram_size`, `cpu_driver_version`, `mb_chipset_driver_version`, `gpu_driver_version`, `cpu_overclock`, `cpu_baseclock`, `cpu_currentclock`, `gpu_core_overclock`, `gpu_core_baseclock`, `gpu_core_currentclock`, `gpu_vram_overclock`, `gpu_vram_baseclock`, `gpu_vram_currentclock`, `ram_overclock`, `ram_baseclock`, `ram_currentclock`, `notes`) VALUES (1,'Test System 1',1,1,'[1]',1,1,1,'[1]',2,5,2,'128MB','','','',0,NULL,NULL,0,NULL,NULL,0,NULL,NULL,0,NULL,NULL,''),(2,'Test System 2',2,1,'[2]',2,2,1,'[2]',2,5,2,'128MB','','','',0,NULL,NULL,0,NULL,NULL,0,NULL,NULL,0,NULL,NULL,''),(3,'Test System 3',3,1,'[3]',1,1,1,'[1]',1,5,2,'128mb','','','',0,NULL,NULL,0,NULL,NULL,0,NULL,NULL,0,NULL,NULL,'');
/*!40000 ALTER TABLE `config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cpu`
--

DROP TABLE IF EXISTS `cpu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cpu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `model` varchar(255) NOT NULL,
  `speed` varchar(255) NOT NULL,
  `core_count` int NOT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `cpu_brand_id` int NOT NULL,
  `cpu_family_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cpu_brand_id` (`cpu_brand_id`),
  KEY `cpu_family_id` (`cpu_family_id`),
  CONSTRAINT `cpu_ibfk_1` FOREIGN KEY (`cpu_brand_id`) REFERENCES `cpubrand` (`id`),
  CONSTRAINT `cpu_ibfk_2` FOREIGN KEY (`cpu_family_id`) REFERENCES `cpufamily` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cpu`
--

LOCK TABLES `cpu` WRITE;
/*!40000 ALTER TABLE `cpu` DISABLE KEYS */;
INSERT INTO `cpu` (`id`, `model`, `speed`, `core_count`, `serial`, `cpu_brand_id`, `cpu_family_id`) VALUES (1,'700','700Mhz',1,NULL,1,8),(2,'700','700Mhz',1,NULL,7,19),(3,'1000','1000Mhz',1,NULL,1,7);
/*!40000 ALTER TABLE `cpu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cpubrand`
--

DROP TABLE IF EXISTS `cpubrand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cpubrand` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cpubrand`
--

LOCK TABLES `cpubrand` WRITE;
/*!40000 ALTER TABLE `cpubrand` DISABLE KEYS */;
INSERT INTO `cpubrand` (`id`, `name`) VALUES (1,'AMD'),(2,'Broadcom'),(3,'Compaq'),(4,'Cyrix'),(5,'Digital Equipment Corporation (DEC)'),(6,'IBM'),(20,'IDT'),(7,'Intel'),(8,'Motorola'),(9,'NexGen'),(10,'Qualcomm'),(11,'Rise'),(12,'Siemens'),(13,'SiS'),(15,'STMicroelectronics'),(14,'Sun Microsystems'),(16,'Texas Instruments'),(17,'Transmeta'),(18,'VIA'),(19,'Zilog');
/*!40000 ALTER TABLE `cpubrand` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cpufamily`
--

DROP TABLE IF EXISTS `cpufamily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cpufamily` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `cpu_brand_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cpufamily_brand_name` (`cpu_brand_id`,`name`),
  CONSTRAINT `cpufamily_ibfk_1` FOREIGN KEY (`cpu_brand_id`) REFERENCES `cpubrand` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cpufamily`
--

LOCK TABLES `cpufamily` WRITE;
/*!40000 ALTER TABLE `cpufamily` DISABLE KEYS */;
INSERT INTO `cpufamily` (`id`, `name`, `cpu_brand_id`) VALUES (1,'Am386',1),(2,'Am486',1),(8,'Athlon',1),(10,'Athlon 64',1),(9,'Athlon XP',1),(7,'Duron',1),(3,'K5',1),(4,'K6',1),(5,'K6-II',1),(6,'K6-III',1),(58,'Phenom',1),(11,'Sempron',1),(46,'6x86',4),(47,'6x86MX',4),(44,'Cx486',4),(45,'MediaGX',4),(48,'MII',4),(24,'IBM 5x86',6),(25,'IBM 6x86',6),(26,'IBM 6x86MX',6),(27,'IBM PowerPC 601',6),(28,'IBM PowerPC 603',6),(29,'IBM PowerPC 604',6),(31,'IBM PowerPC 7400 (G4)',6),(30,'IBM PowerPC 750 (G3)',6),(32,'IBM PowerPC 970 (G5)',6),(12,'286',7),(13,'386',7),(14,'486',7),(57,'Atom',7),(20,'Celeron',7),(55,'Core 2 Duo',7),(56,'Core 2 Quad',7),(54,'Core Solo',7),(15,'Pentium',7),(21,'Pentium 4',7),(22,'Pentium D',7),(18,'Pentium II',7),(19,'Pentium III',7),(17,'Pentium MMX',7),(16,'Pentium Pro',7),(23,'Xeon',7),(33,'68000',8),(34,'68010',8),(35,'68020',8),(36,'68030',8),(37,'68040',8),(38,'68060',8),(39,'PowerPC 601',8),(40,'PowerPC 603',8),(41,'PowerPC 604',8),(43,'PowerPC 7400 (G4)',8),(42,'PowerPC 750 (G3)',8),(49,'VIA 6x86',18),(50,'VIA MediaGX',18),(51,'VIA MII',18),(52,'IDT WinChip',20),(53,'IDT WinChip 2',20);
/*!40000 ALTER TABLE `cpufamily` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disk`
--

DROP TABLE IF EXISTS `disk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disk` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disk`
--

LOCK TABLES `disk` WRITE;
/*!40000 ALTER TABLE `disk` DISABLE KEYS */;
INSERT INTO `disk` (`id`, `name`) VALUES (13,'CFDisk'),(1,'IDE 5400 RPM'),(2,'IDE 7200 RPM'),(8,'SAS 10000 RPM'),(9,'SAS 15000 RPM'),(7,'SAS 7200 RPM'),(3,'SATA I 5400 RPM'),(4,'SATA I 7200 RPM'),(5,'SATA II 5400 RPM'),(6,'SATA II 7200 RPM'),(11,'SCSI 10000 RPM'),(12,'SCSI 15000 RPM'),(10,'SCSI 7200 RPM'),(14,'SDCard');
/*!40000 ALTER TABLE `disk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gpu`
--

DROP TABLE IF EXISTS `gpu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gpu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vram_size` varchar(255) NOT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `gpu_manufacturer_id` int DEFAULT NULL,
  `gpu_brand_id` int NOT NULL,
  `gpu_model_id` int NOT NULL,
  `gpu_vram_type_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `gpu_manufacturer_id` (`gpu_manufacturer_id`),
  KEY `gpu_brand_id` (`gpu_brand_id`),
  KEY `gpu_model_id` (`gpu_model_id`),
  KEY `gpu_vram_type_id` (`gpu_vram_type_id`),
  CONSTRAINT `gpu_ibfk_1` FOREIGN KEY (`gpu_manufacturer_id`) REFERENCES `gpumanufacturer` (`id`),
  CONSTRAINT `gpu_ibfk_2` FOREIGN KEY (`gpu_brand_id`) REFERENCES `gpubrand` (`id`),
  CONSTRAINT `gpu_ibfk_3` FOREIGN KEY (`gpu_model_id`) REFERENCES `gpumodel` (`id`),
  CONSTRAINT `gpu_ibfk_4` FOREIGN KEY (`gpu_vram_type_id`) REFERENCES `gpuvramtype` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gpu`
--

LOCK TABLES `gpu` WRITE;
/*!40000 ALTER TABLE `gpu` DISABLE KEYS */;
INSERT INTO `gpu` (`id`, `vram_size`, `serial`, `gpu_manufacturer_id`, `gpu_brand_id`, `gpu_model_id`, `gpu_vram_type_id`) VALUES (1,'32MB',NULL,2,7,17,1),(2,'32MB',NULL,14,7,19,1);
/*!40000 ALTER TABLE `gpu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gpubrand`
--

DROP TABLE IF EXISTS `gpubrand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gpubrand` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gpubrand`
--

LOCK TABLES `gpubrand` WRITE;
/*!40000 ALTER TABLE `gpubrand` DISABLE KEYS */;
INSERT INTO `gpubrand` (`id`, `name`) VALUES (1,'3dfx'),(2,'ARK Logic'),(3,'ATI'),(4,'Cirrus Logic'),(5,'Intel'),(6,'Matrox'),(7,'NVIDIA'),(8,'PowerVR'),(9,'S3'),(10,'SiS'),(11,'Trident');
/*!40000 ALTER TABLE `gpubrand` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gpumanufacturer`
--

DROP TABLE IF EXISTS `gpumanufacturer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gpumanufacturer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gpumanufacturer`
--

LOCK TABLES `gpumanufacturer` WRITE;
/*!40000 ALTER TABLE `gpumanufacturer` DISABLE KEYS */;
INSERT INTO `gpumanufacturer` (`id`, `name`) VALUES (3,'3dfx Interactive'),(4,'Ark Logic'),(5,'Asus'),(6,'ATI'),(7,'Cirrus Logic'),(8,'Diamond'),(9,'EVGA'),(10,'Gainward'),(2,'Generic'),(11,'Gigabyte'),(12,'Hercules'),(13,'Inno3D'),(14,'Leadtek'),(15,'Matrox'),(16,'MSI'),(17,'Neomagic'),(1,'OEM'),(18,'Palit'),(19,'PNY'),(20,'PowerColor'),(21,'S3'),(22,'SiS'),(23,'Trident'),(24,'VisionTek'),(25,'XFX');
/*!40000 ALTER TABLE `gpumanufacturer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gpumodel`
--

DROP TABLE IF EXISTS `gpumodel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gpumodel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `gpu_brand_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gpumodel_brand_name` (`gpu_brand_id`,`name`),
  CONSTRAINT `gpumodel_ibfk_1` FOREIGN KEY (`gpu_brand_id`) REFERENCES `gpubrand` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gpumodel`
--

LOCK TABLES `gpumodel` WRITE;
/*!40000 ALTER TABLE `gpumodel` DISABLE KEYS */;
INSERT INTO `gpumodel` (`id`, `name`, `gpu_brand_id`) VALUES (5,'Velocity 100',1),(6,'Velocity 200',1),(3,'Voodoo 2',1),(4,'Voodoo Banshee',1),(1,'Voodoo Graphics',1),(2,'Voodoo Rush',1),(7,'Voodoo3 1000',1),(8,'Voodoo3 2000',1),(9,'Voodoo3 3000',1),(10,'Voodoo3 3500 TV',1),(11,'Voodoo4 4500',1),(12,'Voodoo5 5500',1),(34,'3D Rage',3),(33,'Mach',3),(39,'Radeon 7000',3),(40,'Radeon 7200',3),(41,'Radeon 7500',3),(42,'Radeon 8500',3),(43,'Radeon 9000',3),(44,'Radeon 9200',3),(45,'Radeon 9600',3),(46,'Radeon 9800',3),(96,'Radeon HD 2000',3),(97,'Radeon HD 3000',3),(51,'Radeon X1000',3),(47,'Radeon X300',3),(48,'Radeon X600',3),(49,'Radeon X700',3),(50,'Radeon X800',3),(38,'Rage 128',3),(35,'Rage I',3),(36,'Rage II',3),(37,'Rage Pro',3),(32,'Wonder',3),(59,'GD5400',4),(60,'GD5430',4),(61,'GD5434',4),(67,'GD5446',4),(62,'GD5460',4),(63,'GD5464',4),(64,'GD5465',4),(65,'GD5480',4),(66,'GD5486',4),(76,'i740',5),(77,'Intel 810',5),(78,'Intel 830M',5),(79,'Intel 845G',5),(80,'Intel 865G',5),(81,'Intel GMA 900',5),(82,'Intel GMA 950',5),(98,'Intel GMA X3000',5),(69,'Matrox G100',6),(70,'Matrox G200',6),(71,'Matrox G400',6),(72,'Matrox G450',6),(73,'Matrox G550',6),(101,'Matrox M-Series',6),(68,'Matrox MGA',6),(75,'Matrox Millennium P650',6),(74,'Matrox Parhelia',6),(20,'GeForce 256',7),(30,'GeForce 6 Series',7),(31,'GeForce 7 Series',7),(94,'GeForce 8 Series',7),(95,'GeForce 9 Series',7),(27,'GeForce FX 5200',7),(28,'GeForce FX 5600',7),(29,'GeForce FX 5900',7),(22,'GeForce2 GTS',7),(21,'GeForce2 MX',7),(23,'GeForce2 Ultra',7),(24,'GeForce3',7),(25,'GeForce4 MX',7),(26,'GeForce4 Ti',7),(13,'RIVA 128',7),(14,'RIVA 128ZX',7),(15,'TNT',7),(16,'TNT2',7),(17,'TNT2 M64',7),(18,'TNT2 Pro',7),(19,'TNT2 Ultra',7),(93,'KYRO II',8),(92,'PowerVR KYRO',8),(90,'PowerVR Series1',8),(91,'PowerVR Series2',8),(58,'S3 Chrome',9),(57,'S3 DeltaChrome',9),(56,'S3 ProSavage',9),(53,'S3 Savage3D',9),(54,'S3 Savage4',9),(52,'S3 Trio',9),(55,'S3 Virge',9),(87,'SiS 315',10),(89,'SiS 330',10),(83,'SiS 530',10),(85,'SiS 540',10),(84,'SiS 6326',10),(86,'SiS 650',10),(88,'SiS 650/740',10),(100,'SiS 672/771',10),(99,'SiS Mirage 3',10);
/*!40000 ALTER TABLE `gpumodel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gpuvramtype`
--

DROP TABLE IF EXISTS `gpuvramtype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gpuvramtype` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gpuvramtype`
--

LOCK TABLES `gpuvramtype` WRITE;
/*!40000 ALTER TABLE `gpuvramtype` DISABLE KEYS */;
INSERT INTO `gpuvramtype` (`id`, `name`) VALUES (2,'DDR'),(3,'GDDR'),(4,'GDDR2'),(5,'GDDR3'),(6,'GDDR4'),(7,'GDDR5'),(1,'SDR');
/*!40000 ALTER TABLE `gpuvramtype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `motherboard`
--

DROP TABLE IF EXISTS `motherboard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `motherboard` (
  `id` int NOT NULL AUTO_INCREMENT,
  `model` varchar(255) NOT NULL,
  `manufacturer_id` int NOT NULL,
  `chipset_id` int NOT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `manufacturer_id` (`manufacturer_id`),
  KEY `chipset_id` (`chipset_id`),
  CONSTRAINT `motherboard_ibfk_1` FOREIGN KEY (`manufacturer_id`) REFERENCES `motherboardmanufacturer` (`id`),
  CONSTRAINT `motherboard_ibfk_2` FOREIGN KEY (`chipset_id`) REFERENCES `motherboardchipset` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `motherboard`
--

LOCK TABLES `motherboard` WRITE;
/*!40000 ALTER TABLE `motherboard` DISABLE KEYS */;
INSERT INTO `motherboard` (`id`, `model`, `manufacturer_id`, `chipset_id`, `serial`, `notes`) VALUES (1,'AMDATH',5,30,NULL,NULL),(2,'GA-6BXC',14,3,NULL,NULL);
/*!40000 ALTER TABLE `motherboard` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `motherboardchipset`
--

DROP TABLE IF EXISTS `motherboardchipset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `motherboardchipset` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `motherboardchipset`
--

LOCK TABLES `motherboardchipset` WRITE;
/*!40000 ALTER TABLE `motherboardchipset` DISABLE KEYS */;
INSERT INTO `motherboardchipset` (`id`, `name`) VALUES (23,'ALi M1647'),(11,'AMD 760'),(29,'AMD 770'),(30,'AMD 790X'),(3,'Intel 440BX'),(1,'Intel 440FX'),(2,'Intel 440LX'),(4,'Intel 815'),(5,'Intel 845'),(6,'Intel 850'),(7,'Intel 865'),(8,'Intel 915'),(9,'Intel 945'),(25,'Intel 965'),(10,'Intel 975X'),(26,'Intel P35'),(27,'Intel P45'),(20,'NVIDIA nForce2'),(21,'NVIDIA nForce3'),(22,'NVIDIA nForce4'),(28,'NVIDIA nForce5'),(17,'SiS 630'),(18,'SiS 735'),(19,'SiS 745'),(24,'ULi M1695'),(12,'VIA Apollo'),(13,'VIA KT133'),(14,'VIA KT266'),(15,'VIA KT333'),(16,'VIA KT400');
/*!40000 ALTER TABLE `motherboardchipset` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `motherboardmanufacturer`
--

DROP TABLE IF EXISTS `motherboardmanufacturer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `motherboardmanufacturer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `motherboardmanufacturer`
--

LOCK TABLES `motherboardmanufacturer` WRITE;
/*!40000 ALTER TABLE `motherboardmanufacturer` DISABLE KEYS */;
INSERT INTO `motherboardmanufacturer` (`id`, `name`) VALUES (2,'Abit'),(3,'Acer'),(1,'AOpen'),(4,'ASRock'),(5,'ASUS'),(6,'Biostar'),(7,'Chaintech'),(8,'Dell'),(9,'DFI'),(10,'ECS'),(11,'EVGA'),(12,'FIC'),(13,'Foxconn'),(14,'Gigabyte'),(15,'HP'),(16,'Intel'),(17,'MSI'),(18,'Sapphire'),(19,'Shuttle'),(21,'Soyo'),(20,'Supermicro'),(22,'Tyan');
/*!40000 ALTER TABLE `motherboardmanufacturer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `os`
--

DROP TABLE IF EXISTS `os`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `os` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `os`
--

LOCK TABLES `os` WRITE;
/*!40000 ALTER TABLE `os` DISABLE KEYS */;
INSERT INTO `os` (`id`, `name`) VALUES (15,'AmigaOS'),(20,'BeOS'),(22,'CP/M'),(24,'DR DOS'),(12,'FreeBSD'),(11,'Linux'),(16,'Mac OS 7'),(17,'Mac OS 8'),(18,'Mac OS 9'),(19,'Mac OS X'),(21,'Minix'),(1,'MS-DOS'),(13,'NetBSD'),(14,'OpenBSD'),(9,'OS/2'),(2,'PC DOS'),(25,'Solaris'),(10,'UNIX'),(7,'Windows 2000'),(3,'Windows 3.1'),(4,'Windows 95'),(5,'Windows 98'),(6,'Windows NT 4.0'),(26,'Windows Vista'),(8,'Windows XP'),(23,'Xenix');
/*!40000 ALTER TABLE `os` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ram`
--

DROP TABLE IF EXISTS `ram`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ram` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ram`
--

LOCK TABLES `ram` WRITE;
/*!40000 ALTER TABLE `ram` DISABLE KEYS */;
INSERT INTO `ram` (`id`, `name`) VALUES (4,'DDR 200MHz'),(5,'DDR 266MHz'),(6,'DDR 333MHz'),(7,'DDR 400MHz'),(8,'DDR2 400MHz'),(9,'DDR2 533MHz'),(10,'DDR2 667MHz'),(11,'DDR2 800MHz'),(12,'DDR3 1066MHz'),(13,'DDR3 1333MHz'),(2,'SDRAM 100MHz'),(3,'SDRAM 133MHz'),(1,'SDRAM 66MHz');
/*!40000 ALTER TABLE `ram` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `key` varchar(191) NOT NULL,
  `value` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` (`key`, `value`) VALUES ('hardware_data_era','retroextended'),('hardware_data_loaded','true'),('hardware_data_loaded_at','2026-07-11T22:05:55.899780Z');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'benchmarkinator'
--

--
-- Dumping routines for database 'benchmarkinator'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-12 16:15:02
