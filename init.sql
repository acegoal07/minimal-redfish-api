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
   IF NOT EXISTS Path (
      id INT AUTO_INCREMENT PRIMARY KEY,
      path TEXT NOT NULL,
      name VARCHAR(255),
      assetId INT NOT NULL,
      CONSTRAINT fk_path_asset FOREIGN KEY (assetId) REFERENCES Asset (id) ON DELETE CASCADE
   );

CREATE TABLE
   IF NOT EXISTS JsonHistory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rawJson LONGTEXT NOT NULL,
      uploadDate DATETIME DEFAULT (UTC_TIMESTAMP ()),
      filename VARCHAR(255),
      assetId INT NOT NULL,
      CONSTRAINT fk_jsonhistory_asset FOREIGN KEY (assetId) REFERENCES Asset (id) ON DELETE CASCADE
   );

CREATE TABLE
   IF NOT EXISTS Role (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL
   );

CREATE TABLE
   IF NOT EXISTS User (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      passwordHash CHAR(64),
      roleId INT NOT NULL,
      CONSTRAINT fk_user_role FOREIGN KEY (roleId) REFERENCES Role (id) ON DELETE CASCADE
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

INSERT IGNORE INTO Role (name)
VALUES
   ('admin');

INSERT IGNORE INTO User (username, passwordHash, roleId)
SELECT
   'admin',
   SHA2 ('admin', 256),
   id
FROM
   Role
WHERE
   name = 'admin';