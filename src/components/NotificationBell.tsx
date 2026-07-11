'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Bell, BellRing, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AppNotification } from '@/types/notification';
import { fetchNotifications, markNotificationsRead, dismissNotifications } from '@/lib/notifications';
import { getPushState, subscribeToPush, unsubscribeFromPush, isPushSupported } from '@/lib/push';
import { patchNotes, getLatestVersion, versionKey } from '@/data/patch-notes';
import { hasUnseenUpdate, setLastSeenVersion } from '@/lib/patch-notes';

type Tab = 'notifications' | 'updates';

/** Badge colours per patch-note type; the label itself is translated. */
const typeBadgeClass: Record<string, string> = {
  feature: 'bg-green-100 text-green-700',
  improvement: 'bg-blue-100 text-blue-700',
  fix: 'bg-amber-100 text-amber-700',
  announcement: 'bg-pink-100 text-pink-700',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('dashboard.notifications');
  // Patch-note copy lives in the `updates` namespace (data/patch-notes.ts now holds
  // only version/date/badge-type), so the Updates tab reads from there.
  const tUpdates = useTranslations('updates');
  const format = useFormatter();
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

  const handleDismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (user) await dismissNotifications(user.id, [id]);
  };

  const handleClearAll = async () => {
    const ids = notifications.map((n) => n.id);
    setNotifications([]);
    if (user && ids.length > 0) await dismissNotifications(user.id, ids);
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
        aria-label={t('bell')}
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
              {t('tabNotifications')}{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
            <button
              onClick={() => openTab('updates')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${tab === 'updates' ? 'text-[#E63946] border-b-2 border-[#E63946]' : 'text-gray-500'}`}
            >
              {t('tabUpdates')}
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
                    {pushOn ? t('pushOn') : t('pushOff')}
                  </button>
                )}
                {!loading && notifications.length > 0 && (
                  <div className="flex justify-end px-3 py-1.5 border-b border-pink-50">
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-gray-400 hover:text-[#E63946] transition-colors"
                    >
                      {t('clearAll')}
                    </button>
                  </div>
                )}
                {loading ? (
                  <p className="text-center text-sm text-gray-400 py-8">{t('loading')}</p>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">{t('empty')}</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start border-b border-pink-50 hover:bg-pink-50/50 transition-colors ${!n.read ? 'bg-pink-50/30' : ''}`}
                    >
                      <button
                        onClick={() => handleNotifClick(n)}
                        className="flex-1 text-left px-4 py-3 min-w-0"
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#E63946] flex-shrink-0" />}
                          <div className={`flex-1 min-w-0 ${n.read ? 'pl-4' : ''}`}>
                            <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {format.relativeTime(new Date(n.createdAt))}
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDismiss(n.id)}
                        className="p-2 mt-1.5 mr-1 text-gray-300 hover:text-[#E63946] flex-shrink-0"
                        aria-label={t('dismiss')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div>
                {patchNotes.slice(0, 6).map((pn) => {
                  // Patch-note TEXT lives in messages/<locale>/updates.json, keyed by an
                  // underscored version ("2.9.0" -> "v2_9_0") because next-intl splits
                  // message keys on ".". items[i] here lines up with pn.items[i].type.
                  const noteKey = `notes.${versionKey(pn.version)}`;
                  const itemTexts = tUpdates.raw(`${noteKey}.items`) as string[] | undefined;
                  return (
                  <div key={pn.version} className="px-4 py-3 border-b border-pink-50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">{tUpdates(`${noteKey}.title`)}</p>
                      <span className="text-[10px] text-gray-400">v{pn.version}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1.5">{tUpdates(`${noteKey}.summary`)}</p>
                    <ul className="space-y-1">
                      {pn.items.slice(0, 4).map((it, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span
                            className={`mt-0.5 px-1.5 rounded text-[9px] font-medium ${typeBadgeClass[it.type] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {typeBadgeClass[it.type] ? t(`patchTypes.${it.type}`) : it.type}
                          </span>
                          <span className="flex-1">{itemTexts?.[i] ?? ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  );
                })}
                <Link
                  href="/updates"
                  onClick={() => setOpen(false)}
                  className="block text-center py-3 text-sm text-[#E63946] font-medium hover:bg-pink-50/50"
                >
                  {t('viewAllUpdates')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
