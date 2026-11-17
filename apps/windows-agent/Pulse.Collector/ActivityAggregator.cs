using Microsoft.Extensions.Logging;
using Pulse.Core.Interfaces;
using Pulse.Core.Models;

namespace Pulse.Collector;

public class ActivityAggregator : IActivityAggregator
{
    private readonly ILogger<ActivityAggregator>? _logger;
    private readonly System.Threading.Timer _flushTimer;
    private readonly object _lock = new();

    private Guid _deviceId;
    private Guid _userId;
    private string _sessionId = Guid.NewGuid().ToString("N");
    private bool _isIdle;

    private DateTime _currentBucketStartUtc;
    private int _leftClicks;
    private int _rightClicks;
    private int _middleClicks;
    private int _x1Clicks;
    private int _x2Clicks;
    private int _keyboardPresses;
    private int _verticalScroll;
    private int _horizontalScroll;
    private int _mouseMoveEvents;
    private double _mouseDistance;
    private int _activeSeconds;
    private int _idleSeconds;

    public event Action<ActivitySummary>? OnSummaryReady;

    public ActivityAggregator(Guid deviceId, Guid userId, ILogger<ActivityAggregator>? logger = null)
    {
        _deviceId = deviceId;
        _userId = userId;
        _logger = logger;

        _currentBucketStartUtc = QuantizeToMinute(DateTime.UtcNow);
        // Ticks every second to accumulate active/idle seconds
        _flushTimer = new System.Threading.Timer(OnSecondTick, null, 1000, 1000);
    }

    public void UpdateIdentity(Guid deviceId, Guid userId)
    {
        lock (_lock)
        {
            _deviceId = deviceId;
            _userId = userId;
        }
    }

    public void SetSessionId(string sessionId)
    {
        lock (_lock)
        {
            _sessionId = sessionId;
        }
    }

    public void UpdateIdleState(bool isIdle)
    {
        lock (_lock)
        {
            _isIdle = isIdle;
        }
    }

    public void RecordMouse(RawMouseEvent e)
    {
        lock (_lock)
        {
            if (e.LeftButtonDown) _leftClicks++;
            if (e.RightButtonDown) _rightClicks++;
            if (e.MiddleButtonDown) _middleClicks++;
            if (e.X1ButtonDown) _x1Clicks++;
            if (e.X2ButtonDown) _x2Clicks++;

            _verticalScroll += e.WheelDeltaVertical;
            _horizontalScroll += e.WheelDeltaHorizontal;

            if (e.HasMovement)
            {
                _mouseMoveEvents++;
                _mouseDistance += e.Distance;
            }
        }
    }

    public void RecordKeyboard(RawKeyboardEvent e)
    {
        lock (_lock)
        {
            if (e.IsKeyDown)
            {
                _keyboardPresses++;
            }
        }
    }

    private void OnSecondTick(object? state)
    {
        try
        {
            ActivitySummary? summaryToEmit = null;

            lock (_lock)
            {
                var now = DateTime.UtcNow;

                // Accumulate second into active or idle
                if (_isIdle)
                {
                    _idleSeconds++;
                }
                else
                {
                    _activeSeconds++;
                }

                // If bucket has reached or exceeded 60 seconds (or current minute boundary passed)
                var currentMinute = QuantizeToMinute(now);
                if (currentMinute > _currentBucketStartUtc || (_activeSeconds + _idleSeconds) >= 60)
                {
                    summaryToEmit = CreateAndResetSummary(now);
                }
            }

            if (summaryToEmit != null)
            {
                OnSummaryReady?.Invoke(summaryToEmit);
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error during aggregator second tick");
        }
    }

    public ActivitySummary FlushCurrentBucket()
    {
        ActivitySummary summary;
        lock (_lock)
        {
            summary = CreateAndResetSummary(DateTime.UtcNow);
        }

        OnSummaryReady?.Invoke(summary);
        return summary;
    }

    public ActivitySummary GetCurrentLiveBucket()
    {
        lock (_lock)
        {
            var now = DateTime.UtcNow;
            return new ActivitySummary
            {
                Id = Guid.NewGuid().ToString(),
                DeviceId = _deviceId,
                UserId = _userId,
                BucketStartUtc = _currentBucketStartUtc,
                BucketEndUtc = now,
                LeftClicks = _leftClicks,
                RightClicks = _rightClicks,
                MiddleClicks = _middleClicks,
                X1Clicks = _x1Clicks,
                X2Clicks = _x2Clicks,
                KeyboardPresses = _keyboardPresses,
                VerticalScroll = _verticalScroll,
                HorizontalScroll = _horizontalScroll,
                MouseMovementEvents = _mouseMoveEvents,
                MouseDistance = _mouseDistance,
                ActiveSeconds = _activeSeconds,
                IdleSeconds = _idleSeconds,
                SessionId = _sessionId,
                CreatedAtUtc = now
            };
        }
    }

    private ActivitySummary CreateAndResetSummary(DateTime now)
    {
        var bucketEnd = _currentBucketStartUtc.AddMinutes(1);
        if (now < bucketEnd)
        {
            bucketEnd = now;
        }

        var summary = new ActivitySummary
        {
            Id = Guid.NewGuid().ToString(),
            DeviceId = _deviceId,
            UserId = _userId,
            BucketStartUtc = _currentBucketStartUtc,
            BucketEndUtc = bucketEnd,
            LeftClicks = _leftClicks,
            RightClicks = _rightClicks,
            MiddleClicks = _middleClicks,
            X1Clicks = _x1Clicks,
            X2Clicks = _x2Clicks,
            KeyboardPresses = _keyboardPresses,
            VerticalScroll = _verticalScroll,
            HorizontalScroll = _horizontalScroll,
            MouseMovementEvents = _mouseMoveEvents,
            MouseDistance = _mouseDistance,
            ActiveSeconds = Math.Min(60, _activeSeconds),
            IdleSeconds = Math.Min(60, _idleSeconds),
            SessionId = _sessionId,
            CreatedAtUtc = now,
            IsSynced = false
        };

        // Reset for new bucket
        _currentBucketStartUtc = QuantizeToMinute(now);
        _leftClicks = 0;
        _rightClicks = 0;
        _middleClicks = 0;
        _x1Clicks = 0;
        _x2Clicks = 0;
        _keyboardPresses = 0;
        _verticalScroll = 0;
        _horizontalScroll = 0;
        _mouseMoveEvents = 0;
        _mouseDistance = 0.0;
        _activeSeconds = 0;
        _idleSeconds = 0;

        return summary;
    }

    private static DateTime QuantizeToMinute(DateTime dt)
    {
        return new DateTime(dt.Year, dt.Month, dt.Day, dt.Hour, dt.Minute, 0, DateTimeKind.Utc);
    }

    public void Dispose()
    {
        _flushTimer.Dispose();
        GC.SuppressFinalize(this);
    }
}
