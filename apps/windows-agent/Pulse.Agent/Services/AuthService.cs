using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Pulse.Core.Interfaces;
using Pulse.Core.Models;

namespace Pulse.Agent.Services;

public class AuthService
{
    private readonly IStorageService _storage;
    private readonly ISecureStorage _secureStorage;
    private readonly HttpClient _httpClient;

    public AuthService(IStorageService storage, ISecureStorage secureStorage, HttpClient? httpClient = null)
    {
        _storage = storage;
        _secureStorage = secureStorage;
        _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(20) };
    }

    public async Task<(bool Success, string Message)> SignInAndPairDeviceAsync(
        string supabaseUrl,
        string anonKey,
        string email,
        string password,
        string deviceName)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(supabaseUrl) || string.IsNullOrWhiteSpace(anonKey))
            {
                return (false, "Supabase URL and Anon Key are required.");
            }

            // 1. Authenticate with Supabase Auth
            var authUrl = $"{supabaseUrl.TrimEnd('/')}/auth/v1/token?grant_type=password";
            var authReq = new HttpRequestMessage(HttpMethod.Post, authUrl)
            {
                Content = JsonContent.Create(new { email, password })
            };
            authReq.Headers.Add("apikey", anonKey);

            var authRes = await _httpClient.SendAsync(authReq);
            if (!authRes.IsSuccessStatusCode)
            {
                var err = await authRes.Content.ReadAsStringAsync();
                return (false, $"Sign in failed: {authRes.StatusCode}");
            }

            var authJson = await authRes.Content.ReadFromJsonAsync<JsonElement>();
            string accessToken = authJson.GetProperty("access_token").GetString()!;
            string refreshToken = authJson.GetProperty("refresh_token").GetString()!;
            string userIdStr = authJson.GetProperty("user").GetProperty("id").GetString()!;
            Guid userId = Guid.Parse(userIdStr);

            // 2. Fetch or create device registration
            var existingDevice = await _storage.GetDeviceRegistrationAsync();
            Guid deviceId = existingDevice?.Id ?? Guid.NewGuid();

            var registration = new DeviceRegistration
            {
                Id = deviceId,
                UserId = userId,
                DeviceName = string.IsNullOrWhiteSpace(deviceName) ? (existingDevice?.DeviceName ?? "Personal Laptop") : deviceName,
                DeviceType = "desktop",
                Hostname = Environment.MachineName,
                OsVersion = Environment.OSVersion.VersionString,
                AgentVersion = "1.0.0",
                IsActive = true,
                RegisteredAtUtc = existingDevice?.RegisteredAtUtc ?? DateTime.UtcNow,
                LastSeenAtUtc = DateTime.UtcNow
            };

            // 3. Register device in Supabase devices table
            var deviceUpsertReq = new HttpRequestMessage(HttpMethod.Post, $"{supabaseUrl.TrimEnd('/')}/rest/v1/devices")
            {
                Content = JsonContent.Create(new
                {
                    id = registration.Id,
                    user_id = registration.UserId,
                    device_name = registration.DeviceName,
                    device_type = registration.DeviceType,
                    hostname = registration.Hostname,
                    os_version = registration.OsVersion,
                    agent_version = registration.AgentVersion,
                    is_active = true,
                    last_seen_at = registration.LastSeenAtUtc.ToString("O")
                })
            };
            deviceUpsertReq.Headers.Add("apikey", anonKey);
            deviceUpsertReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            deviceUpsertReq.Headers.Add("Prefer", "resolution=merge-duplicates,return=representation");

            var deviceRes = await _httpClient.SendAsync(deviceUpsertReq);
            if (!deviceRes.IsSuccessStatusCode)
            {
                var devErr = await deviceRes.Content.ReadAsStringAsync();
                return (false, $"Device pairing failed: {deviceRes.StatusCode} - {devErr}");
            }

            // 4. Save settings and encrypted tokens locally
            await _storage.SaveSettingAsync("supabase_url", supabaseUrl);
            await _storage.SaveSettingAsync("supabase_anon_key", anonKey);
            await _storage.SaveSettingAsync("auth_access_token", _secureStorage.Protect(accessToken));
            await _storage.SaveSettingAsync("auth_refresh_token", _secureStorage.Protect(refreshToken));
            await _storage.SaveSettingAsync("user_email", email);
            await _storage.SaveDeviceRegistrationAsync(registration);

            return (true, $"Device successfully paired as '{registration.DeviceName}'!");
        }
        catch (Exception ex)
        {
            return (false, $"Pairing exception: {ex.Message}");
        }
    }
}
