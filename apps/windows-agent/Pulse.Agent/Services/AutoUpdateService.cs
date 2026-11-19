using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Pulse.Agent.Services;

public class UpdateInfo
{
    public string Version { get; set; } = "1.0.0";
    public string DownloadUrl { get; set; } = "";
    public string Notes { get; set; } = "";
    public bool Mandatory { get; set; } = false;
}

public class AutoUpdateService
{
    public const string CurrentVersion = "1.1.0";
    private const string VersionApiUrl = "https://pulse-tracker-theta.vercel.app/api/agent/version";
    private const string VersionFallbackUrl = "https://pulse-tracker-theta.vercel.app/downloads/version.json";

    private readonly HttpClient _httpClient;
    private readonly ILogger<AutoUpdateService>? _logger;
    private System.Threading.Timer? _checkTimer;
    private readonly SemaphoreSlim _updateLock = new(1, 1);

    public event Action<string>? OnUpdateStatusChanged;

    public AutoUpdateService(HttpClient? httpClient = null, ILogger<AutoUpdateService>? logger = null)
    {
        _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        _logger = logger;
    }

    public void StartBackgroundChecks(int initialDelaySeconds = 15, int intervalMinutes = 60)
    {
        _logger?.LogInformation("AutoUpdateService: Background check enabled. Initial delay: {Delay}s, Interval: {Interval}m", initialDelaySeconds, intervalMinutes);
        _checkTimer = new System.Threading.Timer(
            async _ => await CheckAndApplyUpdateAsync(silent: true),
            null,
            TimeSpan.FromSeconds(initialDelaySeconds),
            TimeSpan.FromMinutes(intervalMinutes));
    }

    public async Task<UpdateInfo?> CheckForUpdateAsync()
    {
        try
        {
            UpdateInfo? info = null;
            try
            {
                info = await _httpClient.GetFromJsonAsync<UpdateInfo>(VersionApiUrl);
            }
            catch (Exception ex)
            {
                _logger?.LogWarning("Primary version check failed, attempting fallback: {Msg}", ex.Message);
                info = await _httpClient.GetFromJsonAsync<UpdateInfo>(VersionFallbackUrl);
            }

            if (info == null || string.IsNullOrWhiteSpace(info.Version))
            {
                return null;
            }

            if (IsNewerVersion(info.Version, CurrentVersion))
            {
                _logger?.LogInformation("New version detected: {Remote} (Current: {Current})", info.Version, CurrentVersion);
                return info;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning("CheckForUpdateAsync error: {Msg}", ex.Message);
        }

        return null;
    }

    public async Task<bool> CheckAndApplyUpdateAsync(bool silent = true)
    {
        if (!await _updateLock.WaitAsync(100))
        {
            return false;
        }

        try
        {
            OnUpdateStatusChanged?.Invoke("Checking for updates...");
            var updateInfo = await CheckForUpdateAsync();

            if (updateInfo == null)
            {
                OnUpdateStatusChanged?.Invoke($"Project PULSE is up to date (v{CurrentVersion}).");
                return false;
            }

            OnUpdateStatusChanged?.Invoke($"New update found (v{updateInfo.Version}). Downloading...");
            return await DownloadAndApplyAsync(updateInfo);
        }
        finally
        {
            _updateLock.Release();
        }
    }

    private async Task<bool> DownloadAndApplyAsync(UpdateInfo updateInfo)
    {
        try
        {
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string updateDir = Path.Combine(localAppData, "ProjectPulse", "Updates");
            if (Directory.Exists(updateDir))
            {
                try { Directory.Delete(updateDir, recursive: true); } catch { }
            }
            Directory.CreateDirectory(updateDir);

            string zipPath = Path.Combine(updateDir, "Pulse-Agent-Update.zip");
            string extractDir = Path.Combine(updateDir, "extracted");

            // 1. Download
            using (var response = await _httpClient.GetAsync(updateInfo.DownloadUrl, HttpCompletionOption.ResponseHeadersRead))
            {
                response.EnsureSuccessStatusCode();
                using (var fs = new FileStream(zipPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    await response.Content.CopyToAsync(fs);
                }
            }

            // 2. Extract
            ZipFile.ExtractToDirectory(zipPath, extractDir, overwriteFiles: true);

            // 3. Prepare Batch Updater Script
            string appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            int currentPid = Environment.ProcessId;
            string batchPath = Path.Combine(updateDir, "apply_update.cmd");

            string batchContent = $@"@echo off
timeout /t 2 /nobreak >nul
taskkill /f /pid {currentPid} >nul 2>&1
timeout /t 1 /nobreak >nul
xcopy /s /y ""{extractDir}\*"" ""{appDir}\"" >nul
start """" ""{appDir}\Pulse.Agent.exe"" --minimized
exit
";
            File.WriteAllText(batchPath, batchContent);

            // 4. Launch updater script detached
            var psi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/c \"{batchPath}\"",
                CreateNoWindow = true,
                UseShellExecute = true,
                WindowStyle = ProcessWindowStyle.Hidden
            };

            Process.Start(psi);

            _logger?.LogInformation("Update launcher started. Exiting application to apply update...");
            Environment.Exit(0);
            return true;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to download and apply update");
            OnUpdateStatusChanged?.Invoke($"Update failed: {ex.Message}");
            return false;
        }
    }

    private static bool IsNewerVersion(string remoteVersion, string localVersion)
    {
        try
        {
            var remote = new Version(remoteVersion.TrimStart('v', 'V'));
            var local = new Version(localVersion.TrimStart('v', 'V'));
            return remote > local;
        }
        catch
        {
            return string.Compare(remoteVersion, localVersion, StringComparison.OrdinalIgnoreCase) > 0;
        }
    }
}
