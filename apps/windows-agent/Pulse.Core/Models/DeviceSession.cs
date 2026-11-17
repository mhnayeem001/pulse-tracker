using System.Text.Json.Serialization;

namespace Pulse.Core.Models;

public class DeviceSession
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [JsonPropertyName("user_id")]
    public Guid UserId { get; set; }

    [JsonPropertyName("device_id")]
    public Guid DeviceId { get; set; }

    [JsonPropertyName("started_at")]
    public DateTime StartedAtUtc { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("ended_at")]
    public DateTime? EndedAtUtc { get; set; }

    [JsonPropertyName("active_seconds")]
    public int ActiveSeconds { get; set; }

    [JsonPropertyName("idle_seconds")]
    public int IdleSeconds { get; set; }

    [JsonPropertyName("session_status")]
    public string SessionStatus { get; set; } = "active";
}
