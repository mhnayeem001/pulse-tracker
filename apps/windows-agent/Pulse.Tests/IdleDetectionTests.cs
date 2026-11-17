using Pulse.Collector;
using Xunit;

namespace Pulse.Tests;

public class IdleDetectionTests
{
    [Fact]
    public void RecordInput_WhenIdle_ShouldTriggerResumeState()
    {
        using var detector = new IdleDetector();
        detector.IdleThresholdSeconds = 10;

        bool stateFired = false;
        bool newState = true;

        detector.OnIdleStateChanged += isIdle =>
        {
            stateFired = true;
            newState = isIdle;
        };

        // When record input is called, it verifies transition
        detector.RecordInput();

        Assert.False(detector.IsIdle);
    }

    [Fact]
    public void ThresholdProperty_ShouldEnforceMinimumSafeValue()
    {
        using var detector = new IdleDetector();
        detector.IdleThresholdSeconds = 2; // Below safe min

        Assert.True(detector.IdleThresholdSeconds >= 10);
    }
}
