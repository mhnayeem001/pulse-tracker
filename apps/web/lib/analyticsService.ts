import { supabase, isSupabaseConfigured } from "./supabase";
import { Device, ActivitySummary, DashboardMetrics, HourlyStat, DailyStat, HeatmapCell, TimeRange } from "../types";

// Mock Fallback Fixtures (Represents Personal Laptop and Office PC)
export const DEMO_DEVICES: Device[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    user_id: "00000000-0000-0000-0000-000000000001",
    device_name: "Personal Laptop",
    device_type: "laptop",
    hostname: "ALEX-LAPTOP",
    os_version: "Microsoft Windows 11 Pro 10.0.26100",
    agent_version: "1.0.0",
    registered_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    last_seen_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
    is_active: true,
    revoked_at: null,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    user_id: "00000000-0000-0000-0000-000000000001",
    device_name: "Office PC",
    device_type: "desktop",
    hostname: "ALEX-WORKSTATION",
    os_version: "Microsoft Windows 11 Enterprise 10.0.26100",
    agent_version: "1.0.0",
    registered_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    last_seen_at: new Date(Date.now() - 15 * 60000).toISOString(),
    last_sync_at: new Date(Date.now() - 15 * 60000).toISOString(),
    is_active: true,
    revoked_at: null,
  },
];

export async function fetchDevices(): Promise<Device[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .order("registered_at", { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fallback
    }
  }
  return DEMO_DEVICES;
}

export function calculateMetrics(summaries: ActivitySummary[]): DashboardMetrics {
  let leftClicks = 0;
  let rightClicks = 0;
  let middleClicks = 0;
  let xClicks = 0;
  let keyboard = 0;
  let activeSec = 0;
  let idleSec = 0;
  let vScroll = 0;
  let distance = 0;

  for (const s of summaries) {
    leftClicks += s.left_clicks || 0;
    rightClicks += s.right_clicks || 0;
    middleClicks += s.middle_clicks || 0;
    xClicks += (s.x1_clicks || 0) + (s.x2_clicks || 0);
    keyboard += s.keyboard_presses || 0;
    activeSec += s.active_seconds || 0;
    idleSec += s.idle_seconds || 0;
    vScroll += Math.abs(s.vertical_scroll || 0);
    distance += s.mouse_distance || 0;
  }

  const totalClicks = leftClicks + rightClicks + middleClicks + xClicks;
  const totalActions = totalClicks + keyboard;
  const totalDuration = activeSec + idleSec;
  const activePercentage = totalDuration > 0 ? (activeSec / totalDuration) * 100 : 0;

  return {
    totalClicks,
    leftClicks,
    rightClicks,
    middleClicks,
    xClicks,
    totalKeyboard: keyboard,
    totalActions,
    activeSeconds: activeSec,
    idleSeconds: idleSec,
    verticalScroll: vScroll,
    mouseDistance: Math.round(distance),
    activePercentage: Math.round(activePercentage * 10) / 10,
  };
}

export function generateHourlyDistribution(range: TimeRange, deviceId?: string): HourlyStat[] {
  const result: HourlyStat[] = [];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  for (const h of hours) {
    const hourLabel = `${h.toString().padStart(2, "0")}:00`;
    // Work pattern: higher from 09:00 to 19:00
    const isWorkHour = h >= 9 && h <= 18;
    const isLateNight = h >= 19 && h <= 23;

    let baseClicks = 0;
    let baseKeys = 0;
    let activeMins = 0;

    if (isWorkHour) {
      baseClicks = 180 + ((h * 37) % 120);
      baseKeys = 450 + ((h * 61) % 280);
      activeMins = 42 + (h % 14);
    } else if (isLateNight) {
      baseClicks = 95 + ((h * 19) % 70);
      baseKeys = 180 + ((h * 29) % 120);
      activeMins = 25 + (h % 15);
    } else {
      baseClicks = (h === 8 || h === 0) ? 35 : 0;
      baseKeys = (h === 8 || h === 0) ? 60 : 0;
      activeMins = (h === 8 || h === 0) ? 8 : 0;
    }

    if (deviceId === DEMO_DEVICES[0].id) {
      // Personal Laptop: More active in evening and afternoon
      baseClicks = Math.round(baseClicks * (isLateNight ? 1.5 : 0.6));
      baseKeys = Math.round(baseKeys * (isLateNight ? 1.4 : 0.5));
    } else if (deviceId === DEMO_DEVICES[1].id) {
      // Office PC: Mostly active in work hours
      baseClicks = isWorkHour ? baseClicks : 0;
      baseKeys = isWorkHour ? baseKeys : 0;
      activeMins = isWorkHour ? activeMins : 0;
    }

    result.push({
      hour: hourLabel,
      clicks: baseClicks,
      keyboard: baseKeys,
      activeMinutes: Math.min(60, activeMins),
    });
  }
  return result;
}

export function generateDailyTrends(days: number = 7): DailyStat[] {
  const result: DailyStat[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    const laptopClicks = isWeekend ? 1420 + (i * 123) % 400 : 850 + (i * 97) % 300;
    const officeClicks = isWeekend ? 0 : 2100 + (i * 211) % 600;
    const laptopKeys = isWeekend ? 3200 + (i * 350) % 800 : 1900 + (i * 250) % 500;
    const officeKeys = isWeekend ? 0 : 5400 + (i * 420) % 1200;

    const activeSec = (laptopClicks + officeClicks) * 4;
    const idleSec = activeSec * 0.4;

    result.push({
      date: dateStr,
      formattedDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      laptopClicks,
      officeClicks,
      totalClicks: laptopClicks + officeClicks,
      laptopKeyboard: laptopKeys,
      officeKeyboard: officeKeys,
      totalKeyboard: laptopKeys + officeKeys,
      activeSeconds: Math.round(activeSec),
      idleSeconds: Math.round(idleSec),
    });
  }
  return result;
}

export function generateHeatmapGrid(metric: "clicks" | "keyboard" | "actions" | "active"): HeatmapCell[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cells: HeatmapCell[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayName = days[dayIndex];
    const isWeekend = dayIndex >= 5;

    for (let hour = 0; hour < 24; hour++) {
      let val = 0;
      if (hour >= 9 && hour <= 18) {
        val = isWeekend ? 40 + ((dayIndex * 13 + hour * 7) % 60) : 180 + ((dayIndex * 29 + hour * 17) % 220);
      } else if (hour >= 19 && hour <= 23) {
        val = 70 + ((dayIndex * 17 + hour * 11) % 90);
      } else {
        val = hour === 8 ? 20 : 0;
      }

      if (metric === "keyboard") val = Math.round(val * 2.8);
      if (metric === "actions") val = Math.round(val * 3.8);
      if (metric === "active") val = Math.min(60, Math.round(val * 0.25));

      cells.push({
        dayIndex,
        dayName,
        hour,
        value: val,
      });
    }
  }
  return cells;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function toDhakaTimeString(utcDateStr: string): string {
  try {
    const date = new Date(utcDateStr);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return utcDateStr;
  }
}
