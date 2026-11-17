namespace Pulse.Core.Interfaces;

public interface ISyncService : IDisposable
{
    event Action<bool, string>? OnSyncStatusChanged;

    bool IsSyncing { get; }
    DateTime? LastSyncTimeUtc { get; }
    int PendingRecordsCount { get; }
    bool IsOnline { get; }

    void Start();
    void Stop();
    Task<bool> ForceSyncNowAsync();
}
