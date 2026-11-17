using System.Runtime.InteropServices;

namespace Pulse.Collector.Native;

public static class Win32Api
{
    public const int WM_INPUT = 0x00FF;
    public const int WM_WTSSESSION_CHANGE = 0x02B1;
    public const int WM_POWERBROADCAST = 0x0218;

    // Session notification constants
    public const int NOTIFY_FOR_THIS_SESSION = 0;
    public const int WTS_CONSOLE_CONNECT = 0x1;
    public const int WTS_CONSOLE_DISCONNECT = 0x2;
    public const int WTS_SESSION_LOGON = 0x5;
    public const int WTS_SESSION_LOGOFF = 0x6;
    public const int WTS_SESSION_LOCK = 0x7;
    public const int WTS_SESSION_UNLOCK = 0x8;

    // Power notification constants
    public const int PBT_APMSUSPEND = 0x0004;
    public const int PBT_APMRESUMESUSPEND = 0x0007;
    public const int PBT_APMRESUMEAUTOMATIC = 0x0012;

    // Raw input constants
    public const int RID_INPUT = 0x10000003;
    public const int RID_HEADER = 0x10000005;

    public const int RIM_TYPEMOUSE = 0;
    public const int RIM_TYPEKEYBOARD = 1;
    public const int RIM_TYPEHID = 2;

    public const int RIDEV_INPUTSINK = 0x00000100;
    public const int RIDEV_REMOVE = 0x00000001;

    public const ushort HID_USAGE_PAGE_GENERIC = 0x01;
    public const ushort HID_USAGE_GENERIC_MOUSE = 0x02;
    public const ushort HID_USAGE_GENERIC_KEYBOARD = 0x06;

    // Mouse button flags
    public const ushort RI_MOUSE_LEFT_BUTTON_DOWN = 0x0001;
    public const ushort RI_MOUSE_LEFT_BUTTON_UP = 0x0002;
    public const ushort RI_MOUSE_RIGHT_BUTTON_DOWN = 0x0004;
    public const ushort RI_MOUSE_RIGHT_BUTTON_UP = 0x0008;
    public const ushort RI_MOUSE_MIDDLE_BUTTON_DOWN = 0x0010;
    public const ushort RI_MOUSE_MIDDLE_BUTTON_UP = 0x0020;
    public const ushort RI_MOUSE_BUTTON_4_DOWN = 0x0040;
    public const ushort RI_MOUSE_BUTTON_4_UP = 0x0080;
    public const ushort RI_MOUSE_BUTTON_5_DOWN = 0x0100;
    public const ushort RI_MOUSE_BUTTON_5_UP = 0x0200;
    public const ushort RI_MOUSE_WHEEL = 0x0400;
    public const ushort RI_MOUSE_HWHEEL = 0x0800;

    // Keyboard flags
    public const int WM_KEYDOWN = 0x0100;
    public const int WM_KEYUP = 0x0101;
    public const int WM_SYSKEYDOWN = 0x0104;
    public const int WM_SYSKEYUP = 0x0105;

    [StructLayout(LayoutKind.Sequential)]
    public struct RAWINPUTDEVICE
    {
        public ushort usUsagePage;
        public ushort usUsage;
        public uint dwFlags;
        public IntPtr hwndTarget;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct RAWINPUTHEADER
    {
        public uint dwType;
        public uint dwSize;
        public IntPtr hDevice;
        public IntPtr wParam;
    }

    [StructLayout(LayoutKind.Explicit)]
    public struct RAWMOUSE
    {
        [FieldOffset(0)]
        public ushort usFlags;

        [FieldOffset(4)]
        public uint ulButtons;

        [FieldOffset(4)]
        public ushort usButtonFlags;

        [FieldOffset(6)]
        public short usButtonData;

        [FieldOffset(8)]
        public uint ulRawButtons;

        [FieldOffset(12)]
        public int lLastX;

        [FieldOffset(16)]
        public int lLastY;

        [FieldOffset(20)]
        public uint ulExtraInformation;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct RAWKEYBOARD
    {
        public ushort MakeCode;
        public ushort Flags;
        public ushort Reserved;
        public ushort VKey;
        public uint Message;
        public uint ExtraInformation;
    }

    [StructLayout(LayoutKind.Explicit)]
    public struct RAWINPUT
    {
        [FieldOffset(0)]
        public RAWINPUTHEADER header;

        [FieldOffset(16)] // 24 on 64-bit due to pointer alignment in header (x64: uint 4 + uint 4 + IntPtr 8 + IntPtr 8 = 24)
        public RAWMOUSE mouse;

        [FieldOffset(16)]
        public RAWKEYBOARD keyboard;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct LASTINPUTINFO
    {
        public uint cbSize;
        public uint dwTime;
    }

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool RegisterRawInputDevices(
        [In] RAWINPUTDEVICE[] pRawInputDevices,
        uint uiNumDevices,
        uint cbSize);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetRawInputData(
        IntPtr hRawInput,
        uint uiCommand,
        IntPtr pData,
        ref uint pcbSize,
        uint cbSizeHeader);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

    [DllImport("wtsapi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool WTSRegisterSessionNotification(IntPtr hWnd, int dwFlags);

    [DllImport("wtsapi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool WTSUnRegisterSessionNotification(IntPtr hWnd);
}
