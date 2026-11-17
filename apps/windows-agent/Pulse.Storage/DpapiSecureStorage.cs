using System.Security.Cryptography;
using System.Text;
using Pulse.Core.Interfaces;

namespace Pulse.Storage;

public class DpapiSecureStorage : ISecureStorage
{
    private static readonly byte[] Entropy = Encoding.UTF8.GetBytes("ProjectPulse_WindowsAgent_v1");

    public string Protect(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return string.Empty;

        byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
        byte[] cipherBytes = ProtectedData.Protect(plainBytes, Entropy, DataProtectionScope.CurrentUser);
        return Convert.ToBase64String(cipherBytes);
    }

    public string? Unprotect(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return null;

        try
        {
            byte[] cipherBytes = Convert.FromBase64String(cipherText);
            byte[] plainBytes = ProtectedData.Unprotect(cipherBytes, Entropy, DataProtectionScope.CurrentUser);
            return Encoding.UTF8.GetString(plainBytes);
        }
        catch
        {
            return null;
        }
    }
}
