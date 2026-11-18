using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using Pulse.Agent.Services;
using Pulse.Collector;
using Pulse.Core.Interfaces;
using Pulse.Core.Models;

namespace Pulse.Agent.UI;

public partial class MainForm : Form
{
    private readonly IInputCollector _collector;
    private readonly IIdleDetector _idleDetector;
    private readonly ActivityAggregator _aggregator;
    private readonly IStorageService _storage;
    private readonly ISyncService _syncService;
    private readonly AuthService _authService;

    private readonly NotifyIcon _trayIcon;
    private readonly ContextMenuStrip _trayMenu;
    private readonly System.Windows.Forms.Timer _uiRefreshTimer;

    // Runtime state
    private bool _isTrackingPaused = false;
    private ActivitySummary _todayTotals = new();
    private DeviceRegistration? _currentDevice;

    public MainForm(
        IInputCollector collector,
        IIdleDetector idleDetector,
        ActivityAggregator aggregator,
        IStorageService storage,
        ISyncService syncService,
        AuthService authService)
    {
        _collector = collector;
        _idleDetector = idleDetector;
        _aggregator = aggregator;
        _storage = storage;
        _syncService = syncService;
        _authService = authService;

        InitializeComponent();

        // Setup System Tray
        _trayMenu = new ContextMenuStrip();
        _trayMenu.Items.Add("Open Status Window", null, (s, e) => RestoreFromTray());
        _trayMenu.Items.Add(new ToolStripSeparator());
        _trayMenu.Items.Add("Pause Tracking", null, (s, e) => TogglePause());
        _trayMenu.Items.Add("Force Sync Now", null, async (s, e) => await _syncService.ForceSyncNowAsync());
        _trayMenu.Items.Add("Open Web Dashboard", null, (s, e) => OpenWebDashboard());
        _trayMenu.Items.Add(new ToolStripSeparator());
        _trayMenu.Items.Add("Exit Project PULSE", null, (s, e) => ExitApplication());

        _trayIcon = new NotifyIcon
        {
            Icon = CreatePulseIcon(Color.LimeGreen),
            Text = "Project PULSE - Active",
            Visible = true,
            ContextMenuStrip = _trayMenu
        };
        _trayIcon.DoubleClick += (s, e) => RestoreFromTray();

        // Event hooks
        _collector.OnMouseInput += e =>
        {
            _idleDetector.RecordInput();
            _aggregator.RecordMouse(e);
        };

        _collector.OnKeyboardInput += e =>
        {
            _idleDetector.RecordInput();
            _aggregator.RecordKeyboard(e);
        };

        _idleDetector.OnIdleStateChanged += isIdle =>
        {
            _aggregator.UpdateIdleState(isIdle);
            UpdateStatusBadge();
        };

        _aggregator.OnSummaryReady += async summary =>
        {
            await _storage.SaveSummaryAsync(summary);
            _todayTotals = await _storage.GetTodayTotalsAsync();
        };

        _syncService.OnSyncStatusChanged += (success, msg) =>
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => UpdateSyncLabel(success, msg)));
            }
            else
            {
                UpdateSyncLabel(success, msg);
            }
        };

        // UI Refresh timer (every 1 second)
        _uiRefreshTimer = new System.Windows.Forms.Timer { Interval = 1000 };
        _uiRefreshTimer.Tick += async (s, e) => await RefreshDashboardDataAsync();
        _uiRefreshTimer.Start();

        Load += async (s, e) => await InitializeFormAsync();
        FormClosing += OnFormClosing;
    }

    private async Task InitializeFormAsync()
    {
        _currentDevice = await _storage.GetDeviceRegistrationAsync();
        if (_currentDevice != null)
        {
            lblDeviceName.Text = $"Device: {_currentDevice.DeviceName}";
            txtPairDeviceName.Text = _currentDevice.DeviceName;
            lblDeviceId.Text = $"ID: {_currentDevice.Id}";
            _aggregator.UpdateIdentity(_currentDevice.Id, _currentDevice.UserId);
        }
        else
        {
            lblDeviceName.Text = "Device: Unpaired";
            lblDeviceId.Text = "ID: Not paired with account";
        }

        chkAutoStart.Checked = StartupManager.IsStartupEnabled();
        txtSupabaseUrl.Text = await _storage.GetSettingAsync("supabase_url", "https://izdellrmoeleychjwuzo.supabase.co") ?? "https://izdellrmoeleychjwuzo.supabase.co";
        txtAnonKey.Text = await _storage.GetSettingAsync("supabase_anon_key", "sb_publishable_T8yJ86FF7FxZKQpCFVoXcw_FTHtnDqt") ?? "sb_publishable_T8yJ86FF7FxZKQpCFVoXcw_FTHtnDqt";
        txtUserEmail.Text = await _storage.GetSettingAsync("user_email", "") ?? "";

        _todayTotals = await _storage.GetTodayTotalsAsync();
        UpdateStatusBadge();
    }

    private async Task RefreshDashboardDataAsync()
    {
        var liveBucket = _aggregator.GetCurrentLiveBucket();

        int totalClicks = _todayTotals.TotalClicks + liveBucket.TotalClicks;
        int totalKeyboard = _todayTotals.KeyboardPresses + liveBucket.KeyboardPresses;
        int activeSec = _todayTotals.ActiveSeconds + liveBucket.ActiveSeconds;
        int idleSec = _todayTotals.IdleSeconds + liveBucket.IdleSeconds;
        double distance = _todayTotals.MouseDistance + liveBucket.MouseDistance;

        lblTotalClicks.Text = totalClicks.ToString("N0");
        lblKeyboardPresses.Text = totalKeyboard.ToString("N0");

        var activeSpan = TimeSpan.FromSeconds(activeSec);
        var idleSpan = TimeSpan.FromSeconds(idleSec);

        lblActiveDuration.Text = $"{(int)activeSpan.TotalHours:D2}:{activeSpan.Minutes:D2}:{activeSpan.Seconds:D2}";
        lblIdleDuration.Text = $"{(int)idleSpan.TotalHours:D2}:{idleSpan.Minutes:D2}:{idleSpan.Seconds:D2}";
        lblMouseDistance.Text = $"{distance:N0} px";

        lblClickBreakdown.Text = $"L: {_todayTotals.LeftClicks + liveBucket.LeftClicks:N0}  |  R: {_todayTotals.RightClicks + liveBucket.RightClicks:N0}  |  M: {_todayTotals.MiddleClicks + liveBucket.MiddleClicks:N0}";

        lblQueueCount.Text = $"Pending records: {_syncService.PendingRecordsCount}";

        string syncText = _syncService.LastSyncTimeUtc.HasValue
            ? $"Last sync: {ToDhakaTime(_syncService.LastSyncTimeUtc.Value):hh:mm:ss tt}"
            : "Last sync: Never";
        lblLastSyncTime.Text = syncText;

        _trayIcon.Text = $"PULSE: {totalClicks + totalKeyboard:N0} inputs today";
    }

    private static DateTime ToDhakaTime(DateTime utc)
    {
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("Bangladesh Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(utc, tz);
        }
        catch
        {
            return utc.AddHours(6); // UTC+6 fallback
        }
    }

    private void UpdateStatusBadge()
    {
        if (_isTrackingPaused)
        {
            pnlStatusIndicator.BackColor = Color.FromArgb(234, 179, 8); // Amber
            lblStatusText.Text = "PAUSED";
            lblStatusText.ForeColor = Color.FromArgb(234, 179, 8);
            btnPauseResume.Text = "Resume Tracking";
            _trayIcon.Icon = CreatePulseIcon(Color.FromArgb(234, 179, 8));
        }
        else if (_idleDetector.IsIdle)
        {
            pnlStatusIndicator.BackColor = Color.FromArgb(148, 163, 184); // Slate
            lblStatusText.Text = "IDLE";
            lblStatusText.ForeColor = Color.FromArgb(148, 163, 184);
            btnPauseResume.Text = "Pause Tracking";
            _trayIcon.Icon = CreatePulseIcon(Color.FromArgb(148, 163, 184));
        }
        else
        {
            pnlStatusIndicator.BackColor = Color.FromArgb(34, 197, 94); // Green
            lblStatusText.Text = "TRACKING ACTIVE";
            lblStatusText.ForeColor = Color.FromArgb(34, 197, 94);
            btnPauseResume.Text = "Pause Tracking";
            _trayIcon.Icon = CreatePulseIcon(Color.FromArgb(34, 197, 94));
        }
    }

    private void TogglePause()
    {
        _isTrackingPaused = !_isTrackingPaused;
        if (_isTrackingPaused)
        {
            _collector.Pause();
        }
        else
        {
            _collector.Resume();
        }
        UpdateStatusBadge();
    }

    private void UpdateSyncLabel(bool success, string msg)
    {
        lblSyncMessage.Text = msg;
        lblSyncMessage.ForeColor = success ? Color.FromArgb(34, 197, 94) : Color.FromArgb(239, 68, 68);
    }

    private void OpenWebDashboard()
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "http://localhost:3000",
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Could not open browser: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void RestoreFromTray()
    {
        Show();
        WindowState = FormWindowState.Normal;
        BringToFront();
    }

    private void OnFormClosing(object? sender, FormClosingEventArgs e)
    {
        if (e.CloseReason == CloseReason.UserClosing)
        {
            e.Cancel = true;
            Hide();
            _trayIcon.ShowBalloonTip(1500, "Project PULSE", "Minimized to tray. Tracking continues in background.", ToolTipIcon.Info);
        }
    }

    private void ExitApplication()
    {
        _uiRefreshTimer.Stop();
        _collector.Stop();
        _aggregator.FlushCurrentBucket();
        _syncService.Stop();
        _trayIcon.Visible = false;
        _trayIcon.Dispose();
        Application.Exit();
    }

    private static Icon CreatePulseIcon(Color dotColor)
    {
        using var bmp = new Bitmap(32, 32);
        using (var g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.Clear(Color.Transparent);

            // Dark rounded background
            using var bgBrush = new SolidBrush(Color.FromArgb(15, 23, 42)); // Slate-900
            g.FillEllipse(bgBrush, 1, 1, 30, 30);

            // Colored center pulse dot
            using var dotBrush = new SolidBrush(dotColor);
            g.FillEllipse(dotBrush, 9, 9, 14, 14);
        }
        return Icon.FromHandle(bmp.GetHicon());
    }
}
