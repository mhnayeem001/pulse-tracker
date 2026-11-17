using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;
using Pulse.Collector.Native;
using Pulse.Core.Interfaces;

namespace Pulse.Collector;

public class IdleDetector : IIdleDetector
{
    private readonly ILogger<IdleDetector>? _logger;
    private readonly System.Threading.Timer _timer;
    private bool _isIdle;
    private int _idleThresholdSeconds = 300;
    private DateTime _lastInputUtc = DateTime.UtcNow;
    private readonly object _lock = new();

    public event Action<bool>? OnIdleStateChanged;

    public bool IsIdle
    {
        get
        {
            lock (_lock) return _isIdle;
        }
        private set
        {
            lock (_lock) _isIdle = value;
        }
    }

    public int IdleThresholdSeconds
    {
        get => _idleThresholdSeconds;
        set => _idleThresholdSeconds = Math.Max(10, value);
    }

    public DateTime LastInputUtc
    {
        get
        {
            lock (_lock) return _lastInputUtc;
        }
        private set
        {
            lock (_lock) _lastInputUtc = value;
        }
    }

    public IdleDetector(ILogger<IdleDetector>? logger = null)
    {
        _logger = logger;
        _timer = new System.Threading.Timer(CheckIdleState, null, 1000, 1000);
    }

    public void RecordInput()
    {
        bool wasIdle;
        lock (_lock)
        {
            _lastInputUtc = DateTime.UtcNow;
            wasIdle = _isIdle;
            if (wasIdle)
            {
                _isIdle = false;
            }
        }

        if (wasIdle)
        {
            _logger?.LogInformation("User resumed active state from idle at {TimeUtc}", DateTime.UtcNow);
            OnIdleStateChanged?.Invoke(false);
        }
    }

    public TimeSpan GetIdleDuration()
    {
        var lii = new Win32Api.LASTINPUTINFO();
        lii.cbSize = (uint)Marshal.SizeOf<Win32Api.LASTINPUTINFO>();

        if (Win32Api.GetLastInputInfo(ref lii))
        {
            uint currentTick = (uint)Environment.TickCount;
            uint idleTicks = currentTick - lii.dwTime;
            return TimeSpan.FromMilliseconds(idleTicks);
        }

        // Fallback to internal tracker
        lock (_lock)
        {
            return DateTime.UtcNow - _lastInputUtc;
        }
    }

    private void CheckIdleState(object? state)
    {
        try
        {
            var idleDuration = GetIdleDuration();
            bool shouldBeIdle = idleDuration.TotalSeconds >= IdleThresholdSeconds;

            bool stateChanged = false;
            lock (_lock)
            {
                if (shouldBeIdle != _isIdle)
                {
                    _isIdle = shouldBeIdle;
                    stateChanged = true;
                }
            }

            if (stateChanged)
            {
                _logger?.LogInformation("Idle state changed. IsIdle: {IsIdle}, IdleDuration: {Duration}s", _isIdle, idleDuration.TotalSeconds);
                OnIdleStateChanged?.Invoke(_isIdle);
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error while checking idle state");
        }
    }

    public void Dispose()
    {
        _timer.Dispose();
        GC.SuppressFinalize(this);
    }
}
