"use client";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#9ca3af"];
export function CategoryChart({ data }: { data: { name: string; kg: number }[] }) {
  if (!data.length) return <p className="text-sm text-gray-500">Belum ada data.</p>;
  return (<div className="h-56"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="kg" fill="#059669" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>);
}
export function StatusChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <p className="text-sm text-gray-500">Belum ada data.</p>;
  return (<div className="h-56"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>);
}
