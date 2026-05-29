import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export async function GET(req: NextRequest) {
  if (!checkRateLimit(getClientIp(req), 'comments', 10)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  const videoId = req.nextUrl.searchParams.get('videoId');
  const maxResults = Math.min(parseInt(req.nextUrl.searchParams.get('maxResults') || '100'), 100);
  if (!videoId) return NextResponse.json({ error: 'Video ID is required.' }, { status: 400 });
  if (!/^[a-zA-Z0-9_\-]{1,20}$/.test(videoId)) return NextResponse.json({ error: 'Invalid video ID.' }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'YouTube API key is not configured.' }, { status: 500 });

  try {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      if (data.error.errors?.[0]?.reason === 'commentsDisabled') {
        return NextResponse.json({ comments: [], disabled: true });
      }
      const reason = data.error.errors?.[0]?.reason;
      return NextResponse.json(
        { error: reason === 'quotaExceeded' ? 'API quota exceeded. Please try again tomorrow.' : data.error.message },
        { status: 429 }
      );
    }

    const comments = (data.items || []).map((item: {
      snippet: { topLevelComment: { snippet: { textDisplay: string; likeCount: number } } };
    }) => ({
      text: stripHtml(item.snippet.topLevelComment.snippet.textDisplay),
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
    }));

    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch comments.' }, { status: 500 });
  }
}
