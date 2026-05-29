'use client';

import Image from 'next/image';
import { ChannelInfo } from '@/types';
import { formatNumber } from '@/lib/utils';

export default function ChannelOverview({ channel }: { channel: ChannelInfo }) {
  const channelUrl = channel.customUrl
    ? `https://youtube.com/${channel.customUrl}`
    : `https://youtube.com/channel/${channel.id}`;

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
      <a
        href={channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-4 group"
      >
        {channel.thumbnail && (
          <Image
            src={channel.thumbnail}
            alt={channel.title}
            width={80}
            height={80}
            className="rounded-full border-2 border-[#ff0000] flex-shrink-0 group-hover:border-white transition-colors"
            unoptimized
          />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate group-hover:text-[#ff0000] transition-colors">
            {channel.title}
          </h1>
          {channel.customUrl && (
            <p className="text-[#ff0000] text-sm mt-0.5">{channel.customUrl}</p>
          )}
          <p className="text-gray-400 text-sm mt-2 line-clamp-2">{channel.description}</p>
        </div>
      </a>
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-[#0f0f0f] rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Subscribers</p>
          <p className="text-white text-xl font-bold">{formatNumber(parseInt(channel.subscriberCount))}</p>
        </div>
        <div className="bg-[#0f0f0f] rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Views</p>
          <p className="text-white text-xl font-bold">{formatNumber(parseInt(channel.viewCount))}</p>
          <p className="text-gray-600 text-xs mt-0.5">all time</p>
        </div>
        <div className="bg-[#0f0f0f] rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Videos</p>
          <p className="text-white text-xl font-bold">{formatNumber(parseInt(channel.videoCount))}</p>
          <p className="text-gray-600 text-xs mt-0.5">all time</p>
        </div>
      </div>
    </div>
  );
}
