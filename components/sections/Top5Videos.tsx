'use client';

import Image from 'next/image';
import { TopVideo } from '@/types';
import { formatNumber } from '@/lib/utils';

export default function Top5Videos({ videos }: { videos: TopVideo[] }) {
  return (
    <div className="space-y-3">
      {videos.map((video, i) => (
        <a
          key={video.id}
          href={`https://youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-[#0f0f0f] rounded-xl p-3 hover:bg-[#222] transition-colors group"
        >
          <span className="text-gray-500 text-sm font-bold w-5 flex-shrink-0 text-center">
            {i + 1}
          </span>
          <div className="relative flex-shrink-0">
            <Image
              src={video.thumbnail}
              alt={video.title}
              width={96}
              height={54}
              className="rounded-lg object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-[#ff0000] transition-colors">
              {video.title}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-gray-400 text-xs">👁 {formatNumber(video.viewCount)}</span>
              <span className="text-gray-400 text-xs">👍 {formatNumber(video.likeCount)} <span className="text-gray-600">({video.likeRate.toFixed(1)}%)</span></span>
              <span className="text-gray-500 text-xs">
                {new Date(video.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
