CREATE DATABASE IF NOT EXISTS redfish CHARACTER
SET
   utf8mb4 COLLATE utf8mb4_unicode_ci;

USE redfish;

CREATE TABLE
   IF NOT EXISTS Rack (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      size INT,
      notes VARCHAR(255)
   );

CREATE TABLE
   IF NOT EXISTS Asset (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rackId INT NOT NULL,
      name VARCHAR(255) UNIQUE NOT NULL,
      size INT,
      position INT,
      CONSTRAINT fk_asset_rack FOREIGN KEY (rackId) REFERENCES Rack (id) ON DELETE CASCADE
   );

CREATE TABLE
   IF NOT EXISTS AssetPath (
      id INT AUTO_INCREMENT PRIMARY KEY,
      path TEXT NOT NULL,
      name VARCHAR(255),
      assetId INT NOT NULL,
      CONSTRAINT fk_assetpath_asset FOREIGN KEY (assetId) REFERENCES Asset (id) ON DELETE CASCADE
   );

CREATE TABLE
   IF NOT EXISTS AssetJson (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rawJson LONGTEXT NOT NULL,
      uploadDate DATETIME DEFAULT (UTC_TIMESTAMP ()),
      filename VARCHAR(255),
      assetId INT NOT NULL,
      CONSTRAINT fk_assetjson_asset FOREIGN KEY (assetId) REFERENCES Asset (id) ON DELETE CASCADE
   );

CREATE TABLE
   IF NOT EXISTS Role (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL
   );

CREATE TABLE
   IF NOT EXISTS Permission (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL
   );

CREATE TABLE
   IF NOT EXISTS _PermissionToRole (
      A INT NOT NULL,
      B INT NOT NULL,
      UNIQUE INDEX _PermissionToRole_AB_unique (A, B),
      INDEX _PermissionToRole_B_index (B),
      CONSTRAINT _PermissionToRole_A_fkey FOREIGN KEY (A) REFERENCES Permission (id) ON DELETE CASCADE,
      CONSTRAINT _PermissionToRole_B_fkey FOREIGN KEY (B) REFERENCES Role (id) ON DELETE CASCADE
   );

CREATE TABLE
   IF NOT EXISTS Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      passwordHash CHAR(64) NOT NULL,
      roleId INT NOT NULL,
      CONSTRAINT fk_users_role FOREIGN KEY (roleId) REFERENCES Role (id) ON DELETE RESTRICT
   );

CREATE TABLE
   IF NOT EXISTS Template (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL
   );

CREATE TABLE
   IF NOT EXISTS TemplatePath (
      id INT AUTO_INCREMENT PRIMARY KEY,
      path TEXT NOT NULL,
      name VARCHAR(255),
      templateId INT NOT NULL,
      CONSTRAINT fk_templatepath_template FOREIGN KEY (templateId) REFERENCES Template (id) ON DELETE CASCADE
   );

CREATE TABLE
   IF NOT EXISTS UserRefreshTokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL UNIQUE,
      tokenHash CHAR(64) NOT NULL,
      expiresAt DATETIME NOT NULL,
      CONSTRAINT fk_refreshtokens_user FOREIGN KEY (userId) REFERENCES Users (id) ON DELETE CASCADE
   );

-- Create permissions
INSERT IGNORE INTO Permission (name)
VALUES
   ('template.read'),
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
VALUES
   ('admin');

-- Give admin all permissions
-- A = Permission.id
-- B = Role.id
INSERT IGNORE INTO _PermissionToRole (A, B)
SELECT
   p.id,
   r.id
FROM
   Permission p
   CROSS JOIN Role r
WHERE
   r.name = 'admin';

-- Create default admin user
INSERT IGNORE INTO Users (username, passwordHash, roleId)
SELECT
   'admin',
   SHA2 ('admin', 256),
   id
FROM
   Role
WHERE
   name = 'admin';