'use client';

import { useState, useMemo } from 'react';
import {
  ScatterChart, Scatter,
  LineChart, Line,
  BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ZAxis,
} from 'recharts';
import { VideoItem } from '@/types';
import { formatNumber } from '@/lib/utils';

interface Props { videos: VideoItem[] }

type ChartType = 'scatter' | 'line' | 'bar';

const CHART_TYPES: { type: ChartType; label: string; desc: string }[] = [
  { type: 'line',    label: 'Line',    desc: 'Connected trend' },
  { type: 'bar',     label: 'Bar',     desc: 'Views per upload' },
  { type: 'scatter', label: 'Scatter', desc: 'Each video as a dot' },
];

const fmtDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: { payload: { title: string; views: number; date: number; isShort: boolean } }[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#222] border border-[#333] rounded-lg p-3 text-xs max-w-xs">
      <p className="text-white font-medium mb-1 leading-tight line-clamp-2">{d.title}</p>
      <p className="text-[#ff0000]">{formatNumber(d.views)} views</p>
      <p className="text-gray-400 mt-0.5">
        {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
      {d.isShort && <p className="text-blue-400 mt-0.5">Short</p>}
    </div>
  );
};

export default function TrendChart({ videos }: Props) {
  const [chartType, setChartType] = useState<ChartType>('line');

  const sorted = useMemo(() => [...videos]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .map(v => ({
      date: new Date(v.publishedAt).getTime(),
      views: v.viewCount,
      title: v.title,
      isShort: v.isShort,
    })), [videos]);

  const regular = useMemo(() => sorted.filter(v => !v.isShort), [sorted]);
  const shorts  = useMemo(() => sorted.filter(v => v.isShort), [sorted]);
  const hasShorts = shorts.length > 0;

  const axisProps = {
    xAxis: {
      type: 'number' as const,
      dataKey: 'date',
      domain: ['dataMin', 'dataMax'] as ['dataMin', 'dataMax'],
      tickFormatter: fmtDate,
      tick: { fill: '#666', fontSize: 11 },
      axisLine: false,
      tickLine: false,
      scale: 'time' as const,
    },
    yAxis: {
      tickFormatter: (v: number) => formatNumber(v),
      tick: { fill: '#666', fontSize: 11 },
      axisLine: false,
      tickLine: false,
    },
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <div className="flex gap-1">
          {CHART_TYPES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                chartType === type
                  ? 'bg-[#ff0000] text-white'
                  : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'scatter' ? (
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis {...axisProps.xAxis} />
            <YAxis {...axisProps.yAxis} type="number" dataKey="views" />
            <ZAxis range={[35, 35]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#444' }} />
            {regular.length > 0 && <Scatter data={regular} fill="#ff0000" fillOpacity={0.85} name="Regular" />}
            {hasShorts && <Scatter data={shorts} fill="#3b82f6" fillOpacity={0.7} name="Shorts" />}
          </ScatterChart>
        ) : chartType === 'line' ? (
          <LineChart data={sorted} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} scale="time" type="number" domain={['dataMin', 'dataMax']} />
            <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#444' }} />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#ff0000"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload, index } = props;
                return (
                  <circle
                    key={index}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={payload.isShort ? '#3b82f6' : '#ff0000'}
                    stroke="none"
                  />
                );
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        ) : (
          <BarChart data={sorted} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} scale="time" type="number" domain={['dataMin', 'dataMax']} />
            <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="views" radius={[3, 3, 0, 0]}>
              {sorted.map((entry, i) => (
                <Cell key={i} fill={entry.isShort ? '#3b82f6' : '#ff0000'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>

      {hasShorts && (
        <div className="flex items-center gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff0000]" />
            <span className="text-gray-500 text-xs">Regular ({regular.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-gray-500 text-xs">Shorts ({shorts.length})</span>
          </div>
        </div>
      )}
    </div>
  );
}
