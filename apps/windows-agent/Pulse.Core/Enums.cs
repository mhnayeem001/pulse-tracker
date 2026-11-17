namespace Pulse.Core;

public enum TrackingState
{
    Active = 0,
    Paused = 1,
    Stopped = 2
}

public enum SessionState
{
    Active = 0,
    Idle = 1,
    Locked = 2,
    Suspended = 3
}

public enum SyncStatus
{
    Pending = 0,
    Syncing = 1,
    Synced = 2,
    Failed = 3
}
