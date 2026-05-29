'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  RadialBarChart, RadialBar,
} from 'recharts';
import { ShortsData } from '@/types';
import { formatNumber } from '@/lib/utils';

interface Props { data: ShortsData }

type ChartType = 'bar' | 'pie' | 'radial';

const CHART_TYPES: { type: ChartType; label: string }[] = [
  { type: 'bar',    label: 'Bar' },
  { type: 'pie',    label: 'Pie' },
  { type: 'radial', label: 'Radial' },
];

const renderPieLabel = ({ name, percent }: { name?: string; percent?: number }) =>
  `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`;

export default function ShortsChart({ data }: Props) {
  const [chartType, setChartType] = useState<ChartType>('bar');

  const chartData = [
    { name: 'Shorts',  avgViews: data.shorts.avgViews },
    { name: 'Regular', avgViews: data.regular.avgViews },
  ];

  const radialData = [
    { name: 'Regular', avgViews: data.regular.avgViews, fill: '#3a3a3a' },
    { name: 'Shorts',  avgViews: data.shorts.avgViews,  fill: '#ff0000' },
  ];

  const showChart = data.shorts.count > 0 && data.regular.count > 0;

  return (
    <div className="space-y-4">
      {/* 스탯 카드 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0f0f0f] rounded-xl p-4 border border-[#ff0000]/20">
          <p className="text-gray-400 text-xs mb-1">Shorts</p>
          <p className="text-white text-xl font-bold">{formatNumber(data.shorts.avgViews)}</p>
          <p className="text-gray-500 text-xs">Avg. Views</p>
          <p className="text-gray-400 text-xs mt-2">{data.shorts.count} videos</p>
        </div>
        <div className="bg-[#0f0f0f] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-gray-400 text-xs mb-1">Regular Videos</p>
          <p className="text-white text-xl font-bold">{formatNumber(data.regular.avgViews)}</p>
          <p className="text-gray-500 text-xs">Avg. Views</p>
          <p className="text-gray-400 text-xs mt-2">{data.regular.count} videos</p>
        </div>
      </div>

      {showChart && (
        <div>
          <div className="flex justify-end mb-3">
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

          <ResponsiveContainer width="100%" height={200}>
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => formatNumber(v)} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ background: '#222', border: '1px solid #333', borderRadius: 8 }}
                  labelStyle={{ color: '#fff', marginBottom: 4 }}
                  formatter={(value) => [Number(value).toLocaleString() + ' views', 'Avg. Views']} />
                <Bar dataKey="avgViews" radius={[4, 4, 0, 0]}>
                  <Cell fill="#ff0000" />
                  <Cell fill="#3a3a3a" />
                </Bar>
              </BarChart>
            ) : chartType === 'pie' ? (
              <PieChart>
                <Pie data={chartData} dataKey="avgViews" nameKey="name"
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={4} label={renderPieLabel} labelLine={{ stroke: '#555' }}>
                  <Cell fill="#ff0000" />
                  <Cell fill="#3a3a3a" />
                </Pie>
                <Legend formatter={(value) => <span style={{ color: '#888', fontSize: 12 }}>{value}</span>} />
                <Tooltip contentStyle={{ background: '#222', border: '1px solid #333', borderRadius: 8 }}
                  formatter={(value) => [Number(value).toLocaleString() + ' avg. views']} />
              </PieChart>
            ) : (
              <RadialBarChart
                data={radialData}
                innerRadius="30%"
                outerRadius="90%"
                startAngle={180}
                endAngle={0}
                barSize={28}
              >
                <RadialBar dataKey="avgViews" background={{ fill: '#1a1a1a' }} cornerRadius={6} label={false} />
                <Legend
                  iconSize={10}
                  formatter={(value) => <span style={{ color: '#888', fontSize: 12 }}>{value}</span>}
                />
                <Tooltip contentStyle={{ background: '#222', border: '1px solid #333', borderRadius: 8 }}
                  formatter={(value) => [Number(value).toLocaleString() + ' avg. views']} />
              </RadialBarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
