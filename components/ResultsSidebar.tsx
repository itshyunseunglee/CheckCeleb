'use client';

import { AnalysisOptions } from '@/types';
import { getToday, daysAgo } from '@/lib/utils';

interface Props {
  options: AnalysisOptions;
  onToggle: (key: keyof AnalysisOptions) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

const OPTION_LABELS: { key: keyof AnalysisOptions; label: string; note?: string }[] = [
  { key: 'trend',      label: 'Views Trend' },
  { key: 'engagement', label: 'Engagement Rate' },
  { key: 'timing',     label: 'Upload Timing' },
  { key: 'shorts',     label: 'Shorts vs Regular' },
  { key: 'top5',       label: 'TOP 5 Videos' },
  { key: 'comments',   label: '💬 Word Cloud', note: 'Extra quota' },
];

const PRESETS = [
  { label: '14 days', days: 14 },
  { label: '21 days', days: 21 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
];

export default function ResultsSidebar({ options, onToggle, startDate, endDate, onStartDateChange, onEndDateChange }: Props) {
  const activePreset = PRESETS.find(
    (p) => daysAgo(p.days) === startDate && endDate === getToday()
  ) ?? null;

  const applyPreset = (days: number) => {
    onStartDateChange(daysAgo(days));
    onEndDateChange(getToday());
  };

  return (
    <aside className="w-56 flex-shrink-0 space-y-6 sticky top-6 self-start">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
        <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Analysis Sections</p>
        <div className="space-y-2">
          {OPTION_LABELS.map(({ key, label, note }) => (
            <label key={key} className="flex items-start gap-2.5 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 border flex items-center justify-center transition-colors ${
                  options[key]
                    ? 'bg-[#ff0000] border-[#ff0000]'
                    : 'bg-transparent border-[#444] group-hover:border-[#666]'
                }`}
                onClick={() => onToggle(key)}
              >
                {options[key] && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div
                onClick={() => {
                  if (!options[key]) { onToggle(key); }
                  setTimeout(() => document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                }}
              >
                <p className="text-gray-200 text-sm leading-none group-hover:text-white transition-colors">{label}</p>
                {note && <p className="text-yellow-600 text-xs mt-0.5">{note}</p>}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
        <p className="text-gray-400 text-xs uppercase tracking-wide">Date Range</p>

        {/* 빠른 선택 */}
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => applyPreset(p.days)}
              className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activePreset?.days === p.days
                  ? 'bg-[#ff0000] text-white'
                  : 'bg-[#0f0f0f] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* OR 구분선 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#2a2a2a]" />
          <span className="text-gray-500 text-sm font-medium">or</span>
          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>

        {/* 직접 날짜 입력 */}
        <div className="space-y-2">
          <div>
            <p className="text-gray-500 text-xs mb-1">Start</p>
            <input
              type="date"
              value={startDate}
              max={endDate || getToday()}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] focus:border-[#ff0000] rounded-lg px-3 py-2 text-white text-xs outline-none transition-colors"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">End</p>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={getToday()}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] focus:border-[#ff0000] rounded-lg px-3 py-2 text-white text-xs outline-none transition-colors"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
