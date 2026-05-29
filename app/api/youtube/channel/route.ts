import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  if (!checkRateLimit(getClientIp(req), 'channel', 30)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  const channelId = req.nextUrl.searchParams.get('id');
  if (!channelId) return NextResponse.json({ error: 'Channel ID is required.' }, { status: 400 });
  if (!/^[a-zA-Z0-9_\-]{1,64}$/.test(channelId)) return NextResponse.json({ error: 'Invalid channel ID.' }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'YouTube API key is not configured.' }, { status: 500 });

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    if (!data.items?.length) {
      return NextResponse.json({ error: 'Channel not found.' }, { status: 404 });
    }

    const ch = data.items[0];
    return NextResponse.json({
      id: ch.id,
      title: ch.snippet.title,
      description: ch.snippet.description,
      thumbnail: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.medium?.url || '',
      subscriberCount: ch.statistics.subscriberCount || '0',
      viewCount: ch.statistics.viewCount || '0',
      videoCount: ch.statistics.videoCount || '0',
      customUrl: ch.snippet.customUrl,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch channel info.' }, { status: 500 });
  }
}
