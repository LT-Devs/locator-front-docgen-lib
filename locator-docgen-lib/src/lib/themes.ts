export const themes = [
  {
    name: 'zinc',
    label: 'Цинк',
    color: '#000000',
  },
  {
    name: 'rose',
    label: 'Роза',
    color: '#f43f5e',
  },
  {
    name: 'orange',
    label: 'Оранжевый',
    color: '#f97316',
  },
  {
    name: 'green',
    label: 'Зеленый',
    color: '#22c55e',
  },
  {
    name: 'blue',
    label: 'Синий',
    color: '#3b82f6',
  },
  {
    name: 'violet',
    label: 'Фиолетовый',
    color: '#8b5cf6',
  },
] as const


export type Theme = (typeof themes)[number]
