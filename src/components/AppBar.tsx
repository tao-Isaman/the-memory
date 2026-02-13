'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import HeartIcon from './HeartIcon';
import { Bell, User, LogOut, Coins } from 'lucide-react';
import { getLatestVersion } from '@/data/patch-notes';
import { hasUnseenUpdate, setLastSeenVersion } from '@/lib/patch-notes';
import { useCreditBalance } from '@/hooks/useCreditBalance';

export default function AppBar() {
  const { user, signOut } = useAuth();
  const { balance: creditBalance } = useCreditBalance();
  const router = useRouter();
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const latestVersion = getLatestVersion();
    if (hasUnseenUpdate(latestVersion)) {
      setHasNewUpdate(true);
    }
  }, []);

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleBellClick = () => {
    setLastSeenVersion(getLatestVersion());
    setHasNewUpdate(false);
    router.push('/updates');
  };

  const handleSignOut = async () => {
    setShowMenu(false);
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name || user.email || '';
  const initials = fullName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-pink-100">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <HeartIcon size={22} className="animate-pulse-heart" />
          <span className="font-leckerli text-xl bg-gradient-to-r from-[#FF6B9D] to-[#E63946] bg-clip-text text-transparent">
            The Memory
          </span>
        </Link>

        {/* Right: Notification + Avatar */}
        <div className="flex items-center gap-2">
          {/* Credit Balance */}
          <button
            onClick={() => router.push('/credits')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 hover:from-pink-100 hover:to-red-100 transition-colors"
            aria-label="เครดิต"
          >
            <Coins size={14} className="text-[#E63946]" />
            <span className="text-xs font-bold text-[#E63946]">{creditBalance}</span>
          </button>

          {/* Notification Bell */}
          <button
            onClick={handleBellClick}
            className="relative w-9 h-9 rounded-full hover:bg-pink-50 flex items-center justify-center transition-colors"
            aria-label="อัปเดตใหม่"
          >
            <Bell size={20} className="text-gray-500" />
            {hasNewUpdate && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#E63946] rounded-full border-2 border-white" />
            )}
          </button>

          {/* Profile Avatar + Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-pink-200 hover:border-[#E63946] transition-colors flex items-center justify-center"
              aria-label="เมนูผู้ใช้"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="w-full h-full bg-gradient-to-r from-[#FF6B9D] to-[#E63946] flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-pink-100 overflow-hidden animate-fade-in-up">
                <Link
                  href="/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 transition-colors"
                >
                  <User size={16} className="text-gray-400" />
                  โปรไฟล์
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 transition-colors border-t border-pink-50"
                >
                  <LogOut size={16} className="text-gray-400" />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
