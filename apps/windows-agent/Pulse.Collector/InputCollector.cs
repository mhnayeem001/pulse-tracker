using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;
using Pulse.Collector.Native;
using Pulse.Core.Interfaces;
using Pulse.Core.Models;

namespace Pulse.Collector;

public class InputCollector : IInputCollector
{
    private readonly ILogger<InputCollector>? _logger;
    private InputWindow? _window;
    private bool _isActive;
    private bool _isPaused;
    private readonly object _lock = new();

    public event Action<RawMouseEvent>? OnMouseInput;
    public event Action<RawKeyboardEvent>? OnKeyboardInput;

    public bool IsActive => _isActive && !_isPaused;

    public InputCollector(ILogger<InputCollector>? logger = null)
    {
        _logger = logger;
    }

    public void Start()
    {
        lock (_lock)
        {
            if (_isActive) return;

            _window = new InputWindow(this);
            _window.CreateHandle(new System.Windows.Forms.CreateParams());

            RegisterDevices(_window.Handle);
            _isActive = true;
            _isPaused = false;
            _logger?.LogInformation("Raw Input Collector started successfully");
        }
    }

    public void Stop()
    {
        lock (_lock)
        {
            if (!_isActive) return;

            UnregisterDevices();
            _window?.DestroyHandle();
            _window = null;
            _isActive = false;
            _isPaused = false;
            _logger?.LogInformation("Raw Input Collector stopped");
        }
    }

    public void Pause()
    {
        lock (_lock)
        {
            _isPaused = true;
            _logger?.LogInformation("Raw Input Collector paused");
        }
    }

    public void Resume()
    {
        lock (_lock)
        {
            _isPaused = false;
            _logger?.LogInformation("Raw Input Collector resumed");
        }
    }

    private void RegisterDevices(IntPtr hwnd)
    {
        var devices = new Win32Api.RAWINPUTDEVICE[2];

        // Mouse
        devices[0].usUsagePage = Win32Api.HID_USAGE_PAGE_GENERIC;
        devices[0].usUsage = Win32Api.HID_USAGE_GENERIC_MOUSE;
        devices[0].dwFlags = Win32Api.RIDEV_INPUTSINK;
        devices[0].hwndTarget = hwnd;

        // Keyboard
        devices[1].usUsagePage = Win32Api.HID_USAGE_PAGE_GENERIC;
        devices[1].usUsage = Win32Api.HID_USAGE_GENERIC_KEYBOARD;
        devices[1].dwFlags = Win32Api.RIDEV_INPUTSINK;
        devices[1].hwndTarget = hwnd;

        bool success = Win32Api.RegisterRawInputDevices(
            devices,
            (uint)devices.Length,
            (uint)Marshal.SizeOf<Win32Api.RAWINPUTDEVICE>());

        if (!success)
        {
            int err = Marshal.GetLastWin32Error();
            _logger?.LogError("Failed to register Raw Input devices. Win32 Error: {Error}", err);
            throw new InvalidOperationException($"RegisterRawInputDevices failed with error {err}");
        }
    }

    private void UnregisterDevices()
    {
        var devices = new Win32Api.RAWINPUTDEVICE[2];

        devices[0].usUsagePage = Win32Api.HID_USAGE_PAGE_GENERIC;
        devices[0].usUsage = Win32Api.HID_USAGE_GENERIC_MOUSE;
        devices[0].dwFlags = Win32Api.RIDEV_REMOVE;
        devices[0].hwndTarget = IntPtr.Zero;

        devices[1].usUsagePage = Win32Api.HID_USAGE_PAGE_GENERIC;
        devices[1].usUsage = Win32Api.HID_USAGE_GENERIC_KEYBOARD;
        devices[1].dwFlags = Win32Api.RIDEV_REMOVE;
        devices[1].hwndTarget = IntPtr.Zero;

        Win32Api.RegisterRawInputDevices(
            devices,
            (uint)devices.Length,
            (uint)Marshal.SizeOf<Win32Api.RAWINPUTDEVICE>());
    }

    internal void ProcessRawInput(IntPtr hRawInput)
    {
        if (!IsActive) return;

        uint dwSize = 0;
        uint headerSize = (uint)Marshal.SizeOf<Win32Api.RAWINPUTHEADER>();

        // Query size
        Win32Api.GetRawInputData(hRawInput, Win32Api.RID_INPUT, IntPtr.Zero, ref dwSize, headerSize);
        if (dwSize == 0) return;

        IntPtr buffer = Marshal.AllocHGlobal((int)dwSize);
        try
        {
            if (Win32Api.GetRawInputData(hRawInput, Win32Api.RID_INPUT, buffer, ref dwSize, headerSize) != dwSize)
            {
                return;
            }

            var header = Marshal.PtrToStructure<Win32Api.RAWINPUTHEADER>(buffer);
            int dataOffset = Marshal.SizeOf<Win32Api.RAWINPUTHEADER>();
            IntPtr dataPtr = IntPtr.Add(buffer, dataOffset);

            if (header.dwType == Win32Api.RIM_TYPEMOUSE)
            {
                var mouse = Marshal.PtrToStructure<Win32Api.RAWMOUSE>(dataPtr);
                HandleRawMouse(mouse);
            }
            else if (header.dwType == Win32Api.RIM_TYPEKEYBOARD)
            {
                var keyboard = Marshal.PtrToStructure<Win32Api.RAWKEYBOARD>(dataPtr);
                HandleRawKeyboard(keyboard);
            }
        }
        finally
        {
            Marshal.FreeHGlobal(buffer);
        }
    }

    private void HandleRawMouse(Win32Api.RAWMOUSE mouse)
    {
        ushort flags = mouse.usButtonFlags;
        bool leftDown = (flags & Win32Api.RI_MOUSE_LEFT_BUTTON_DOWN) != 0;
        bool rightDown = (flags & Win32Api.RI_MOUSE_RIGHT_BUTTON_DOWN) != 0;
        bool middleDown = (flags & Win32Api.RI_MOUSE_MIDDLE_BUTTON_DOWN) != 0;
        bool x1Down = (flags & Win32Api.RI_MOUSE_BUTTON_4_DOWN) != 0;
        bool x2Down = (flags & Win32Api.RI_MOUSE_BUTTON_5_DOWN) != 0;

        int wheelV = 0;
        int wheelH = 0;
        if ((flags & Win32Api.RI_MOUSE_WHEEL) != 0)
        {
            wheelV = mouse.usButtonData;
        }
        if ((flags & Win32Api.RI_MOUSE_HWHEEL) != 0)
        {
            wheelH = mouse.usButtonData;
        }

        int dx = mouse.lLastX;
        int dy = mouse.lLastY;
        bool hasMovement = dx != 0 || dy != 0;
        double distance = hasMovement ? Math.Sqrt(dx * dx + dy * dy) : 0.0;

        if (leftDown || rightDown || middleDown || x1Down || x2Down ||
            wheelV != 0 || wheelH != 0 || hasMovement)
        {
            var evt = new RawMouseEvent
            {
                LeftButtonDown = leftDown,
                RightButtonDown = rightDown,
                MiddleButtonDown = middleDown,
                X1ButtonDown = x1Down,
                X2ButtonDown = x2Down,
                WheelDeltaVertical = wheelV,
                WheelDeltaHorizontal = wheelH,
                LastX = dx,
                LastY = dy,
                HasMovement = hasMovement,
                Distance = distance,
                TimestampUtc = DateTime.UtcNow
            };

            OnMouseInput?.Invoke(evt);
        }
    }

    private void HandleRawKeyboard(Win32Api.RAWKEYBOARD keyboard)
    {
        // Only count KeyDown to prevent double counting on KeyUp
        bool isKeyDown = keyboard.Message == Win32Api.WM_KEYDOWN || keyboard.Message == Win32Api.WM_SYSKEYDOWN;
        if (!isKeyDown) return;

        // Flags bit 30 indicates whether previous state was down (key repeat)
        bool isRepeat = (keyboard.Flags & 0x4000) != 0;

        var evt = new RawKeyboardEvent
        {
            IsKeyDown = true,
            IsRepeat = isRepeat,
            TimestampUtc = DateTime.UtcNow
        };

        // Notice: We strictly do NOT record MakeCode, VKey, or any characters
        OnKeyboardInput?.Invoke(evt);
    }

    public void Dispose()
    {
        Stop();
        GC.SuppressFinalize(this);
    }

    private sealed class InputWindow : System.Windows.Forms.NativeWindow
    {
        private readonly InputCollector _parent;

        public InputWindow(InputCollector parent)
        {
            _parent = parent;
        }

        protected override void WndProc(ref System.Windows.Forms.Message m)
        {
            if (m.Msg == Win32Api.WM_INPUT)
            {
                _parent.ProcessRawInput(m.LParam);
            }
            base.WndProc(ref m);
        }
    }
}
