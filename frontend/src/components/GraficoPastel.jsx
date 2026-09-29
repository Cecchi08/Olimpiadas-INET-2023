import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ui from '../styles/ui.module.css';
export default function GraficoPastel({ data }) {
  if (!data.some(row => row.cantidad > 0)) return <p className={ui.empty}>No hay llamados para estos filtros.</p>;
  return <ResponsiveContainer width="100%" height={270}><PieChart accessibilityLayer><Pie data={data} dataKey="cantidad" nameKey="nombre" innerRadius={60} outerRadius={88} paddingAngle={3}>{data.map(row => <Cell key={row.nombre} fill={row.nombre === 'Emergencia' ? '#ef4444' : '#3b82f6'} />)}</Pie><Tooltip /><Legend iconType="circle" iconSize={8} /></PieChart></ResponsiveContainer>;
}

