<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PlantService } from '@/plant-management/services/plant-api.service';
import { TaskApiService } from '@/task-management/services/task-api.service';
import type { Plant, UpdatePlantRequest } from '@/plant-management/model/plant.entity';
import type { Task, CreateTaskRequest } from '@/task-management/model/task.entity';

const route = useRoute();
const router = useRouter();
const taskApi = new TaskApiService();

const plant = ref<Plant | null>(null);
const pendingTasks = ref<Task[]>([]);
const historyTasks = ref<Task[]>([]);
const loading = ref(true);
const error = ref('');
const activeTab = ref<'pending' | 'history'>('pending');

// Edit state
const editing = ref(false);
const editName = ref('');
const editSpecies = ref('');
const editImage = ref('');
const saving = ref(false);

// Delete state
const showDeleteConfirm = ref(false);
const deleting = ref(false);

// New task state
const showTaskDialog = ref(false);
const newTaskAction = ref('');
const newTaskDate = ref('');
const newTaskNotes = ref('');
const creatingTask = ref(false);

const plantId = Number(route.params.id);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  error.value = '';
  try {
    plant.value = await PlantService.getById(plantId);
    editName.value = plant.value.name;
    editSpecies.value = plant.value.species;
    editImage.value = plant.value.imageUrl || '';

    const [pending, history] = await Promise.all([
      taskApi.getPending(plantId),
      taskApi.getHistory(plantId),
    ]);
    pendingTasks.value = pending;
    historyTasks.value = history;
  } catch (e: any) {
    if (e?.response?.status !== 404) {
      error.value = 'Error loading plant data.';
    }
  } finally {
    loading.value = false;
  }
}

async function savePlant() {
  if (!editName.value.trim() || !editSpecies.value.trim()) return;
  saving.value = true;
  try {
    const request: UpdatePlantRequest = {
      name: editName.value.trim(),
      species: editSpecies.value.trim(),
      imageUrl: editImage.value.trim() || undefined,
    };
    plant.value = await PlantService.update(plantId, request);
    editing.value = false;
  } catch {
    error.value = 'Error saving plant.';
  } finally {
    saving.value = false;
  }
}

async function deletePlant() {
  deleting.value = true;
  try {
    await PlantService.delete(plantId);
    router.push('/plants');
  } catch {
    error.value = 'Error deleting plant.';
  } finally {
    deleting.value = false;
    showDeleteConfirm.value = false;
  }
}

async function createTask() {
  if (!newTaskAction.value.trim() || !newTaskDate.value) return;
  if (!plant.value) return;
  creatingTask.value = true;
  try {
    const request: CreateTaskRequest = {
      action: newTaskAction.value.trim(),
      scheduledDate: newTaskDate.value,
      plantId: plantId,
      profileId: plant.value.profileId,
      humidity: 0,
      notes: newTaskNotes.value.trim() || undefined,
    };
    const task = await taskApi.create(request);
    pendingTasks.value.push(task);
    showTaskDialog.value = false;
    newTaskAction.value = '';
    newTaskDate.value = '';
    newTaskNotes.value = '';
  } catch {
    error.value = 'Error creating task. The backend may require additional permissions.';
  } finally {
    creatingTask.value = false;
  }
}

async function completeTask(task: Task) {
  try {
    await taskApi.complete(task.id, { humidity: task.humidity || 0, notes: 'Completed' });
    pendingTasks.value = pendingTasks.value.filter(t => t.id !== task.id);
    task.status = 'COMPLETED';
    task.completedAt = new Date().toISOString();
    historyTasks.value.unshift(task);
  } catch (e: any) {
    if (e?.response?.status === 403) {
      error.value = 'Cannot complete this task - permission denied.';
    } else {
      error.value = 'Error completing task.';
    }
  }
}

async function deleteTask(task: Task) {
  try {
    await taskApi.delete(task.id);
    pendingTasks.value = pendingTasks.value.filter(t => t.id !== task.id);
    historyTasks.value = historyTasks.value.filter(t => t.id !== task.id);
  } catch {
    error.value = 'Error deleting task.';
  }
}

function getMoisturePercent(humidity: string | undefined): string {
  if (!humidity) return '--';
  const map: Record<string, string> = { BAJA: '30%', MEDIA: '55%', ALTA: '80%' };
  return map[humidity] || humidity;
}
</script>

<template>
  <div class="plant-detail-page">
    <!-- Back button -->
    <button class="ps-btn ps-btn--outline back-btn" @click="router.push('/plants')">
      <i class="pi pi-arrow-left"></i>
      <span>Back to Plants</span>
    </button>

    <!-- Loading -->
    <div v-if="loading" class="ps-loading">
      <i class="pi pi-spinner pi-spin"></i>
    </div>

    <!-- Error -->
    <div v-if="error" class="ps-alert ps-alert--error" style="margin-bottom:1rem;">
      {{ error }}
      <button class="ps-btn ps-btn--outline" style="margin-left:0.5rem;padding:0.3rem 0.6rem;font-size:0.8rem;" @click="error = ''">Dismiss</button>
    </div>

    <div v-if="plant && !loading" class="detail-layout">
      <!-- Left: Plant image and info -->
      <div class="detail-left">
        <div class="detail-image ps-card">
          <img v-if="plant.imageUrl" :src="plant.imageUrl" :alt="plant.name" class="detail-image__img" />
          <div v-else class="detail-image__placeholder" style="background: var(--ps-gradient-1);">
            <i class="pi pi-leaf"></i>
          </div>
        </div>

        <!-- Stats cards -->
        <div class="detail-stats">
          <div class="detail-stat ps-card">
            <i class="pi pi-cloud"></i>
            <span class="detail-stat__value">{{ getMoisturePercent(plant.humidity) }}</span>
            <span class="detail-stat__label">Moisture</span>
          </div>
          <div class="detail-stat ps-card">
            <i class="pi pi-sun"></i>
            <span class="detail-stat__value">22C</span>
            <span class="detail-stat__label">Temperature</span>
          </div>
          <div class="detail-stat ps-card" v-if="plant.nextWateringDate">
            <i class="pi pi-calendar"></i>
            <span class="detail-stat__value">{{ new Date(plant.nextWateringDate).toLocaleDateString() }}</span>
            <span class="detail-stat__label">Next Watering</span>
          </div>
        </div>
      </div>

      <!-- Right: Details and actions -->
      <div class="detail-right">
        <div class="ps-card detail-info-card">
          <template v-if="!editing">
            <h1 class="detail-name">{{ plant.name }}</h1>
            <p class="detail-species">{{ plant.species }}</p>
            <p v-if="plant.description" class="detail-description">{{ plant.description }}</p>

            <div class="detail-meta">
              <span v-if="plant.acquisitionDate" class="detail-meta__item">
                <i class="pi pi-calendar"></i> Since {{ plant.acquisitionDate }}
              </span>
            </div>

            <div class="detail-actions">
              <button class="ps-btn ps-btn--primary" @click="editing = true">
                <i class="pi pi-pencil"></i>
                <span>Edit</span>
              </button>
              <button class="ps-btn ps-btn--danger" @click="showDeleteConfirm = true">
                <i class="pi pi-trash"></i>
                <span>Delete</span>
              </button>
            </div>
          </template>

          <template v-else>
            <h2 class="detail-edit-title">Edit Plant</h2>
            <div class="ps-input-group">
              <label>Name</label>
              <input v-model="editName" type="text" />
            </div>
            <div class="ps-input-group">
              <label>Species</label>
              <input v-model="editSpecies" type="text" />
            </div>
            <div class="ps-input-group">
              <label>Image URL</label>
              <input v-model="editImage" type="text" placeholder="https://..." />
            </div>
            <div class="detail-actions">
              <button class="ps-btn ps-btn--primary" @click="savePlant" :disabled="saving">
                <i v-if="saving" class="pi pi-spinner pi-spin"></i>
                <span>{{ saving ? 'Saving...' : 'Save' }}</span>
              </button>
              <button class="ps-btn ps-btn--outline" @click="editing = false">Cancel</button>
            </div>
          </template>
        </div>

        <!-- Tasks Section -->
        <div class="detail-tasks">
          <div class="detail-tasks__header">
            <h2 class="detail-tasks__title">Tasks</h2>
            <button class="ps-btn ps-btn--primary ps-btn--sm" @click="showTaskDialog = true">
              <i class="pi pi-plus"></i>
              <span>New Task</span>
            </button>
          </div>

          <div class="detail-tasks__tabs">
            <button
              class="tab-btn"
              :class="{ 'tab-btn--active': activeTab === 'pending' }"
              @click="activeTab = 'pending'"
            >
              Pending ({{ pendingTasks.length }})
            </button>
            <button
              class="tab-btn"
              :class="{ 'tab-btn--active': activeTab === 'history' }"
              @click="activeTab = 'history'"
            >
              History ({{ historyTasks.length }})
            </button>
          </div>

          <!-- Pending tasks -->
          <div v-if="activeTab === 'pending'">
            <div v-if="pendingTasks.length === 0" class="ps-empty" style="padding:2rem;">
              <p>No pending tasks for this plant.</p>
            </div>
            <div v-else class="tasks-list">
              <div v-for="task in pendingTasks" :key="task.id" class="ps-task-item">
                <div class="ps-task-item__checkbox" @click="completeTask(task)"></div>
                <div class="ps-task-item__content">
                  <p class="ps-task-item__name">{{ task.action }}</p>
                  <p class="ps-task-item__meta">
                    Due: {{ new Date(task.scheduledDate).toLocaleDateString() }}
                    <span v-if="task.notes"> · {{ task.notes }}</span>
                  </p>
                </div>
                <button class="icon-btn icon-btn--danger" @click="deleteTask(task)">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- History tasks -->
          <div v-if="activeTab === 'history'">
            <div v-if="historyTasks.length === 0" class="ps-empty" style="padding:2rem;">
              <p>No completed tasks yet.</p>
            </div>
            <div v-else class="tasks-list">
              <div v-for="task in historyTasks" :key="task.id" class="ps-task-item ps-task-item--completed">
                <div class="ps-task-item__checkbox">
                  <i class="pi pi-check" style="font-size:0.7rem;color:white;"></i>
                </div>
                <div class="ps-task-item__content">
                  <p class="ps-task-item__name">{{ task.action }}</p>
                  <p class="ps-task-item__meta">
                    Completed: {{ task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <pv-dialog v-model:visible="showDeleteConfirm" header="Delete Plant" :modal="true" :style="{ width: '90%', maxWidth: '400px' }">
      <p>Are you sure you want to delete <strong>{{ plant?.name }}</strong>? This cannot be undone.</p>
      <template #footer>
        <div class="ps-dialog-footer">
          <button class="ps-btn ps-btn--outline" @click="showDeleteConfirm = false">Cancel</button>
          <button class="ps-btn ps-btn--danger" @click="deletePlant" :disabled="deleting">
            <i v-if="deleting" class="pi pi-spinner pi-spin"></i>
            <span>{{ deleting ? 'Deleting...' : 'Delete' }}</span>
          </button>
        </div>
      </template>
    </pv-dialog>

    <!-- New task dialog -->
    <pv-dialog v-model:visible="showTaskDialog" header="New Task" :modal="true" :style="{ width: '90%', maxWidth: '400px' }">
      <div class="ps-dialog-body">
        <div class="ps-input-group">
          <label>Action</label>
          <input v-model="newTaskAction" type="text" placeholder="e.g. Water the plant" />
        </div>
        <div class="ps-input-group">
          <label>Scheduled Date</label>
          <input v-model="newTaskDate" type="date" />
        </div>
        <div class="ps-input-group">
          <label>Notes (optional)</label>
          <input v-model="newTaskNotes" type="text" placeholder="Optional notes" />
        </div>
      </div>
      <template #footer>
        <div class="ps-dialog-footer">
          <button class="ps-btn ps-btn--outline" @click="showTaskDialog = false">Cancel</button>
          <button class="ps-btn ps-btn--primary" @click="createTask" :disabled="creatingTask">
            <i v-if="creatingTask" class="pi pi-spinner pi-spin"></i>
            <span>{{ creatingTask ? 'Creating...' : 'Create' }}</span>
          </button>
        </div>
      </template>
    </pv-dialog>
  </div>
</template>

<style scoped>
.plant-detail-page {
  max-width: 1100px;
}

.back-btn {
  margin-bottom: 1.5rem;
}

.detail-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}

.detail-image {
  border-radius: 0.75rem;
  overflow: hidden;
}

.detail-image__img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}

.detail-image__placeholder {
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-image__placeholder i {
  font-size: 3.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.detail-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

.detail-stat {
  padding: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.detail-stat i {
  font-size: 1.25rem;
  color: var(--ps-primary);
}

.detail-stat__value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ps-text);
}

.detail-stat__label {
  font-size: 0.75rem;
  color: var(--ps-text-secondary);
}

.detail-info-card {
  padding: 1.5rem;
}

.detail-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--ps-text);
}

.detail-species {
  font-size: 1rem;
  color: var(--ps-text-secondary);
  margin: 0 0 1rem;
}

.detail-description {
  font-size: 0.9rem;
  color: var(--ps-text-secondary);
  margin: 0 0 1rem;
}

.detail-meta {
  margin-bottom: 1.5rem;
}

.detail-meta__item {
  font-size: 0.85rem;
  color: var(--ps-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.detail-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.detail-edit-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--ps-text);
}

.detail-tasks {
  margin-top: 2rem;
}

.detail-tasks__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.detail-tasks__title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--ps-text);
}

.detail-tasks__tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--ps-border);
  border-radius: 0.5rem;
  background: var(--ps-card);
  color: var(--ps-text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn--active {
  background: var(--ps-primary);
  color: white;
  border-color: var(--ps-primary);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: transparent;
}

.icon-btn--danger {
  color: #dc2626;
}

.icon-btn--danger:hover {
  background: #fef2f2;
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
