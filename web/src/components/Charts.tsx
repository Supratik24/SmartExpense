import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import type { ChartPoint } from '../services/api';

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip);

const palette = ['#1677ff', '#00a76f', '#f59e0b', '#e11d48', '#7c3aed', '#0f766e', '#ea580c', '#475569'];

export function ExpenseLine({ data }: { data: ChartPoint[] }) {
  return (
    <Line
      data={{
        labels: data.map((item) => formatLabel(item.label)),
        datasets: [{ label: 'Expense', data: data.map((item) => item.value), borderColor: '#1677ff', backgroundColor: '#1677ff' }]
      }}
      options={{ responsive: true, plugins: { legend: { display: false } } }}
    />
  );
}

export function CategoryPie({ data }: { data: ChartPoint[] }) {
  return (
    <Pie
      data={{
        labels: data.map((item) => item.label),
        datasets: [{ data: data.map((item) => item.value), backgroundColor: palette }]
      }}
      options={{ responsive: true }}
    />
  );
}

export function MerchantsBar({ data }: { data: ChartPoint[] }) {
  return (
    <Bar
      data={{
        labels: data.map((item) => item.label),
        datasets: [{ label: 'Spend', data: data.map((item) => item.value), backgroundColor: '#00a76f' }]
      }}
      options={{ responsive: true, plugins: { legend: { display: false } } }}
    />
  );
}

function formatLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
