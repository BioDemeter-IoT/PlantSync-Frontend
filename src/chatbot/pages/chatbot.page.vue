<script setup lang="ts">
import { ref, nextTick } from 'vue';
import type { ChatMessage } from '@/chatbot/model/chat-message.entity';

const messages = ref<ChatMessage[]>([]);
const input = ref('');
const sending = ref(false);
const chatContainer = ref<HTMLElement | null>(null);

let messageId = 0;

const popularQuestions = [
  'How often should I water succulents?',
  'Best indoor plants for low light?',
  'How to prevent root rot?',
  'When should I repot my plant?',
  'Natural pest control methods?',
  'How to increase humidity for plants?',
];

async function sendMessage(text?: string) {
  const msg = (text || input.value).trim();
  if (!msg || msg.length > 500 || sending.value) return;

  messages.value.push({
    id: ++messageId,
    content: msg,
    sender: 'user',
    timestamp: new Date().toISOString(),
  });
  input.value = '';
  sending.value = true;
  await scrollToBottom();

  // Simulate bot response (stub)
  setTimeout(async () => {
    messages.value.push({
      id: ++messageId,
      content: `I received your question: "${msg}". The chatbot integration is pending backend implementation. I'll be able to help you with plant care advice soon!`,
      sender: 'bot',
      timestamp: new Date().toISOString(),
    });
    sending.value = false;
    await scrollToBottom();
  }, 1000);
}

async function scrollToBottom() {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}
</script>

<template>
  <div class="chatbot-page">
    <!-- Page header -->
    <div class="ps-page-header">
      <div>
        <h1 class="ps-page-header__title">Plant Care Assistant</h1>
        <p class="ps-page-header__subtitle">Ask me anything about your plants</p>
      </div>
    </div>

    <!-- Chat area -->
    <div class="chat-container ps-card">
      <div ref="chatContainer" class="chat-messages">
        <!-- Empty state -->
        <div v-if="messages.length === 0" class="chat-empty">
          <i class="pi pi-comments"></i>
          <p>Start a conversation about plant care!</p>
        </div>

        <!-- Messages -->
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="ps-chat-bubble"
          :class="msg.sender === 'user' ? 'ps-chat-bubble--user' : 'ps-chat-bubble--bot'"
        >
          <p class="chat-msg-text">{{ msg.content }}</p>
          <span class="chat-msg-time">{{ new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
        </div>

        <!-- Typing indicator -->
        <div v-if="sending" class="ps-chat-bubble ps-chat-bubble--bot">
          <i class="pi pi-spinner pi-spin"></i> Typing...
        </div>
      </div>

      <!-- Input -->
      <div class="chat-input-area">
        <input
          v-model="input"
          type="text"
          placeholder="Type your question..."
          class="chat-input"
          :maxlength="500"
          @keydown.enter="sendMessage()"
          :disabled="sending"
        />
        <button
          class="chat-send-btn"
          @click="sendMessage()"
          :disabled="!input.trim() || sending"
        >
          <i class="pi pi-send"></i>
        </button>
      </div>
    </div>

    <!-- Popular questions -->
    <div class="popular-questions">
      <h3 class="popular-questions__title">Popular questions</h3>
      <div class="popular-questions__grid">
        <button
          v-for="q in popularQuestions"
          :key="q"
          class="popular-questions__item"
          @click="sendMessage(q)"
          :disabled="sending"
        >
          {{ q }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 55vh;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ps-text-secondary);
}

.chat-empty i {
  font-size: 3rem;
  margin-bottom: 0.75rem;
  color: var(--ps-border);
}

.chat-empty p {
  font-size: 0.95rem;
}

.chat-msg-text {
  margin: 0 0 0.25rem;
}

.chat-msg-time {
  font-size: 0.7rem;
  opacity: 0.7;
}

.chat-input-area {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--ps-border);
}

.chat-input {
  flex: 1;
  padding: 0.7rem 1rem;
  border: 1px solid var(--ps-border);
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  color: var(--ps-text);
  background: var(--ps-bg);
}

.chat-input:focus {
  border-color: var(--ps-primary);
  box-shadow: 0 0 0 3px rgba(107, 124, 62, 0.1);
}

.chat-send-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--ps-primary);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.chat-send-btn:hover:not(:disabled) {
  background: var(--ps-primary-dark);
}

.chat-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.popular-questions {
  margin-top: 1.5rem;
}

.popular-questions__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ps-text);
  margin: 0 0 1rem;
}

.popular-questions__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

.popular-questions__item {
  padding: 0.75rem 1rem;
  border: 1px solid var(--ps-border);
  border-radius: 0.5rem;
  background: var(--ps-card);
  color: var(--ps-text);
  font-size: 0.85rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.popular-questions__item:hover:not(:disabled) {
  border-color: var(--ps-primary);
  background: rgba(107, 124, 62, 0.03);
}

.popular-questions__item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
