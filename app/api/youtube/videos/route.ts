import { NextRequest, NextResponse } from 'next/server';
import { isShortVideo } from '@/lib/utils';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get('channelId');
  const count = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get('count') || '20')), 200);
  const publishedAfter = req.nextUrl.searchParams.get('publishedAfter') || '';
  const publishedBefore = req.nextUrl.searchParams.get('publishedBefore') || '';

  if (!channelId) return NextResponse.json({ error: 'Channel ID is required.' }, { status: 400 });
  if (!/^UC[a-zA-Z0-9_\-]{1,62}$/.test(channelId)) return NextResponse.json({ error: 'Invalid channel ID.' }, { status: 400 });
  if (publishedAfter && !ISO_DATE_RE.test(publishedAfter)) return NextResponse.json({ error: 'Invalid date format.' }, { status: 400 });
  if (publishedBefore && !ISO_DATE_RE.test(publishedBefore)) return NextResponse.json({ error: 'Invalid date format.' }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'YouTube API key is not configured.' }, { status: 500 });

  // UC... -> UU... (uploads playlist, 1 unit/call vs 100 units for Search API)
  const uploadsPlaylistId = 'UU' + channelId.slice(2);
  const afterDate = publishedAfter ? new Date(publishedAfter) : null;
  const beforeDate = publishedBefore ? new Date(publishedBefore) : null;

  try {
    const videoIds: string[] = [];
    let pageToken = '';
    let reachedOldVideos = false;

    while (!reachedOldVideos && videoIds.length < count) {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        const reason = data.error.errors?.[0]?.reason;
        const message = reason === 'quotaExceeded'
          ? 'API quota exceeded. Please try again tomorrow.'
          : data.error.message;
        return NextResponse.json({ error: message }, { status: 429 });
      }

      if (!data.items?.length) break;

      for (const item of data.items) {
        const publishedAt = item.snippet.videoPublishedAt || item.snippet.publishedAt;
        const date = new Date(publishedAt);

        // Playlist is newest-first — stop as soon as we go past the start date
        if (afterDate && date < afterDate) {
          reachedOldVideos = true;
          break;
        }

        if (beforeDate && date > beforeDate) continue;

        const videoId = item.snippet.resourceId?.videoId;
        if (videoId) videoIds.push(videoId);

        if (videoIds.length >= count) break;
      }

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }

    if (!videoIds.length) return NextResponse.json([]);

    // Fetch video details in batches of 50 (1 unit per batch)
    const videos = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50).join(',');
      const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batch}&key=${apiKey}`;
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
    }

    return NextResponse.json(videos);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch videos.' }, { status: 500 });
  }
}
