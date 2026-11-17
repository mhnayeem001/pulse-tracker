namespace Pulse.Core.Models;

public class UserSettings
{
    public int IdleThresholdSeconds { get; set; } = 300;
    public bool TrackingEnabled { get; set; } = true;
    public string Timezone { get; set; } = "Asia/Dhaka";
    public int DataRetentionDays { get; set; } = 90;
    public int SyncIntervalSeconds { get; set; } = 60;
    public bool AutoStartWithWindows { get; set; } = true;
    public string SupabaseUrl { get; set; } = "";
    public string SupabaseAnonKey { get; set; } = "";
}
