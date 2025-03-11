export interface ITelexMonitorSettings {
  metrics: {
    cpu: boolean;
    memory: boolean;
    disk: boolean;
  };
  thresholds: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export interface ITelexMonitorSettingsFromTelexApp {
  monitorServer: boolean; // if true, the server will be monitored
  outputFrequency: number; // this is in minutes
  outputChannelIds: string; // comma separated string of channel ids
}
