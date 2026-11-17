using Pulse.Core.Models;

namespace Pulse.Core.Interfaces;

public interface IActivityAggregator : IDisposable
{
    event Action<ActivitySummary>? OnSummaryReady;

    void RecordMouse(RawMouseEvent e);
    void RecordKeyboard(RawKeyboardEvent e);
    void UpdateIdleState(bool isIdle);
    ActivitySummary FlushCurrentBucket();
    ActivitySummary GetCurrentLiveBucket();
}
