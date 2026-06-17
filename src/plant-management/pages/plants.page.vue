<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { PlantService } from '@/plant-management/services/plant-api.service';
import { useAuthenticationStore } from '@/iam/services/authentication.store';
import { ProfileApiService } from '@/profile-management/services/profile-api.service';
import type { Plant, CreatePlantRequest } from '@/plant-management/model/plant.entity';

const router = useRouter();
const authStore = useAuthenticationStore();
const profileApi = new ProfileApiService();

const plants = ref<Plant[]>([]);
const loading = ref(true);
const error = ref('');
const profileId = ref<number | null>(null);

// Create form
const showCreateDialog = ref(false);
const newPlantName = ref('');
const newPlantSpecies = ref('');
const newPlantWateringFreq = ref(7);
const creating = ref(false);
const createError = ref('');

const gradients = [
  'var(--ps-gradient-1)',
  'var(--ps-gradient-2)',
  'var(--ps-gradient-3)',
];

onMounted(async () => {
  await loadPlants();
});

async function loadPlants() {
  loading.value = true;
  error.value = '';
  try {
    if (authStore.userId) {
      const profile = await profileApi.getByUserId(authStore.userId);
      profileId.value = profile.id;
      authStore.profileId = profile.id;
      localStorage.setItem('profileId', String(profile.id));
      plants.value = await PlantService.getByProfile(profile.id);
    } else {
      plants.value = [];
    }
  } catch {
    plants.value = [];
  } finally {
    loading.value = false;
  }
}

function getGradient(index: number): string {
  return gradients[index % gradients.length];
}

function getMoisturePercent(humidity: string | undefined): string {
  if (!humidity) return '--';
  const map: Record<string, string> = { BAJA: '30%', MEDIA: '55%', ALTA: '80%' };
  return map[humidity] || humidity;
}

function getTemperature(): string {
  return '22C';
}

function getLastWatered(nextWateringDate: string | undefined): string {
  if (!nextWateringDate) return 'Unknown';
  const next = new Date(nextWateringDate);
  const now = new Date();
  const diff = Math.ceil((now.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 0) return `${diff} days ago`;
  return 'Today';
}

function openCreateDialog() {
  newPlantName.value = '';
  newPlantSpecies.value = '';
  newPlantWateringFreq.value = 7;
  createError.value = '';
  showCreateDialog.value = true;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getNextWaterDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

async function createPlant() {
  if (!newPlantName.value.trim() || !newPlantSpecies.value.trim()) {
    createError.value = 'Name and species are required.';
    return;
  }
  if (!profileId.value) {
    createError.value = 'No profile found. Please set up your profile first.';
    return;
  }

  creating.value = true;
  createError.value = '';

  try {
    const request: CreatePlantRequest = {
      name: newPlantName.value.trim(),
      species: newPlantSpecies.value.trim(),
      description: '',
      acquisitionDate: getTodayDate(),
      humidity: 'MEDIA',
      nextWateringDate: getNextWaterDate(newPlantWateringFreq.value),
      imageUrl: undefined,
      notificationsEnabled: true,
      profileId: profileId.value,
    };
    const created = await PlantService.create(request);
    plants.value.push(created);
    showCreateDialog.value = false;
  } catch (e: any) {
    createError.value = e?.response?.data?.message || 'Error creating plant. Please try again.';
  } finally {
    creating.value = false;
  }
}

function goToDetail(plant: Plant) {
  router.push(`/plants/${plant.id}`);
}

async function deletePlant(plant: Plant, event: Event) {
  event.stopPropagation();
  try {
    await PlantService.delete(plant.id);
    plants.value = plants.value.filter(p => p.id !== plant.id);
  } catch {
    error.value = 'Error deleting plant.';
  }
}
</script>

<template>
  <div class="plants-page">
    <!-- Page header -->
    <div class="ps-page-header">
      <div>
        <h1 class="ps-page-header__title">Mis Plantas</h1>
        <p class="ps-page-header__subtitle">Manage your plant collection</p>
      </div>
      <button class="ps-btn ps-btn--primary" @click="openCreateDialog" :disabled="loading">
        <i class="pi pi-plus"></i>
        <span>Add Plant</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ps-loading">
      <i class="pi pi-spinner pi-spin"></i>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="ps-alert ps-alert--error">
      <p>{{ error }}</p>
      <button class="ps-btn ps-btn--outline" @click="loadPlants">Retry</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="plants.length === 0" class="ps-empty">
      <i class="pi pi-leaf"></i>
      <p>No plants yet. Add your first plant!</p>
      <button class="ps-btn ps-btn--primary" @click="openCreateDialog">
        <i class="pi pi-plus"></i>
        <span>Add Plant</span>
      </button>
    </div>

    <!-- Plant grid -->
    <div v-else class="plants-grid">
      <div
        v-for="(plant, index) in plants"
        :key="plant.id"
        class="ps-plant-card"
        @click="goToDetail(plant)"
      >
        <div class="ps-plant-card__image" :style="{ background: getGradient(index) }">
          <img v-if="plant.imageUrl" :src="plant.imageUrl" :alt="plant.name" class="ps-plant-card__img" />
          <i v-else class="pi pi-leaf"></i>
        </div>
        <div class="ps-plant-card__body">
          <h3 class="ps-plant-card__name">{{ plant.name }}</h3>
          <p class="ps-plant-card__species">{{ plant.species }}</p>

          <div class="ps-plant-card__stats">
            <div class="ps-plant-card__stat">
              <i class="pi pi-cloud"></i>
              <span>{{ getMoisturePercent(plant.humidity) }}</span>
            </div>
            <div class="ps-plant-card__stat">
              <i class="pi pi-sun"></i>
              <span>{{ getTemperature() }}</span>
            </div>
          </div>

          <p class="ps-plant-card__watered">
            Last watered {{ getLastWatered(plant.nextWateringDate) }}
          </p>

          <div class="ps-plant-card__actions">
            <button class="ps-btn ps-btn--outline ps-btn--sm" @click.stop="goToDetail(plant)">
              <i class="pi pi-pencil"></i>
              <span>Edit</span>
            </button>
            <button class="ps-btn ps-btn--danger ps-btn--sm" @click="deletePlant(plant, $event)">
              <i class="pi pi-trash"></i>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Dialog -->
    <pv-dialog
      v-model:visible="showCreateDialog"
      header="Add New Plant"
      :modal="true"
      :closable="true"
      :style="{ width: '90%', maxWidth: '450px' }"
    >
      <div class="ps-dialog-body">
        <div v-if="createError" class="ps-alert ps-alert--error" style="margin-bottom:1rem;">
          {{ createError }}
        </div>

        <div class="ps-input-group">
          <label for="plantName">Plant Name</label>
          <input id="plantName" v-model="newPlantName" type="text" placeholder="e.g. My Tomato" />
        </div>

        <div class="ps-input-group">
          <label for="plantSpecies">Species</label>
          <input id="plantSpecies" v-model="newPlantSpecies" type="text" placeholder="e.g. Solanum lycopersicum" />
        </div>

        <div class="ps-input-group">
          <label for="plantFreq">Watering Frequency (days)</label>
          <input id="plantFreq" v-model.number="newPlantWateringFreq" type="number" min="1" max="90" />
        </div>
      </div>

      <template #footer>
        <div class="ps-dialog-footer">
          <button class="ps-btn ps-btn--outline" @click="showCreateDialog = false" :disabled="creating">Cancel</button>
          <button class="ps-btn ps-btn--primary" @click="createPlant" :disabled="creating">
            <i v-if="creating" class="pi pi-spinner pi-spin"></i>
            <span>{{ creating ? 'Creating...' : 'Create' }}</span>
          </button>
        </div>
      </template>
    </pv-dialog>
  </div>
</template>

<style scoped>
.plants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}

.ps-plant-card {
  cursor: pointer;
}

.ps-plant-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.ps-plant-card__image {
  position: relative;
}

.ps-btn--sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
}

.ps-loading {
  display: flex;
  justify-content: center;
  padding: 4rem;
}

.ps-loading i {
  font-size: 2.5rem;
  color: var(--ps-primary);
}

.ps-alert {
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.ps-alert--error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.ps-dialog-body {
  padding: 0.5rem 0;
}

.ps-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
