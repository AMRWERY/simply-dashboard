import type { ToastOptions } from "~/components/shared/VToast.vue";

// Singleton ref — same instance across all composable calls
const _toastRef = ref<{
  add: (o: ToastOptions) => void;
  remove: (id: number) => void;
} | null>(null);

export function useToast() {
  /** Called once from app.vue to register the mounted VToast instance */
  function register(instance: typeof _toastRef.value) {
    _toastRef.value = instance;
  }

  function add(options: ToastOptions) {
    if (!_toastRef.value) {
      console.warn(
        "[useToast] VToast is not mounted yet. Make sure <VToast> is in app.vue.",
      );
      return;
    }
    _toastRef.value.add(options);
  }

  function remove(id: number) {
    _toastRef.value?.remove(id);
  }

  return { register, add, remove };
}
