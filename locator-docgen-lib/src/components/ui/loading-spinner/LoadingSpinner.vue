<template>
  <div class="loading-spinner" :class="{ 'loading-spinner--overlay': overlay }">
    <div class="loading-spinner__container">
      <div class="loading-spinner__spinner"></div>
      <div v-if="text" class="loading-spinner__text">{{ text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text?: string;
  overlay?: boolean;
}>();
</script>

<style scoped>
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.loading-spinner--overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  padding: 0;
}

.loading-spinner__container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner__spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner__text {
  color: white;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Темная тема для overlay */
.loading-spinner--overlay .loading-spinner__text {
  color: white;
}

.loading-spinner--overlay .loading-spinner__spinner {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: #3498db;
}
</style>
