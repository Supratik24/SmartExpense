import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type Plugin,
  type ScriptableContext
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import type { ChartPoint } from '../services/api';

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip);

/** Soft lilac / lavender / blush palette (reference UI) */
const LILAC = {
  ink: '#5E4B7A',
  muted: '#9B8BB4',
  pink: '#F8BBD0',
  blush: '#F5C6D6',
  lavender: '#E1BEE7',
  lilac: '#D1C4E9',
  paleLilac: '#EDE7F6',
  palePink: '#FCE4EC',
  midLilac: '#CE93D8',
  softRose: '#F48FB1'
};

const pieStops: [string, string][] = [
  [LILAC.palePink, LILAC.pink],
  [LILAC.pink, LILAC.lavender],
  [LILAC.paleLilac, LILAC.lavender],
  [LILAC.lavender, LILAC.lilac],
  [LILAC.palePink, LILAC.blush],
  [LILAC.lilac, LILAC.midLilac],
  [LILAC.paleLilac, LILAC.lilac],
  [LILAC.blush, LILAC.softRose]
];

const barStops: [string, string][] = [
  [LILAC.lavender, LILAC.midLilac],
  [LILAC.pink, LILAC.lavender],
  [LILAC.lilac, LILAC.lavender],
  [LILAC.palePink, LILAC.pink],
  [LILAC.paleLilac, LILAC.lilac],
  [LILAC.blush, LILAC.lavender],
  [LILAC.midLilac, LILAC.lilac],
  [LILAC.pink, LILAC.softRose]
];

const incomeStops: [string, string] = [LILAC.lavender, LILAC.midLilac];
const expenseStops: [string, string] = [LILAC.pink, LILAC.softRose];

const pieAnimation = {
  animateRotate: true,
  animateScale: true,
  duration: 1500,
  easing: 'easeOutQuart' as const,
  delay(context: { type: string; dataIndex: number; mode: string }) {
    if (context.type === 'data' && context.mode === 'default') {
      return context.dataIndex * 100;
    }
    return 0;
  }
};

const barAnimation = {
  duration: 1200,
  easing: 'easeOutCubic' as const,
  delay(context: { type: string; dataIndex: number; mode: string }) {
    if (context.type === 'data' && context.mode === 'default') {
      return context.dataIndex * 110;
    }
    return 0;
  }
};

const lineAnimation = {
  duration: 900,
  easing: 'easeOutQuart' as const
};

const pastelTooltip = {
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  titleColor: LILAC.ink,
  bodyColor: LILAC.muted,
  borderColor: 'rgba(225, 190, 231, 0.75)',
  borderWidth: 1,
  padding: 12,
  cornerRadius: 14,
  displayColors: true,
  boxPadding: 6,
  boxWidth: 10,
  boxHeight: 10,
  usePointStyle: true
};

const pastelScales = {
  x: {
    grid: { display: false },
    ticks: { color: LILAC.muted, font: { weight: 'bold' as const } }
  },
  y: {
    grid: { color: 'rgba(209, 196, 233, 0.35)' },
    ticks: {
      color: LILAC.muted,
      callback(value: string | number) {
        return formatCurrency(Number(value));
      }
    }
  }
};

const centerTextPlugin: Plugin<'doughnut'> = {
  id: 'centerText',
  beforeDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const values = chart.data.datasets[0]?.data as number[] | undefined;
    if (!values?.length) return;

    const total = values.reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
    if (!total) return;

    const topIndex = values.indexOf(Math.max(...values));
    const topValue = values[topIndex] ?? 0;
    const pct = Math.round((topValue / total) * 100);
    const rawLabel = String(chart.data.labels?.[topIndex] ?? 'Top');
    const subtitle = rawLabel.length > 16 ? 'Top Category' : rawLabel;

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 30px Inter, ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = LILAC.ink;
    ctx.fillText(`${pct}%`, centerX, centerY - 10);
    ctx.font = '500 12px Inter, ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = LILAC.muted;
    ctx.fillText(subtitle, centerX, centerY + 18);
    ctx.restore();
  }
};

const slicePercentPlugin: Plugin<'doughnut'> = {
  id: 'slicePercent',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const values = chart.data.datasets[0]?.data as number[] | undefined;
    if (!values?.length) return;

    const total = values.reduce((sum, value) => sum + value, 0);
    if (!total) return;

    meta.data.forEach((arc, index) => {
      const value = values[index] ?? 0;
      const pct = Math.round((value / total) * 100);
      if (pct < 6) return;

      const point = arc.tooltipPosition(false);
      const px = point.x ?? 0;
      const py = point.y ?? 0;
      const label = `${pct}%`;
      const padX = 8;

      ctx.save();
      ctx.font = '600 11px Inter, ui-sans-serif, system-ui, sans-serif';
      const width = ctx.measureText(label).width + padX * 2;
      const height = 22;
      const x = px - width / 2;
      const y = py - height / 2;

      roundRect(ctx, x, y, width, height, 10);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.shadowColor = 'rgba(94, 75, 122, 0.12)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = LILAC.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, px, py + 1);
      ctx.restore();
    });
  }
};

ChartJS.register(centerTextPlugin, slicePercentPlugin);

export const DEMO_CATEGORY: ChartPoint[] = [
  { label: 'Food', value: 4500 },
  { label: 'Shopping', value: 3200 },
  { label: 'Travel', value: 1800 },
  { label: 'Bills', value: 1200 }
];

export const DEMO_MERCHANTS: ChartPoint[] = [
  { label: 'SWIGGY', value: 4200 },
  { label: 'AMAZON', value: 3100 },
  { label: 'UBER', value: 1900 },
  { label: 'ZOMATO', value: 1500 }
];

export const DEMO_LINE: ChartPoint[] = [
  { label: '2026-06-01', value: 800 },
  { label: '2026-06-05', value: 1200 },
  { label: '2026-06-09', value: 950 },
  { label: '2026-06-13', value: 1400 }
];

export const DEMO_INCOME_EXPENSE: ChartPoint[] = [
  { label: 'income', value: 52000 },
  { label: 'expense', value: 38500 }
];

export function ExpenseLine({ data, variant = 'daily', demo = false }: { data: ChartPoint[]; variant?: 'daily' | 'monthly'; demo?: boolean }) {
  return (
    <div className={`chart-wrap chart-wrap-line${demo ? ' chart-demo' : ''}`}>
      <Line
        data={{
          labels: data.map((item) => formatLabel(item.label, variant)),
          datasets: [{
            label: 'Expense',
            data: data.map((item) => item.value),
            borderColor: LILAC.midLilac,
            backgroundColor: 'rgba(225, 190, 231, 0.28)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#fff',
            pointBorderColor: LILAC.midLilac,
            pointBorderWidth: 2,
            pointHoverRadius: 6
          }]
        }}
        options={{
          responsive: true,
          animation: lineAnimation,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...pastelTooltip,
              callbacks: {
                label(context) {
                  return ` ${formatCurrency(context.parsed.y ?? 0)}`;
                }
              }
            }
          },
          scales: pastelScales
        }}
      />
    </div>
  );
}

export function CategoryPie({ data, demo = false }: { data: ChartPoint[]; demo?: boolean }) {
  return (
    <div className={`chart-wrap chart-wrap-pie${demo ? ' chart-demo' : ''}`}>
      <Doughnut
        data={{
          labels: data.map((item) => item.label),
          datasets: [{
            data: data.map((item) => item.value),
            backgroundColor: (context) => pieSliceGradient(context, pieStops),
            hoverBackgroundColor: (context) => pieSliceGradient(context, pieStops, 1.06),
            borderColor: '#faf7fc',
            borderWidth: 4,
            hoverBorderColor: '#ffffff',
            hoverBorderWidth: 4,
            hoverOffset: 10,
            spacing: 3
          }]
        }}
        options={{
          responsive: true,
          cutout: '62%',
          animation: pieAnimation,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                pointStyle: 'rectRounded',
                padding: 18,
                color: LILAC.muted,
                font: { size: 12, weight: 'bold' as const }
              }
            },
            tooltip: {
              ...pastelTooltip,
              callbacks: {
                label(context) {
                  const values = context.dataset.data as number[];
                  const total = values.reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
                  const value = context.parsed ?? 0;
                  const pct = total ? Math.round((value / total) * 100) : 0;
                  return ` ${context.label}: ${formatCurrency(value)} (${pct}%)`;
                }
              }
            }
          }
        }}
      />
    </div>
  );
}

export function MerchantsBar({ data, demo = false }: { data: ChartPoint[]; demo?: boolean }) {
  return (
    <div className={`chart-wrap chart-wrap-bar${demo ? ' chart-demo' : ''}`}>
      <Bar
        data={{
          labels: data.map((item) => item.label),
          datasets: [{
            label: 'Spend',
            data: data.map((item) => item.value),
            backgroundColor: (context) => verticalBarGradient(context, barStops),
            hoverBackgroundColor: (context) => verticalBarGradient(context, barStops, 1.05),
            borderRadius: 14,
            borderSkipped: false,
            maxBarThickness: 46
          }]
        }}
        options={{
          responsive: true,
          animation: barAnimation,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...pastelTooltip,
              callbacks: {
                label(context) {
                  return ` ${formatCurrency(context.parsed.y ?? 0)}`;
                }
              }
            }
          },
          scales: pastelScales
        }}
      />
    </div>
  );
}

export function IncomeExpenseBar({ data, demo = false }: { data: ChartPoint[]; demo?: boolean }) {
  return (
    <div className={`chart-wrap chart-wrap-bar${demo ? ' chart-demo' : ''}`}>
      <Bar
        data={{
          labels: data.map((item) => item.label.charAt(0).toUpperCase() + item.label.slice(1)),
          datasets: [{
            label: 'Amount',
            data: data.map((item) => item.value),
            backgroundColor: (context) => {
              const label = data[context.dataIndex]?.label ?? '';
              const stops = label === 'income' ? incomeStops : expenseStops;
              return verticalBarGradient(context, [stops], 1);
            },
            hoverBackgroundColor: (context) => {
              const label = data[context.dataIndex]?.label ?? '';
              const stops = label === 'income' ? incomeStops : expenseStops;
              return verticalBarGradient(context, [stops], 1.05);
            },
            borderRadius: 16,
            borderSkipped: false,
            maxBarThickness: 72
          }]
        }}
        options={{
          responsive: true,
          animation: barAnimation,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...pastelTooltip,
              callbacks: {
                label(context) {
                  return ` ${formatCurrency(context.parsed.y ?? 0)}`;
                }
              }
            }
          },
          scales: pastelScales
        }}
      />
    </div>
  );
}

function pieSliceGradient(
  context: ScriptableContext<'doughnut'>,
  stops: [string, string][],
  brighten = 1
) {
  const chart = context.chart;
  const { ctx, chartArea } = chart;
  const index = context.dataIndex % stops.length;
  const [from, to] = stops[index];

  if (!chartArea) return from;

  const angle = (index / Math.max(stops.length, 1)) * Math.PI * 2;
  const x1 = chartArea.left + (chartArea.right - chartArea.left) * (0.25 + 0.15 * Math.cos(angle));
  const y1 = chartArea.bottom - 4;
  const x2 = chartArea.right - 8;
  const y2 = chartArea.top + (chartArea.bottom - chartArea.top) * 0.15;

  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, brightenColor(from, brighten));
  gradient.addColorStop(0.55, brightenColor(to, brighten * 0.98));
  gradient.addColorStop(1, brightenColor(to, brighten * 0.88));
  return gradient;
}

function verticalBarGradient(
  context: ScriptableContext<'bar'>,
  stops: [string, string][],
  brighten = 1
) {
  const chart = context.chart;
  const { ctx, chartArea } = chart;
  const index = context.dataIndex % stops.length;
  const [from, to] = stops[index];

  if (!chartArea) return from;

  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, brightenColor(to, brighten * 0.9));
  gradient.addColorStop(0.5, brightenColor(from, brighten));
  gradient.addColorStop(1, brightenColor(from, brighten * 1.04));
  return gradient;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function brightenColor(hex: string, factor: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `rgb(${clamp(rgb.r)}, ${clamp(rgb.g)}, ${clamp(rgb.b)})`;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function formatLabel(value: string, variant: 'daily' | 'monthly') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (variant === 'monthly') {
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}
