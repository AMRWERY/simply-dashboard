import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
} from "chart.js";

// Register only what the report charts use (keeps the bundle small).
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip);

if (import.meta.client) {
  // Canvas can't inherit CSS fonts, so copy the page's font family.
  Chart.defaults.font.family =
    getComputedStyle(document.body).fontFamily || "sans-serif";
  Chart.defaults.font.weight = 600;
}

/** Colours and shared options that follow dark mode and the active language. */
export function useChartTheme() {
  const { isDark } = useTheme();
  const { locale } = useI18n();

  const isRtl = computed(() => locale.value === "ar");

  const colors = computed(() => ({
    text: isDark.value ? "#9ca3af" : "#6b7280",
    grid: isDark.value ? "rgba(255,255,255,0.07)" : "rgba(17,24,39,0.06)",
    track: isDark.value ? "#2a2c3a" : "#f3f4f6",
    indigo: "#4f46e5",
    indigoSoft: isDark.value ? "#3730a3" : "#c7d2fe",
    emerald: "#10b981",
    amber: "#f59e0b",
    orange: "#f97316",
    violet: "#8b5cf6",
  }));

  /** Tooltip styling shared by every chart. */
  const tooltip = computed(() => ({
    backgroundColor: isDark.value ? "#0f1020" : "#111827",
    titleColor: "#ffffff",
    bodyColor: "#e5e7eb",
    padding: 10,
    cornerRadius: 10,
    displayColors: false,
    rtl: isRtl.value,
    textDirection: isRtl.value ? ("rtl" as const) : ("ltr" as const),
  }));

  return { isRtl, colors, tooltip };
}
