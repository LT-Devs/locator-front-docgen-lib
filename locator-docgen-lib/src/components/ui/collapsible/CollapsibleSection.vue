<template>
    <Collapsible :open="open" class="mb-4">
      <CollapsibleTrigger as-child>
        <Button variant="outline" class="w-full" @click="toggle">
          <ChevronUp v-if="open" />
          <ChevronDown v-else />
          <a>{{ title }}</a>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent class="px-[10px]">
        <div class="flex flex-col gap-y-[10px] py-[15px]">
          <slot></slot>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const props = defineProps({
    title: String,
    open: Boolean,
  });
  
  const emit = defineEmits(['toggle']);
  
  const toggle = () => {
    emit('toggle');
  };
  </script>