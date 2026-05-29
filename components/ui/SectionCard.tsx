'use client';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  id?: string;
}

export default function SectionCard({ title, children, id }: SectionCardProps) {
  return (
    <div id={id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-[#ff0000] rounded-full inline-block" />
        {title}
      </h2>
      {children}
    </div>
  );
}
