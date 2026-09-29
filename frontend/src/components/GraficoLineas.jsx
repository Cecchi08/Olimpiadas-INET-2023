import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ui from '../styles/ui.module.css';
export default function GraficoLineas({ data }) {
  if (!data.length) return <p className={ui.empty}>No hay llamados atendidos para calcular el tiempo de respuesta.</p>;
  return <ResponsiveContainer width="100%" height={270}><LineChart data={data} margin={{ top: 15, right: 20, bottom: 15, left: 0 }} accessibilityLayer><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f5" /><XAxis dataKey="fecha" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis unit=" s" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={value => [`${value} s`, 'Tiempo promedio']} /><Line type="monotone" dataKey="promedio" name="Tiempo promedio" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} /></LineChart></ResponsiveContainer>;
}

