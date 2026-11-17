using Pulse.Collector;
using Pulse.Core.Models;
using Xunit;

namespace Pulse.Tests;

public class ActivityAggregationTests
{
    [Fact]
    public void RecordMouse_ShouldAccumulateAllClickTypes()
    {
        var deviceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        using var aggregator = new ActivityAggregator(deviceId, userId);

        // 5 left clicks
        for (int i = 0; i < 5; i++)
        {
            aggregator.RecordMouse(new RawMouseEvent { LeftButtonDown = true });
        }

        // 3 right clicks
        for (int i = 0; i < 3; i++)
        {
            aggregator.RecordMouse(new RawMouseEvent { RightButtonDown = true });
        }

        // 2 middle clicks
        for (int i = 0; i < 2; i++)
        {
            aggregator.RecordMouse(new RawMouseEvent { MiddleButtonDown = true });
        }

        // 1 X1 click, 4 X2 clicks
        aggregator.RecordMouse(new RawMouseEvent { X1ButtonDown = true });
        for (int i = 0; i < 4; i++)
        {
            aggregator.RecordMouse(new RawMouseEvent { X2ButtonDown = true });
        }

        var bucket = aggregator.GetCurrentLiveBucket();

        Assert.Equal(5, bucket.LeftClicks);
        Assert.Equal(3, bucket.RightClicks);
        Assert.Equal(2, bucket.MiddleClicks);
        Assert.Equal(1, bucket.X1Clicks);
        Assert.Equal(4, bucket.X2Clicks);
        Assert.Equal(15, bucket.TotalClicks);
    }

    [Fact]
    public void RecordKeyboard_ShouldCountOnlyKeyDownEvents()
    {
        var deviceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        using var aggregator = new ActivityAggregator(deviceId, userId);

        // 10 key down presses
        for (int i = 0; i < 10; i++)
        {
            aggregator.RecordKeyboard(new RawKeyboardEvent { IsKeyDown = true, IsRepeat = false });
        }

        // 5 repeated keys
        for (int i = 0; i < 5; i++)
        {
            aggregator.RecordKeyboard(new RawKeyboardEvent { IsKeyDown = true, IsRepeat = true });
        }

        var bucket = aggregator.GetCurrentLiveBucket();

        Assert.Equal(15, bucket.KeyboardPresses);
    }

    [Fact]
    public void RecordScrollAndMovement_ShouldAccumulateDeltaAndDistance()
    {
        var deviceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        using var aggregator = new ActivityAggregator(deviceId, userId);

        aggregator.RecordMouse(new RawMouseEvent
        {
            WheelDeltaVertical = 120,
            WheelDeltaHorizontal = 60,
            HasMovement = true,
            Distance = 50.0
        });

        aggregator.RecordMouse(new RawMouseEvent
        {
            WheelDeltaVertical = -120,
            WheelDeltaHorizontal = 0,
            HasMovement = true,
            Distance = 25.5
        });

        var bucket = aggregator.GetCurrentLiveBucket();

        Assert.Equal(0, bucket.VerticalScroll); // 120 + (-120) = 0
        Assert.Equal(60, bucket.HorizontalScroll);
        Assert.Equal(2, bucket.MouseMovementEvents);
        Assert.Equal(75.5, bucket.MouseDistance);
    }

    [Fact]
    public void FlushCurrentBucket_ShouldResetCountsForNextWindow()
    {
        var deviceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        using var aggregator = new ActivityAggregator(deviceId, userId);

        aggregator.RecordMouse(new RawMouseEvent { LeftButtonDown = true });
        aggregator.RecordKeyboard(new RawKeyboardEvent { IsKeyDown = true });

        var flushed = aggregator.FlushCurrentBucket();

        Assert.Equal(1, flushed.LeftClicks);
        Assert.Equal(1, flushed.KeyboardPresses);

        // Next live bucket should be freshly reset
        var nextLive = aggregator.GetCurrentLiveBucket();
        Assert.Equal(0, nextLive.LeftClicks);
        Assert.Equal(0, nextLive.KeyboardPresses);
    }
}
