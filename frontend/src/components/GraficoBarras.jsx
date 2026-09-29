import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ui from '../styles/ui.module.css';
export default function GraficoBarras({ data }) {
  if (!data.length) return <p className={ui.empty}>No hay llamados para estos filtros.</p>;
  return <ResponsiveContainer width="100%" height={270}><BarChart data={data} margin={{ top: 15, right: 12, bottom: 20, left: -15 }} accessibilityLayer><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f5" /><XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#eff6ff' }} /><Bar dataKey="cantidad" name="Llamados" fill="#3b82f6" radius={[5, 5, 0, 0]} maxBarSize={40} /></BarChart></ResponsiveContainer>;
}

