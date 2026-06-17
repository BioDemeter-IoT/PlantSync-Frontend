<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchAllAnalytics } from '@/analytics/services/analytics-api.service';
import type { GlobalTelemetry, DeviceStatus } from '@/analytics/model/analytics.entity';

const telemetry = ref<GlobalTelemetry | null>(null);
const deviceStatus = ref<DeviceStatus | null>(null);
const loading = ref(true);
const telemetryError = ref('');
const deviceError = ref('');

onMounted(async () => {
  loading.value = true;
  try {
    const [t, d] = await fetchAllAnalytics();
    telemetry.value = t;
    deviceStatus.value = d;
  } catch (e: any) {
    if (e?.response?.status === 403) {
      telemetryError.value = 'Insufficient permissions. Admin role required.';
    } else {
      telemetryError.value = 'Error loading analytics data.';
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="analytics-page p-4">
    <h1 class="text-2xl font-bold mb-4">📊 Analytics Dashboard</h1>

    <div v-if="loading" class="flex justify-content-center p-6">
      <i class="pi pi-spinner pi-spin text-4xl text-primary"></i>
    </div>

    <div v-else-if="telemetryError" class="p-4 border-round bg-red-50 text-red-700">
      <p>{{ telemetryError }}</p>
    </div>

    <div v-else class="grid">
      <!-- Telemetry -->
      <div class="col-12 md:col-6">
        <pv-card>
          <template #title>🌡️ Global Telemetry</template>
          <template #content>
            <div v-if="telemetry" class="flex flex-column gap-3">
              <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                <span class="font-medium">Avg Soil Humidity</span>
                <span class="text-xl font-bold text-primary">{{ telemetry.averageSoilHumidity.toFixed(1) }}%</span>
              </div>
              <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                <span class="font-medium">Avg Air Temperature</span>
                <span class="text-xl font-bold text-orange-500">{{ telemetry.averageAirTemperature.toFixed(1) }}°C</span>
              </div>
            </div>
            <div v-else class="text-500">No telemetry data available.</div>
          </template>
        </pv-card>
      </div>

      <!-- Device Status -->
      <div class="col-12 md:col-6">
        <pv-card>
          <template #title>🔌 Device Status</template>
          <template #content>
            <div v-if="deviceStatus" class="flex flex-column gap-3">
              <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                <span class="font-medium">Online</span>
                <pv-tag :value="String(deviceStatus.onlineCount)" severity="success" />
              </div>
              <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                <span class="font-medium">Offline</span>
                <pv-tag :value="String(deviceStatus.offlineCount)" severity="warning" />
              </div>
              <div class="flex justify-content-between align-items-center p-3 surface-100 border-round">
                <span class="font-medium">Error</span>
                <pv-tag :value="String(deviceStatus.errorCount)" severity="danger" />
              </div>
            </div>
            <div v-else class="text-500">No device status data available.</div>
          </template>
        </pv-card>
      </div>
    </div>
  </div>
</template>
