'use client';

// PDPA consent guard for authenticated pages.
// - New users accept on the login page; that pending acceptance is synced to
//   user_consents silently on the first authenticated load (no extra prompt).
// - Users with an existing session who never accepted the current legal version
//   get this blocking modal: read + tick + accept (or sign out).
// Fails open on transient errors — users are never locked out by a flaky network.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  hasRecordedConsent,
  recordConsent,
  getPendingConsent,
  clearPendingConsent,
} from '@/lib/consent';
import HeartIcon from './HeartIcon';
import { ScrollText, ShieldCheck } from 'lucide-react';

export default function ConsentGuard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowModal(false);
      return;
    }
    let cancelled = false;

    (async () => {
      const has = await hasRecordedConsent(user.id);
      if (cancelled || has !== false) return; // true → done; null → can't determine, fail open

      // Accepted on the login page before OAuth? Persist silently.
      const pending = getPendingConsent();
      if (pending) {
        const ok = await recordConsent(user.id, 'login', pending.acceptedAt);
        if (ok) clearPendingConsent();
        return; // even on failure, don't nag — they did accept; retried next load
      }

      if (!cancelled) setShowModal(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleAccept = async () => {
    if (!user || !accepted || saving) return;
    setSaving(true);
    const ok = await recordConsent(user.id, 'modal');
    setSaving(false);
    if (ok) setShowModal(false);
  };

  const handleSignOut = async () => {
    setShowModal(false);
    await signOut();
    router.push('/login');
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="memory-card bg-white p-8 max-w-md w-full text-center">
        <HeartIcon size={40} className="mx-auto mb-4 animate-pulse-heart" />
        <h2 className="font-kanit text-xl font-bold text-[#4A1942] mb-2">
          ข้อกำหนดและความเป็นส่วนตัว
        </h2>
        <p className="text-sm text-gray-600 mb-5">
          ก่อนใช้งานต่อ กรุณาอ่านและยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัวของเรา
        </p>

        <div className="space-y-2 mb-5">
          <Link
            href="/terms"
            target="_blank"
            className="flex items-center gap-3 p-3 rounded-xl border border-pink-100 hover:bg-pink-50 transition-colors text-left"
          >
            <ScrollText size={18} className="text-[#E63946] flex-shrink-0" />
            <span className="text-sm text-gray-700">ข้อกำหนดการใช้งาน</span>
            <span className="ml-auto text-xs text-gray-400">เปิดอ่าน →</span>
          </Link>
          <Link
            href="/privacy"
            target="_blank"
            className="flex items-center gap-3 p-3 rounded-xl border border-pink-100 hover:bg-pink-50 transition-colors text-left"
          >
            <ShieldCheck size={18} className="text-[#E63946] flex-shrink-0" />
            <span className="text-sm text-gray-700">นโยบายความเป็นส่วนตัว</span>
            <span className="ml-auto text-xs text-gray-400">เปิดอ่าน →</span>
          </Link>
        </div>

        <label className="flex items-start gap-2.5 text-left mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#E63946] flex-shrink-0"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            ฉันได้อ่านและยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัวของ The Memory
          </span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!accepted || saving}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'กำลังบันทึก...' : 'ยอมรับและใช้งานต่อ'}
        </button>
        <button
          onClick={handleSignOut}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ไม่ยอมรับ — ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
