CREATE DATABASE IF NOT EXISTS redfish CHARACTER
SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE redfish;
CREATE TABLE IF NOT EXISTS Roles (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(255) UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS Permissions (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(255) UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS _PermissionToRoles (
   A INT NOT NULL,
   B INT NOT NULL,
   UNIQUE INDEX _PermissionToRole_AB_unique (A, B),
   INDEX _PermissionToRole_B_index (B),
   CONSTRAINT _PermissionToRole_A_fkey FOREIGN KEY (A) REFERENCES Permissions (id) ON DELETE CASCADE,
   CONSTRAINT _PermissionToRole_B_fkey FOREIGN KEY (B) REFERENCES Roles (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS Users (
   id INT AUTO_INCREMENT PRIMARY KEY,
   username VARCHAR(255) UNIQUE NOT NULL,
   passwordHash CHAR(64) NOT NULL,
   roleId INT NOT NULL,
   CONSTRAINT fk_users_role FOREIGN KEY (roleId) REFERENCES Roles (id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS UserRefreshTokens (
   id INT AUTO_INCREMENT PRIMARY KEY,
   userId INT NOT NULL UNIQUE,
   tokenHash CHAR(64) NOT NULL,
   expiresAt DATETIME NOT NULL,
   CONSTRAINT fk_refreshtokens_user FOREIGN KEY (userId) REFERENCES Users (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS Groups (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS Tags (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS Assets (
   id INT AUTO_INCREMENT PRIMARY KEY,
   groupId INT,
   name VARCHAR(255),
   notes TEXT,
   position INT,
   storageId INT,
   CONSTRAINT fk_assets_storage FOREIGN KEY (storageId) REFERENCES Storages(id)
);
CREATE TABLE IF NOT EXISTS _AssetsToTags (
   assetId INT NOT NULL,
   tagId INT NOT NULL,
   PRIMARY KEY (assetId, tagId),
   CONSTRAINT fk_assets_to_tags_asset FOREIGN KEY (assetId) REFERENCES Assets(id) ON DELETE CASCADE,
   CONSTRAINT fk_assets_to_tags_tag FOREIGN KEY (tagId) REFERENCES Tags(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS Storages (
   id INT PRIMARY KEY,
   CONSTRAINT fk storage_asset FOREIGN KEY (id) REFERENCES Assets(id) ON DELETE CASCADE
);
CREATE TABLE Servers (
   id INT PRIMARY KEY,
   model VARCHAR(255),
   CONSTRAINT fk server_asset FOREIGN KEY (id) REFERENCES Assets(id) ON DELETE CASCADE
);
CREATE TABLE UninterruptiblePowerSupplies(
   id INT PRIMARY KEY,
   capacity FLOAT,
   CONSTRAINT fk ups_asset FOREIGN KEY (id) REFERENCES Assets(id) ON DELETE CASCADE
);
CREATE TABLE PowerDistributionUnits(
   id INT PRIMARY KEY,
   outletCount INT,
   CONSTRAINT fk pds_asset FOREIGN KEY (id) REFERENCES Assets(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS AssetPaths (
   id INT AUTO_INCREMENT PRIMARY KEY,
   path TEXT NOT NULL,
   name VARCHAR(255),
   assetId INT NOT NULL,
   CONSTRAINT fk_assetpath_asset FOREIGN KEY (assetId) REFERENCES Asset (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS AssetJson (
   id INT AUTO_INCREMENT PRIMARY KEY,
   rawJson LONGTEXT NOT NULL,
   uploadDate DATETIME DEFAULT (UTC_TIMESTAMP ()),
   assetId INT NOT NULL,
   CONSTRAINT fk_assetjson_asset FOREIGN KEY (assetId) REFERENCES Asset (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS Templates (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(255) UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS TemplatePaths (
   id INT AUTO_INCREMENT PRIMARY KEY,
   path TEXT NOT NULL,
   name VARCHAR(255),
   templateId INT NOT NULL,
   CONSTRAINT fk_templatepath_template FOREIGN KEY (templateId) REFERENCES Template (id) ON DELETE CASCADE
);
-- Create permissions
INSERT IGNORE INTO Permission (name)
VALUES ('template.read'),
   ('template.write'),
   ('template.delete'),
   ('rack.read'),
   ('rack.write'),
   ('rack.delete'),
   ('asset.read'),
   ('asset.write'),
   ('asset.delete'),
   ('user.create'),
   ('user.update'),
   ('user.delete'),
   ('role.create'),
   ('role.update'),
   ('role.delete');
-- Create admin role
INSERT IGNORE INTO Role (name)
VALUES ('admin');
-- Give admin all permissions
-- A = Permission.id
-- B = Role.id
INSERT IGNORE INTO _PermissionToRole (A, B)
SELECT p.id,
   r.id
FROM Permission p
   CROSS JOIN Role r
WHERE r.name = 'admin';
-- Create default admin user
INSERT IGNORE INTO Users (username, passwordHash, roleId)
SELECT 'admin',
   SHA2 ('admin', 256),
   id
FROM Role
WHERE name = 'admin';