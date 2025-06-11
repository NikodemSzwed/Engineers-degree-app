-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Czas generowania: 23 Paź 2024, 14:12
-- Wersja serwera: 10.4.17-MariaDB
-- Wersja PHP: 8.0.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

SET @dbname = 'EngineersDegreeAppDB';
SET @query = CONCAT('DROP DATABASE IF EXISTS `', @dbname, '`');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @query = CONCAT('CREATE DATABASE IF NOT EXISTS `', @dbname, '`');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;
USE EngineersDegreeAppDB;

CREATE USER IF NOT EXISTS 'EngineersDegreeAppDBuser'@'localhost' IDENTIFIED BY 'EngineersDegreeAppDBpassword';
GRANT ALL ON `EngineersDegreeAppDB`.* TO 'EngineersDegreeAppDBuser'@'localhost';
FLUSH PRIVILEGES;

-- CREATE TABLE `ElementsTypes` (
--   `ETID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `name` text NOT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INSERT INTO `ElementsTypes` (`ETID`, `name`) VALUES
-- (1, 'Map'),
-- (2, 'Order'),
-- (3, 'Sector');

-- CREATE TABLE `MapsAndElements` (
--   `EID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `ParentEID` int(11) DEFAULT NULL,
--   `ETID` int(11) NOT NULL,
--   `name` text NOT NULL,
--   `DimensionsAndStructure_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`DimensionsAndStructure_json`)),
--   FOREIGN KEY (`ETID`) REFERENCES ElementsTypes(`ETID`) ON DELETE CASCADE,
-- FOREIGN KEY (`ParentEID`) REFERENCES MapsAndElements(`EID`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -- INSERT INTO `MapsAndElements` (`EID`, `ParentEID`, `ETID` , `name`, `DimensionsAndStructure_json`) VALUES
-- -- (2, NULL, 1, 'Mapa 1', '{}'),
-- -- (3, 2, 3, 'Sektor 1', '{}'),
-- -- (4, 2, 3, 'Sektor 2', '{}'),
-- -- (5, 2, 3, 'Sektor 3', '{}'),
-- -- (6, NULL, 1, 'Mapa 2', '{}'),
-- -- (16, 2, 2, 'Zlecenie1', '{}'),
-- -- (19, 2, 2, 'Zlecenie1', '{}');


-- CREATE TABLE `Orders` (
--   `OID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `EID` int(11) NOT NULL,
--   `State` int(11) NOT NULL,
--   `Priority` int(11) DEFAULT 1,
--   `deadline` datetime DEFAULT NULL,
--   FOREIGN KEY (`EID`) REFERENCES MapsAndElements(`EID`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -- INSERT INTO `Orders` (`OID`, `EID`, `State`, `Priority`, `deadline`) VALUES
-- -- (1, 16, 0, 1, '2024-11-23 18:08:09'),
-- -- (2, 19, 0, 1, '2024-11-23 18:12:39');

-- CREATE TABLE `AlertsTypes` (
--   `AAID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `name` text NOT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CREATE TABLE `Alerts` (
--   `AID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `AAID` int(11) NOT NULL,
--   `EID` int(11) NOT NULL,
--   `State` int(11) NOT NULL DEFAULT 0,
--   `date` datetime DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (`AAID`) REFERENCES AlertsTypes(`AAID`) ON DELETE CASCADE,
--   FOREIGN KEY (`EID`) REFERENCES MapsAndElements(`EID`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- CREATE TABLE `ATtoETAssignment` (
--   `ATTETAID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `ETID` int(11) NOT NULL,
--   `AAID` int(11) NOT NULL,
--   FOREIGN KEY (`ETID`) REFERENCES ElementsTypes(`ETID`) ON DELETE CASCADE,
--   FOREIGN KEY (`AAID`) REFERENCES AlertsTypes(`AAID`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- CREATE TABLE `Deliveries` (
--   `DelivID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `OID` int(11) NOT NULL,
--   `date` datetime DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (`OID`) REFERENCES Orders(`OID`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- CREATE TABLE `Displays` (
--   `DID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `token` text NOT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CREATE TABLE `DisplayElementsAssignment` (
--   `DEAID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `DID` int(11) NOT NULL,
--   `EID` int(11) NOT NULL,
--   FOREIGN KEY (`DID`) REFERENCES Displays(`DID`) ON DELETE CASCADE,
--   FOREIGN KEY (`EID`) REFERENCES MapsAndElements(`EID`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CREATE TABLE `Groups` (
--   `GID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `name` text NOT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -- INSERT INTO `Groups` (`GID`, `name`) VALUES
-- -- (1, 'Administrators');

-- CREATE TABLE `MapsToGroupAssignment` (
--   `MGAID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `GID` int(11) NOT NULL,
--   `EID` int(11) NOT NULL,
--   FOREIGN KEY (GID) REFERENCES Groups(GID) ON DELETE CASCADE,
--   FOREIGN KEY (EID) REFERENCES MapsAndElements(EID) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CREATE TABLE `Users` (
--   `UID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `login` text NOT NULL,
--   `passwd` text NOT NULL,
--   `email` text DEFAULT NULL,
--   `PersonalSettings_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT "{}" CHECK (json_valid(`PersonalSettings_json`))
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -- INSERT INTO `Users` (`UID`, `login`, `passwd`, `email`) VALUES
-- -- (1, 'Administrator', '$2b$10$tMNgHzbCE/1l3nOfFIUQauE3Hmf/20ldLX0v71ZzGcjQ3omSb3JXG', 'tak@wp.pl');

-- CREATE TABLE `Membership` (
--   `MemID` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `GID` int(11) NOT NULL, 
--   `UID` int(11) NOT NULL,
--   FOREIGN KEY (GID) REFERENCES Groups(GID) ON DELETE CASCADE,
--   FOREIGN KEY (UID) REFERENCES Users(UID) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INSERT INTO `Membership` (`MemID`, `GID`, `UID`) VALUES
-- (1, 1, 1);

COMMIT;
