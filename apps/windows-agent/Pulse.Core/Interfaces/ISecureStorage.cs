namespace Pulse.Core.Interfaces;

public interface ISecureStorage
{
    string Protect(string plainText);
    string? Unprotect(string cipherText);
}
