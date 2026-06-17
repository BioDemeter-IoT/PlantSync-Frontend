<script setup lang="ts">
import { ref } from 'vue';
import { IoTApiService } from '@/iot-management/services/iot-api.service';
import type { CreateNodeRequest, CreateReadingRequest } from '@/iot-management/model/iot-node.entity';

const iotApi = new IoTApiService();
const error = ref('');
const success = ref('');

// Register node form
const nodeCode = ref('');
const nodePlantId = ref<number | undefined>();
const nodeProfileId = ref<number | undefined>();
const registeringNode = ref(false);

// Submit reading form
const readingNodeId = ref<number | undefined>();
const soilHumidity = ref<number | undefined>();
const airTemperature = ref<number | undefined>();
const submittingReading = ref(false);

async function registerNode() {
  if (!nodeCode.value.trim() || !nodePlantId.value || !nodeProfileId.value) {
    error.value = 'All fields are required to register a node.';
    return;
  }
  registeringNode.value = true;
  error.value = '';
  success.value = '';
  try {
    const request: CreateNodeRequest = {
      nodeCode: nodeCode.value.trim(),
      plantId: nodePlantId.value,
      profileId: nodeProfileId.value,
    };
    const node = await iotApi.createNode(request);
    success.value = `Node registered successfully! ID: ${node.id}, Code: ${node.nodeCode}`;
    nodeCode.value = '';
    nodePlantId.value = undefined;
    nodeProfileId.value = undefined;
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error registering node. Check permissions.';
  } finally {
    registeringNode.value = false;
  }
}

async function submitReading() {
  if (!readingNodeId.value || soilHumidity.value === undefined || airTemperature.value === undefined) {
    error.value = 'Node ID, soil humidity, and air temperature are required.';
    return;
  }
  submittingReading.value = true;
  error.value = '';
  success.value = '';
  try {
    const request: CreateReadingRequest = {
      nodeId: readingNodeId.value,
      soilHumidity: soilHumidity.value,
      airTemperature: airTemperature.value,
    };
    const reading = await iotApi.createReading(request);
    success.value = `Reading submitted! ID: ${reading.id}, Timestamp: ${reading.timestamp}`;
    soilHumidity.value = undefined;
    airTemperature.value = undefined;
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error submitting reading. Check node ID and permissions.';
  } finally {
    submittingReading.value = false;
  }
}
</script>

<template>
  <div class="iot-page p-4">
    <h1 class="text-2xl font-bold mb-4">🔌 IoT Dashboard</h1>

    <!-- Messages -->
    <div v-if="error" class="mb-3 p-3 border-round bg-red-50 text-red-700 text-sm">
      {{ error }}
      <pv-button label="Dismiss" text size="small" @click="error = ''" class="ml-2" />
    </div>
    <div v-if="success" class="mb-3 p-3 border-round bg-green-50 text-green-700 text-sm">
      {{ success }}
      <pv-button label="Dismiss" text size="small" @click="success = ''" class="ml-2" />
    </div>

    <div class="grid">
      <!-- Register Node -->
      <div class="col-12 md:col-6">
        <pv-card>
          <template #title>Register IoT Node</template>
          <template #subtitle>Connect a new sensor node to a plant</template>
          <template #content>
            <div class="flex flex-column gap-3">
              <div class="flex flex-column gap-1">
                <label class="font-medium text-sm">Node Code *</label>
                <pv-input-text v-model="nodeCode" placeholder="e.g. ESP32-001" />
              </div>
              <div class="flex flex-column gap-1">
                <label class="font-medium text-sm">Plant ID *</label>
                <pv-input-number v-model="nodePlantId" placeholder="Plant ID" :min="1" />
              </div>
              <div class="flex flex-column gap-1">
                <label class="font-medium text-sm">Profile ID *</label>
                <pv-input-number v-model="nodeProfileId" placeholder="Your profile ID" :min="1" />
              </div>
            </div>
          </template>
          <template #footer>
            <pv-button label="Register Node" icon="pi pi-plus" @click="registerNode" :loading="registeringNode" />
          </template>
        </pv-card>
      </div>

      <!-- Submit Reading -->
      <div class="col-12 md:col-6">
        <pv-card>
          <template #title>Submit Sensor Reading</template>
          <template #subtitle>Manually ingest a reading from a node</template>
          <template #content>
            <div class="flex flex-column gap-3">
              <div class="flex flex-column gap-1">
                <label class="font-medium text-sm">Node ID *</label>
                <pv-input-number v-model="readingNodeId" placeholder="Node ID" :min="1" />
              </div>
              <div class="flex flex-column gap-1">
                <label class="font-medium text-sm">Soil Humidity *</label>
                <pv-input-number v-model="soilHumidity" :min="0" :max="100" :maxFractionDigits="1" placeholder="e.g. 45.5" suffix="%" />
              </div>
              <div class="flex flex-column gap-1">
                <label class="font-medium text-sm">Air Temperature *</label>
                <pv-input-number v-model="airTemperature" :min="-50" :max="80" :maxFractionDigits="1" placeholder="e.g. 23.0" suffix="°C" />
              </div>
            </div>
          </template>
          <template #footer>
            <pv-button label="Submit Reading" icon="pi pi-upload" @click="submitReading" :loading="submittingReading" />
          </template>
        </pv-card>
      </div>
    </div>
  </div>
</template>
