'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Sparkles } from 'lucide-react';
import { NOTIFICATION_CREDITS } from '@/lib/constants';
import { isPushSupported, getPushState, subscribeToPush } from '@/lib/push';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useToast } from '@/hooks/useToast';

const SNOOZE_KEY = 'push_prompt_snooze_until';
const SNOOZE_MS = 24 * 60 * 60 * 1000; // re-ask tomorrow

/**
 * Dashboard opt-in prompt for push notifications, offering a one-time credit
 * reward. Shows only when push is supported + configured, the user isn't already
 * subscribed, hasn't hard-denied, and isn't within the 24h snooze window.
 */
export default function PushNotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const { refresh } = useCreditBalance();
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const check = async () => {
      if (!isPushSupported() || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
      const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
      if (Date.now() < snoozeUntil) return;
      const state = await getPushState();
      // Skip if already on, or hard-denied at the browser level (re-prompting can't work).
      if (state.subscribed || state.permission === 'denied') return;
      // Small delay so it doesn't collide with the initial dashboard render / other modals.
      timer = setTimeout(() => {
        if (!cancelled) setIsVisible(true);
      }, 1500);
    };

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  };

  const handleLater = () => {
    snooze();
    setIsVisible(false);
  };

  const handleEnable = async () => {
    setBusy(true);
    const res = await subscribeToPush();
    setBusy(false);

    if (res.ok) {
      setIsVisible(false);
      if (res.creditsGranted && res.creditsGranted > 0) {
        await refresh();
        showToast(`เปิดการแจ้งเตือนสำเร็จ! รับ ${res.creditsGranted} เครดิต 🎉`, 'success');
      } else {
        showToast('เปิดการแจ้งเตือนสำเร็จ!', 'success');
      }
    } else if (res.error === 'denied') {
      snooze();
      setIsVisible(false);
      showToast('คุณปิดสิทธิ์การแจ้งเตือนไว้ เปิดได้ภายหลังที่ไอคอนกระดิ่ง', 'info');
    } else {
      showToast('ไม่สามารถเปิดการแจ้งเตือนได้ ลองใหม่อีกครั้ง', 'error');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleLater} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
        <button
          onClick={handleLater}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="ปิด"
        >
          <X size={18} className="text-gray-400" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center">
            <Bell size={32} className="text-[#E63946]" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="font-kanit text-xl font-bold text-gray-800 mb-2">
            เปิดการแจ้งเตือน รับเครดิตฟรี!
          </h3>
          <p className="text-gray-500 text-sm mb-3">
            รับแจ้งเตือนข่าวสาร โปรโมชัน และเรื่องสำคัญ — ส่งตรงถึงเครื่องคุณ
          </p>
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-full px-4 py-1.5">
            <Sparkles size={16} className="text-[#E63946]" />
            <span className="font-kanit font-semibold text-[#E63946]">
              {NOTIFICATION_CREDITS} เครดิตฟรี
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleLater}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-kanit text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            ไว้ทีหลัง
          </button>
          <button
            onClick={handleEnable}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#E63946] to-[#FF6B6B] text-white font-kanit font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
          >
            {busy ? 'กำลังเปิด...' : 'เปิดเลย'}
          </button>
        </div>
      </div>
    </div>
  );
}
