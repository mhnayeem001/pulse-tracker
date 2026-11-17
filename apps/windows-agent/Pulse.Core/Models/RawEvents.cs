namespace Pulse.Core.Models;

public record RawMouseEvent
{
    public bool LeftButtonDown { get; init; }
    public bool RightButtonDown { get; init; }
    public bool MiddleButtonDown { get; init; }
    public bool X1ButtonDown { get; init; }
    public bool X2ButtonDown { get; init; }
    public int WheelDeltaVertical { get; init; }
    public int WheelDeltaHorizontal { get; init; }
    public int LastX { get; init; }
    public int LastY { get; init; }
    public bool HasMovement { get; init; }
    public double Distance { get; init; }
    public DateTime TimestampUtc { get; init; } = DateTime.UtcNow;
}

public record RawKeyboardEvent
{
    public bool IsKeyDown { get; init; }
    public bool IsRepeat { get; init; }
    public DateTime TimestampUtc { get; init; } = DateTime.UtcNow;
}
