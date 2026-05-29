'use client';

import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine,
} from 'recharts';
import { EngagementData } from '@/types';
import { formatNumber } from '@/lib/utils';

interface Props { data: EngagementData[] }

type ChartType = 'bar' | 'line' | 'scatter';

const CHART_TYPES: { type: ChartType; label: string; desc: string }[] = [
  { type: 'bar',     label: 'Bar',     desc: 'Per-video engagement' },
  { type: 'line',    label: 'Line',    desc: 'Engagement trend' },
  { type: 'scatter', label: 'Scatter', desc: 'Views vs Engagement' },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: EngagementData }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#222] border border-[#333] rounded-lg p-3 text-xs max-w-xs">
      <p className="text-white font-medium mb-1 leading-tight">{d.title}</p>
      <p className="text-[#ff0000]">Engagement: {d.engagementRate.toFixed(2)}%</p>
      <p className="text-gray-400">Views: {d.viewCount.toLocaleString()}</p>
      <p className="text-gray-400">Likes: {d.likeCount.toLocaleString()}</p>
      <p className="text-gray-400">Comments: {d.commentCount.toLocaleString()}</p>
    </div>
  );
};

const fmtY = (v: number) => `${v}%`;
const fmtX = (v: number) => formatNumber(v);

const MAX_BAR_LINE = 50;

export default function EngagementChart({ data }: Props) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const avg = data.reduce((s, d) => s + d.engagementRate, 0) / data.length;
  const visibleData = chartType === 'scatter' ? data : data.slice(0, MAX_BAR_LINE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <p className="text-gray-400 text-sm">
            Avg. Engagement Rate:{' '}
            <span className="text-[#ff0000] font-bold">{avg.toFixed(2)}%</span>
          </p>
          <p className="text-gray-600 text-xs">(Likes + Comments) / Views</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {CHART_TYPES.map(({ type, label }) => (
            <button key={type} onClick={() => setChartType(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                chartType === type ? 'bg-[#ff0000] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      {chartType === 'scatter' && (
        <div className="flex items-center gap-4 mb-3 bg-[#0f0f0f] rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">X axis</span>
            <span className="text-white text-xs font-semibold">Views</span>
          </div>
          <span className="text-gray-700">·</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Y axis</span>
            <span className="text-white text-xs font-semibold">Engagement Rate (%)</span>
          </div>
          <span className="text-gray-700">·</span>
          <span className="text-gray-500 text-xs">Do high-view videos have lower engagement?</span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'bar' ? (
          <BarChart data={visibleData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="shortTitle" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtY} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <ReferenceLine y={avg} stroke="#555" strokeDasharray="4 4" label={{ value: `avg ${avg.toFixed(1)}%`, fill: '#555', fontSize: 10, position: 'right' }} />
            <Bar dataKey="engagementRate" radius={[4, 4, 0, 0]}>
              {visibleData.map((entry, i) => <Cell key={i} fill={entry.engagementRate >= avg ? '#ff0000' : '#3a3a3a'} />)}
            </Bar>
          </BarChart>
        ) : chartType === 'line' ? (
          <LineChart data={visibleData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis dataKey="shortTitle" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtY} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#444' }} />
            <ReferenceLine y={avg} stroke="#555" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="engagementRate" stroke="#ff0000" strokeWidth={2}
              dot={{ fill: '#ff0000', r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        ) : (
          <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis
              type="number" dataKey="viewCount" name="Views"
              tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#333' }} tickLine={false}
              tickFormatter={fmtX}
              label={{ value: '← Views →', position: 'insideBottom', offset: -18, fill: '#aaa', fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              type="number" dataKey="engagementRate" name="Engagement Rate"
              tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#333' }} tickLine={false}
              tickFormatter={fmtY}
              label={{ value: 'Engagement %', angle: -90, position: 'insideLeft', offset: 10, fill: '#aaa', fontSize: 12, fontWeight: 600 }}
            />
            <ZAxis range={[50, 50]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#444' }} />
            <ReferenceLine y={avg} stroke="#444" strokeDasharray="4 4" label={{ value: `avg ${avg.toFixed(1)}%`, fill: '#666', fontSize: 10, position: 'insideTopRight' }} />
            <Scatter data={visibleData} fill="#ff0000" fillOpacity={0.8} />
          </ScatterChart>
        )}
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-2">
        {chartType === 'bar' && (
          <p className="text-gray-500 text-xs">Red = above-average · Gray = below-average</p>
        )}
        {chartType !== 'scatter' && data.length > MAX_BAR_LINE && (
          <p className="text-gray-600 text-xs ml-auto">Showing most recent {MAX_BAR_LINE} of {data.length} videos</p>
        )}
      </div>
    </div>
  );
}
