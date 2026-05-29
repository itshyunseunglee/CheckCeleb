export interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  customUrl?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  duration: string;
  isShort: boolean;
}

export interface EngagementData {
  title: string;
  shortTitle: string;
  engagementRate: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface DayData {
  day: string;
  avgViews: number;
  count: number;
}

export interface ShortsData {
  shorts: {
    count: number;
    avgViews: number;
    totalViews: number;
  };
  regular: {
    count: number;
    avgViews: number;
    totalViews: number;
  };
}

export interface TopVideo {
  id: string;
  title: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  likeRate: number;
  publishedAt: string;
}

export interface AnalysisOptions {
  trend: boolean;
  engagement: boolean;
  timing: boolean;
  shorts: boolean;
  top5: boolean;
  comments: boolean;
}

