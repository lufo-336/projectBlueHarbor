-- ============================================================================
--  script7.sql — Evoluzione #8: ruolo Admin di piattaforma
--  1) CK_Users_Role ammette anche 'Admin'
--  2) nuova colonna Users.IsActive (BIT NOT NULL DEFAULT 1)
--  3) seed dell'admin iniziale per i DB gia' popolati (Program.cs lo crea solo
--     su DB vuoto)
--  Incrementale e idempotente. Rispecchiato in BlueHarborContext.OnModelCreating.
-- ============================================================================
USE [BlueHarbor];
GO

-- 1) CHECK sul ruolo: ricreo il vincolo includendo 'Admin'.
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Users_Role')
    ALTER TABLE dbo.Users DROP CONSTRAINT CK_Users_Role;
GO
ALTER TABLE dbo.Users
    ADD CONSTRAINT CK_Users_Role CHECK ([Role] IN ('Scheduler','Operator','Admin'));
GO

-- 2) Colonna IsActive: utente disattivato = non puo' loggarsi.
IF COL_LENGTH('dbo.Users', 'IsActive') IS NULL
    ALTER TABLE dbo.Users
        ADD IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1);
GO

-- 3) Admin iniziale (solo se non esiste gia'). L'hash e' SHA-256 esadecimale
--    maiuscolo, come PasswordHasher.Hash: HASHBYTES + CONVERT stile 2.
--    NB: 'admin123' come VARCHAR (non N'...') per usare gli stessi byte ASCII.
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Username = 'admin@blueharbor')
    INSERT INTO dbo.Users (Username, PasswordHash, Role, IsActive)
    VALUES ('admin@blueharbor',
            CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', 'admin123'), 2),
            'Admin', 1);
GO
