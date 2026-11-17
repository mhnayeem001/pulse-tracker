using Pulse.Storage;
using Xunit;

namespace Pulse.Tests;

public class DpapiSecurityTests
{
    [Fact]
    public void ProtectAndUnprotect_ShouldMatchOriginalPlainText()
    {
        var secureStorage = new DpapiSecureStorage();
        string secretToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_test_payload_12345";

        string cipherText = secureStorage.Protect(secretToken);

        Assert.NotEmpty(cipherText);
        Assert.NotEqual(secretToken, cipherText);

        string? decrypted = secureStorage.Unprotect(cipherText);

        Assert.Equal(secretToken, decrypted);
    }

    [Fact]
    public void Protect_EmptyString_ShouldReturnEmpty()
    {
        var secureStorage = new DpapiSecureStorage();
        Assert.Equal(string.Empty, secureStorage.Protect(""));
        Assert.Null(secureStorage.Unprotect(""));
    }
}
