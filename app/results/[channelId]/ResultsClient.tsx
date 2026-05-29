'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChannelInfo, VideoItem, AnalysisOptions, EngagementData, DayData, ShortsData, TopVideo } from '@/types';
import { getDayName, truncateTitle, getToday, daysAgo } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SectionCard from '@/components/ui/SectionCard';
import ChannelOverview from '@/components/sections/ChannelOverview';
import TrendChart from '@/components/charts/TrendChart';
import EngagementChart from '@/components/charts/EngagementChart';
import TimingChart from '@/components/charts/TimingChart';
import ShortsChart from '@/components/charts/ShortsChart';
import Top5Videos from '@/components/sections/Top5Videos';
import CommentWordCloud from '@/components/sections/CommentWordCloud';
import ResultsSidebar from '@/components/ResultsSidebar';

interface Props {
  channelId: string;
  optionsParam?: string;
  startDateParam?: string;
  endDateParam?: string;
}

const DEFAULT_OPTIONS: AnalysisOptions = {
  trend: true,
  engagement: true,
  timing: true,
  shorts: true,
  top5: true,
  comments: false,
};

const SECTION_OPTIONS: { key: keyof AnalysisOptions; label: string; note?: string }[] = [
  { key: 'trend',      label: 'Views Trend' },
  { key: 'engagement', label: 'Engagement Rate' },
  { key: 'timing',     label: 'Upload Timing' },
  { key: 'shorts',     label: 'Shorts vs Regular' },
  { key: 'top5',       label: 'TOP 5 Videos' },
  { key: 'comments',   label: 'Word Cloud', note: 'Extra quota' },
];

const CACHE_TTL = 5 * 60 * 1000; // 5분

function getCacheKey(channelId: string, start: string, end: string) {
  return `cc:videos:${channelId}:${start}:${end}`;
}

function readCache(key: string): unknown[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function writeCache(key: string, data: unknown[]) {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch { /* 무시 */ }
}

export default function ResultsClient({ channelId, optionsParam, startDateParam, endDateParam }: Props) {
  const router = useRouter();
  const isInitialRender = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingChannel, setLoadingChannel] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [channelError, setChannelError] = useState('');
  const [videosError, setVideosError] = useState('');
  const [startDate, setStartDate] = useState(startDateParam || daysAgo(14));
  const [endDate, setEndDate] = useState(endDateParam || getToday());
  const [options, setOptions] = useState<AnalysisOptions>(() => {
    if (!optionsParam) return DEFAULT_OPTIONS;
    try {
      const parsed = JSON.parse(optionsParam);
      if (!parsed || typeof parsed !== 'object') return DEFAULT_OPTIONS;
      const result = { ...DEFAULT_OPTIONS };
      for (const key of Object.keys(DEFAULT_OPTIONS) as (keyof AnalysisOptions)[]) {
        if (typeof parsed[key] === 'boolean') result[key] = parsed[key];
      }
      return result;
    } catch {
      return DEFAULT_OPTIONS;
    }
  });

  // URL 동기화 — 날짜·옵션 변경 시 URL 업데이트 (초기 렌더 제외)
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const params = new URLSearchParams({ options: JSON.stringify(options) });
    if (startDate) params.set('startDate', startDate);
    if (endDate && endDate !== getToday()) params.set('endDate', endDate);
    router.replace(`/results/${channelId}?${params.toString()}`, { scroll: false });
  }, [startDate, endDate, options, channelId, router]);

  useEffect(() => {
    const fetchChannel = async () => {
      setLoadingChannel(true);
      setChannelError('');
      try {
        const res = await fetch(`/api/youtube/channel?id=${channelId}`);
        const data = await res.json();
        if (data.error) { setChannelError(data.error); return; }
        setChannel(data);
        document.title = `${data.title} – CheckCeleb`;
      } catch {
        setChannelError('Failed to load channel info.');
      } finally {
        setLoadingChannel(false);
      }
    };
    fetchChannel();
  }, [channelId]);

  const fetchVideos = useCallback(async (start: string, end: string, signal?: AbortSignal) => {
    setLoadingVideos(true);
    setVideosError('');

    const cacheKey = getCacheKey(channelId, start, end);
    const cached = readCache(cacheKey);
    if (cached) {
      setVideos(cached as VideoItem[]);
      setLoadingVideos(false);
      return;
    }

    try {
      const params = new URLSearchParams({ channelId, count: '200' });
      if (start) params.set('publishedAfter', new Date(start).toISOString());
      if (end && end !== getToday()) {
        const endOfDay = new Date(end);
        endOfDay.setDate(endOfDay.getDate() + 1);
        params.set('publishedBefore', endOfDay.toISOString());
      }
      const res = await fetch(`/api/youtube/videos?${params.toString()}`, { signal });
      if (signal?.aborted) return;
      const data = await res.json();
      if (data.error) { setVideosError(data.error); return; }
      setVideos(data);
      writeCache(cacheKey, data);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setVideosError('Failed to load videos.');
    } finally {
      if (!signal?.aborted) setLoadingVideos(false);
    }
  }, [channelId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchVideos(startDate, endDate, controller.signal);
    return () => controller.abort();
  }, [fetchVideos, startDate, endDate]);

  const toggleOption = (key: keyof AnalysisOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const engagementData = useMemo<EngagementData[]>(() => videos.map((v) => ({
    title: v.title,
    shortTitle: truncateTitle(v.title, 12),
    engagementRate: v.viewCount > 0 ? ((v.likeCount + v.commentCount) / v.viewCount) * 100 : 0,
    viewCount: v.viewCount,
    likeCount: v.likeCount,
    commentCount: v.commentCount,
  })), [videos]);

  const timingData = useMemo<DayData[]>(() => {
    const dayMap: Record<string, { total: number; count: number }> = {};
    videos.forEach((v) => {
      const day = getDayName(v.publishedAt);
      if (!dayMap[day]) dayMap[day] = { total: 0, count: 0 };
      dayMap[day].total += v.viewCount;
      dayMap[day].count += 1;
    });
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      day,
      avgViews: dayMap[day] ? Math.round(dayMap[day].total / dayMap[day].count) : 0,
      count: dayMap[day]?.count || 0,
    }));
  }, [videos]);

  const { shortsVideos, shortsData } = useMemo(() => {
    const shortsVideos = videos.filter((v) => v.isShort);
    const regularVideos = videos.filter((v) => !v.isShort);
    const shortsData: ShortsData = {
      shorts: {
        count: shortsVideos.length,
        avgViews: shortsVideos.length ? Math.round(shortsVideos.reduce((s, v) => s + v.viewCount, 0) / shortsVideos.length) : 0,
        totalViews: shortsVideos.reduce((s, v) => s + v.viewCount, 0),
      },
      regular: {
        count: regularVideos.length,
        avgViews: regularVideos.length ? Math.round(regularVideos.reduce((s, v) => s + v.viewCount, 0) / regularVideos.length) : 0,
        totalViews: regularVideos.reduce((s, v) => s + v.viewCount, 0),
      },
    };
    return { shortsVideos, shortsData };
  }, [videos]);

  const top5Videos = useMemo<TopVideo[]>(() => [...videos]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5)
    .map((v) => ({
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnail,
      viewCount: v.viewCount,
      likeCount: v.likeCount,
      likeRate: v.viewCount > 0 ? (v.likeCount / v.viewCount) * 100 : 0,
      publishedAt: v.publishedAt,
    })), [videos]);

  const dateLabel = useMemo(() => {
    if (videos.length === 0) return '';
    const daysDiff = Math.max(1, (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
    const perWeek = (videos.length / daysDiff) * 7;
    const freq = perWeek >= 1 ? `${perWeek.toFixed(1)}/week` : `${(perWeek * 4).toFixed(1)}/month`;
    return [`${startDate} → ${endDate}`, `${videos.length} videos`, `~${freq}`].join(' · ');
  }, [videos, startDate, endDate]);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-6xl mx-auto flex gap-6">
        {/* 데스크탑 사이드바 */}
        <div className="hidden lg:block">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs mb-4 transition-colors"
          >
            ← Back to search
          </button>
          <ResultsSidebar
            options={options}
            onToggle={toggleOption}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* 모바일 상단 컨트롤 */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-white text-xs transition-colors flex-shrink-0"
            >
              ← Back
            </button>
            <div className="flex-1 flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5">
              <input
                type="date"
                value={startDate}
                max={endDate || getToday()}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 bg-transparent text-white text-xs outline-none min-w-0"
                style={{ colorScheme: 'dark' }}
              />
              <span className="text-gray-600 text-xs flex-shrink-0">→</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={getToday()}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 bg-transparent text-white text-xs outline-none min-w-0"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <button
              onClick={() => setMobileOptionsOpen((v) => !v)}
              className="flex-shrink-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-gray-400 hover:text-white text-xs transition-colors"
            >
              Sections {mobileOptionsOpen ? '▲' : '▼'}
            </button>
          </div>

          {/* 모바일 섹션 토글 패널 */}
          {mobileOptionsOpen && (
            <div className="lg:hidden bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 grid grid-cols-2 gap-2">
              {SECTION_OPTIONS.map(({ key, label, note }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => toggleOption(key)}
                >
                  <div className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${
                    options[key] ? 'bg-[#ff0000] border-[#ff0000]' : 'border-[#444]'
                  }`}>
                    {options[key] && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-200 text-xs">{label}</p>
                    {note && <p className="text-yellow-600 text-xs">{note}</p>}
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="lg:hidden h-px" />

          {/* 채널 오버뷰 */}
          {loadingChannel ? (
            <LoadingSpinner text="Loading channel info..." />
          ) : channelError ? (
            <ErrorMessage message={channelError} />
          ) : channel ? (
            <ChannelOverview channel={channel} />
          ) : null}

          {videosError && (
            <div className="space-y-2">
              <ErrorMessage message={videosError} />
              <button
                onClick={() => {
                  abortRef.current?.abort();
                  abortRef.current = new AbortController();
                  fetchVideos(startDate, endDate, abortRef.current.signal);
                }}
                className="text-xs text-gray-400 hover:text-white underline underline-offset-2 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {loadingVideos ? (
            <LoadingSpinner text="Fetching videos..." />
          ) : (
            <>
              {videos.length > 0 && (
                <p className="text-gray-500 text-xs">{dateLabel}</p>
              )}

              {options.trend && videos.length > 0 && (
                <SectionCard title="Views Trend" id="trend">
                  <TrendChart videos={videos} />
                </SectionCard>
              )}

              {options.engagement && engagementData.length > 0 && (
                <SectionCard title="Engagement Rate Analysis" id="engagement">
                  <EngagementChart data={engagementData} />
                </SectionCard>
              )}

              {options.timing && timingData.some((d) => d.avgViews > 0) && (
                <SectionCard title="Best Upload Timing" id="timing">
                  <TimingChart data={timingData} />
                </SectionCard>
              )}

              {options.shorts && shortsVideos.length > 0 && (
                <SectionCard title="Shorts vs Regular Videos" id="shorts">
                  <ShortsChart data={shortsData} />
                </SectionCard>
              )}

              {options.top5 && top5Videos.length > 0 && (
                <SectionCard title={`TOP ${top5Videos.length} Videos`} id="top5">
                  <Top5Videos videos={top5Videos} />
                </SectionCard>
              )}

              {options.comments && top5Videos.length > 0 && (
                <SectionCard title="💬 Comment Word Cloud" id="comments">
                  <CommentWordCloud videos={top5Videos} />
                </SectionCard>
              )}

              {videos.length === 0 && !videosError && (
                <div className="text-center py-20 space-y-3">
                  <p className="text-4xl">📭</p>
                  <p className="text-white font-medium">No videos found</p>
                  <p className="text-gray-500 text-sm">No uploads between <span className="text-gray-300">{startDate}</span> and <span className="text-gray-300">{endDate}</span>.</p>
                  <p className="text-gray-600 text-xs">Try expanding the date range.</p>
                </div>
              )}

              {!Object.values(options).some(Boolean) && (
                <div className="text-center py-16 text-gray-500">
                  Select analysis sections from the sidebar.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
