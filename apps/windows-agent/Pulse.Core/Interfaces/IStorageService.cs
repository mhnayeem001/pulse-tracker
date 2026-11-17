using Pulse.Core.Models;

namespace Pulse.Core.Interfaces;

public interface IStorageService : IDisposable
{
    Task InitializeAsync();
    Task SaveSummaryAsync(ActivitySummary summary);
    Task<List<ActivitySummary>> GetPendingSyncSummariesAsync(int limit = 100);
    Task MarkSummariesSyncedAsync(IEnumerable<string> summaryIds);
    Task<ActivitySummary> GetTodayTotalsAsync();
    Task<DeviceRegistration?> GetDeviceRegistrationAsync();
    Task SaveDeviceRegistrationAsync(DeviceRegistration device);
    Task<string?> GetSettingAsync(string key, string? defaultValue = null);
    Task SaveSettingAsync(string key, string value);
    Task PruneOldDataAsync(int retentionDays);
    Task LogAsync(string level, string message, string? exception = null);
}
