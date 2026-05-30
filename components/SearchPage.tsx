'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalysisOptions } from '@/types';
import { getToday, daysAgo, formatNumber } from '@/lib/utils';

const OPTION_ITEMS: { key: keyof AnalysisOptions; label: string; note?: string }[] = [
  { key: 'trend',      label: '📈  Views Trend' },
  { key: 'engagement', label: '📊  Engagement Rate' },
  { key: 'timing',     label: '⏰  Best Upload Timing' },
  { key: 'shorts',     label: '⚡  Shorts vs Regular' },
  { key: 'top5',       label: '🏆  TOP 5 Videos' },
  { key: 'comments',   label: '💬  Comment Word Cloud', note: 'Uses extra quota' },
];

const PRESETS = [
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 21 days', days: 21 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 60 days', days: 60 },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState(daysAgo(14));
  const [endDate, setEndDate] = useState(getToday());
  const [options, setOptions] = useState<AnalysisOptions>({
    trend: true,
    engagement: true,
    timing: true,
    shorts: true,
    top5: true,
    comments: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; thumbnail: string; customUrl?: string; subscriberCount?: string }[]>([]);
  const [showResults, setShowResults] = useState(false);

  const toggleOption = (key: keyof AnalysisOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (days: number) => {
    setStartDate(daysAgo(days));
    setEndDate(getToday());
  };

  const activePreset = PRESETS.find(
    (p) => daysAgo(p.days) === startDate && endDate === getToday()
  ) ?? null;

  const handleSearch = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setShowResults(false);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.length === 1) { navigateToResults(data[0].id); return; }
      setSearchResults(data);
      setShowResults(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToResults = (channelId: string) => {
    const params = new URLSearchParams({ options: JSON.stringify(options) });
    if (startDate) params.set('startDate', startDate);
    if (endDate && endDate !== getToday()) params.set('endDate', endDate);
    router.push(`/results/${channelId}?${params.toString()}`);
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-black mb-3">
          <span className="text-[#ff0000]">Check</span>
          <span className="text-white">Celeb</span>
        </h1>
        <p className="text-gray-400 text-base sm:text-lg">Deep-dive analytics for any YouTube channel</p>
        <p className="text-gray-600 text-xs mt-2">Runs on a shared API quota (10,000 units/day). If it stops working, check back tomorrow.</p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowResults(false); }}
            placeholder="Channel name or @handle (e.g. @MrBeast)"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-[#ff0000] rounded-2xl px-5 py-4 text-white placeholder-gray-500 text-base outline-none transition-colors pr-32"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-[#ff0000] hover:bg-[#cc0000] disabled:bg-[#3a3a3a] disabled:text-gray-500 text-white font-semibold px-5 rounded-xl transition-colors text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching
              </span>
            ) : 'Search'}
          </button>
        </form>

        {error && (
          <div className="bg-[#2a1111] border border-[#ff0000]/30 rounded-xl p-3 text-[#ff6666] text-sm flex gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {showResults && searchResults.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <p className="text-gray-400 text-xs px-4 py-2 border-b border-[#2a2a2a]">Select a channel</p>
            {searchResults.map((ch) => (
              <button
                key={ch.id}
                onClick={() => navigateToResults(ch.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors text-left"
              >
                <div className="ch-avatar">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ch.thumbnail || ''} alt="" width={88} height={88} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{ch.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ch.customUrl && <p className="text-gray-500 text-xs">{ch.customUrl}</p>}
                    {ch.subscriberCount && ch.subscriberCount !== '0' && (
                      <p className="text-gray-600 text-xs">{formatNumber(ch.subscriberCount)} subs</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 space-y-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Analysis Options</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {OPTION_ITEMS.map(({ key, label, note }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => toggleOption(key)}
                  className={`w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${
                    options[key]
                      ? 'bg-[#ff0000] border-[#ff0000]'
                      : 'bg-transparent border-[#444] group-hover:border-[#666]'
                  }`}
                >
                  {options[key] && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div onClick={() => toggleOption(key)}>
                  <span className="text-gray-200 text-base">{label}</span>
                  {note && <span className="text-yellow-600 text-xs ml-2">({note})</span>}
                </div>
              </label>
            ))}
          </div>

          <div className="border-t border-[#2a2a2a] pt-4 space-y-3">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Date Range</p>

            {/* 빠른 선택 — 위에 */}
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => applyPreset(p.days)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
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
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-[#2a2a2a]" />
              <span className="text-gray-500 text-sm font-medium">or</span>
              <div className="flex-1 h-px bg-[#2a2a2a]" />
            </div>

            {/* 직접 날짜 입력 */}
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-xs mb-1">Start</p>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || getToday()}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] focus:border-[#ff0000] rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <span className="text-gray-600 text-sm mt-5 flex-shrink-0">→</span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-xs mb-1">End</p>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={getToday()}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] focus:border-[#ff0000] rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO content */}
      <div className="w-full max-w-2xl mt-16 space-y-12 pb-8">
        <div>
          <h2 className="text-white font-bold text-lg mb-4">What is CheckCeleb?</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            CheckCeleb is a free YouTube channel analytics tool. Search any channel by name or @handle
            and instantly get a breakdown of views trend, engagement rate, best upload timing,
            Shorts vs regular video performance, and a comment word cloud — no account or login required.
          </p>
        </div>

        <div>
          <h2 className="text-white font-bold text-lg mb-4">What can you analyze?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Views Trend', desc: 'See how a channel\'s view counts have changed over time.' },
              { title: 'Engagement Rate', desc: 'Measure likes and comments relative to total views per video.' },
              { title: 'Upload Timing', desc: 'Find out which days of the week get the most views on average.' },
              { title: 'Shorts vs Regular', desc: 'Compare how Shorts perform against long-form content.' },
              { title: 'TOP 5 Videos', desc: 'See the most-viewed videos in the selected date range.' },
              { title: 'Comment Word Cloud', desc: 'Visualize the most common words across top video comments.' },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-white text-sm font-medium mb-1">{title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-white font-bold text-lg mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is it free?',
                a: 'Yes, completely free. No signup required.',
              },
              {
                q: 'Which channels can I search?',
                a: 'Any public YouTube channel. Search by channel name or paste the @handle directly.',
              },
              {
                q: 'How far back does the data go?',
                a: 'You can set a custom date range. The default is the last 14 days, with presets up to 60 days.',
              },
              {
                q: 'Why does it sometimes say "quota exceeded"?',
                a: 'The app uses the YouTube Data API which has a daily usage limit shared across all users. If it happens, try again the next day.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-[#1a1a1a] pb-4">
                <p className="text-white text-sm font-medium mb-1">{q}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
