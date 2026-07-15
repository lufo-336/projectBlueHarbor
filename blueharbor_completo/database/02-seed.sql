-- ═══ SPRINT 1 (+ utenti demo Sprint 6) ═══
-- Dati iniziali: le 8 banchine tassative (1 XL, 1 L, 2 M, 4 S) e il giorno 1.
-- Idempotente. Eseguire dopo 01-schema.sql e 03-history.sql.
USE BlueHarborCompleto;
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Berths)
BEGIN
    INSERT INTO dbo.Berths (Name, Size) VALUES
        ('Berth XL-1', 'XL'),
        ('Berth L-1',  'L'),
        ('Berth M-1',  'M'),
        ('Berth M-2',  'M'),
        ('Berth S-1',  'S'),
        ('Berth S-2',  'S'),
        ('Berth S-3',  'S'),
        ('Berth S-4',  'S');
END
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Settings WHERE [Key] = 'CurrentVirtualDay')
    INSERT INTO dbo.Settings ([Key], [Value]) VALUES ('CurrentVirtualDay', '1');
GO
-- ═══ SPRINT 6 ═══ Utenti demo (credenziali nella documentazione del progetto).
-- Gli hash sono PBKDF2 (100000.salt.hash in Base64): la password in chiaro
-- NON compare mai in questo script.
IF NOT EXISTS (SELECT 1 FROM dbo.Users)
BEGIN
    INSERT INTO dbo.Users (Username, PasswordHash, Role) VALUES
        ('operator',  '100000.yzzr4HJj46drn0hzk4+Lgg==.hgrwKwSegFhs2qVCwVOgqxTrk2xIHED46t0EqZC0zU0=',  'Operator'),
        ('scheduler', '100000.huec60AToapiTKWHy7Jrvw==.pDRreAnxMapM4QX1imSdozj8i9H4WLHqwk9olGZP0KY=', 'Scheduler');
END
GO
