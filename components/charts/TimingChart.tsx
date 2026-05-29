'use client';

import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { DayData } from '@/types';

interface Props { data: DayData[] }

type ChartType = 'bar' | 'line' | 'radar';

const CHART_TYPES: { type: ChartType; label: string }[] = [
  { type: 'bar',   label: 'Bar' },
  { type: 'line',  label: 'Line' },
  { type: 'radar', label: 'Radar' },
];

const fmtViews = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: DayData }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#222] border border-[#333] rounded-lg p-3 text-xs">
      <p className="text-white font-medium mb-1">{label}</p>
      <p className="text-[#ff0000]">Avg. Views: {payload[0].value.toLocaleString()}</p>
      <p className="text-gray-400 mt-0.5">{d.count} video{d.count !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default function TimingChart({ data }: Props) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const sorted = [...data].sort((a, b) => a.avgViews - b.avgViews);
  const maxDay = data.reduce((a, b) => a.avgViews > b.avgViews ? a : b, data[0]);
  const total = sorted.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">
          <span className="text-[#ff0000] font-bold">{maxDay?.day}</span>{' '}
          uploads have the highest avg. views
          <span className="text-white ml-1">({fmtViews(maxDay?.avgViews ?? 0)})</span>
        </p>
        <div className="flex gap-1">
          {CHART_TYPES.map(({ type, label }) => (
            <button key={type} onClick={() => setChartType(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                chartType === type ? 'bg-[#ff0000] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        {chartType === 'bar' ? (
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtViews} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="avgViews" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.day === maxDay?.day ? '#ff0000' : '#3a3a3a'} />
              ))}
            </Bar>
          </BarChart>
        ) : chartType === 'line' ? (
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtViews} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#444' }} />
            <Line type="monotone" dataKey="avgViews" stroke="#ff0000" strokeWidth={2}
              dot={(props) => {
                const isMax = data[props.index]?.day === maxDay?.day;
                return <circle key={props.index} cx={props.cx} cy={props.cy} r={isMax ? 6 : 3} fill={isMax ? '#ff0000' : '#cc4444'} stroke={isMax ? '#fff' : 'none'} strokeWidth={1.5} />;
              }}
            />
          </LineChart>
        ) : (
          <RadarChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
            <PolarGrid stroke="#2a2a2a" />
            <PolarAngleAxis dataKey="day" tick={{ fill: '#888', fontSize: 12 }} />
            <PolarRadiusAxis tick={{ fill: '#555', fontSize: 9 }} tickFormatter={fmtViews} />
            <Tooltip content={<CustomTooltip />} />
            <Radar dataKey="avgViews" stroke="#ff0000" fill="#ff0000" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        )}
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
        <p className="text-gray-500 text-xs">Average views by upload day · {total} videos</p>
        {data.some(d => d.count === 0) && (
          <p className="text-gray-600 text-xs">
            No uploads on: {data.filter(d => d.count === 0).map(d => d.day).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
