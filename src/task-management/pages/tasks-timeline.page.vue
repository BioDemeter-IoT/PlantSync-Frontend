<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { TaskApiService } from '@/task-management/services/task-api.service';
import { useAuthenticationStore } from '@/iam/services/authentication.store';
import { ProfileApiService } from '@/profile-management/services/profile-api.service';
import type { Task, CreateTaskRequest } from '@/task-management/model/task.entity';

const taskApi = new TaskApiService();
const authStore = useAuthenticationStore();
const profileApi = new ProfileApiService();

const tasks = ref<Task[]>([]);
const loading = ref(true);
const error = ref('');

// New task
const showTaskDialog = ref(false);
const newTaskAction = ref('');
const newTaskDate = ref('');
const newTaskNotes = ref('');
const creatingTask = ref(false);
const profileId = ref<number | null>(null);

const pendingTasks = computed(() =>
  tasks.value
    .filter(t => t.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
);

const completedTasks = computed(() =>
  tasks.value.filter(t => t.status === 'COMPLETED')
);

onMounted(async () => {
  if (authStore.userId) {
    try {
      const profile = await profileApi.getByUserId(authStore.userId);
      profileId.value = profile.id;
    } catch { /* silent */ }
  }
  await loadTasks();
});

async function loadTasks() {
  loading.value = true;
  error.value = '';
  try {
    tasks.value = await taskApi.getAll();
  } catch {
    error.value = 'Error loading tasks.';
  } finally {
    loading.value = false;
  }
}

async function completeTask(task: Task) {
  try {
    await taskApi.complete(task.id, { humidity: task.humidity || 0, notes: 'Completed' });
    task.status = 'COMPLETED';
    task.completedAt = new Date().toISOString();
  } catch (e: any) {
    if (e?.response?.status === 403) {
      error.value = 'Cannot complete this task - permission denied.';
    } else {
      error.value = 'Error completing task.';
    }
  }
}

function isOverdue(scheduledDate: string): boolean {
  return new Date(scheduledDate) < new Date();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getPriorityClass(task: Task): string {
  if (isOverdue(task.scheduledDate)) return 'ps-badge--high';
  const days = Math.ceil((new Date(task.scheduledDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 2) return 'ps-badge--medium';
  return 'ps-badge--low';
}

function getPriorityLabel(task: Task): string {
  if (isOverdue(task.scheduledDate)) return 'Overdue';
  const days = Math.ceil((new Date(task.scheduledDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 2) return 'Soon';
  return 'Normal';
}

function openNewTask() {
  newTaskAction.value = '';
  newTaskDate.value = '';
  newTaskNotes.value = '';
  showTaskDialog.value = true;
}

async function createTask() {
  if (!newTaskAction.value.trim() || !newTaskDate.value) return;
  if (!profileId.value) return;

  creatingTask.value = true;
  try {
    const request: CreateTaskRequest = {
      action: newTaskAction.value.trim(),
      scheduledDate: newTaskDate.value,
      plantId: 0,
      profileId: profileId.value,
      humidity: 0,
      notes: newTaskNotes.value.trim() || undefined,
    };
    const task = await taskApi.create(request);
    tasks.value.push(task);
    showTaskDialog.value = false;
  } catch {
    error.value = 'Error creating task.';
  } finally {
    creatingTask.value = false;
  }
}
</script>

<template>
  <div class="tasks-page">
    <!-- Page header -->
    <div class="ps-page-header">
      <div>
        <h1 class="ps-page-header__title">Tareas</h1>
        <p class="ps-page-header__subtitle">Keep track of your plant care schedule</p>
      </div>
      <button class="ps-btn ps-btn--primary" @click="openNewTask">
        <i class="pi pi-plus"></i>
        <span>New Task</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ps-loading">
      <i class="pi pi-spinner pi-spin"></i>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="ps-alert ps-alert--error" style="margin-bottom:1rem;">
      {{ error }}
      <button class="ps-btn ps-btn--outline" style="margin-left:0.5rem;" @click="loadTasks">Retry</button>
    </div>

    <template v-if="!loading">
      <!-- Upcoming Tasks -->
      <section class="tasks-section" v-if="pendingTasks.length > 0">
        <h2 class="tasks-section__title">Upcoming Tasks</h2>
        <div class="tasks-list">
          <div
            v-for="task in pendingTasks"
            :key="task.id"
            class="ps-task-item"
          >
            <div class="ps-task-item__checkbox" @click="completeTask(task)"></div>
            <div class="ps-task-item__content">
              <p class="ps-task-item__name">{{ task.action }}</p>
              <p class="ps-task-item__meta">
                <span v-if="task.notes">{{ task.notes }} · </span>
                {{ formatDate(task.scheduledDate) }}
              </p>
            </div>
            <span class="ps-badge" :class="getPriorityClass(task)">{{ getPriorityLabel(task) }}</span>
          </div>
        </div>
      </section>

      <!-- Empty pending -->
      <div v-else-if="pendingTasks.length === 0 && completedTasks.length === 0" class="ps-empty">
        <i class="pi pi-check-square"></i>
        <p>No tasks yet. Create your first task!</p>
      </div>

      <div v-else-if="pendingTasks.length === 0" class="ps-empty" style="padding:2rem;">
        <i class="pi pi-check-circle" style="font-size:2rem;color:var(--ps-primary);"></i>
        <p>All tasks completed! Nothing pending.</p>
      </div>

      <!-- Completed Tasks -->
      <section class="tasks-section" v-if="completedTasks.length > 0">
        <h2 class="tasks-section__title">Completed Tasks</h2>
        <div class="tasks-list">
          <div
            v-for="task in completedTasks"
            :key="task.id"
            class="ps-task-item ps-task-item--completed"
          >
            <div class="ps-task-item__checkbox">
              <i class="pi pi-check" style="font-size:0.7rem;color:white;"></i>
            </div>
            <div class="ps-task-item__content">
              <p class="ps-task-item__name">{{ task.action }}</p>
              <p class="ps-task-item__meta">
                Completed {{ task.completedAt ? formatDate(task.completedAt) : '' }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- New Task Dialog -->
    <pv-dialog
      v-model:visible="showTaskDialog"
      header="New Task"
      :modal="true"
      :closable="true"
      :style="{ width: '90%', maxWidth: '420px' }"
    >
      <div class="ps-dialog-body">
        <div class="ps-input-group">
          <label for="taskAction">Task Name</label>
          <input id="taskAction" v-model="newTaskAction" type="text" placeholder="e.g. Water the plant" />
        </div>
        <div class="ps-input-group">
          <label for="taskDate">Scheduled Date</label>
          <input id="taskDate" v-model="newTaskDate" type="date" />
        </div>
        <div class="ps-input-group">
          <label for="taskNotes">Notes (optional)</label>
          <input id="taskNotes" v-model="newTaskNotes" type="text" placeholder="Additional notes" />
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
.tasks-section {
  margin-bottom: 2rem;
}

.tasks-section__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ps-text);
  margin: 0 0 1rem;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
