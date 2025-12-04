'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, LogOut, User, Settings, Lock } from 'lucide-react'; // Added Menu icon
import Link from 'next/link';

export default function Header({ user, onMenuToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const initials = user?.name 
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'A';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Trigger */}
        <button 
          onClick={onMenuToggle}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          <Menu size={20} />
        </button>
        <div className="font-semibold text-slate-800 hidden md:block">
          Dashboard Overview
        </div>
      </div>
      
      {/* Profile Only (No Text, No Arrow) */}
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative rounded-full ring-2 ring-transparent hover:ring-slate-100 transition-all focus:outline-none"
        >
          <Avatar className="h-9 w-9 border border-slate-200 cursor-pointer">
            <AvatarImage src={user?.image} alt="Profile" />
            <AvatarFallback className="bg-slate-900 text-white">{initials}</AvatarFallback>
          </Avatar>
          
          {/* Status Dot (Online) */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
        </button>

        {/* Minimal Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-2 border-b border-slate-50 mb-1">
               <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
               <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            
            <Link href="/dashboard/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <User size={16} /> Profile Details
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Settings size={16} /> Settings
            </Link>
            <Link href="/setup-account" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Lock size={16} /> Reset Password
            </Link>

            <div className="my-1 border-t border-slate-50"></div>
            
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}