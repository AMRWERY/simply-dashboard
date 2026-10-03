export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastOptions {
  message: string;
  type?: ToastType;
  /** Auto-dismiss duration in ms. Pass 0 to disable. Default: 4000 */
  duration?: number;
}

export interface ToastItem extends Required<ToastOptions> {
  id: number;
  progress: number;
  _timer?: ReturnType<typeof setInterval>;
}
