import http from '@/shared/services/http-common';
import type { IoTNode, CreateNodeRequest, CreateReadingRequest, SensorReading } from '../model/iot-node.entity';

/**
 * Service for managing IoT nodes and sensor readings.
 */
export class IoTApiService {
  /**
   * Register a new IoT node.
   */
  createNode(request: CreateNodeRequest): Promise<IoTNode> {
    return http.post('/iot/nodes', request).then(r => r.data);
  }

  /**
   * Submit a sensor reading.
   */
  createReading(request: CreateReadingRequest): Promise<SensorReading> {
    return http.post('/iot/readings', request).then(r => r.data);
  }
}
