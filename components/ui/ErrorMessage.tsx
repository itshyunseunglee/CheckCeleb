'use client';

export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-[#2a1111] border border-[#ff0000]/30 rounded-xl p-4 text-[#ff6666] text-sm flex items-start gap-2">
      <span className="text-lg leading-none">⚠️</span>
      <span>{message}</span>
    </div>
  );
}
