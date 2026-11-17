using Pulse.Agent.Services;

namespace Pulse.Agent.UI;

partial class MainForm
{
    private System.ComponentModel.IContainer components = null;

    private Panel pnlHeader;
    private Label lblTitle;
    private Label lblSubTitle;
    private Panel pnlStatusIndicator;
    private Label lblStatusText;
    private Label lblDeviceName;
    private Label lblDeviceId;

    private TabControl tabControl;
    private TabPage tabDashboard;
    private TabPage tabSettings;

    // Dashboard Cards
    private Panel cardClicks;
    private Label lblClicksTitle;
    private Label lblTotalClicks;
    private Label lblClickBreakdown;

    private Panel cardKeyboard;
    private Label lblKeyboardTitle;
    private Label lblKeyboardPresses;
    private Label lblKeyboardSub;

    private Panel cardActive;
    private Label lblActiveTitle;
    private Label lblActiveDuration;
    private Label lblIdleDuration;

    private Panel cardSync;
    private Label lblSyncTitle;
    private Label lblLastSyncTime;
    private Label lblQueueCount;
    private Label lblSyncMessage;
    private Label lblMouseDistance;

    // Controls
    private Button btnPauseResume;
    private Button btnForceSync;
    private Button btnOpenDashboard;

    // Settings Controls
    private Label lblPairTitle;
    private Label lblSupabaseUrl;
    private TextBox txtSupabaseUrl;
    private Label lblAnonKey;
    private TextBox txtAnonKey;
    private Label lblUserEmail;
    private TextBox txtUserEmail;
    private Label lblPassword;
    private TextBox txtPassword;
    private Label lblPairDeviceName;
    private TextBox txtPairDeviceName;
    private Button btnPairDevice;
    private CheckBox chkAutoStart;
    private Label lblPairStatus;

    protected override void Dispose(bool disposing)
    {
        if (disposing && (components != null))
        {
            components.Dispose();
        }
        base.Dispose(disposing);
    }

    private void InitializeComponent()
    {
        this.components = new System.ComponentModel.Container();

        this.pnlHeader = new Panel();
        this.lblTitle = new Label();
        this.lblSubTitle = new Label();
        this.pnlStatusIndicator = new Panel();
        this.lblStatusText = new Label();
        this.lblDeviceName = new Label();
        this.lblDeviceId = new Label();

        this.tabControl = new TabControl();
        this.tabDashboard = new TabPage();
        this.tabSettings = new TabPage();

        this.cardClicks = new Panel();
        this.lblClicksTitle = new Label();
        this.lblTotalClicks = new Label();
        this.lblClickBreakdown = new Label();

        this.cardKeyboard = new Panel();
        this.lblKeyboardTitle = new Label();
        this.lblKeyboardPresses = new Label();
        this.lblKeyboardSub = new Label();

        this.cardActive = new Panel();
        this.lblActiveTitle = new Label();
        this.lblActiveDuration = new Label();
        this.lblIdleDuration = new Label();

        this.cardSync = new Panel();
        this.lblSyncTitle = new Label();
        this.lblLastSyncTime = new Label();
        this.lblQueueCount = new Label();
        this.lblSyncMessage = new Label();
        this.lblMouseDistance = new Label();

        this.btnPauseResume = new Button();
        this.btnForceSync = new Button();
        this.btnOpenDashboard = new Button();

        // Settings
        this.lblPairTitle = new Label();
        this.lblSupabaseUrl = new Label();
        this.txtSupabaseUrl = new TextBox();
        this.lblAnonKey = new Label();
        this.txtAnonKey = new TextBox();
        this.lblUserEmail = new Label();
        this.txtUserEmail = new TextBox();
        this.lblPassword = new Label();
        this.txtPassword = new TextBox();
        this.lblPairDeviceName = new Label();
        this.txtPairDeviceName = new TextBox();
        this.btnPairDevice = new Button();
        this.chkAutoStart = new CheckBox();
        this.lblPairStatus = new Label();

        this.SuspendLayout();

        // Form settings
        this.Text = "Project PULSE — Desktop Agent";
        this.Size = new Size(720, 620);
        this.StartPosition = FormStartPosition.CenterScreen;
        this.FormBorderStyle = FormBorderStyle.FixedDialog;
        this.MaximizeBox = false;
        this.BackColor = Color.FromArgb(15, 23, 42); // Slate-900
        this.ForeColor = Color.FromArgb(248, 250, 252);
        this.Font = new Font("Segoe UI", 9.5F, FontStyle.Regular, GraphicsUnit.Point);

        // Header Panel
        this.pnlHeader.Dock = DockStyle.Top;
        this.pnlHeader.Height = 90;
        this.pnlHeader.BackColor = Color.FromArgb(30, 41, 59); // Slate-800
        this.pnlHeader.Padding = new Padding(20, 15, 20, 15);

        this.lblTitle.Text = "PROJECT PULSE";
        this.lblTitle.Font = new Font("Segoe UI", 16F, FontStyle.Bold);
        this.lblTitle.ForeColor = Color.FromArgb(56, 189, 248); // Sky-400
        this.lblTitle.Location = new Point(20, 15);
        this.lblTitle.AutoSize = true;

        this.lblSubTitle.Text = "Personal Digital Activity Analytics";
        this.lblSubTitle.Font = new Font("Segoe UI", 8.5F);
        this.lblSubTitle.ForeColor = Color.FromArgb(148, 163, 184);
        this.lblSubTitle.Location = new Point(22, 48);
        this.lblSubTitle.AutoSize = true;

        this.pnlStatusIndicator.Location = new Point(540, 22);
        this.pnlStatusIndicator.Size = new Size(12, 12);
        this.pnlStatusIndicator.BackColor = Color.FromArgb(34, 197, 94);

        this.lblStatusText.Text = "TRACKING ACTIVE";
        this.lblStatusText.Font = new Font("Segoe UI", 8.5F, FontStyle.Bold);
        this.lblStatusText.ForeColor = Color.FromArgb(34, 197, 94);
        this.lblStatusText.Location = new Point(560, 20);
        this.lblStatusText.AutoSize = true;

        this.lblDeviceName.Text = "Device: Personal Laptop";
        this.lblDeviceName.Font = new Font("Segoe UI", 8.5F);
        this.lblDeviceName.ForeColor = Color.FromArgb(203, 213, 225);
        this.lblDeviceName.Location = new Point(500, 42);
        this.lblDeviceName.AutoSize = true;

        this.lblDeviceId.Text = "ID: ...";
        this.lblDeviceId.Font = new Font("Segoe UI", 7.5F);
        this.lblDeviceId.ForeColor = Color.FromArgb(100, 116, 139);
        this.lblDeviceId.Location = new Point(500, 60);
        this.lblDeviceId.AutoSize = true;

        this.pnlHeader.Controls.AddRange(new Control[] {
            lblTitle, lblSubTitle, pnlStatusIndicator, lblStatusText, lblDeviceName, lblDeviceId
        });

        // Tab Control
        this.tabControl.Location = new Point(20, 105);
        this.tabControl.Size = new Size(665, 455);
        this.tabControl.TabPages.AddRange(new TabPage[] { tabDashboard, tabSettings });

        // Tab 1: Dashboard
        this.tabDashboard.Text = "  Activity Monitor  ";
        this.tabDashboard.BackColor = Color.FromArgb(15, 23, 42);

        // Card 1: Clicks
        this.cardClicks.Location = new Point(15, 15);
        this.cardClicks.Size = new Size(305, 115);
        this.cardClicks.BackColor = Color.FromArgb(30, 41, 59);

        this.lblClicksTitle.Text = "TODAY'S MOUSE CLICKS";
        this.lblClicksTitle.ForeColor = Color.FromArgb(148, 163, 184);
        this.lblClicksTitle.Font = new Font("Segoe UI", 8F, FontStyle.Bold);
        this.lblClicksTitle.Location = new Point(15, 12);
        this.lblClicksTitle.AutoSize = true;

        this.lblTotalClicks.Text = "0";
        this.lblTotalClicks.Font = new Font("Segoe UI", 22F, FontStyle.Bold);
        this.lblTotalClicks.ForeColor = Color.FromArgb(56, 189, 248);
        this.lblTotalClicks.Location = new Point(12, 34);
        this.lblTotalClicks.AutoSize = true;

        this.lblClickBreakdown.Text = "L: 0  |  R: 0  |  M: 0";
        this.lblClickBreakdown.Font = new Font("Segoe UI", 8F);
        this.lblClickBreakdown.ForeColor = Color.FromArgb(148, 163, 184);
        this.lblClickBreakdown.Location = new Point(15, 84);
        this.lblClickBreakdown.AutoSize = true;

        this.cardClicks.Controls.AddRange(new Control[] { lblClicksTitle, lblTotalClicks, lblClickBreakdown });

        // Card 2: Keyboard
        this.cardKeyboard.Location = new Point(335, 15);
        this.cardKeyboard.Size = new Size(305, 115);
        this.cardKeyboard.BackColor = Color.FromArgb(30, 41, 59);

        this.lblKeyboardTitle.Text = "TODAY'S KEY PRESSES";
        this.lblKeyboardTitle.ForeColor = Color.FromArgb(148, 163, 184);
        this.lblKeyboardTitle.Font = new Font("Segoe UI", 8F, FontStyle.Bold);
        this.lblKeyboardTitle.Location = new Point(15, 12);
        this.lblKeyboardTitle.AutoSize = true;

        this.lblKeyboardPresses.Text = "0";
        this.lblKeyboardPresses.Font = new Font("Segoe UI", 22F, FontStyle.Bold);
        this.lblKeyboardPresses.ForeColor = Color.FromArgb(168, 85, 247); // Purple-400
        this.lblKeyboardPresses.Location = new Point(12, 34);
        this.lblKeyboardPresses.AutoSize = true;

        this.lblKeyboardSub.Text = "Key-down events (Privacy preserved)";
        this.lblKeyboardSub.Font = new Font("Segoe UI", 8F);
        this.lblKeyboardSub.ForeColor = Color.FromArgb(148, 163, 184);
        this.lblKeyboardSub.Location = new Point(15, 84);
        this.lblKeyboardSub.AutoSize = true;

        this.cardKeyboard.Controls.AddRange(new Control[] { lblKeyboardTitle, lblKeyboardPresses, lblKeyboardSub });

        // Card 3: Active Time
        this.cardActive.Location = new Point(15, 145);
        this.cardActive.Size = new Size(305, 115);
        this.cardActive.BackColor = Color.FromArgb(30, 41, 59);

        this.lblActiveTitle.Text = "ACTIVE & IDLE TIME";
        this.lblActiveTitle.ForeColor = Color.FromArgb(148, 163, 184);
        this.lblActiveTitle.Font = new Font("Segoe UI", 8F, FontStyle.Bold);
        this.lblActiveTitle.Location = new Point(15, 12);
        this.lblActiveTitle.AutoSize = true;

        this.lblActiveDuration.Text = "00:00:00";
        this.lblActiveDuration.Font = new Font("Segoe UI", 20F, FontStyle.Bold);
        this.lblActiveDuration.ForeColor = Color.FromArgb(34, 197, 94); // Green-400
        this.lblActiveDuration.Location = new Point(12, 36);
        this.lblActiveDuration.AutoSize = true;

        this.lblIdleDuration.Text = "Idle: 00:00:00";
        this.lblIdleDuration.Font = new Font("Segoe UI", 8.5F);
        this.lblIdleDuration.ForeColor = Color.FromArgb(148, 163, 184);
        this.lblIdleDuration.Location = new Point(15, 84);
        this.lblIdleDuration.AutoSize = true;

        this.cardActive.Controls.AddRange(new Control[] { lblActiveTitle, lblActiveDuration, lblIdleDuration });

        // Card 4: Cloud Sync
        this.cardSync.Location = new Point(335, 145);
        this.cardSync.Size = new Size(305, 115);
        this.cardSync.BackColor = Color.FromArgb(30, 41, 59);

        this.lblSyncTitle.Text = "CLOUD SYNCHRONIZATION";
        this.lblSyncTitle.ForeColor = Color.FromArgb(148, 163, 184);
        this.lblSyncTitle.Font = new Font("Segoe UI", 8F, FontStyle.Bold);
        this.lblSyncTitle.Location = new Point(15, 12);
        this.lblSyncTitle.AutoSize = true;

        this.lblLastSyncTime.Text = "Last sync: Checking...";
        this.lblLastSyncTime.Font = new Font("Segoe UI", 9F);
        this.lblLastSyncTime.ForeColor = Color.FromArgb(226, 232, 240);
        this.lblLastSyncTime.Location = new Point(15, 38);
        this.lblLastSyncTime.AutoSize = true;

        this.lblQueueCount.Text = "Pending records: 0";
        this.lblQueueCount.Font = new Font("Segoe UI", 8F);
        this.lblQueueCount.ForeColor = Color.FromArgb(148, 163, 184);
        this.lblQueueCount.Location = new Point(15, 62);
        this.lblQueueCount.AutoSize = true;

        this.lblSyncMessage.Text = "Ready";
        this.lblSyncMessage.Font = new Font("Segoe UI", 8F);
        this.lblSyncMessage.ForeColor = Color.FromArgb(34, 197, 94);
        this.lblSyncMessage.Location = new Point(15, 84);
        this.lblSyncMessage.AutoSize = true;

        this.cardSync.Controls.AddRange(new Control[] { lblSyncTitle, lblLastSyncTime, lblQueueCount, lblSyncMessage });

        // Buttons
        this.btnPauseResume.Text = "Pause Tracking";
        this.btnPauseResume.Location = new Point(15, 280);
        this.btnPauseResume.Size = new Size(180, 42);
        this.btnPauseResume.BackColor = Color.FromArgb(51, 65, 85);
        this.btnPauseResume.ForeColor = Color.White;
        this.btnPauseResume.FlatStyle = FlatStyle.Flat;
        this.btnPauseResume.Click += (s, e) => TogglePause();

        this.btnForceSync.Text = "Force Sync Now";
        this.btnForceSync.Location = new Point(210, 280);
        this.btnForceSync.Size = new Size(180, 42);
        this.btnForceSync.BackColor = Color.FromArgb(51, 65, 85);
        this.btnForceSync.ForeColor = Color.White;
        this.btnForceSync.FlatStyle = FlatStyle.Flat;
        this.btnForceSync.Click += async (s, e) => await _syncService.ForceSyncNowAsync();

        this.btnOpenDashboard.Text = "Open Web Dashboard";
        this.btnOpenDashboard.Location = new Point(405, 280);
        this.btnOpenDashboard.Size = new Size(235, 42);
        this.btnOpenDashboard.BackColor = Color.FromArgb(14, 165, 233); // Sky-500
        this.btnOpenDashboard.ForeColor = Color.White;
        this.btnOpenDashboard.FlatStyle = FlatStyle.Flat;
        this.btnOpenDashboard.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);
        this.btnOpenDashboard.Click += (s, e) => OpenWebDashboard();

        this.lblMouseDistance.Text = "Movement distance today: 0 px";
        this.lblMouseDistance.Location = new Point(15, 345);
        this.lblMouseDistance.AutoSize = true;
        this.lblMouseDistance.ForeColor = Color.FromArgb(100, 116, 139);

        this.tabDashboard.Controls.AddRange(new Control[] {
            cardClicks, cardKeyboard, cardActive, cardSync,
            btnPauseResume, btnForceSync, btnOpenDashboard, lblMouseDistance
        });

        // Tab 2: Settings & Pairing
        this.tabSettings.Text = "  Device Pairing & Settings  ";
        this.tabSettings.BackColor = Color.FromArgb(15, 23, 42);
        this.tabSettings.Padding = new Padding(20);

        this.lblPairTitle.Text = "PAIR DEVICE WITH ACCOUNT";
        this.lblPairTitle.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
        this.lblPairTitle.ForeColor = Color.FromArgb(56, 189, 248);
        this.lblPairTitle.Location = new Point(20, 15);
        this.lblPairTitle.AutoSize = true;

        this.lblSupabaseUrl.Text = "Supabase Project URL:";
        this.lblSupabaseUrl.Location = new Point(20, 50);
        this.lblSupabaseUrl.AutoSize = true;

        this.txtSupabaseUrl.Location = new Point(20, 72);
        this.txtSupabaseUrl.Size = new Size(600, 26);
        this.txtSupabaseUrl.BackColor = Color.FromArgb(30, 41, 59);
        this.txtSupabaseUrl.ForeColor = Color.White;

        this.lblAnonKey.Text = "Supabase Publishable/Anon Key:";
        this.lblAnonKey.Location = new Point(20, 105);
        this.lblAnonKey.AutoSize = true;

        this.txtAnonKey.Location = new Point(20, 127);
        this.txtAnonKey.Size = new Size(600, 26);
        this.txtAnonKey.BackColor = Color.FromArgb(30, 41, 59);
        this.txtAnonKey.ForeColor = Color.White;

        this.lblUserEmail.Text = "Account Email:";
        this.lblUserEmail.Location = new Point(20, 160);
        this.lblUserEmail.AutoSize = true;

        this.txtUserEmail.Location = new Point(20, 182);
        this.txtUserEmail.Size = new Size(290, 26);
        this.txtUserEmail.BackColor = Color.FromArgb(30, 41, 59);
        this.txtUserEmail.ForeColor = Color.White;

        this.lblPassword.Text = "Password:";
        this.lblPassword.Location = new Point(330, 160);
        this.lblPassword.AutoSize = true;

        this.txtPassword.Location = new Point(330, 182);
        this.txtPassword.Size = new Size(290, 26);
        this.txtPassword.UseSystemPasswordChar = true;
        this.txtPassword.BackColor = Color.FromArgb(30, 41, 59);
        this.txtPassword.ForeColor = Color.White;

        this.lblPairDeviceName.Text = "Device Label (e.g. 'Personal Laptop' or 'Office PC'):";
        this.lblPairDeviceName.Location = new Point(20, 218);
        this.lblPairDeviceName.AutoSize = true;

        this.txtPairDeviceName.Text = "Personal Laptop";
        this.txtPairDeviceName.Location = new Point(20, 240);
        this.txtPairDeviceName.Size = new Size(600, 26);
        this.txtPairDeviceName.BackColor = Color.FromArgb(30, 41, 59);
        this.txtPairDeviceName.ForeColor = Color.White;

        this.btnPairDevice.Text = "Sign In & Pair This Device";
        this.btnPairDevice.Location = new Point(20, 280);
        this.btnPairDevice.Size = new Size(260, 40);
        this.btnPairDevice.BackColor = Color.FromArgb(16, 185, 129); // Emerald-500
        this.btnPairDevice.ForeColor = Color.White;
        this.btnPairDevice.FlatStyle = FlatStyle.Flat;
        this.btnPairDevice.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);
        this.btnPairDevice.Click += async (s, e) =>
        {
            lblPairStatus.Text = "Pairing device...";
            lblPairStatus.ForeColor = Color.FromArgb(234, 179, 8);
            var (ok, msg) = await _authService.SignInAndPairDeviceAsync(
                txtSupabaseUrl.Text.Trim(),
                txtAnonKey.Text.Trim(),
                txtUserEmail.Text.Trim(),
                txtPassword.Text,
                txtPairDeviceName.Text.Trim());

            lblPairStatus.Text = msg;
            lblPairStatus.ForeColor = ok ? Color.FromArgb(34, 197, 94) : Color.FromArgb(239, 68, 68);
            if (ok)
            {
                await InitializeFormAsync();
                await _syncService.ForceSyncNowAsync();
            }
        };

        this.chkAutoStart.Text = "Start Project PULSE automatically on Windows login";
        this.chkAutoStart.Location = new Point(20, 335);
        this.chkAutoStart.AutoSize = true;
        this.chkAutoStart.CheckedChanged += (s, e) => StartupManager.SetStartup(chkAutoStart.Checked);

        this.lblPairStatus.Text = "";
        this.lblPairStatus.Location = new Point(290, 290);
        this.lblPairStatus.AutoSize = true;

        this.tabSettings.Controls.AddRange(new Control[] {
            lblPairTitle, lblSupabaseUrl, txtSupabaseUrl, lblAnonKey, txtAnonKey,
            lblUserEmail, txtUserEmail, lblPassword, txtPassword,
            lblPairDeviceName, txtPairDeviceName, btnPairDevice, chkAutoStart, lblPairStatus
        });

        this.Controls.Add(this.tabControl);
        this.Controls.Add(this.pnlHeader);

        this.ResumeLayout(false);
    }
}
