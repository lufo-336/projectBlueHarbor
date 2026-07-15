-- ═══ SPRINT 0-1 ═══
-- Schema del database: le 4 tabelle fondamentali del dominio.
-- Eseguire per primo. Idempotente: si può rilanciare senza errori.
IF DB_ID('BlueHarborCompleto') IS NULL
    CREATE DATABASE BlueHarborCompleto;
GO
USE BlueHarborCompleto;
GO

-- Le 8 banchine fisse del porto. Size vincolata ai 4 valori ammessi.
IF OBJECT_ID('dbo.Berths') IS NULL
CREATE TABLE dbo.Berths (
    Id   INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(50)  NOT NULL CONSTRAINT UQ_Berths_Name UNIQUE,
    Size VARCHAR(2)   NOT NULL CONSTRAINT CK_Berths_Size
         CHECK (Size IN ('S','M','L','XL'))
);
GO

-- Le navi. BerthId/OccupationStartDay restano NULL finché la nave è Pending.
IF OBJECT_ID('dbo.Ships') IS NULL
CREATE TABLE dbo.Ships (
    Id                  INT IDENTITY(1,1) PRIMARY KEY,
    Name                VARCHAR(100) NOT NULL,
    Size                VARCHAR(2)   NOT NULL CONSTRAINT CK_Ships_Size
                        CHECK (Size IN ('S','M','L','XL')),
    ArrivalDay          INT NOT NULL CONSTRAINT CK_Ships_ArrivalDay CHECK (ArrivalDay >= 0),
    Duration            INT NOT NULL CONSTRAINT CK_Ships_Duration CHECK (Duration BETWEEN 3 AND 15),
    Status              VARCHAR(10) NOT NULL CONSTRAINT DF_Ships_Status DEFAULT 'Pending'
                        CONSTRAINT CK_Ships_Status CHECK (Status IN ('Pending','Assigned','Departed')),
    BerthId             INT NULL CONSTRAINT FK_Ships_Berths REFERENCES dbo.Berths(Id),
    OccupationStartDay  INT NULL
);
GO

-- Tabella chiave/valore di sistema: contiene il giorno virtuale corrente.
IF OBJECT_ID('dbo.Settings') IS NULL
CREATE TABLE dbo.Settings (
    [Key]   VARCHAR(50) NOT NULL PRIMARY KEY,
    [Value] VARCHAR(50) NOT NULL
);
GO

-- Utenti per il login (Sprint 6). PasswordHash = PBKDF2, mai in chiaro.
IF OBJECT_ID('dbo.Users') IS NULL
CREATE TABLE dbo.Users (
    Id           INT IDENTITY(1,1) PRIMARY KEY,
    Username     VARCHAR(50)  NOT NULL CONSTRAINT UQ_Users_Username UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role         VARCHAR(20)  NOT NULL CONSTRAINT CK_Users_Role
                 CHECK (Role IN ('Operator','Scheduler'))
);
GO
