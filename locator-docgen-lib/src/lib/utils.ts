import type { Ref } from 'vue'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function valueUpdater(updaterOrValue: any, ref: Ref) {
  ref.value
    = typeof updaterOrValue === 'function'
      ? updaterOrValue(ref.value)
      : updaterOrValue
}
