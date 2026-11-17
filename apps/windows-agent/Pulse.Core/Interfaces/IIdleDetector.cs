namespace Pulse.Core.Interfaces;

public interface IIdleDetector : IDisposable
{
    event Action<bool>? OnIdleStateChanged;

    bool IsIdle { get; }
    int IdleThresholdSeconds { get; set; }
    TimeSpan GetIdleDuration();
    DateTime LastInputUtc { get; }
    void RecordInput();
}
