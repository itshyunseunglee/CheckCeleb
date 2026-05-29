'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col gap-1">
      <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-[#ff0000]' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs">{sub}</p>}
    </div>
  );
}
