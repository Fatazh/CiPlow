import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Filler,
  type ChartOptions,
} from "chart.js";

// Register all Chart.js components used across the app
ChartJS.register(
  // Geometry
  ArcElement, // Doughnut / Pie
  BarElement, // Bar charts
  LineElement, // Line charts
  PointElement, // Scatter / Line points

  // Scales
  CategoryScale, // X axis — category
  LinearScale, // Y axis — linear

  // Plugins
  Tooltip,
  Legend,
  Title,
  Filler, // Area fill under line charts
);

// ─── Global Defaults ──────────────────────────────────────────
ChartJS.defaults.font.family = "Inter, system-ui, sans-serif";
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = "#94a3b8"; // slate-400 — works on both light & dark

// Tooltip defaults
ChartJS.defaults.plugins.tooltip.backgroundColor = "rgba(15, 23, 42, 0.92)";
ChartJS.defaults.plugins.tooltip.titleColor = "#f1f5f9";
ChartJS.defaults.plugins.tooltip.bodyColor = "#cbd5e1";
ChartJS.defaults.plugins.tooltip.borderColor = "rgba(148, 163, 184, 0.15)";
ChartJS.defaults.plugins.tooltip.borderWidth = 1;
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius = 10;
ChartJS.defaults.plugins.tooltip.displayColors = true;
ChartJS.defaults.plugins.tooltip.boxPadding = 4;

// Legend defaults
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.pointStyle = "circle";
ChartJS.defaults.plugins.legend.labels.padding = 16;
ChartJS.defaults.plugins.legend.labels.font = { size: 12, weight: 500 };

// Doughnut / Pie defaults
ChartJS.defaults.elements.arc.borderWidth = 0;
ChartJS.defaults.elements.arc.hoverOffset = 6;

// Bar defaults
ChartJS.defaults.elements.bar.borderRadius = 6;
ChartJS.defaults.elements.bar.borderWidth = 0;

// Line defaults
ChartJS.defaults.elements.line.tension = 0.4;
ChartJS.defaults.elements.line.borderWidth = 2;

// Point defaults
ChartJS.defaults.elements.point.radius = 3;
ChartJS.defaults.elements.point.hoverRadius = 5;
ChartJS.defaults.elements.point.borderWidth = 2;
ChartJS.defaults.elements.point.hoverBorderWidth = 2;

export default defineNuxtPlugin(() => {
  // Chart.js is registered globally — no return value needed.
  // Components (Doughnut, Bar, Line, etc.) are imported directly
  // from 'vue-chartjs' in each .vue component.
});
