<script setup lang="ts">
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Search, Plus } from "lucide-vue-next";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ref, onMounted, nextTick } from 'vue';
import { useVModel } from '@vueuse/core';

const isCreating = ref(false);

const props = defineProps<{
  label: string;
  items?: { value: string; label: string }[];
  modelValue: string | number;
}>()

const modelValue = useVModel(props, 'modelValue', undefined, {
  passive: true,
})

const isOpen = ref(false);
const emit = defineEmits(['update:openState']);
 


let commandGroup: HTMLCollectionOf<Element> | null = null;

onMounted(() => {
  commandGroup = document.getElementsByClassName('command-group');
});

const handleEnter = () => {
  if (isCreating.value) {
    modelValue.value = input.value;
    isOpen.value = false;
  }
};

const input = ref("");

const handleInput = (value: string) => {
  input.value = value;
  nextTick(() => {
    const children = commandGroup ? Array.from(commandGroup).flatMap(group => Array.from(group.children).filter(child => getComputedStyle(child).display !== 'none')) : [];
    isCreating.value = children.length === 0;
  });
};

const handleSelect = (value: string) => {
  modelValue.value = value;
  isOpen.value = false;
};
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button variant="outline" role="combobox" :aria-expanded="isOpen" class="w-full justify-between">
        <template v-if="props.items?.find(item => item.label === modelValue)">
          {{ props.items?.find(item => item.label === modelValue)?.label }}
        </template>
        <template v-else-if="isCreating">
          {{ input }}
        </template>
        <template v-else>
          {{ props.label }}
        </template>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-full p-0">
      <Command v-model="modelValue">

        <CommandInput v-if="!isCreating" class="h-9" placeholder="Поиск..." @update:input="handleInput" :items="props.items" >
          <Search class="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </CommandInput>
        <CommandEmpty v-else>
          <CommandInput class="h-9" placeholder="Поиск..." @update:input="handleInput"  :items="props.items" @keyup.enter="handleEnter()">
            <Plus class="mr-2 h-4 w-4 shrink-0 opacity-50" @click="handleEnter" />
          </CommandInput>
        </CommandEmpty>
        
        <CommandList>
          <CommandGroup>
            <CommandItem
              v-for="comboitem in props.items"
              :key="comboitem.value"
              :value="comboitem.label"
              @select="handleSelect(comboitem.value)"
            >
              {{ comboitem.label }}
              <Check :class="cn(
                'ml-auto h-4 w-4',
                modelValue === comboitem.value ? 'opacity-100' : 'opacity-0',
              )" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>