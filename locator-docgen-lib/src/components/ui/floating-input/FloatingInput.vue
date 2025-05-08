<template>
  <div class="relative">
    <input
      v-model="modelValue"
      :id="label"
      :max="max"
      :min="min"
      :disabled="disabled"
      :type="type"
      :class="cn('peer flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', inputClass)"
      placeholder=" "
    />
    <label
      :for="label"
      :class="cn('peer-focus:secondary peer-focus:dark:secondary absolute start-2 top-1.5 z-0 origin-[0] -translate-y-4 scale-75 transform bg-background px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 dark:bg-background rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4 cursor-text', labelClass)"
    >
      {{ label }}
    </label>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { cn } from '@/lib/utils'
import { useVModel } from '@vueuse/core'

const props = defineProps<{
  modelValue?: string | number
  label?: string
  type?: string
  inputClass?: string
  labelClass?: string
  max?: string
  min?: string
  disabled?: boolean
}>()

const modelValue = useVModel(props, 'modelValue', undefined, {
  passive: true,
})
</script>


<style scoped>
input[type="date"]::-webkit-inner-spin-button,
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1) hue-rotate(180deg) brightness(0.7) saturate(0.5);
  color: hsl(var(--muted));
}
</style>