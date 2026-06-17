/**
 * Represents an IoT node as returned by the API.
 */
export interface IoTNode {
  id: number;
  nodeCode: string;
  status: string;
  plantId: number;
  profileId: number;
  createdAt: string;
}

/**
 * Represents a sensor reading.
 */
export interface SensorReading {
  id: number;
  nodeId: number;
  soilHumidity: number;
  airTemperature: number;
  timestamp: string;
}

/**
 * Request payload for registering a new IoT node.
 */
export interface CreateNodeRequest {
  nodeCode: string;
  plantId: number;
  profileId: number;
}

/**
 * Request payload for submitting a sensor reading.
 */
export interface CreateReadingRequest {
  nodeId: number;
  soilHumidity: number;
  airTemperature: number;
}
