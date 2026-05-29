# CheckCeleb

A YouTube channel analytics dashboard. Search any channel by name or @handle and get a breakdown of views, engagement, upload timing, and more.

🌐 **Live site: [check-celeb.vercel.app](https://check-celeb.vercel.app)**

## Features

- Search by channel name or @handle
- Custom date range (14 / 21 / 30 / 60 day presets or manual input)
- Views trend over time
- Engagement rate per video (likes + comments / views)
- Average views by day of week
- Shorts vs regular video comparison
- TOP 5 most-viewed videos
- Comment word cloud from top 5 videos (English and Korean stopwords filtered)

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Recharts** (charts)
- **d3-cloud** (word cloud layout)
- **YouTube Data API v3**

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/itshyunseunglee/CheckCeleb.git
cd CheckCeleb
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and add your YouTube API key:

```
YOUTUBE_API_KEY=your_api_key_here
```

You can get one from the [Google Cloud Console](https://console.cloud.google.com/). Enable **YouTube Data API v3** and create a credential.

## API Quota

YouTube Data API has a default limit of **10,000 units/day**.

| Action | Quota used (approx) |
|---|---|
| Channel search | ~100 units |
| Video list (up to 200 videos) | ~400-800 units |
| Comment word cloud | ~5 units per video |

Fine for personal use. For a public deployment, consider adding server-side caching or requesting a quota increase in Google Cloud.

## Project Structure

```
app/
  api/youtube/          # API routes (search, channel, videos, comments)
  results/[channelId]/  # Channel analysis page
components/
  charts/               # Recharts chart components
  sections/             # Analysis sections (overview, top5, word cloud)
  ui/                   # Shared UI (card, spinner, error message)
lib/
  utils.ts              # Formatters and date helpers
  rateLimit.ts          # IP-based rate limiter
types/
  index.ts              # Shared types
```
