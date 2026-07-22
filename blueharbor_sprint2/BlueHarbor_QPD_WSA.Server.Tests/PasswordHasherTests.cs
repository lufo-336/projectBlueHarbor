using System.Security.Cryptography;
using System.Text;
using BlueHarbor_QPD_WSA.Server.Services;

namespace BlueHarbor_QPD_WSA.Server.Tests;

public class PasswordHasherTests
{
    [Fact]
    public void Hash_ProducesPbkdf2Format()
    {
        var hash = PasswordHasher.Hash("admin123");
        Assert.StartsWith("PBKDF2$", hash);
        Assert.Equal(4, hash.Split('$').Length);
    }

    [Fact]
    public void Hash_SamePasswordTwice_DifferentResults_BecauseOfSalt()
    {
        Assert.NotEqual(PasswordHasher.Hash("admin123"), PasswordHasher.Hash("admin123"));
    }

    [Fact]
    public void Verify_CorrectPassword_ReturnsTrue()
    {
        var hash = PasswordHasher.Hash("admin123");
        Assert.True(PasswordHasher.Verify("admin123", hash));
    }

    [Fact]
    public void Verify_WrongPassword_ReturnsFalse()
    {
        var hash = PasswordHasher.Hash("admin123");
        Assert.False(PasswordHasher.Verify("admin124", hash));
    }

    [Fact]
    public void Verify_LegacySha256Hash_StillWorks()
    {
        // Hash nel formato precedente: SHA-256 esadecimale (com'e' salvato nei DB esistenti).
        var legacy = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("admin123")));
        Assert.True(PasswordHasher.Verify("admin123", legacy));
        Assert.False(PasswordHasher.Verify("sbagliata", legacy));
    }

    [Fact]
    public void NeedsRehash_TrueForLegacy_FalseForPbkdf2()
    {
        var legacy = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("x")));
        Assert.True(PasswordHasher.NeedsRehash(legacy));
        Assert.False(PasswordHasher.NeedsRehash(PasswordHasher.Hash("x")));
    }
}
