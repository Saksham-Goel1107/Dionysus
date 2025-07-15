// Types for Uptime Robot API response

export interface Monitor {
  id: number;
  friendly_name: string;
  url: string;
  type: number;
  sub_type: string;
  keyword_type: string | null;
  keyword_value: string | null;
  http_username: string | null;
  http_password: string | null;
  port: string | null;
  interval: number;
  status: number;
  all_time_uptime_ratio: number;
  all_time_uptime_durations: {
    uptime: number;
    downtime: number;
  };
  average_response: number;
  create_datetime: number;
  logs: MonitorLog[];
  average_response_time: number;
  last_check: number;
}

export interface MonitorLog {
  type: number;
  datetime: number;
  duration: number;
  reason: {
    code: string;
    detail: string;
  };
}

export interface UptimeRobotError {
  type: string;
  message: string;
}

export interface UptimeRobotResponse {
  stat: string;
  pagination?: {
    offset: number;
    limit: number;
    total: number;
  };
  monitors?: Monitor[];
  error?: UptimeRobotError;
}
