import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, description, color, link, trend }) {
  // Color maps for dynamic styling (Backgrounds, Text, Borders)
  const colorVariants = {
    blue: "bg-blue-50/50 hover:bg-blue-50 border-blue-100 text-blue-600",
    purple: "bg-purple-50/50 hover:bg-purple-50 border-purple-100 text-purple-600",
    indigo: "bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100 text-indigo-600",
    amber: "bg-amber-50/50 hover:bg-amber-50 border-amber-100 text-amber-600",
    emerald: "bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100 text-emerald-600",
  };

  const activeColor = colorVariants[color] || colorVariants.blue;

  return (
    <Link 
      href={link || '#'}
      className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer bg-white ${activeColor.split(' ')[2]}`}
    >
      {/* Background Doodle (Large Icon) */}
      <div className={`absolute -right-6 -bottom-6 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12 ${activeColor.split(' ').pop()}`}>
        <Icon size={140} strokeWidth={1} />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div className={`p-3 rounded-xl ${activeColor}`}>
            <Icon size={24} />
          </div>
          
          {/* Action Arrow (Appears on Hover) */}
          <div className="bg-white p-1.5 rounded-full shadow-sm opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
            <ArrowRight size={16} className="text-slate-400" />
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {value?.toLocaleString() ?? '0'}
          </h3>
          <p className="text-sm font-semibold text-slate-600 mt-1">{title}</p>
          <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed max-w-[85%]">
            {description}
          </p>
        </div>

        {/* Optional: Trend Indicator */}
        {trend && (
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-white/80 border border-slate-100 text-slate-700 shadow-sm">
              {trend}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}