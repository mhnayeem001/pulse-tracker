using Pulse.Core.Models;

namespace Pulse.Core.Interfaces;

public interface IInputCollector : IDisposable
{
    event Action<RawMouseEvent>? OnMouseInput;
    event Action<RawKeyboardEvent>? OnKeyboardInput;

    bool IsActive { get; }
    void Start();
    void Stop();
    void Pause();
    void Resume();
}
