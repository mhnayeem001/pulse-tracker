using System.Text.Json.Serialization;

namespace Pulse.Core.Models;

public class ActivitySummary
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("device_id")]
    public Guid DeviceId { get; set; }

    [JsonPropertyName("user_id")]
    public Guid UserId { get; set; }

    [JsonPropertyName("bucket_start")]
    public DateTime BucketStartUtc { get; set; }

    [JsonPropertyName("bucket_end")]
    public DateTime BucketEndUtc { get; set; }

    [JsonPropertyName("left_clicks")]
    public int LeftClicks { get; set; }

    [JsonPropertyName("right_clicks")]
    public int RightClicks { get; set; }

    [JsonPropertyName("middle_clicks")]
    public int MiddleClicks { get; set; }

    [JsonPropertyName("x1_clicks")]
    public int X1Clicks { get; set; }

    [JsonPropertyName("x2_clicks")]
    public int X2Clicks { get; set; }

    [JsonPropertyName("keyboard_presses")]
    public int KeyboardPresses { get; set; }

    [JsonPropertyName("vertical_scroll")]
    public int VerticalScroll { get; set; }

    [JsonPropertyName("horizontal_scroll")]
    public int HorizontalScroll { get; set; }

    [JsonPropertyName("mouse_movement_events")]
    public int MouseMovementEvents { get; set; }

    [JsonPropertyName("mouse_distance")]
    public double MouseDistance { get; set; }

    [JsonPropertyName("active_seconds")]
    public int ActiveSeconds { get; set; }

    [JsonPropertyName("idle_seconds")]
    public int IdleSeconds { get; set; }

    [JsonPropertyName("session_id")]
    public string SessionId { get; set; } = "default";

    [JsonPropertyName("created_at")]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public bool IsSynced { get; set; }

    [JsonIgnore]
    public int TotalClicks => LeftClicks + RightClicks + MiddleClicks + X1Clicks + X2Clicks;

    [JsonIgnore]
    public int TotalInputActions => TotalClicks + KeyboardPresses;

    [JsonIgnore]
    public double ActivityPercentage
    {
        get
        {
            var total = ActiveSeconds + IdleSeconds;
            return total > 0 ? (double)ActiveSeconds / total * 100.0 : 0.0;
        }
    }
}
