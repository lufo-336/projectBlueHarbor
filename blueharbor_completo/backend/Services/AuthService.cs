// ═══ SPRINT 6 ═══
// Hashing e verifica password con PBKDF2 NATIVO di .NET (Rfc2898DeriveBytes):
// niente pacchetti esterni, come studiato nel modulo Sicurezza (mai MD5/SHA1
// semplici, mai password in chiaro). Formato salvato: "iterazioni.salt.hash"
// (entrambi Base64), così la verifica è autodescrittiva.
using System.Security.Cryptography;
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Models;
using Microsoft.Data.SqlClient;

namespace BlueHarbor.Api.Services;

public class AuthService
{
    private const int Iterations = 100_000;  // rallenta il brute force
    private const int SaltSize = 16;         // 128 bit di salt casuale
    private const int HashSize = 32;         // 256 bit di hash

    private readonly Db _db;

    public AuthService(Db db) => _db = db;

    // Hash "finto" a formato valido, calcolato una sola volta all'avvio: usato dal
    // controller quando l'utente non esiste, cosi' VerifyPassword gira comunque
    // le sue ~100000 iterazioni ed evita un timing attack per enumerare gli username.
    public static readonly string DummyHashForTimingSafety = HashPassword("dummy-password-for-timing-safety");

    public static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, Iterations, HashAlgorithmName.SHA256, HashSize);
        return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string password, string stored)
    {
        var parts = stored.Split('.');
        if (parts.Length != 3) return false;
        var iterations = int.Parse(parts[0]);
        var salt = Convert.FromBase64String(parts[1]);
        var expected = Convert.FromBase64String(parts[2]);
        var actual = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
        // Confronto a tempo costante: evita i timing attack (modulo Sicurezza).
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    public async Task<User?> FindByUsernameAsync(string username)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        using var cmd = new SqlCommand(
            "SELECT Id, Username, PasswordHash, Role FROM Users WHERE Username = @username", conn);
        cmd.Parameters.AddWithValue("@username", username);
        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return new User
        {
            Id = (int)reader["Id"],
            Username = (string)reader["Username"],
            PasswordHash = (string)reader["PasswordHash"],
            Role = (string)reader["Role"]
        };
    }
}
