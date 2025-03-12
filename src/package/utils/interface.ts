export interface ITelexMonitorSettings {
  metrics: {
    cpu: boolean;
  };
}

export interface ITelexMonitorSettingsFromTelexApp {
  monitorServer: boolean; // if true, the server will be monitored
  outputFrequency: number; // this is in minutes
  outputChannelIds: string; // comma separated string of channel ids
}
