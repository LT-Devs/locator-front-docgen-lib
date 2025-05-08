<script lang="ts" setup>
import type { Color } from '@/components/ui/theme/theming/utils/data'
import { Button } from '@/components/ui/button'
import { CircleCheck } from 'lucide-vue-next'
import { useConfigStore } from '@/lib/config'
import { themes } from '@/lib/themes'
defineProps<{
  allColors: Color[]
}>()

const { theme, setTheme } = useConfigStore()
</script>

<template>
  <div class="p-2">
    <div class="grid space-y-1">
      <h1 class="text-md text-foreground font-semibold">
        Цвет
      </h1>
      <p class="text-xs text-muted-foreground">
        Выберите свои акценты цвета
      </p>
    </div>
    <div class="space-y-1.5 pt-6">
      <div class="grid grid-cols-3 gap-2 py-1.5">
        <Button
          v-for="(color, index) in allColors"
          :key="index"
          variant="outline"
          class="h-8 justify-start px-1"
          :class="
            color === theme
              ? 'border-foreground border-2'
              : ''
          "
          @click="setTheme(color)"
        >
          <span
            class="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
            :style="{ backgroundColor: themes.find(theme => theme.name === color)?.color }"
          >
            <CircleCheck
              v-if="color === theme"
              class="text-white"
            />
          </span>
          <span class="text-xs capitalize">
            {{ themes.find(theme => theme.name === color)?.label }}
          </span>
        </Button>
      </div>
    </div>
  </div>
</template>
