using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.NetworkInformation;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Pulse.Core.Interfaces;
using Pulse.Core.Models;

namespace Pulse.Sync;

public class SupabaseSyncService : ISyncService
{
    private readonly IStorageService _storage;
    private readonly ISecureStorage _secureStorage;
    private readonly ILogger<SupabaseSyncService>? _logger;
    private readonly HttpClient _httpClient;

    private System.Threading.Timer? _syncTimer;
    private readonly SemaphoreSlim _syncLock = new(1, 1);
    private bool _isSyncing;
    private DateTime? _lastSyncTimeUtc;
    private int _pendingRecordsCount;
    private bool _isOnline;
    private int _currentBackoffSeconds = 60;
    private const int BaseIntervalSeconds = 60;
    private const int MaxBackoffSeconds = 300;

    public event Action<bool, string>? OnSyncStatusChanged;

    public bool IsSyncing => _isSyncing;
    public DateTime? LastSyncTimeUtc => _lastSyncTimeUtc;
    public int PendingRecordsCount => _pendingRecordsCount;
    public bool IsOnline => _isOnline;

    public SupabaseSyncService(
        IStorageService storage,
        ISecureStorage secureStorage,
        HttpClient? httpClient = null,
        ILogger<SupabaseSyncService>? logger = null)
    {
        _storage = storage;
        _secureStorage = secureStorage;
        _logger = logger;
        _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    public void Start()
    {
        _logger?.LogInformation("Supabase Sync Service starting with base interval {Interval}s", BaseIntervalSeconds);
        ScheduleNextSync(5); // Initial sync after 5s
    }

    public void Stop()
    {
        _syncTimer?.Change(Timeout.Infinite, Timeout.Infinite);
        _logger?.LogInformation("Supabase Sync Service stopped");
    }

    private void ScheduleNextSync(int seconds)
    {
        _syncTimer?.Dispose();
        _syncTimer = new System.Threading.Timer(async _ => await ExecuteSyncAsync(), null, TimeSpan.FromSeconds(seconds), Timeout.InfiniteTimeSpan);
    }

    public async Task<bool> ForceSyncNowAsync()
    {
        return await ExecuteSyncAsync();
    }

    private async Task<bool> ExecuteSyncAsync()
    {
        if (!await _syncLock.WaitAsync(100))
        {
            return false; // Sync already in progress
        }

        _isSyncing = true;
        try
        {
            var device = await _storage.GetDeviceRegistrationAsync();
            if (device == null || !device.IsActive)
            {
                OnSyncStatusChanged?.Invoke(false, "Device not registered or inactive");
                ScheduleNextSync(BaseIntervalSeconds);
                return false;
            }

            // Check network availability
            _isOnline = NetworkInterface.GetIsNetworkAvailable();
            if (!_isOnline)
            {
                OnSyncStatusChanged?.Invoke(false, "No internet connection");
                ApplyBackoff();
                return false;
            }

            var supabaseUrl = await _storage.GetSettingAsync("supabase_url");
            var anonKey = await _storage.GetSettingAsync("supabase_anon_key");
            var encryptedToken = await _storage.GetSettingAsync("auth_access_token");
            var accessToken = _secureStorage.Unprotect(encryptedToken ?? "");

            if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(anonKey) || string.IsNullOrEmpty(accessToken))
            {
                OnSyncStatusChanged?.Invoke(false, "Cloud credentials missing or device not paired");
                ScheduleNextSync(BaseIntervalSeconds);
                return false;
            }

            // Fetch pending records
            var pending = await _storage.GetPendingSyncSummariesAsync(limit: 100);
            _pendingRecordsCount = pending.Count;

            if (pending.Count == 0)
            {
                // Send heartbeat to update last_seen_at
                await SendHeartbeatAsync(supabaseUrl, anonKey, accessToken, device.Id);
                _lastSyncTimeUtc = DateTime.UtcNow;
                _currentBackoffSeconds = BaseIntervalSeconds;
                OnSyncStatusChanged?.Invoke(true, "All data synced");
                ScheduleNextSync(BaseIntervalSeconds);
                return true;
            }

            // Prepare RPC batch payload
            var batchUuid = Guid.NewGuid();
            var payload = new
            {
                p_batch_uuid = batchUuid,
                p_device_id = device.Id,
                p_records = pending.Select(p => new
                {
                    bucket_start = p.BucketStartUtc.ToString("O"),
                    bucket_end = p.BucketEndUtc.ToString("O"),
                    left_clicks = p.LeftClicks,
                    right_clicks = p.RightClicks,
                    middle_clicks = p.MiddleClicks,
                    x1_clicks = p.X1Clicks,
                    x2_clicks = p.X2Clicks,
                    keyboard_presses = p.KeyboardPresses,
                    vertical_scroll = p.VerticalScroll,
                    horizontal_scroll = p.HorizontalScroll,
                    mouse_movement_events = p.MouseMovementEvents,
                    mouse_distance = p.MouseDistance,
                    active_seconds = p.ActiveSeconds,
                    idle_seconds = p.IdleSeconds,
                    session_id = p.SessionId
                }).ToList()
            };

            var request = new HttpRequestMessage(HttpMethod.Post, $"{supabaseUrl.TrimEnd('/')}/rest/v1/rpc/ingest_activity_batch")
            {
                Content = JsonContent.Create(payload)
            };
            request.Headers.Add("apikey", anonKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                // Attempt token refresh
                bool refreshed = await TryRefreshTokenAsync(supabaseUrl, anonKey);
                if (refreshed)
                {
                    // Retry immediately with new token
                    ScheduleNextSync(2);
                    return false;
                }

                OnSyncStatusChanged?.Invoke(false, "Authentication expired. Please sign in again.");
                ApplyBackoff();
                return false;
            }

            if (response.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                // Device may be revoked
                device.IsActive = false;
                device.RevokedAtUtc = DateTime.UtcNow;
                await _storage.SaveDeviceRegistrationAsync(device);
                OnSyncStatusChanged?.Invoke(false, "Device has been revoked in cloud console.");
                Stop();
                return false;
            }

            if (!response.IsSuccessStatusCode)
            {
                var errContent = await response.Content.ReadAsStringAsync();
                _logger?.LogWarning("Sync batch failed with HTTP {Status}: {Error}", response.StatusCode, errContent);
                OnSyncStatusChanged?.Invoke(false, $"Sync error: HTTP {(int)response.StatusCode}");
                ApplyBackoff();
                return false;
            }

            // Success! Mark local records as synced
            var ids = pending.Select(x => x.Id).ToList();
            await _storage.MarkSummariesSyncedAsync(ids);

            // Update device last sync in local db
            device.LastSyncAtUtc = DateTime.UtcNow;
            device.LastSeenAtUtc = DateTime.UtcNow;
            await _storage.SaveDeviceRegistrationAsync(device);

            _lastSyncTimeUtc = DateTime.UtcNow;
            _pendingRecordsCount = (await _storage.GetPendingSyncSummariesAsync(1)).Count;
            _currentBackoffSeconds = BaseIntervalSeconds;

            _logger?.LogInformation("Successfully synced batch {BatchId} with {Count} records", batchUuid, pending.Count);
            OnSyncStatusChanged?.Invoke(true, $"Synced {pending.Count} records");

            ScheduleNextSync(BaseIntervalSeconds);
            return true;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Unexpected error during cloud synchronization");
            OnSyncStatusChanged?.Invoke(false, "Sync failed: " + ex.Message);
            ApplyBackoff();
            return false;
        }
        finally
        {
            _isSyncing = false;
            _syncLock.Release();
        }
    }

    private void ApplyBackoff()
    {
        _currentBackoffSeconds = Math.Min(MaxBackoffSeconds, _currentBackoffSeconds * 2);
        _logger?.LogInformation("Backing off sync retry. Next attempt in {Seconds}s", _currentBackoffSeconds);
        ScheduleNextSync(_currentBackoffSeconds);
    }

    private async Task<bool> TryRefreshTokenAsync(string supabaseUrl, string anonKey)
    {
        try
        {
            var encRefresh = await _storage.GetSettingAsync("auth_refresh_token");
            var refreshToken = _secureStorage.Unprotect(encRefresh ?? "");
            if (string.IsNullOrEmpty(refreshToken)) return false;

            var req = new HttpRequestMessage(HttpMethod.Post, $"{supabaseUrl.TrimEnd('/')}/auth/v1/token?grant_type=refresh_token")
            {
                Content = JsonContent.Create(new { refresh_token = refreshToken })
            };
            req.Headers.Add("apikey", anonKey);

            var res = await _httpClient.SendAsync(req);
            if (!res.IsSuccessStatusCode) return false;

            var json = await res.Content.ReadFromJsonAsync<JsonElement>();
            if (json.TryGetProperty("access_token", out var newAccess) &&
                json.TryGetProperty("refresh_token", out var newRefresh))
            {
                await _storage.SaveSettingAsync("auth_access_token", _secureStorage.Protect(newAccess.GetString()!));
                await _storage.SaveSettingAsync("auth_refresh_token", _secureStorage.Protect(newRefresh.GetString()!));
                _logger?.LogInformation("Auth token refreshed successfully");
                return true;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to refresh auth token");
        }
        return false;
    }

    private async Task SendHeartbeatAsync(string supabaseUrl, string anonKey, string accessToken, Guid deviceId)
    {
        try
        {
            var req = new HttpRequestMessage(HttpMethod.Patch, $"{supabaseUrl.TrimEnd('/')}/rest/v1/devices?id=eq.{deviceId}")
            {
                Content = JsonContent.Create(new { last_seen_at = DateTime.UtcNow.ToString("O") })
            };
            req.Headers.Add("apikey", anonKey);
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            req.Headers.Add("Prefer", "return=minimal");

            await _httpClient.SendAsync(req);
        }
        catch
        {
            // Best effort heartbeat
        }
    }

    public void Dispose()
    {
        _syncTimer?.Dispose();
        _syncLock.Dispose();
        GC.SuppressFinalize(this);
    }
}
