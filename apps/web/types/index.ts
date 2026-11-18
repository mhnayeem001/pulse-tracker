export interface Device {
  id: string;
  user_id: string;
  device_name: string;
  device_type: "laptop" | "desktop" | "workstation";
  hostname: string;
  os_version: string;
  agent_version: string;
  registered_at: string;
  last_seen_at: string;
  last_sync_at: string | null;
  is_active: boolean;
  revoked_at: string | null;
}

export interface ActivitySummary {
  id: string;
  user_id: string;
  device_id: string;
  bucket_start: string;
  bucket_end: string;
  left_clicks: number;
  right_clicks: number;
  middle_clicks: number;
  x1_clicks: number;
  x2_clicks: number;
  keyboard_presses: number;
  vertical_scroll: number;
  horizontal_scroll: number;
  mouse_movement_events: number;
  mouse_distance: number;
  active_seconds: number;
  idle_seconds: number;
  session_id: string;
  created_at: string;
  key_counts?: Record<string, number>;
}

export interface DashboardMetrics {
  totalClicks: number;
  leftClicks: number;
  rightClicks: number;
  middleClicks: number;
  xClicks: number;
  totalKeyboard: number;
  totalActions: number;
  activeSeconds: number;
  idleSeconds: number;
  verticalScroll: number;
  mouseDistance: number;
  activePercentage: number;
}

export interface HourlyStat {
  hour: string; // "00", "01", ... "23"
  clicks: number;
  keyboard: number;
  activeMinutes: number;
}

export interface DailyStat {
  date: string;
  formattedDate: string;
  laptopClicks: number;
  officeClicks: number;
  totalClicks: number;
  laptopKeyboard: number;
  officeKeyboard: number;
  totalKeyboard: number;
  activeSeconds: number;
  idleSeconds: number;
}

export interface HeatmapCell {
  dayIndex: number; // 0 = Mon, 6 = Sun
  dayName: string;
  hour: number; // 0 - 23
  value: number;
}

export type TimeRange = "today" | "yesterday" | "7d" | "30d" | "custom";
