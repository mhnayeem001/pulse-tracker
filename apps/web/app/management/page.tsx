"use client";

import { useState, useEffect } from "react";
import { Cpu, Laptop, Monitor, AlertTriangle, Edit3, Trash2, CheckCircle2, ShieldAlert, RefreshCw } from "lucide-react";
import { DEMO_DEVICES, fetchDevices, toDhakaTimeString } from "@/lib/analyticsService";
import { Device } from "@/types";

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<Device[]>(DEMO_DEVICES);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [newName, setNewName] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDevices = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    const res = await fetchDevices();
    setDevices(res);
    if (refresh) setIsRefreshing(false);
  };

  useEffect(() => {
    loadDevices();
    const interval = setInterval(() => loadDevices(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveRename = () => {
    if (!editingDevice || !newName.trim()) return;
    setDevices((prev) =>
      prev.map((d) => (d.id === editingDevice.id ? { ...d, device_name: newName.trim() } : d))
    );
    setEditingDevice(null);
  };

  const handleConfirmRevoke = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_active: false, revoked_at: new Date().toISOString() } : d))
    );
    setRevokingId(null);
  };

  return (
    <div className="space-y-8">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Cpu className="w-7 h-7 text-sky-400" />
              Device Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              {devices.length} Online Device(s)
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Register, label, monitor heartbeat, and manage cryptographic authorizations for your computers
          </p>
        </div>

        <button
          onClick={() => loadDevices(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
          <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Devices List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm overflow-x-auto">
        <h2 className="text-base font-semibold text-white mb-4">Authorized Windows 11 Computers</h2>

        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="text-slate-400 border-b border-slate-800 font-mono">
            <tr>
              <th className="pb-3 font-semibold">Device</th>
              <th className="pb-3 font-semibold">Device UUID</th>
              <th className="pb-3 font-semibold">OS &amp; Agent</th>
              <th className="pb-3 font-semibold">Last Heartbeat</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {devices.map((device) => {
              const isLaptop =
                device.device_type === "laptop" ||
                device.device_name?.toLowerCase().includes("laptop");
              return (
                <tr key={device.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
                        {isLaptop ? <Laptop className="w-4 h-4" /> : <Monitor className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {device.device_name}
                          {device.is_active && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{device.hostname}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-mono text-[11px] text-slate-400">{device.id}</td>
                  <td className="py-4 font-mono text-[11px] text-slate-400">
                    {device.os_version} • v{device.agent_version}
                  </td>
                  <td className="py-4 font-mono text-[11px] text-slate-300">
                    {device.last_seen_at ? toDhakaTimeString(device.last_seen_at) : "Active now"}
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        device.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {device.is_active ? "Authorized" : "Revoked"}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingDevice(device);
                          setNewName(device.device_name);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Rename Device"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rename Dialog Modal */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Rename Device</h3>
            <p className="text-xs text-slate-400">
              Update the friendly display label for this device across all analytics pages.
            </p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Personal Laptop"
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg p-2.5 font-medium focus:outline-none focus:border-sky-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingDevice(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
              >
                Save Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
