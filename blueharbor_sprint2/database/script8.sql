-- ============================================================================
--  script8.sql — Banchine in manutenzione
--  Crea BerthMaintenance: finestre di indisponibilita' di una banchina,
--  intervallo [StartDay, EndDay) con la stessa semantica delle occupazioni.
--  Incrementale e idempotente. Rispecchiato in BlueHarborContext.OnModelCreating.
-- ============================================================================
USE [BlueHarbor];
GO

IF OBJECT_ID('dbo.BerthMaintenance', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.BerthMaintenance (
        Id        INT IDENTITY(1,1) NOT NULL
                  CONSTRAINT PK_BerthMaintenance PRIMARY KEY,
        BerthId   INT NOT NULL,
        StartDay  INT NOT NULL,
        EndDay    INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL
                  CONSTRAINT DF_BerthMaintenance_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_BerthMaintenance_Berths FOREIGN KEY (BerthId)
                  REFERENCES dbo.Berths(Id),
        CONSTRAINT CK_BerthMaintenance_Days CHECK ([EndDay] > [StartDay])
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_BerthMaintenance_Berth_Start'
                 AND object_id = OBJECT_ID('dbo.BerthMaintenance'))
    CREATE INDEX IX_BerthMaintenance_Berth_Start
        ON dbo.BerthMaintenance (BerthId, StartDay);
GO
