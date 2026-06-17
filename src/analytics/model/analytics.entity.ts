/**
 * Global telemetry response from the API.
 */
export interface GlobalTelemetry {
  averageSoilHumidity: number;
  averageAirTemperature: number;
}

/**
 * Device status metrics response from the API.
 */
export interface DeviceStatus {
  onlineCount: number;
  offlineCount: number;
  errorCount: number;
}
