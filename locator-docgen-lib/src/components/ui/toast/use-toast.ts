import type { Component, VNode } from 'vue'
import type { ToastProps } from '.'
import { computed, ref } from 'vue'

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

export type StringOrVNode =
  | string
  | VNode
  | (() => VNode)

type ToasterToast = ToastProps & {
  id: string
  title?: string
  description?: StringOrVNode
  action?: Component
}

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
    type: ActionType['ADD_TOAST']
    toast: ToasterToast
  }
  | {
    type: ActionType['UPDATE_TOAST']
    toast: Partial<ToasterToast>
  }
  | {
    type: ActionType['DISMISS_TOAST']
    toastId?: ToasterToast['id']
  }
  | {
    type: ActionType['REMOVE_TOAST']
    toastId?: ToasterToast['id']
  }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId))
    return

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

const state = ref<State>({
  toasts: [],
})

function dispatch(action: Action) {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      // @ts-ignore: Bypassing deep instantiation error
      state.value.toasts = ([action.toast] as any[]).concat(state.value.toasts).slice(0, TOAST_LIMIT)
      break

    case actionTypes.UPDATE_TOAST: {
      const arr: any[] = [];
      for (let i = 0; i < state.value.toasts.length; i++) {
        const t = state.value.toasts[i];
        if (t.id === action.toast.id) {
          arr.push(Object.assign({}, t, action.toast));
        } else {
          arr.push(t);
        }
      }
      state.value.toasts = arr;
      break;
    }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      }
      else {
        state.value.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      const arr: any[] = [];
      for (let i = 0; i < state.value.toasts.length; i++) {
        const t = state.value.toasts[i];
        if (t.id === toastId || toastId === undefined) {
          arr.push(Object.assign({}, t, { open: false }));
        } else {
          arr.push(t);
        }
      }
      state.value.toasts = arr;
      break
    }

    case actionTypes.REMOVE_TOAST: {
      if (action.toastId === undefined) {
        state.value.toasts = []
      } else {
        const arr: any[] = [];
        for (let i = 0; i < state.value.toasts.length; i++) {
          const t = state.value.toasts[i];
          if (t.id !== action.toastId) {
            arr.push(t);
          }
        }
        state.value.toasts = arr;
      }
      break
    }
  }
}

function useToast() {
  return {
    toasts: computed(() => state.value.toasts),
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

type Toast = Omit<ToasterToast, 'id'>

function toast(props: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    })

  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open)
          dismiss()
      },
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

export { toast, useToast }
