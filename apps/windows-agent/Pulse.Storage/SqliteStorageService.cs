using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Pulse.Core.Interfaces;
using Pulse.Core.Models;

namespace Pulse.Storage;

public class SqliteStorageService : IStorageService
{
    private readonly string _connectionString;
    private readonly ILogger<SqliteStorageService>? _logger;
    private readonly SemaphoreSlim _dbLock = new(1, 1);

    public SqliteStorageService(string dbPath, ILogger<SqliteStorageService>? logger = null)
    {
        _logger = logger;

        var directory = Path.GetDirectoryName(dbPath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        var builder = new SqliteConnectionStringBuilder
        {
            DataSource = dbPath,
            Mode = SqliteOpenMode.ReadWriteCreate,
            Cache = SqliteCacheMode.Shared
        };
        _connectionString = builder.ToString();
    }

    public async Task InitializeAsync()
    {
        await _dbLock.WaitAsync();
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            // Enable WAL mode for high concurrency and performance
            using (var pragmaCmd = connection.CreateCommand())
            {
                pragmaCmd.CommandText = @"
                    PRAGMA journal_mode = WAL;
                    PRAGMA synchronous = NORMAL;
                    PRAGMA busy_timeout = 5000;
                ";
                await pragmaCmd.ExecuteNonQueryAsync();
            }

            using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS local_device (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    device_name TEXT NOT NULL,
                    device_type TEXT NOT NULL,
                    hostname TEXT,
                    os_version TEXT,
                    agent_version TEXT,
                    registered_at TEXT NOT NULL,
                    last_seen_at TEXT NOT NULL,
                    last_sync_at TEXT,
                    is_active INTEGER NOT NULL DEFAULT 1
                );

                CREATE TABLE IF NOT EXISTS activity_summaries (
                    id TEXT PRIMARY KEY,
                    device_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    bucket_start TEXT NOT NULL,
                    bucket_end TEXT NOT NULL,
                    left_clicks INTEGER NOT NULL DEFAULT 0,
                    right_clicks INTEGER NOT NULL DEFAULT 0,
                    middle_clicks INTEGER NOT NULL DEFAULT 0,
                    x1_clicks INTEGER NOT NULL DEFAULT 0,
                    x2_clicks INTEGER NOT NULL DEFAULT 0,
                    keyboard_presses INTEGER NOT NULL DEFAULT 0,
                    vertical_scroll INTEGER NOT NULL DEFAULT 0,
                    horizontal_scroll INTEGER NOT NULL DEFAULT 0,
                    mouse_movement_events INTEGER NOT NULL DEFAULT 0,
                    mouse_distance REAL NOT NULL DEFAULT 0.0,
                    active_seconds INTEGER NOT NULL DEFAULT 0,
                    wait_seconds INTEGER NOT NULL DEFAULT 0,
                    idle_seconds INTEGER NOT NULL DEFAULT 0,
                    session_id TEXT NOT NULL,
                    is_synced INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    key_counts TEXT DEFAULT '{}',
                    CONSTRAINT uq_device_bucket UNIQUE (device_id, bucket_start)
                );

                CREATE TABLE IF NOT EXISTS sync_queue (
                    id TEXT PRIMARY KEY,
                    batch_uuid TEXT NOT NULL UNIQUE,
                    payload TEXT NOT NULL,
                    retry_count INTEGER NOT NULL DEFAULT 0,
                    last_attempt TEXT,
                    error_message TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS application_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS agent_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    level TEXT NOT NULL,
                    message TEXT NOT NULL,
                    exception TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_activity_bucket ON activity_summaries(bucket_start DESC);
                CREATE INDEX IF NOT EXISTS idx_activity_synced ON activity_summaries(is_synced);
            ";
            await cmd.ExecuteNonQueryAsync();

            try
            {
                using var alterCmd = connection.CreateCommand();
                alterCmd.CommandText = "ALTER TABLE activity_summaries ADD COLUMN key_counts TEXT DEFAULT '{}';";
                await alterCmd.ExecuteNonQueryAsync();
            }
            catch
            {
                // Column already exists
            }

            try
            {
                using var alterWaitCmd = connection.CreateCommand();
                alterWaitCmd.CommandText = "ALTER TABLE activity_summaries ADD COLUMN wait_seconds INTEGER DEFAULT 0;";
                await alterWaitCmd.ExecuteNonQueryAsync();
            }
            catch
            {
                // Column already exists
            }

            _logger?.LogInformation("Local SQLite database initialized successfully at {Connection}", _connectionString);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to initialize local SQLite database");
            throw;
        }
        finally
        {
            _dbLock.Release();
        }
    }

    public async Task SaveSummaryAsync(ActivitySummary summary)
    {
        await _dbLock.WaitAsync();
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO activity_summaries (
                    id, device_id, user_id, bucket_start, bucket_end,
                    left_clicks, right_clicks, middle_clicks, x1_clicks, x2_clicks,
                    keyboard_presses, vertical_scroll, horizontal_scroll,
                    mouse_movement_events, mouse_distance, active_seconds, wait_seconds, idle_seconds,
                    session_id, is_synced, created_at, key_counts
                ) VALUES (
                    $id, $device_id, $user_id, $bucket_start, $bucket_end,
                    $left_clicks, $right_clicks, $middle_clicks, $x1_clicks, $x2_clicks,
                    $keyboard_presses, $vertical_scroll, $horizontal_scroll,
                    $mouse_movement_events, $mouse_distance, $active_seconds, $wait_seconds, $idle_seconds,
                    $session_id, $is_synced, $created_at, $key_counts
                )
                ON CONFLICT(device_id, bucket_start) DO UPDATE SET
                    left_clicks = excluded.left_clicks,
                    right_clicks = excluded.right_clicks,
                    middle_clicks = excluded.middle_clicks,
                    x1_clicks = excluded.x1_clicks,
                    x2_clicks = excluded.x2_clicks,
                    keyboard_presses = excluded.keyboard_presses,
                    vertical_scroll = excluded.vertical_scroll,
                    horizontal_scroll = excluded.horizontal_scroll,
                    mouse_movement_events = excluded.mouse_movement_events,
                    mouse_distance = excluded.mouse_distance,
                    active_seconds = excluded.active_seconds,
                    wait_seconds = excluded.wait_seconds,
                    idle_seconds = excluded.idle_seconds,
                    key_counts = excluded.key_counts;
            ";

            cmd.Parameters.AddWithValue("$id", summary.Id);
            cmd.Parameters.AddWithValue("$device_id", summary.DeviceId.ToString());
            cmd.Parameters.AddWithValue("$user_id", summary.UserId.ToString());
            cmd.Parameters.AddWithValue("$bucket_start", summary.BucketStartUtc.ToString("O"));
            cmd.Parameters.AddWithValue("$bucket_end", summary.BucketEndUtc.ToString("O"));
            cmd.Parameters.AddWithValue("$left_clicks", summary.LeftClicks);
            cmd.Parameters.AddWithValue("$right_clicks", summary.RightClicks);
            cmd.Parameters.AddWithValue("$middle_clicks", summary.MiddleClicks);
            cmd.Parameters.AddWithValue("$x1_clicks", summary.X1Clicks);
            cmd.Parameters.AddWithValue("$x2_clicks", summary.X2Clicks);
            cmd.Parameters.AddWithValue("$keyboard_presses", summary.KeyboardPresses);
            cmd.Parameters.AddWithValue("$vertical_scroll", summary.VerticalScroll);
            cmd.Parameters.AddWithValue("$horizontal_scroll", summary.HorizontalScroll);
            cmd.Parameters.AddWithValue("$mouse_movement_events", summary.MouseMovementEvents);
            cmd.Parameters.AddWithValue("$mouse_distance", summary.MouseDistance);
            cmd.Parameters.AddWithValue("$active_seconds", summary.ActiveSeconds);
            cmd.Parameters.AddWithValue("$wait_seconds", summary.WaitSeconds);
            cmd.Parameters.AddWithValue("$idle_seconds", summary.IdleSeconds);
            cmd.Parameters.AddWithValue("$session_id", summary.SessionId);
            cmd.Parameters.AddWithValue("$is_synced", summary.IsSynced ? 1 : 0);
            cmd.Parameters.AddWithValue("$created_at", summary.CreatedAtUtc.ToString("O"));
            cmd.Parameters.AddWithValue("$key_counts", System.Text.Json.JsonSerializer.Serialize(summary.KeyCounts));

            await cmd.ExecuteNonQueryAsync();
        }
        finally
        {
            _dbLock.Release();
        }
    }

    public async Task<List<ActivitySummary>> GetPendingSyncSummariesAsync(int limit = 100)
    {
        await _dbLock.WaitAsync();
        try
        {
            var list = new List<ActivitySummary>();
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT id, device_id, user_id, bucket_start, bucket_end,
                       left_clicks, right_clicks, middle_clicks, x1_clicks, x2_clicks,
                       keyboard_presses, vertical_scroll, horizontal_scroll,
                       mouse_movement_events, mouse_distance, active_seconds, idle_seconds,
                       session_id, is_synced, created_at, key_counts, wait_seconds
                FROM activity_summaries
                WHERE is_synced = 0
                ORDER BY bucket_start ASC
                LIMIT $limit;
            ";
            cmd.Parameters.AddWithValue("$limit", limit);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(ReadSummary(reader));
            }
            return list;
        }
        finally
        {
            _dbLock.Release();
        }
    }

    public async Task MarkSummariesSyncedAsync(IEnumerable<string> summaryIds)
    {
        var ids = summaryIds.ToList();
        if (ids.Count == 0) return;

        await _dbLock.WaitAsync();
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            using var tx = connection.BeginTransaction();

            using var cmd = connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = "UPDATE activity_summaries SET is_synced = 1 WHERE id = $id;";
            var pId = cmd.Parameters.Add("$id", SqliteType.Text);

            foreach (var id in ids)
            {
                pId.Value = id;
                await cmd.ExecuteNonQueryAsync();
            }

            await tx.CommitAsync();
        }
        finally
        {
            _dbLock.Release();
        }
    }

    public async Task<ActivitySummary> GetTodayTotalsAsync()
    {
        await _dbLock.WaitAsync();
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            // Calculate start of today in UTC
            var todayUtcStart = DateTime.UtcNow.Date.ToString("O");

            using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT 
                    COALESCE(SUM(left_clicks), 0) AS left_clicks,
                    COALESCE(SUM(right_clicks), 0) AS right_clicks,
                    COALESCE(SUM(middle_clicks), 0) AS middle_clicks,
                    COALESCE(SUM(x1_clicks), 0) AS x1_clicks,
                    COALESCE(SUM(x2_clicks), 0) AS x2_clicks,
                    COALESCE(SUM(keyboard_presses), 0) AS keyboard_presses,
                    COALESCE(SUM(vertical_scroll), 0) AS vertical_scroll,
                    COALESCE(SUM(horizontal_scroll), 0) AS horizontal_scroll,
                    COALESCE(SUM(mouse_movement_events), 0) AS mouse_movement_events,
                    COALESCE(SUM(mouse_distance), 0.0) AS mouse_distance,
                    COALESCE(SUM(active_seconds), 0) AS active_seconds,
                    COALESCE(SUM(idle_seconds), 0) AS idle_seconds
                FROM activity_summaries
                WHERE bucket_start >= $today;
            ";
            cmd.Parameters.AddWithValue("$today", todayUtcStart);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new ActivitySummary
                {
                    LeftClicks = reader.GetInt32(0),
                    RightClicks = reader.GetInt32(1),
                    MiddleClicks = reader.GetInt32(2),
                    X1Clicks = reader.GetInt32(3),
                    X2Clicks = reader.GetInt32(4),
                    KeyboardPresses = reader.GetInt32(5),
                    VerticalScroll = reader.GetInt32(6),
                    HorizontalScroll = reader.GetInt32(7),
                    MouseMovementEvents = reader.GetInt32(8),
                    MouseDistance = reader.GetDouble(9),
                    ActiveSeconds = reader.GetInt32(10),
                    IdleSeconds = reader.GetInt32(11)
                };
            }

            return new ActivitySummary();
        }
        finally
        {
            _dbLock.Release();
        }
    }

    public async Task<DeviceRegistration?> GetDeviceRegistrationAsync()
    {
        await _dbLock.WaitAsync();
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT id, user_id, device_name, device_type, hostname, os_version, agent_version, registered_at, last_seen_at, last_sync_at, is_active FROM local_device LIMIT 1;";

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new DeviceRegistration
                {
                    Id = Guid.Parse(reader.GetString(0)),
                    UserId = Guid.Parse(reader.GetString(1)),
                    DeviceName = reader.GetString(2),
                    DeviceType = reader.GetString(3),
                    Hostname = reader.IsDBNull(4) ? "" : reader.GetString(4),
                    OsVersion = reader.IsDBNull(5) ? "" : reader.GetString(5),
                    AgentVersion = reader.IsDBNull(6) ? "" : reader.GetString(6),
                    RegisteredAtUtc = DateTime.Parse(reader.GetString(7)),
                    LastSeenAtUtc = DateTime.Parse(reader.GetString(8)),
                    LastSyncAtUtc = reader.IsDBNull(9) ? null : DateTime.Parse(reader.GetString(9)),
                    IsActive = reader.GetInt32(10) == 1
                };
            }
            return null;
        }
        finally
        {
            _dbLock.Release();
        }
    }

    public async Task SaveDeviceRegistrationAsync(DeviceRegistration device)
    {
        await _dbLock.WaitAsync();
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                INSERT OR REPLACE INTO local_device (
                    id, user_id, device_name, device_type, hostname, os_version, agent_version, registered_at, last_seen_at, last_sync_at, is_active
                ) VALUES (
                    $id, $user_id, $device_name, $device_type, $hostname, $os_version, $agent_version, $registered_at, $last_seen_at, $last_sync_at, $is_active
                );
            ";
            cmd.Parameters.AddWithValue("$id", device.Id.ToString());
            cmd.Parameters.AddWithValue("$user_id", device.UserId.ToString());
            cmd.Parameters.AddWithValue("$device_name", device.DeviceName);
            cmd.Parameters.AddWithValue("$device_type", device.DeviceType);
            cmd.Parameters.AddWithValue("$hostname", device.Hostname);
            cmd.Parameters.AddWithValue("$os_version", device.OsVersion);
            cmd.Parameters.AddWithValue("$agent_version", device.AgentVersion);
            cmd.Parameters.AddWithValue("$registered_at", device.RegisteredAtUtc.ToString("O"));
            cmd.Parameters.AddWithValue("$last_seen_at", device.LastSeenAtUtc.ToString("O"));
            cmd.Parameters.AddWithValue("$last_sync_at", device.LastSyncAtUtc.HasValue ? device.LastSyncAtUtc.Value.ToString("O") : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("$is_active", device.IsActive ? 1 : 0);

            await cmd.ExecuteNonQueryAsync();
        }
        finally
        {
            _dbLock.Release();
        }
    }

    public async Task<string?> GetSettingAsync(string key, string? defaultValue = null)
    {
        await _dbLock.WaitAsync();
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT value FROM application_settings WHERE key = $key;";
            cmd.Parameters.AddWithValue("$key", key);

            var res = await cmd.ExecuteScalarAsync();
            return res?.ToString() ?? defaultValue;
        }
        finally
        {
            _dbLock.Release();
        }
    }

    public async Task SaveSettingAsync(string key, string value)
    {
        await _dbLock.WaitAsync();
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                INSERT OR REPLACE INTO application_settings (key, value, updated_at)
                VALUES ($key, $value, $updated_at);
            ";
            cmd.Parameters.AddWithValue("$key", key);
            cmd.Parameters.AddWithValue("$value", value);
            cmd.Parameters.AddWithValue("$updated_at", DateTime.UtcNow.ToString("O"));

            await cmd.ExecuteNonQueryAsync();
        }
        finally
        {
            _dbLock.Release();
        }
    }

    public async Task PruneOldDataAsync(int retentionDays)
    {
        await _dbLock.WaitAsync();
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            var cutoff = DateTime.UtcNow.AddDays(-retentionDays).ToString("O");
            using var cmd = connection.CreateCommand();
            cmd.CommandText = "DELETE FROM activity_summaries WHERE bucket_start < $cutoff AND is_synced = 1;";
            cmd.Parameters.AddWithValue("$cutoff", cutoff);
            await cmd.ExecuteNonQueryAsync();
        }
        finally
        {
            _dbLock.Release();
        }
    }

    public async Task LogAsync(string level, string message, string? exception = null)
    {
        try
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();

            using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO agent_logs (timestamp, level, message, exception)
                VALUES ($ts, $level, $message, $ex);
            ";
            cmd.Parameters.AddWithValue("$ts", DateTime.UtcNow.ToString("O"));
            cmd.Parameters.AddWithValue("$level", level);
            cmd.Parameters.AddWithValue("$message", message);
            cmd.Parameters.AddWithValue("$ex", exception ?? (object)DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            // Logging shouldn't crash caller
        }
    }

    private static ActivitySummary ReadSummary(SqliteDataReader reader)
    {
        var summary = new ActivitySummary
        {
            Id = reader.GetString(0),
            DeviceId = Guid.Parse(reader.GetString(1)),
            UserId = Guid.Parse(reader.GetString(2)),
            BucketStartUtc = DateTime.Parse(reader.GetString(3)),
            BucketEndUtc = DateTime.Parse(reader.GetString(4)),
            LeftClicks = reader.GetInt32(5),
            RightClicks = reader.GetInt32(6),
            MiddleClicks = reader.GetInt32(7),
            X1Clicks = reader.GetInt32(8),
            X2Clicks = reader.GetInt32(9),
            KeyboardPresses = reader.GetInt32(10),
            VerticalScroll = reader.GetInt32(11),
            HorizontalScroll = reader.GetInt32(12),
            MouseMovementEvents = reader.GetInt32(13),
            MouseDistance = reader.GetDouble(14),
            ActiveSeconds = reader.GetInt32(15),
            IdleSeconds = reader.GetInt32(16),
            SessionId = reader.GetString(17),
            IsSynced = reader.GetInt32(18) == 1,
            CreatedAtUtc = DateTime.Parse(reader.GetString(19))
        };

        if (reader.FieldCount > 20 && !reader.IsDBNull(20))
        {
            try
            {
                var json = reader.GetString(20);
                if (!string.IsNullOrWhiteSpace(json))
                {
                    summary.KeyCounts = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, int>>(json) ?? new();
                }
            }
            catch
            {
                // Fallback to empty
            }
        }

        if (reader.FieldCount > 21 && !reader.IsDBNull(21))
        {
            summary.WaitSeconds = reader.GetInt32(21);
        }

        return summary;
    }

    public void Dispose()
    {
        _dbLock.Dispose();
        GC.SuppressFinalize(this);
    }
}
