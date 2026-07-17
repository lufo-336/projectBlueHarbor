-- ============================================================================
--  script6.sql — Evoluzione #1: Storico assegnazioni (audit trail)
--  Aggiunge la tabella append-only AssignmentHistory.
--  Incrementale e idempotente: eseguibile piu' volte senza errori.
--  NB: lo schema e' gestito con script SQL versionati (niente migrazioni EF);
--      questa modifica e' rispecchiata in BlueHarborContext.OnModelCreating.
-- ============================================================================
USE [BlueHarbor];
GO

IF OBJECT_ID(N'dbo.AssignmentHistory', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AssignmentHistory
    (
        Id                 INT           IDENTITY(1,1) NOT NULL,
        ShipId             INT           NOT NULL,              -- FK logica -> Ships (no cascade)
        ShipName           VARCHAR(100)  NOT NULL,              -- snapshot
        Size               VARCHAR(2)    NOT NULL,              -- snapshot
        BerthId            INT           NOT NULL,              -- FK logica -> Berths
        BerthName          VARCHAR(50)   NOT NULL,              -- snapshot
        OccupationStartDay INT           NOT NULL,
        OccupationEndDay   INT           NOT NULL,              -- = start + durata (fine esclusa)
        EventType          VARCHAR(10)   NOT NULL,
        EventDay           INT           NOT NULL,              -- giorno virtuale dell'evento
        CreatedAt          DATETIME2     NOT NULL
            CONSTRAINT DF_AssignmentHistory_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_AssignmentHistory PRIMARY KEY (Id),
        CONSTRAINT CK_AssignmentHistory_EventType
            CHECK (EventType IN ('Assigned','Departed'))
    );

    -- I filtri tipici (?shipId=&berthId=&eventType=) e l'ordinamento per data.
    CREATE INDEX IX_AssignmentHistory_ShipId    ON dbo.AssignmentHistory (ShipId);
    CREATE INDEX IX_AssignmentHistory_BerthId   ON dbo.AssignmentHistory (BerthId);
    CREATE INDEX IX_AssignmentHistory_CreatedAt ON dbo.AssignmentHistory (CreatedAt DESC);
END
GO
