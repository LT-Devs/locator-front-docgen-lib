<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useConfigStore } from '@/lib/config'
import { useColorMode } from '@vueuse/core'
import { Paintbrush } from 'lucide-vue-next'
import { onMounted, watch } from 'vue'
import ThemeCustomizer from './ThemeCustomizer.vue'
import { allColors } from './theming/utils/data'

const { theme, radius } = useConfigStore()
const colorMode = useColorMode()

// Whenever the component is mounted, update the document class list
onMounted(() => {
  document.documentElement.style.setProperty('--radius', `${radius.value}rem`)
  document.documentElement.classList.add(`theme-${theme.value}`)
  // Ensure dark mode is applied if needed
  if (colorMode.value === 'dark') {
    document.documentElement.classList.add('dark')
  }
})

// Whenever the theme value changes, update the document class list
watch(theme, (theme) => {
  document.documentElement.classList.remove(
    ...allColors.map(color => `theme-${color}`),
  )
  document.documentElement.classList.add(`theme-${theme}`)
})

// Watch for color mode changes and sync with theme
watch(colorMode, (mode) => {
  if (mode === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})

// Whenever the radius value changes, update the document style
watch(radius, (radius) => {
  document.documentElement.style.setProperty('--radius', `${radius}rem`)
})
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        class="w-9 h-9"
        variant="outline" size="icon"
      >
        <Paintbrush class="w-4 h-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent :side-offset="8" align="end" class="w-128">
      <ThemeCustomizer :all-colors="allColors" />
    </PopoverContent>
  </Popover>
</template>
