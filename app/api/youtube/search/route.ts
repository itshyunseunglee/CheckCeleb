import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const resizeThumb = (url: string) =>
  url ? url.replace(/=s\d+(-[^?#]*)?$/, '=s88-c-k-c0x00ffffff-no-rj') : '';

type RawChannel = {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: { default?: { url: string }; medium?: { url: string } };
    customUrl?: string;
  };
  statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string };
};

function mapChannel(ch: RawChannel) {
  return {
    id: ch.id,
    title: ch.snippet.title,
    description: ch.snippet.description,
    thumbnail: resizeThumb(ch.snippet.thumbnails?.medium?.url || ch.snippet.thumbnails?.default?.url || ''),
    subscriberCount: ch.statistics.subscriberCount || '0',
    viewCount: ch.statistics.viewCount || '0',
    videoCount: ch.statistics.videoCount || '0',
    customUrl: ch.snippet.customUrl,
  };
}

async function fetchChannelByParam(param: string, value: string, apiKey: string) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&${param}=${encodeURIComponent(value)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.error && data.items?.length > 0) return data.items[0] as RawChannel;
  return null;
}

export async function GET(req: NextRequest) {
  if (!checkRateLimit(getClientIp(req), 'search', 10)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  const query = req.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ error: 'Please enter a search query.' }, { status: 400 });
  if (query.length > 100) return NextResponse.json({ error: 'Search query is too long.' }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'YouTube API key is not configured.' }, { status: 500 });

  try {
    if (query.startsWith('@')) {
      const handle = query.slice(1); // '@' 제거

      // 1) forHandle with @ (e.g. @MrBeast)
      const byHandle = await fetchChannelByParam('forHandle', query, apiKey);
      if (byHandle) return NextResponse.json([mapChannel(byHandle)]);

      // 2) forHandle without @ (일부 API 버전 호환)
      const byHandleNoAt = await fetchChannelByParam('forHandle', handle, apiKey);
      if (byHandleNoAt) return NextResponse.json([mapChannel(byHandleNoAt)]);

      // 3) forUsername (구채널 username 형식 fallback)
      const byUsername = await fetchChannelByParam('forUsername', handle, apiKey);
      if (byUsername) return NextResponse.json([mapChannel(byUsername)]);

      // 4) @ 제거 후 일반 검색으로 fallthrough
    }

    // 일반 검색 — @handle이면 @ 제거해서 검색 품질 향상
    const searchQuery = query.startsWith('@') ? query.slice(1) : query;
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&maxResults=5&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.error) {
      const message = searchData.error.errors?.[0]?.reason === 'quotaExceeded'
        ? 'API quota exceeded. Please try again tomorrow.'
        : searchData.error.message;
      return NextResponse.json({ error: message }, { status: 429 });
    }

    if (!searchData.items?.length) {
      return NextResponse.json({ error: 'Channel not found.' }, { status: 404 });
    }

    const channelIds = searchData.items.map((item: { id: { channelId: string } }) => item.id.channelId).join(',');
    const detailUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${apiKey}`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    return NextResponse.json((detailData.items || []).map(mapChannel));
  } catch {
    return NextResponse.json({ error: 'Search failed. Please try again.' }, { status: 500 });
  }
}
