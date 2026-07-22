using System.Security.Cryptography;
using System.Text;

namespace BlueHarbor_QPD_WSA.Server.Services;

/// <summary>
/// Hashing delle password con PBKDF2 (salt casuale + 100k iterazioni).
/// Retro-compatibile: Verify riconosce anche il vecchio formato SHA-256
/// esadecimale, cosi' gli utenti esistenti migrano al primo login (rehash-on-login).
/// </summary>
public static class PasswordHasher
{
    private const int Iterations = 100_000;

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, 32);
        return $"PBKDF2${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string password, string storedHash)
    {
        if (!storedHash.Contains('$'))
        {
            // Formato precedente: SHA-256 esadecimale, senza salt.
            var legacy = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(password)));
            return string.Equals(legacy, storedHash, StringComparison.OrdinalIgnoreCase);
        }

        var parts = storedHash.Split('$');
        if (parts.Length != 4 || parts[0] != "PBKDF2" || !int.TryParse(parts[1], out var iterations))
            return false;

        var salt = Convert.FromBase64String(parts[2]);
        var expected = Convert.FromBase64String(parts[3]);
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    /// <summary>True se l'hash e' nel vecchio formato e va rigenerato al prossimo login.</summary>
    public static bool NeedsRehash(string storedHash) => !storedHash.Contains('$');
}
