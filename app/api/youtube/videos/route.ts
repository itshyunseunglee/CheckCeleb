import { NextRequest, NextResponse } from 'next/server';
import { isShortVideo } from '@/lib/utils';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export async function GET(req: NextRequest) {
  if (!checkRateLimit(getClientIp(req), 'videos', 5)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  const channelId = req.nextUrl.searchParams.get('channelId');
  const count = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get('count') || '20')), 200);
  const publishedAfter = req.nextUrl.searchParams.get('publishedAfter') || '';
  const publishedBefore = req.nextUrl.searchParams.get('publishedBefore') || '';
  if (!channelId) return NextResponse.json({ error: 'Channel ID is required.' }, { status: 400 });
  if (!/^[a-zA-Z0-9_\-]{1,64}$/.test(channelId)) return NextResponse.json({ error: 'Invalid channel ID.' }, { status: 400 });
  if (publishedAfter && !ISO_DATE_RE.test(publishedAfter)) return NextResponse.json({ error: 'Invalid date format.' }, { status: 400 });
  if (publishedBefore && !ISO_DATE_RE.test(publishedBefore)) return NextResponse.json({ error: 'Invalid date format.' }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'YouTube API key is not configured.' }, { status: 500 });

  try {
    const videos: object[] = [];
    let pageToken = '';

    while (videos.length < count) {
      const remaining = count - videos.length;
      const pageSize = Math.min(remaining, 50);
      const dateParams = [
        publishedAfter ? `&publishedAfter=${publishedAfter}` : '',
        publishedBefore ? `&publishedBefore=${publishedBefore}` : '',
      ].join('');
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${pageSize}${pageToken ? `&pageToken=${pageToken}` : ''}${dateParams}&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.error) {
        const reason = searchData.error.errors?.[0]?.reason;
        const message = reason === 'quotaExceeded'
          ? 'API quota exceeded. Please try again tomorrow.'
          : searchData.error.message;
        return NextResponse.json({ error: message }, { status: 429 });
      }

      if (!searchData.items?.length) break;

      const ids = searchData.items.map((i: { id: { videoId: string } }) => i.id.videoId).join(',');
      const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${apiKey}`;
      const detailRes = await fetch(detailUrl);
      const detailData = await detailRes.json();

      for (const v of detailData.items || []) {
        videos.push({
          id: v.id,
          title: v.snippet.title,
          thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || '',
          viewCount: parseInt(v.statistics.viewCount || '0'),
          likeCount: parseInt(v.statistics.likeCount || '0'),
          commentCount: parseInt(v.statistics.commentCount || '0'),
          publishedAt: v.snippet.publishedAt,
          duration: v.contentDetails.duration,
          isShort: isShortVideo(v.contentDetails.duration, v.snippet.title),
        });
      }

      if (!searchData.nextPageToken || videos.length >= count) break;
      pageToken = searchData.nextPageToken;
    }

    return NextResponse.json(videos.slice(0, count));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch videos.' }, { status: 500 });
  }
}
