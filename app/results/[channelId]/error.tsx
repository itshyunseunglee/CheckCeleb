'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ResultsError({ error, reset }: Props) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
      <p className="text-4xl">📡</p>
      <h2 className="text-white font-semibold text-lg">Failed to load channel data</h2>
      <p className="text-gray-500 text-sm max-w-sm">
        Something went wrong while fetching this channel. It may have been removed or the API quota may be exhausted.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-[#ff0000] hover:bg-[#cc0000] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Try again
        </button>
        <button
          onClick={() => router.push('/')}
          className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 text-sm font-medium px-5 py-2.5 rounded-xl border border-[#2a2a2a] transition-colors"
        >
          Back to search
        </button>
      </div>
    </div>
  );
}
