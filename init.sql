-- ===========================================================
-- Redfish Database Schema
-- MySQL 8+
-- ===========================================================
DROP DATABASE IF EXISTS redfish;
CREATE DATABASE redfish CHARACTER
SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE redfish;
-- ===========================================================
-- Roles & Permissions
-- ===========================================================
CREATE TABLE Roles (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE Permissions (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE _PermissionToRole (
   A INT NOT NULL,
   B INT NOT NULL,
   PRIMARY KEY (A, B)
);
-- ===========================================================
-- Users
-- ===========================================================
CREATE TABLE Users (
   id INT AUTO_INCREMENT PRIMARY KEY,
   username VARCHAR(255) NOT NULL UNIQUE,
   passwordHash CHAR(64) NOT NULL,
   roleId INT NOT NULL,
   CONSTRAINT fk_users_role FOREIGN KEY (roleId) REFERENCES Roles (id) ON DELETE RESTRICT
);
CREATE TABLE UserRefreshTokens (
   id INT AUTO_INCREMENT PRIMARY KEY,
   userId INT NOT NULL UNIQUE,
   tokenHash CHAR(64) NOT NULL,
   expiresAt DATETIME NOT NULL,
   CONSTRAINT fk_refresh_user FOREIGN KEY (userId) REFERENCES Users (id) ON DELETE CASCADE
);
-- ===========================================================
-- Groups / Tags
-- ===========================================================
CREATE TABLE Groups (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE Tags (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(255) NOT NULL UNIQUE
);
-- ===========================================================
-- Assets
-- ===========================================================
CREATE TABLE Assets (
   id INT AUTO_INCREMENT PRIMARY KEY,
   groupId INT NULL,
   storageId INT NULL,
   name VARCHAR(255) NOT NULL,
   notes TEXT NULL,
   position INT NOT NULL DEFAULT 0,
   CONSTRAINT fk_assets_group FOREIGN KEY (groupId) REFERENCES Groups (id) ON DELETE
   SET NULL
);
-- ===========================================================
-- Asset Types
-- ===========================================================
CREATE TABLE Storages (
   id INT PRIMARY KEY,
   size INT NULL,
   CONSTRAINT fk_storage_asset FOREIGN KEY (id) REFERENCES Assets (id) ON DELETE CASCADE
);
ALTER TABLE Assets
ADD CONSTRAINT fk_assets_storage FOREIGN KEY (storageId) REFERENCES Storages (id) ON DELETE
SET NULL;
CREATE TABLE Servers (
   id INT PRIMARY KEY,
   model VARCHAR(255),
   size INT,
   CONSTRAINT fk_server_asset FOREIGN KEY (id) REFERENCES Assets (id) ON DELETE CASCADE
);
CREATE TABLE UninterruptiblePowerSupplies (
   id INT PRIMARY KEY,
   capacity FLOAT,
   CONSTRAINT fk_ups_asset FOREIGN KEY (id) REFERENCES Assets (id) ON DELETE CASCADE
);
CREATE TABLE PowerDistributionUnits (
   id INT PRIMARY KEY,
   outletCount INT,
   CONSTRAINT fk_pdu_asset FOREIGN KEY (id) REFERENCES Assets (id) ON DELETE CASCADE
);
-- ===========================================================
-- Asset Tags
-- ===========================================================
CREATE TABLE _AssetToTag (
   A INT NOT NULL,
   B INT NOT NULL,
   PRIMARY KEY (A, B)
);
-- ===========================================================
-- Asset Paths
-- ===========================================================
CREATE TABLE AssetPaths (
   id INT AUTO_INCREMENT PRIMARY KEY,
   path TEXT NOT NULL,
   name VARCHAR(255),
   assetId INT NOT NULL,
   CONSTRAINT fk_assetpath_asset FOREIGN KEY (assetId) REFERENCES Assets (id) ON DELETE CASCADE
);
-- ===========================================================
-- Asset JSON
-- ===========================================================
CREATE TABLE AssetJson (
   id INT AUTO_INCREMENT PRIMARY KEY,
   rawJson LONGTEXT NOT NULL,
   uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
   assetId INT NOT NULL,
   CONSTRAINT fk_assetjson_asset FOREIGN KEY (assetId) REFERENCES Assets (id) ON DELETE CASCADE
);
-- ===========================================================
-- Templates
-- ===========================================================
CREATE TABLE Templates (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE TemplatePaths (
   id INT AUTO_INCREMENT PRIMARY KEY,
   path TEXT NOT NULL,
   name VARCHAR(255),
   templateId INT NOT NULL,
   CONSTRAINT fk_templatepath_template FOREIGN KEY (templateId) REFERENCES Templates (id) ON DELETE CASCADE
);
-- ===========================================================
-- Indexes
-- ===========================================================
CREATE INDEX idx_assets_group ON Assets (groupId);
CREATE INDEX idx_assets_storage ON Assets (storageId);
CREATE INDEX idx_assetpaths_asset ON AssetPaths (assetId);
CREATE INDEX idx_assetjson_asset ON AssetJson (assetId);
-- ===========================================================
-- Seed Permissions
-- ===========================================================
INSERT IGNORE INTO Permissions (name)
VALUES ('template.read'),
   ('template.write'),
   ('template.delete'),
   ('user.create'),
   ('user.update'),
   ('user.delete'),
   ('role.create'),
   ('role.update'),
   ('role.delete'),
   ('tag.create'),
   ('tag.update'),
   ('tag.delete'),
   ('group.create'),
   ('group.update'),
   ('group.delete'),
   ('asset.create'),
   ('asset.update'),
   ('asset.delete');
-- ===========================================================
-- Seed Roles
-- ===========================================================
INSERT IGNORE INTO Roles (name)
VALUES ('admin');
-- ===========================================================
-- Give admin every permission
-- ===========================================================
INSERT INTO _PermissionToRole (A, B)
SELECT p.id,
   r.id
FROM Roles r
   CROSS JOIN Permissions p
WHERE r.name = 'admin';
-- ===========================================================
-- Default admin user
-- password: admin
-- ===========================================================
INSERT IGNORE INTO Users (username, passwordHash, roleId)
SELECT 'admin',
   SHA2 ('admin', 256),
   id
FROM Roles
WHERE name = 'admin';