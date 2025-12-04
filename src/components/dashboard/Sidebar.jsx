'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, GraduationCap, Building2, 
  MessageSquare, FileWarning, Settings, LogOut, X 
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/experts', label: 'Experts', icon: GraduationCap },
  { href: '/dashboard/organisations', label: 'Organisations', icon: Building2 },
  { href: '/dashboard/chat', label: 'Chat Inspector', icon: MessageSquare },
  { href: '/dashboard/reports', label: 'Reports', icon: FileWarning },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed md:relative z-40 w-64 h-full bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col",
      // Mobile: Slide in/out based on isOpen
      // Desktop: Always visible (translate-x-0)
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="p-6 border-b border-slate-100 flex items-center justify-between h-16">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">M</span>
          Mind Namo
        </h1>
        {/* Close button for mobile */}
        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose} // Close sidebar on nav click (mobile)
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}