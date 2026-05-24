'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, BellRing } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AppNotification } from '@/types/notification';
import { fetchNotifications, markNotificationsRead } from '@/lib/notifications';
import { getPushState, subscribeToPush, unsubscribeFromPush, isPushSupported } from '@/lib/push';
import { patchNotes, getLatestVersion } from '@/data/patch-notes';
import { hasUnseenUpdate, setLastSeenVersion } from '@/lib/patch-notes';

type Tab = 'notifications' | 'updates';

const typeBadge: Record<string, { label: string; cls: string }> = {
  feature: { label: 'ใหม่', cls: 'bg-green-100 text-green-700' },
  improvement: { label: 'ปรับปรุง', cls: 'bg-blue-100 text-blue-700' },
  fix: { label: 'แก้ไข', cls: 'bg-amber-100 text-amber-700' },
  announcement: { label: 'ประกาศ', cls: 'bg-pink-100 text-pink-700' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'เมื่อสักครู่';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('notifications');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasPatchUpdate, setHasPatchUpdate] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const showDot = unreadCount > 0 || hasPatchUpdate;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setNotifications(await fetchNotifications());
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setHasPatchUpdate(hasUnseenUpdate(getLatestVersion()));
    // Only offer the device-push toggle once VAPID is configured (else it'd be a dead button).
    setPushSupported(isPushSupported() && !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  useEffect(() => {
    if (!open) return;
    getPushState().then((s) => setPushOn(s.subscribed && s.permission === 'granted'));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Mark unread as read shortly after the notifications tab is shown.
  useEffect(() => {
    if (!open || tab !== 'notifications' || !user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const t = setTimeout(() => {
      markNotificationsRead(user.id, unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, 800);
    return () => clearTimeout(t);
  }, [open, tab, user, notifications]);

  const openTab = (t: Tab) => {
    setTab(t);
    if (t === 'updates' && hasPatchUpdate) {
      setLastSeenVersion(getLatestVersion());
      setHasPatchUpdate(false);
    }
  };

  const handleNotifClick = (n: AppNotification) => {
    setOpen(false);
    if (!n.url) return;
    if (n.url.startsWith('http')) window.open(n.url, '_blank');
    else router.push(n.url);
  };

  const handlePushToggle = async () => {
    setPushBusy(true);
    if (pushOn) {
      await unsubscribeFromPush();
      setPushOn(false);
    } else {
      const res = await subscribeToPush();
      setPushOn(res.ok);
    }
    setPushBusy(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          setTab('notifications');
        }}
        className="relative w-9 h-9 rounded-full hover:bg-pink-50 flex items-center justify-center transition-colors"
        aria-label="การแจ้งเตือน"
      >
        <Bell size={20} className="text-gray-500" />
        {showDot && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-[#E63946] rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : ''}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden animate-fade-in-up z-50">
          {/* Tabs */}
          <div className="flex border-b border-pink-50">
            <button
              onClick={() => openTab('notifications')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'notifications' ? 'text-[#E63946] border-b-2 border-[#E63946]' : 'text-gray-500'}`}
            >
              การแจ้งเตือน{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
            <button
              onClick={() => openTab('updates')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${tab === 'updates' ? 'text-[#E63946] border-b-2 border-[#E63946]' : 'text-gray-500'}`}
            >
              อัปเดต
              {hasPatchUpdate && <span className="absolute top-2.5 ml-1 w-2 h-2 bg-[#E63946] rounded-full" />}
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {tab === 'notifications' ? (
              <div>
                {pushSupported && (
                  <button
                    onClick={handlePushToggle}
                    disabled={pushBusy}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs border-b border-pink-50 text-gray-600 hover:bg-pink-50/50 disabled:opacity-50"
                  >
                    <BellRing size={14} className={pushOn ? 'text-[#E63946]' : 'text-gray-400'} />
                    {pushOn
                      ? 'การแจ้งเตือนบนอุปกรณ์นี้: เปิดอยู่ (แตะเพื่อปิด)'
                      : 'เปิดการแจ้งเตือนบนอุปกรณ์นี้'}
                  </button>
                )}
                {loading ? (
                  <p className="text-center text-sm text-gray-400 py-8">กำลังโหลด...</p>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">ยังไม่มีการแจ้งเตือน</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-pink-50 hover:bg-pink-50/50 transition-colors ${!n.read ? 'bg-pink-50/30' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#E63946] flex-shrink-0" />}
                        <div className={`flex-1 min-w-0 ${n.read ? 'pl-4' : ''}`}>
                          <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div>
                {patchNotes.slice(0, 6).map((pn) => (
                  <div key={pn.version} className="px-4 py-3 border-b border-pink-50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">{pn.title}</p>
                      <span className="text-[10px] text-gray-400">v{pn.version}</span>
                    </div>
                    {pn.summary && <p className="text-xs text-gray-500 mb-1.5">{pn.summary}</p>}
                    <ul className="space-y-1">
                      {pn.items.slice(0, 4).map((it, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span
                            className={`mt-0.5 px-1.5 rounded text-[9px] font-medium ${typeBadge[it.type]?.cls ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {typeBadge[it.type]?.label ?? it.type}
                          </span>
                          <span className="flex-1">{it.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Link
                  href="/updates"
                  onClick={() => setOpen(false)}
                  className="block text-center py-3 text-sm text-[#E63946] font-medium hover:bg-pink-50/50"
                >
                  ดูอัปเดตทั้งหมด →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
