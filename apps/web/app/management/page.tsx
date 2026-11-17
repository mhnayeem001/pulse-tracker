"use client";

import { useState } from "react";
import { Cpu, Laptop, Monitor, AlertTriangle, Edit3, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";
import { DEMO_DEVICES, toDhakaTimeString } from "@/lib/analyticsService";
import { Device } from "@/types";

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<Device[]>(DEMO_DEVICES);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [newName, setNewName] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);

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
      {/* Title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Cpu className="w-7 h-7 text-sky-400" />
          Device Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Register, label, monitor heartbeat, and manage cryptographic authorizations for your computers
        </p>
      </div>

      {/* Devices List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm overflow-x-auto">
        <h2 className="text-base font-semibold text-white mb-4">Authorized Windows 11 Computers</h2>

        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="text-slate-400 border-b border-slate-800 font-mono">
            <tr>
              <th className="pb-3 font-semibold">Device</th>
              <th className="pb-3 font-semibold">Device UUID</th>
              <th className="pb-3 font-semibold">OS & Agent</th>
              <th className="pb-3 font-semibold">Last Heartbeat</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {devices.map((device) => {
              const isLaptop = device.device_type === "laptop";
              return (
                <tr key={device.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                        {isLaptop ? <Laptop className="w-4 h-4 text-sky-400" /> : <Monitor className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{device.device_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{device.hostname}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-mono text-[11px] text-slate-400">
                    <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {device.id.slice(0, 8)}...{device.id.slice(-4)}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="text-slate-300">{device.os_version}</div>
                    <div className="text-slate-500 text-[10px] font-mono">Agent v{device.agent_version}</div>
                  </td>
                  <td className="py-4 font-mono text-[11px] text-slate-400">
                    {toDhakaTimeString(device.last_seen_at)}
                  </td>
                  <td className="py-4">
                    {device.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Revoked
                      </span>
                    )}
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
                      {device.is_active && (
                        <button
                          onClick={() => setRevokingId(device.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
                          title="Revoke Device Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pairing Instructions for Second PC */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-2">How to Connect Your Second PC (Office PC)</h2>
        <p className="text-xs text-slate-400 mb-4">
          Both your Personal Laptop and Office PC connect to the exact same Project PULSE account while maintaining independent device UUIDs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center mb-2">
              1
            </span>
            <strong className="text-white block mb-1">Install Agent on Office PC</strong>
            <p className="text-slate-400">
              Run the self-contained <code className="text-sky-400 font-mono">Pulse.Agent.exe</code> installer on your second Windows 11 computer.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center mb-2">
              2
            </span>
            <strong className="text-white block mb-1">Open Device Pairing Tab</strong>
            <p className="text-slate-400">
              In the desktop Agent window, switch to the <em>"Device Pairing & Settings"</em> tab. Enter your account email and password.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center mb-2">
              3
            </span>
            <strong className="text-white block mb-1">Set Label as "Office PC"</strong>
            <p className="text-slate-400">
              Click <em>"Sign In & Pair This Device"</em>. The agent will generate a new unique UUID and register under your account automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Rename Dialog Modal */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Rename Device</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter a new label for <strong className="text-white">{editingDevice.device_name}</strong>
            </p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 mb-6"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingDevice(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white shadow"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {revokingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Revoke Device Authorization?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Revoking this device will permanently stop all future synchronization from its local Windows Agent. Historical data will be preserved.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRevokingId(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmRevoke(revokingId)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow"
              >
                Revoke Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
