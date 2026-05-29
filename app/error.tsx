'use client';

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
      <p className="text-4xl">⚠️</p>
      <h2 className="text-white font-semibold text-lg">Something went wrong</h2>
      <p className="text-gray-500 text-sm max-w-sm">
        An unexpected error occurred. Try refreshing the page.
      </p>
      <button
        onClick={reset}
        className="mt-2 bg-[#ff0000] hover:bg-[#cc0000] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
