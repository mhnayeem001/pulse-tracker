import { supabase, isSupabaseConfigured } from "./supabase";
import { Device, ActivitySummary, DashboardMetrics, HourlyStat, DailyStat, HeatmapCell, TimeRange } from "../types";

export const DEFAULT_USER = {
  name: "MH Nayeem",
  email: "admin@projectpulse.dev",
  role: "Personal & Office PC",
};

// Default fallback devices while loading
export const DEMO_DEVICES: Device[] = [
  {
    id: "personal-laptop",
    user_id: "38326e10-7371-42d8-aed7-562f57c84aa6",
    device_name: "Personal Laptop",
    device_type: "laptop",
    hostname: "LAPTOP",
    os_version: "Windows 11",
    agent_version: "1.0.0",
    registered_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
    is_active: true,
    revoked_at: null,
  },
  {
    id: "office-pc",
    user_id: "38326e10-7371-42d8-aed7-562f57c84aa6",
    device_name: "Office pc",
    device_type: "desktop",
    hostname: "OFFICE-PC",
    os_version: "Windows 11",
    agent_version: "1.0.0",
    registered_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
    is_active: true,
    revoked_at: null,
  },
];

/**
 * Ensures authenticated session so Supabase RLS policies allow reading user data
 */
export async function ensureAuthenticated() {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: "admin@projectpulse.dev",
      password: "PulsePassword123!",
    });
    if (!error && data.user) return data.user;
  } catch (err) {
    console.warn("Supabase auth check:", err);
  }
  return null;
}

/**
 * Fetches all registered devices from the live database
 */
export async function fetchDevices(): Promise<Device[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      await ensureAuthenticated();
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .order("registered_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Device[];
      }
    } catch (err) {
      console.warn("fetchDevices error:", err);
    }
  }
  return DEMO_DEVICES;
}

export function getDhakaMidnightDate(daysAgo: number = 0): Date {
  const now = new Date();
  const dhakaStr = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  const dhakaNow = new Date(dhakaStr);
  const target = new Date(dhakaNow);
  target.setDate(target.getDate() - daysAgo);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return new Date(`${year}-${month}-${day}T00:00:00+06:00`);
}

export function getDhakaDateString(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

export function getDhakaFormattedDate(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { timeZone: "Asia/Dhaka", month: "short", day: "numeric" });
}

/**
 * Fetches live activity summaries from Supabase for a given time range and device
 */
export async function fetchLiveSummaries(range: TimeRange = "today", deviceId?: string): Promise<ActivitySummary[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    await ensureAuthenticated();

    let startDate: Date;
    let endDate: Date | null = null;

    if (range === "today") {
      startDate = getDhakaMidnightDate(0);
    } else if (range === "yesterday") {
      startDate = getDhakaMidnightDate(1);
      endDate = getDhakaMidnightDate(0);
    } else if (range === "7d") {
      startDate = getDhakaMidnightDate(7);
    } else if (range === "30d") {
      startDate = getDhakaMidnightDate(30);
    } else {
      startDate = getDhakaMidnightDate(0);
    }

    let query = supabase
      .from("activity_summaries")
      .select("*")
      .gte("bucket_start", startDate.toISOString())
      .order("bucket_start", { ascending: true });

    if (endDate) {
      query = query.lt("bucket_start", endDate.toISOString());
    }

    if (deviceId && deviceId !== "all") {
      query = query.eq("device_id", deviceId);
    }

    const { data, error } = await query;
    if (!error && data) {
      return data as ActivitySummary[];
    }
  } catch (err) {
    console.warn("fetchLiveSummaries error:", err);
  }
  return [];
}

/**
 * 3-Tier Developer Productivity Telemetry:
 * - Direct Active Time: Hands-on typing, clicking, mouse movements (micro-pauses <= 15s).
 * - AI & Build Wait Time: Prompt response wait, backend compilation, reading & review (15s - 180s).
 * - Away / True Break Time: User stepped away (>180s inactivity, screen locked Win+L, or sleep).
 *
 * Total Productive Work = Direct Active + AI & Build Wait Time.
 */
export function get3TierActivity(s: ActivitySummary): {
  activeSeconds: number;
  waitSeconds: number;
  idleSeconds: number;
  productiveSeconds: number;
} {
  // If agent already persisted explicit wait_seconds (new version)
  if (s.wait_seconds !== undefined && s.wait_seconds !== null && s.wait_seconds >= 0) {
    const act = Math.min(60, Math.max(0, s.active_seconds || 0));
    const wt = Math.min(60, Math.max(0, s.wait_seconds));
    const idl = Math.min(60, Math.max(0, s.idle_seconds || 0));
    
    let finalActive = act;
    let finalWait = wt;
    let finalIdle = idl;
    const sum = finalActive + finalWait + finalIdle;
    if (sum !== 60 && sum > 0) {
      finalIdle = Math.max(0, 60 - (finalActive + finalWait));
    }
    return {
      activeSeconds: finalActive,
      waitSeconds: finalWait,
      idleSeconds: finalIdle,
      productiveSeconds: finalActive + finalWait,
    };
  }

  // Backwards compatibility for existing / historical records
  const clicks = (s.left_clicks || 0) + (s.right_clicks || 0) + (s.middle_clicks || 0) + (s.x1_clicks || 0) + (s.x2_clicks || 0);
  const keys = s.keyboard_presses || 0;
  const moves = s.mouse_movement_events || 0;
  const inputs = clicks + keys + moves;

  if (inputs === 0) {
    if ((s.active_seconds || 0) > 0) {
      const wait = Math.min(60, Math.max(0, s.active_seconds));
      return {
        activeSeconds: 0,
        waitSeconds: wait,
        idleSeconds: Math.max(0, 60 - wait),
        productiveSeconds: wait,
      };
    }
    return { activeSeconds: 0, waitSeconds: 0, idleSeconds: 60, productiveSeconds: 0 };
  }

  const rawActive = Math.min(60, Math.max(0, s.active_seconds || 0));
  const estimatedDirectActive = Math.min(60, Math.max(10, Math.round(clicks * 2 + keys * 0.5)));
  const activeSeconds = rawActive > 0 ? Math.min(rawActive, estimatedDirectActive) : estimatedDirectActive;
  const waitSeconds = Math.max(0, (rawActive > 0 ? rawActive : 60) - activeSeconds);
  const idleSeconds = Math.max(0, 60 - (activeSeconds + waitSeconds));

  return {
    activeSeconds,
    waitSeconds,
    idleSeconds,
    productiveSeconds: activeSeconds + waitSeconds,
  };
}

/**
 * Normalizes active vs idle time per 60-second summary:
 * - If 0 clicks, 0 keys, and 0 mouse moves: user was not using computer -> 100% IDLE (0s active, 60s idle).
 * - If user interacted: ensures active + idle equals 60s realistically.
 */
export function getCleanSummaryActivity(s: ActivitySummary): { activeSeconds: number; idleSeconds: number } {
  const threeTier = get3TierActivity(s);
  return {
    activeSeconds: threeTier.productiveSeconds,
    idleSeconds: threeTier.idleSeconds,
  };
}

/**
 * Calculate totals and high-level metrics from real summaries
 */
export function calculateMetrics(summaries: ActivitySummary[]): DashboardMetrics {
  let leftClicks = 0;
  let rightClicks = 0;
  let middleClicks = 0;
  let xClicks = 0;
  let keyboard = 0;
  let directActiveSec = 0;
  let waitSec = 0;
  let idleSec = 0;
  let vScroll = 0;
  let distance = 0;

  for (const s of summaries) {
    leftClicks += s.left_clicks || 0;
    rightClicks += s.right_clicks || 0;
    middleClicks += s.middle_clicks || 0;
    xClicks += (s.x1_clicks || 0) + (s.x2_clicks || 0);
    keyboard += s.keyboard_presses || 0;

    const threeTier = get3TierActivity(s);
    directActiveSec += threeTier.activeSeconds;
    waitSec += threeTier.waitSeconds;
    idleSec += threeTier.idleSeconds;

    vScroll += Math.abs(s.vertical_scroll || 0);
    distance += s.mouse_distance || 0;
  }

  const totalClicks = leftClicks + rightClicks + middleClicks + xClicks;
  const totalActions = totalClicks + keyboard;
  const productiveSec = directActiveSec + waitSec;
  const totalDuration = productiveSec + idleSec;
  const activePercentage = totalDuration > 0 ? (directActiveSec / totalDuration) * 100 : 0;
  const productivePercentage = totalDuration > 0 ? (productiveSec / totalDuration) * 100 : 0;

  return {
    totalClicks,
    leftClicks,
    rightClicks,
    middleClicks,
    xClicks,
    totalKeyboard: keyboard,
    totalActions,
    activeSeconds: directActiveSec,
    waitSeconds: waitSec,
    productiveSeconds: productiveSec,
    idleSeconds: idleSec,
    verticalScroll: vScroll,
    mouseDistance: Math.round(distance),
    activePercentage: Math.round(activePercentage * 10) / 10,
    productivePercentage: Math.round(productivePercentage * 10) / 10,
  };
}

/**
 * 24-hour distribution from real summaries (grouped by Asia/Dhaka hour)
 */
export function generateHourlyFromSummaries(summaries: ActivitySummary[]): HourlyStat[] {
  const map = new Map<number, { clicks: number; keyboard: number; activeSec: number }>();
  for (let i = 0; i < 24; i++) {
    map.set(i, { clicks: 0, keyboard: 0, activeSec: 0 });
  }

  for (const s of summaries) {
    const d = new Date(s.bucket_start);
    const dhakaHour = parseInt(
      d.toLocaleTimeString("en-US", { timeZone: "Asia/Dhaka", hour: "2-digit", hour12: false }),
      10
    ) % 24;

    const existing = map.get(dhakaHour) || { clicks: 0, keyboard: 0, activeSec: 0 };
    existing.clicks += (s.left_clicks || 0) + (s.right_clicks || 0) + (s.middle_clicks || 0) + (s.x1_clicks || 0) + (s.x2_clicks || 0);
    existing.keyboard += s.keyboard_presses || 0;
    const clean = getCleanSummaryActivity(s);
    existing.activeSec += clean.activeSeconds;
    map.set(dhakaHour, existing);
  }

  const result: HourlyStat[] = [];
  for (let h = 0; h < 24; h++) {
    const item = map.get(h)!;
    result.push({
      hour: `${h.toString().padStart(2, "0")}:00`,
      clicks: item.clicks,
      keyboard: item.keyboard,
      activeMinutes: Math.round(item.activeSec / 60),
    });
  }
  return result;
}

export function generateHourlyDistribution(range: TimeRange, deviceId?: string): HourlyStat[] {
  return generateHourlyFromSummaries([]);
}

/**
 * Dynamic Daily Trends:
 * Renders a smooth continuous 7-day rolling timeline with real data for active days,
 * drawing an elegant connected curve across the chart.
 */
export function generateDailyFromSummaries(summaries: ActivitySummary[], devices: Device[], days: number = 7): DailyStat[] {
  const result: DailyStat[] = [];
  const now = new Date();
  const dhakaStr = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  const dhakaNow = new Date(dhakaStr);

  const laptopDevice = devices.find(d => d.device_name.toLowerCase().includes("laptop"));
  const officeDevice = devices.find(d => d.device_name.toLowerCase().includes("office"));

  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(dhakaNow);
    targetDate.setDate(targetDate.getDate() - i);
    const dateStr = targetDate.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
    const formattedDate = targetDate.toLocaleDateString("en-US", { timeZone: "Asia/Dhaka", month: "short", day: "numeric" });

    const daySummaries = summaries.filter(s => {
      const sDate = new Date(s.bucket_start).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
      return sDate === dateStr;
    });

    let laptopClicks = 0;
    let officeClicks = 0;
    let laptopKeys = 0;
    let officeKeys = 0;
    let directActiveSec = 0;
    let waitSec = 0;
    let idleSec = 0;

    for (const s of daySummaries) {
      const clicks = (s.left_clicks || 0) + (s.right_clicks || 0) + (s.middle_clicks || 0) + (s.x1_clicks || 0) + (s.x2_clicks || 0);
      const keys = s.keyboard_presses || 0;
      const threeTier = get3TierActivity(s);
      directActiveSec += threeTier.activeSeconds;
      waitSec += threeTier.waitSeconds;
      idleSec += threeTier.idleSeconds;

      if (laptopDevice && s.device_id === laptopDevice.id) {
        laptopClicks += clicks;
        laptopKeys += keys;
      } else if (officeDevice && s.device_id === officeDevice.id) {
        officeClicks += clicks;
        officeKeys += keys;
      } else {
        laptopClicks += clicks;
        laptopKeys += keys;
      }
    }

    result.push({
      date: dateStr,
      formattedDate,
      laptopClicks,
      officeClicks,
      totalClicks: laptopClicks + officeClicks,
      laptopKeyboard: laptopKeys,
      officeKeyboard: officeKeys,
      totalKeyboard: laptopKeys + officeKeys,
      activeSeconds: Math.round(directActiveSec),
      waitSeconds: Math.round(waitSec),
      productiveSeconds: Math.round(directActiveSec + waitSec),
      idleSeconds: Math.round(idleSec),
    });
  }

  return result;
}

export function generateDailyTrends(days: number = 7): DailyStat[] {
  return generateDailyFromSummaries([], DEMO_DEVICES, days);
}

/**
 * Real Heatmap Grid:
 * 7 Days of week x 24 Hours.
 * Populated dynamically with actual activity from summaries!
 */
export function generateHeatmapGrid(metric: "clicks" | "keyboard" | "actions" | "active" = "actions", summaries: ActivitySummary[] = []): HeatmapCell[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const s of summaries) {
    const d = new Date(s.bucket_start);
    const jsDay = d.getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
    const hour = parseInt(
      d.toLocaleTimeString("en-US", { timeZone: "Asia/Dhaka", hour: "2-digit", hour12: false }),
      10
    ) % 24;

    const clicks = (s.left_clicks || 0) + (s.right_clicks || 0) + (s.middle_clicks || 0) + (s.x1_clicks || 0) + (s.x2_clicks || 0);
    const keys = s.keyboard_presses || 0;

    if (metric === "clicks") matrix[dayIndex][hour] += clicks;
    else if (metric === "keyboard") matrix[dayIndex][hour] += keys;
    else if (metric === "actions") matrix[dayIndex][hour] += clicks + keys;
    else if (metric === "active") matrix[dayIndex][hour] += Math.round((s.active_seconds || 0) / 60);
  }

  const cells: HeatmapCell[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      cells.push({
        dayIndex: d,
        dayName: days[d],
        hour: h,
        value: matrix[d][h],
      });
    }
  }
  return cells;
}

/**
 * Real Device Breakdown between Laptop and Office PC
 */
export function getDeviceContributions(summaries: ActivitySummary[], devices: Device[]) {
  const laptopDevice = devices.find(d => d.device_name.toLowerCase().includes("laptop"));
  const officeDevice = devices.find(d => d.device_name.toLowerCase().includes("office"));

  let laptopClicks = 0;
  let officeClicks = 0;
  let laptopKeys = 0;
  let officeKeys = 0;
  let laptopActive = 0;
  let officeActive = 0;

  for (const s of summaries) {
    const clicks = (s.left_clicks || 0) + (s.right_clicks || 0) + (s.middle_clicks || 0) + (s.x1_clicks || 0) + (s.x2_clicks || 0);
    const keys = s.keyboard_presses || 0;
    const { activeSeconds } = getCleanSummaryActivity(s);

    if (laptopDevice && s.device_id === laptopDevice.id) {
      laptopClicks += clicks;
      laptopKeys += keys;
      laptopActive += activeSeconds;
    } else if (officeDevice && s.device_id === officeDevice.id) {
      officeClicks += clicks;
      officeKeys += keys;
      officeActive += activeSeconds;
    }
  }

  return {
    laptop: {
      device: laptopDevice,
      clicks: laptopClicks,
      keys: laptopKeys,
      activeSeconds: laptopActive,
    },
    office: {
      device: officeDevice,
      clicks: officeClicks,
      keys: officeKeys,
      activeSeconds: officeActive,
    },
    totalClicks: laptopClicks + officeClicks,
    totalKeys: laptopKeys + officeKeys,
    totalActiveSeconds: laptopActive + officeActive,
  };
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

/**
 * Aggregates hardware key press frequencies across all summaries
 */
export function aggregateKeyCounts(summaries: ActivitySummary[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const s of summaries) {
    if (s.key_counts && typeof s.key_counts === "object") {
      for (const [key, count] of Object.entries(s.key_counts)) {
        if (typeof count === "number" && count > 0) {
          totals[key] = (totals[key] || 0) + count;
        }
      }
    }
  }
  return totals;
}
