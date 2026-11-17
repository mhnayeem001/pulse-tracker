using Pulse.Core.Models;
using Pulse.Storage;
using Xunit;

namespace Pulse.Tests;

public class StorageServiceTests : IDisposable
{
    private readonly string _testDbPath;
    private readonly SqliteStorageService _storage;

    public StorageServiceTests()
    {
        _testDbPath = Path.Combine(AppContext.BaseDirectory, $"pulse_test_{Guid.NewGuid():N}.db");
        _storage = new SqliteStorageService(_testDbPath);
        _storage.InitializeAsync().Wait();
    }

    [Fact]
    public async Task SaveSummaryAsync_ShouldInsertAndRetrievePendingSummaries()
    {
        var deviceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        var summary = new ActivitySummary
        {
            DeviceId = deviceId,
            UserId = userId,
            BucketStartUtc = now,
            BucketEndUtc = now.AddMinutes(1),
            LeftClicks = 25,
            RightClicks = 5,
            KeyboardPresses = 80,
            ActiveSeconds = 50,
            IdleSeconds = 10,
            SessionId = "test_sess"
        };

        await _storage.SaveSummaryAsync(summary);

        var pending = await _storage.GetPendingSyncSummariesAsync(10);
        Assert.Single(pending);
        Assert.Equal(25, pending[0].LeftClicks);
        Assert.Equal(5, pending[0].RightClicks);
        Assert.Equal(80, pending[0].KeyboardPresses);
        Assert.Equal(30, pending[0].TotalClicks);
    }

    [Fact]
    public async Task SaveSummaryAsync_DuplicateBucket_ShouldUpdateWithoutDuplication()
    {
        var deviceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var bucketStart = new DateTime(2026, 11, 17, 12, 0, 0, DateTimeKind.Utc);

        var summary1 = new ActivitySummary
        {
            DeviceId = deviceId,
            UserId = userId,
            BucketStartUtc = bucketStart,
            BucketEndUtc = bucketStart.AddMinutes(1),
            LeftClicks = 10,
            KeyboardPresses = 20,
            ActiveSeconds = 30,
            IdleSeconds = 30,
            SessionId = "s1"
        };

        await _storage.SaveSummaryAsync(summary1);

        // Save again with same device and bucketStart but updated counts
        var summary2 = new ActivitySummary
        {
            DeviceId = deviceId,
            UserId = userId,
            BucketStartUtc = bucketStart,
            BucketEndUtc = bucketStart.AddMinutes(1),
            LeftClicks = 25,
            KeyboardPresses = 45,
            ActiveSeconds = 55,
            IdleSeconds = 5,
            SessionId = "s1"
        };

        await _storage.SaveSummaryAsync(summary2);

        var pending = await _storage.GetPendingSyncSummariesAsync(10);
        Assert.Single(pending); // Only 1 record, not 2
        Assert.Equal(25, pending[0].LeftClicks);
        Assert.Equal(45, pending[0].KeyboardPresses);
    }

    [Fact]
    public async Task MarkSummariesSyncedAsync_ShouldExcludeFromPending()
    {
        var deviceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        var s1 = new ActivitySummary
        {
            DeviceId = deviceId,
            UserId = userId,
            BucketStartUtc = now,
            BucketEndUtc = now.AddMinutes(1)
        };

        await _storage.SaveSummaryAsync(s1);

        var pendingBefore = await _storage.GetPendingSyncSummariesAsync(10);
        Assert.Single(pendingBefore);

        await _storage.MarkSummariesSyncedAsync(new[] { s1.Id });

        var pendingAfter = await _storage.GetPendingSyncSummariesAsync(10);
        Assert.Empty(pendingAfter);
    }

    [Fact]
    public async Task DeviceRegistration_SaveAndRetrieve_ShouldMatch()
    {
        var device = new DeviceRegistration
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            DeviceName = "Personal Laptop",
            Hostname = "LAPTOP-TEST",
            OsVersion = "Windows 11",
            AgentVersion = "1.0.0"
        };

        await _storage.SaveDeviceRegistrationAsync(device);
        var fetched = await _storage.GetDeviceRegistrationAsync();

        Assert.NotNull(fetched);
        Assert.Equal(device.Id, fetched.Id);
        Assert.Equal("Personal Laptop", fetched.DeviceName);
        Assert.Equal("LAPTOP-TEST", fetched.Hostname);
    }

    [Fact]
    public async Task Settings_SaveAndRetrieve_ShouldWork()
    {
        await _storage.SaveSettingAsync("test_key", "test_value_123");
        var val = await _storage.GetSettingAsync("test_key");

        Assert.Equal("test_value_123", val);
    }

    public void Dispose()
    {
        _storage.Dispose();
        try
        {
            if (File.Exists(_testDbPath)) File.Delete(_testDbPath);
        }
        catch
        {
            // Best effort cleanup
        }
    }
}
