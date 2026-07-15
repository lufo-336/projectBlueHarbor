-- ═══ SPRINT 8 ═══
-- Storico append-only delle assegnazioni: registra eventi già decisi
-- (assegnazione dello Scheduler, partenza al Next Day). MAI UPDATE/DELETE
-- da parte dell'applicazione. Eseguire dopo 01-schema.sql.
USE BlueHarborCompleto;
GO
IF OBJECT_ID('dbo.AssignmentHistory') IS NULL
CREATE TABLE dbo.AssignmentHistory (
    Id                 INT IDENTITY(1,1) PRIMARY KEY,
    ShipId             INT NOT NULL CONSTRAINT FK_History_Ships  REFERENCES dbo.Ships(Id),
    BerthId            INT NOT NULL CONSTRAINT FK_History_Berths REFERENCES dbo.Berths(Id),
    OccupationStartDay INT NOT NULL,
    OccupationEndDay   INT NOT NULL,
    EventType          VARCHAR(10) NOT NULL CONSTRAINT CK_History_EventType
                       CHECK (EventType IN ('Assigned','Departed')),
    -- Timestamp reale (non giorno virtuale): audit tecnico di QUANDO è successo davvero.
    RecordedAt         DATETIME2 NOT NULL CONSTRAINT DF_History_RecordedAt DEFAULT SYSUTCDATETIME()
);
GO
