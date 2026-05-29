'use client';

import { useState, useEffect, useMemo } from 'react';
import { TopVideo } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

interface Props {
  videos: TopVideo[];
}

const STOP_WORDS = new Set([
  // English
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','it','its','be','was','are','were','been','have','has','had',
  'do','does','did','will','would','could','should','may','might','can',
  'not','no','so','if','as','this','that','these','those','i','you','he',
  'she','we','they','me','him','her','us','them','my','your','his','our',
  'their','what','which','who','how','when','where','why','all','more',
  'just','also','than','then','there','here','very','really','about','up',
  'out','over','get','got','like','know','go','going','see','think','make',
  'one','two','time','even','well','back','way','new','good','great','much',
  'now','love','want','need','dont','im','ive','its','cant','wont','isnt',
  'wasnt','didnt','doesnt','havent','wouldnt','couldnt','shouldnt',
  'please','thank','thanks','hello','hey','hi','lol','haha','wow','oh',
  'yes','yeah','yep','nope','ok','okay','sure','right','because','too',
  // Korean particles & function words
  '이','가','을','를','은','는','도','만','의','에','와','과','로','으로',
  '에서','부터','까지','하고','이나','나','이며','며','에게','한테','께',
  '보다','처럼','같이','대로','마다','조차','마저','밖에','라도','이라도',
  // Korean pronouns & demonstratives
  '나','저','우리','너','그','이거','저거','그거','여기','저기','거기',
  // Korean common verbs/adjectives (stop forms)
  '하다','했다','한다','하는','하면','해서','해요','했어요','합니다','했습니다',
  '있다','있는','있어','있음','있어요','있습니다',
  '없다','없는','없어','없음','없어요','없습니다',
  '되다','됐다','된다','되는','되면','돼서','돼요','됩니다',
  '않다','않는','않아','않음','않아요','않습니다',
  '같다','같은','같아','같아요',
  '좋다','좋은','좋아','좋아요',
  // Korean discourse markers
  '그리고','그런데','근데','하지만','그래서','왜냐면','때문에','그냥',
  '너무','정말','진짜','매우','아주','약간','조금','많이','자주',
  '감사합니다','감사해요','고맙습니다','고마워요','ㅋㅋ','ㅠㅠ','ㅎㅎ',
]);

const COLORS = ['#ff0000', '#ff4444', '#ff6666', '#cc0000', '#ff8888', '#aaaaaa'];

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
}

interface LayoutWord {
  text: string;
  x: number;
  y: number;
  rotate: number;
  size: number;
  color: string;
}

function CloudCanvas({ words }: { words: { text: string; value: number }[] }) {
  const [layout, setLayout] = useState<LayoutWord[]>([]);

  useEffect(() => {
    if (!words.length) return;
    let cancelled = false;

    import('d3-cloud').then(({ default: cloud }) => {
      if (cancelled) return;
      const maxVal = words[0].value;
      const minVal = words[words.length - 1].value;
      const range = maxVal - minVal || 1;

      cloud()
        .size([900, 420])
        .words(words.map((w) => ({
          text: w.text,
          size: 16 + ((w.value - minVal) / range) * 62,
          value: w.value,
        })))
        .padding(4)
        .rotate(() => [-45, -30, 0, 30, 45][Math.floor(Math.random() * 5)])
        .font('system-ui, sans-serif')
        .fontSize((d) => (d as { size: number }).size)
        .on('end', (output) => {
          if (cancelled) return;
          setLayout(
            output.map((d, i) => ({
              text: d.text!,
              x: d.x!,
              y: d.y!,
              rotate: d.rotate!,
              size: d.size!,
              color: COLORS[i % COLORS.length],
            }))
          );
        })
        .start();
    });

    return () => { cancelled = true; };
  }, [words]);

  return (
    <svg width="100%" height="100%" viewBox="0 0 900 420" style={{ display: 'block', minHeight: 360 }}>
      <g transform="translate(450,210)">
        {layout.map((w) => (
          <text
            key={w.text}
            textAnchor="middle"
            transform={`translate(${w.x},${w.y}) rotate(${w.rotate})`}
            style={{ fontFamily: 'system-ui, sans-serif', fontSize: w.size, fill: w.color }}
          >
            {w.text}
          </text>
        ))}
      </g>
    </svg>
  );
}

export default function CommentWordCloud({ videos }: Props) {
  const [allComments, setAllComments] = useState<{ text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);
  const [stats, setStats] = useState({ totalComments: 0, videoCount: 0 });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchComments = async () => {
      setLoading(true);
      setError('');

      const results = await Promise.all(
        videos.map(async (video) => {
          try {
            const res = await fetch(`/api/youtube/comments?videoId=${video.id}&maxResults=100`, { signal });
            const data = await res.json();
            if (!data.error && !data.disabled && data.comments?.length) {
              return { comments: data.comments as { text: string }[], ok: true };
            }
          } catch { /* skip */ }
          return { comments: [], ok: false };
        })
      );

      if (signal.aborted) return;

      const collected = results.flatMap(r => r.comments);
      const successCount = results.filter(r => r.ok).length;

      if (collected.length === 0) {
        setError('No comments found. Comments may be disabled on these videos.');
      } else {
        setAllComments(collected);
        setStats({ totalComments: collected.length, videoCount: successCount });
      }
      setFetched(true);
      setLoading(false);
    };

    fetchComments();
    return () => controller.abort();
  }, [videos]);

  const words = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const { text } of allComments) {
      for (const word of extractWords(text)) {
        freq[word] = (freq[word] || 0) + 1;
      }
    }
    return Object.entries(freq)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 80);
  }, [allComments]);

  const top5 = words.slice(0, 5);

  if (loading) return <LoadingSpinner text={`Fetching comments from ${videos.length} videos...`} />;
  if (error) return <ErrorMessage message={error} />;
  if (!fetched) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <div className="flex-1 bg-[#0f0f0f] rounded-xl overflow-hidden" style={{ minHeight: 280 }}>
        {words.length > 1 && <CloudCanvas words={words} />}
      </div>

      <div className="sm:w-52 sm:flex-shrink-0 space-y-4">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">What is this?</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Analyzes the top 100 comments from each video. Larger words appear more frequently across all comments.
          </p>
        </div>

        <div className="bg-[#0f0f0f] rounded-xl p-3 space-y-1.5">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Stats</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Comments</span>
            <span className="text-white font-medium">{stats.totalComments.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Videos</span>
            <span className="text-white font-medium">{stats.videoCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Unique words</span>
            <span className="text-white font-medium">{words.length}</span>
          </div>
        </div>

        <div className="bg-[#0f0f0f] rounded-xl p-3">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Top Keywords</p>
          <div className="space-y-1.5">
            {top5.map((w, i) => (
              <div key={w.text} className="flex items-center gap-2">
                <span className="text-gray-600 text-xs w-3">{i + 1}</span>
                <div className="flex-1 bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#ff0000] rounded-full"
                    style={{ width: `${(w.value / top5[0].value) * 100}%` }}
                  />
                </div>
                <span className="text-gray-300 text-xs w-16 truncate">{w.text}</span>
                <span className="text-gray-600 text-xs">{w.value}×</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff0000]" />
            <span className="text-gray-500 text-xs">High frequency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#666]" />
            <span className="text-gray-500 text-xs">Low frequency</span>
          </div>
        </div>
      </div>
    </div>
  );
}
