using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Pulse.Agent.Services;
using Pulse.Agent.UI;
using Pulse.Collector;
using Pulse.Core.Interfaces;
using Pulse.Core.Models;
using Pulse.Storage;
using Pulse.Sync;

namespace Pulse.Agent;

internal static class Program
{
    [STAThread]
    private static void Main(string[] args)
    {
        try
        {
            ApplicationConfiguration.Initialize();

            // Database path in LocalAppData
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string pulseDir = Path.Combine(localAppData, "ProjectPulse");
            if (!Directory.Exists(pulseDir)) Directory.CreateDirectory(pulseDir);
            string dbPath = Path.Combine(pulseDir, "pulse.db");

            var host = Host.CreateDefaultBuilder(args)
                .ConfigureServices((context, services) =>
                {
                    services.AddLogging(builder =>
                    {
                        builder.AddConsole();
                        builder.SetMinimumLevel(LogLevel.Information);
                    });

                    services.AddSingleton<ISecureStorage, DpapiSecureStorage>();
                    services.AddSingleton<IStorageService>(sp => new SqliteStorageService(dbPath, sp.GetService<ILogger<SqliteStorageService>>()));
                    services.AddSingleton<IInputCollector, InputCollector>();
                    services.AddSingleton<IIdleDetector, IdleDetector>();
                    services.AddSingleton<SessionPowerMonitor>();

                    services.AddSingleton(sp =>
                    {
                        var storage = sp.GetRequiredService<IStorageService>();
                        var dev = new DeviceRegistration();
                        try
                        {
                            var regTask = storage.GetDeviceRegistrationAsync();
                            regTask.Wait();
                            dev = regTask.Result ?? new DeviceRegistration();
                        }
                        catch { }
                        return new ActivityAggregator(dev.Id, dev.UserId, sp.GetService<ILogger<ActivityAggregator>>());
                    });

                    services.AddSingleton<ISyncService, SupabaseSyncService>();
                    services.AddSingleton<AuthService>();
                    services.AddSingleton<MainForm>();
                })
                .Build();

            // Initialize SQLite Storage
            var storage = host.Services.GetRequiredService<IStorageService>();
            storage.InitializeAsync().Wait();

            // Start collectors and services
            var collector = host.Services.GetRequiredService<IInputCollector>();
            collector.Start();

            var sessionMonitor = host.Services.GetRequiredService<SessionPowerMonitor>();
            sessionMonitor.Start();

            var syncService = host.Services.GetRequiredService<ISyncService>();
            syncService.Start();

            var mainForm = host.Services.GetRequiredService<MainForm>();

            // If started with --minimized, start with form hidden
            bool startMinimized = args.Any(a => a.Equals("--minimized", StringComparison.OrdinalIgnoreCase));
            if (startMinimized)
            {
                mainForm.WindowState = FormWindowState.Minimized;
                mainForm.ShowInTaskbar = false;
            }

            Application.Run(mainForm);

            // Clean shutdown
            collector.Stop();
            sessionMonitor.Stop();
            syncService.Stop();
        }
        catch (Exception ex)
        {
            File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "startup_error.log"), ex.ToString());
            MessageBox.Show(ex.ToString(), "Project PULSE Startup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
