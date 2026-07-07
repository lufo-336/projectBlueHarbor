using System.Security.Cryptography;
using System.Text;

namespace BlueHarbor_QPD_WSA.Server.Services;

/// <summary>
/// Hashing delle password. Usa SHA-256 (semplificazione DIDATTICA): in un'app reale
/// si userebbe un algoritmo con salt e costo, come bcrypt/PBKDF2 (ASP.NET Identity).
/// Qui serve solo a non salvare le password in chiaro nel database.
/// </summary>
public static class PasswordHasher
{
    // Calcola l'hash esadecimale di una password.
    public static string Hash(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes); // stringa esadecimale maiuscola (64 caratteri)
    }

    // Verifica una password confrontando il suo hash con quello salvato.
    public static bool Verify(string password, string storedHash)
        => string.Equals(Hash(password), storedHash, StringComparison.OrdinalIgnoreCase);
}
