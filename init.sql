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