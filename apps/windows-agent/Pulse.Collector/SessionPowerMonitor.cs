using Microsoft.Extensions.Logging;
using Pulse.Collector.Native;

namespace Pulse.Collector;

public class SessionPowerMonitor : IDisposable
{
    private readonly ILogger<SessionPowerMonitor>? _logger;
    private SessionNotificationWindow? _window;

    public event Action? OnSessionLock;
    public event Action? OnSessionUnlock;
    public event Action? OnSuspend;
    public event Action? OnResume;

    public SessionPowerMonitor(ILogger<SessionPowerMonitor>? logger = null)
    {
        _logger = logger;
    }

    public void Start()
    {
        _window = new SessionNotificationWindow(this);
        _window.CreateHandle(new System.Windows.Forms.CreateParams());
        Win32Api.WTSRegisterSessionNotification(_window.Handle, Win32Api.NOTIFY_FOR_THIS_SESSION);
        _logger?.LogInformation("Session and Power notification monitor started");
    }

    public void Stop()
    {
        if (_window != null)
        {
            Win32Api.WTSUnRegisterSessionNotification(_window.Handle);
            _window.DestroyHandle();
            _window = null;
            _logger?.LogInformation("Session and Power notification monitor stopped");
        }
    }

    internal void HandleSessionChange(int changeType)
    {
        switch (changeType)
        {
            case Win32Api.WTS_SESSION_LOCK:
                _logger?.LogInformation("Workstation locked");
                OnSessionLock?.Invoke();
                break;
            case Win32Api.WTS_SESSION_UNLOCK:
                _logger?.LogInformation("Workstation unlocked");
                OnSessionUnlock?.Invoke();
                break;
        }
    }

    internal void HandlePowerBroadcast(int eventType)
    {
        switch (eventType)
        {
            case Win32Api.PBT_APMSUSPEND:
                _logger?.LogInformation("System suspending");
                OnSuspend?.Invoke();
                break;
            case Win32Api.PBT_APMRESUMEAUTOMATIC:
            case Win32Api.PBT_APMRESUMESUSPEND:
                _logger?.LogInformation("System resuming");
                OnResume?.Invoke();
                break;
        }
    }

    public void Dispose()
    {
        Stop();
        GC.SuppressFinalize(this);
    }

    private sealed class SessionNotificationWindow : System.Windows.Forms.NativeWindow
    {
        private readonly SessionPowerMonitor _parent;

        public SessionNotificationWindow(SessionPowerMonitor parent)
        {
            _parent = parent;
        }

        protected override void WndProc(ref System.Windows.Forms.Message m)
        {
            if (m.Msg == Win32Api.WM_WTSSESSION_CHANGE)
            {
                _parent.HandleSessionChange(m.WParam.ToInt32());
            }
            else if (m.Msg == Win32Api.WM_POWERBROADCAST)
            {
                _parent.HandlePowerBroadcast(m.WParam.ToInt32());
            }
            base.WndProc(ref m);
        }
    }
}
