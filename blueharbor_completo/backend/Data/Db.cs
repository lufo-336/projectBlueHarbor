// ═══ SPRINT 1 ═══
// Punto unico di creazione delle connessioni ADO.NET.
// Usato da TUTTI i servizi; la connection string arriva da appsettings.json
// e in Docker viene sovrascritta dalla variabile d'ambiente
// ConnectionStrings__DefaultConnection (Sprint 9).
using Microsoft.Data.SqlClient;

namespace BlueHarbor.Api.Data;

public class Db
{
    private readonly string _connectionString;

    public Db(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' mancante.");
    }

    // Ogni chiamata restituisce una connessione NUOVA: chi la usa la apre
    // e la chiude (pattern using). ADO.NET fa pooling da solo sotto il cofano.
    public SqlConnection CreateConnection() => new(_connectionString);
}
