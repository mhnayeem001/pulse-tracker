using System.Text.Json.Serialization;

namespace Pulse.Core.Models;

public class DeviceRegistration
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [JsonPropertyName("user_id")]
    public Guid UserId { get; set; }

    [JsonPropertyName("device_name")]
    public string DeviceName { get; set; } = "Personal Laptop";

    [JsonPropertyName("device_type")]
    public string DeviceType { get; set; } = "desktop";

    [JsonPropertyName("hostname")]
    public string Hostname { get; set; } = Environment.MachineName;

    [JsonPropertyName("os_version")]
    public string OsVersion { get; set; } = Environment.OSVersion.VersionString;

    [JsonPropertyName("agent_version")]
    public string AgentVersion { get; set; } = "1.0.0";

    [JsonPropertyName("registered_at")]
    public DateTime RegisteredAtUtc { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("last_seen_at")]
    public DateTime LastSeenAtUtc { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("last_sync_at")]
    public DateTime? LastSyncAtUtc { get; set; }

    [JsonPropertyName("is_active")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("revoked_at")]
    public DateTime? RevokedAtUtc { get; set; }
}
