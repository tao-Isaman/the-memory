'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Send } from 'lucide-react';
import { ThemeColors } from '@/lib/themes';
import { trackEvent } from '@/lib/analytics';
import { sendReaction, REACTION_EMOJIS, REACTION_MESSAGE_MAX } from '@/lib/reactions';
import HeartIcon from './HeartIcon';

interface MemoryEndingScreenProps {
  themeColors: ThemeColors;
  memoryId: string;
  isOwner: boolean;
  isPreviewMode: boolean;
  editHref: string;
  onReplay: () => void;
  onCreateOwn: () => void;
}

/**
 * The "fin" screen shown after the last story. Turns the old dead-end into a
 * celebratory moment that (for recipients) drives the view→creator loop.
 */
export default function MemoryEndingScreen({
  themeColors,
  memoryId,
  isOwner,
  isPreviewMode,
  editHref,
  onReplay,
  onCreateOwn,
}: MemoryEndingScreenProps) {
  const primaryGradient = `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`;
  const primaryClass =
    'flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-95';
  const secondaryClass =
    'flex items-center justify-center gap-2 px-8 py-3 rounded-full font-medium border bg-white/40 backdrop-blur-sm transition-all duration-300 hover:bg-black/5 active:scale-95';

  // ── Reaction / reply loop (recipient → owner) ──
  const [sentEmoji, setSentEmoji] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleReact = async (emoji: string) => {
    if (sending || sentEmoji) return;
    setSending(true);
    setSentEmoji(emoji); // optimistic — the loop should feel instant
    trackEvent('send_reaction', { memory_id: memoryId, reaction: emoji, has_message: false });
    await sendReaction(memoryId, { emoji });
    setSending(false);
  };

  const handleSendMessage = async () => {
    const text = message.trim();
    if (sending || messageSent || !text) return;
    setSending(true);
    trackEvent('send_reaction', { memory_id: memoryId, reaction: '❤️', has_message: true });
    const res = await sendReaction(memoryId, { emoji: '❤️', message: text });
    setSending(false);
    if (res.ok) setMessageSent(true);
  };

  const ReplayButton = (
    <button
      onClick={onReplay}
      className={secondaryClass}
      style={{ color: themeColors.dark, borderColor: `${themeColors.dark}33` }}
    >
      <RotateCcw size={16} />
      ดูอีกครั้ง
    </button>
  );

  return (
    <div className="relative z-50 grow flex flex-col items-center justify-center px-6 text-center animate-fade-in-up">
      {/* Glowing heart */}
      <div className="relative mb-6 flex items-center justify-center" style={{ width: 96, height: 96 }}>
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ backgroundColor: `${themeColors.primary}40` }}
        />
        <HeartIcon
          size={72}
          filled
          className="relative animate-pulse-heart"
          style={{ color: themeColors.primary }}
        />
      </div>

      {isOwner ? (
        <>
          <h2 className="font-kanit text-2xl font-bold mb-2" style={{ color: themeColors.dark }}>
            ดูจบแล้ว 🎉
          </h2>
          <p className="text-sm mb-8 max-w-xs" style={{ color: `${themeColors.dark}cc` }}>
            {isPreviewMode
              ? 'นี่คือสิ่งที่คนรับจะได้เห็น เปิดใช้งานเพื่อส่งให้คนสำคัญ'
              : 'ความทรงจำของคุณพร้อมส่งให้คนสำคัญแล้ว'}
          </p>
          <div className="flex flex-col items-stretch gap-3 w-full max-w-xs">
            <Link
              href={isPreviewMode ? editHref : '/dashboard'}
              className={primaryClass}
              style={{ background: primaryGradient, boxShadow: `0 8px 25px ${themeColors.dark}50` }}
            >
              {isPreviewMode ? 'แก้ไขต่อ' : 'ไปที่แดชบอร์ด'}
              <HeartIcon size={18} filled color="white" />
            </Link>
            {ReplayButton}
          </div>
        </>
      ) : (
        <>
          <h2 className="font-kanit text-2xl font-bold mb-2" style={{ color: themeColors.dark }}>
            หวังว่าคุณจะชอบนะ 💕
          </h2>
          <p className="text-sm mb-6 max-w-xs" style={{ color: `${themeColors.dark}cc` }}>
            อยากสร้างความทรงจำแบบนี้ให้คนสำคัญของคุณบ้างไหม?
          </p>

          {/* ── Reaction / reply loop: let the recipient send love back to the creator ── */}
          <div className="w-full max-w-xs mb-7">
            {sentEmoji ? (
              <div
                className="flex items-center justify-center gap-2 text-sm animate-fade-in-up"
                style={{ color: themeColors.dark }}
              >
                <span className="text-2xl animate-pulse-heart">{sentEmoji}</span>
                <span>ขอบคุณที่ส่งความรู้สึก!</span>
              </div>
            ) : (
              <>
                <p className="text-xs mb-2" style={{ color: `${themeColors.dark}aa` }}>
                  ส่งความรู้สึกถึงผู้สร้าง
                </p>
                <div className="flex justify-center gap-2">
                  {REACTION_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => handleReact(e)}
                      disabled={sending}
                      aria-label={`ส่ง ${e}`}
                      className="flex items-center justify-center w-11 h-11 rounded-full text-2xl bg-white/50 backdrop-blur-sm border transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50"
                      style={{ borderColor: `${themeColors.dark}22` }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Optional short reply */}
            <div className="mt-3">
              {messageSent ? (
                <div
                  className="flex items-center justify-center gap-1.5 text-sm"
                  style={{ color: themeColors.dark }}
                >
                  💌 <span>ส่งข้อความแล้ว</span>
                </div>
              ) : showMessage ? (
                <div className="animate-fade-in-up">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={REACTION_MESSAGE_MAX}
                    rows={3}
                    placeholder="เขียนข้อความถึงผู้สร้าง..."
                    className="w-full rounded-xl p-3 text-sm resize-none bg-white/60 backdrop-blur-sm border focus:outline-none"
                    style={{ borderColor: `${themeColors.dark}22`, color: themeColors.dark }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !message.trim()}
                    className={`${primaryClass} w-full mt-2 disabled:opacity-50`}
                    style={{ background: primaryGradient, boxShadow: `0 8px 25px ${themeColors.dark}50` }}
                  >
                    <Send size={16} />
                    ส่งข้อความ
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowMessage(true)}
                  className="text-xs underline underline-offset-2"
                  style={{ color: `${themeColors.dark}aa` }}
                >
                  + เขียนข้อความถึงผู้สร้าง
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 w-full max-w-xs">
            <button
              onClick={onCreateOwn}
              className={primaryClass}
              style={{ background: primaryGradient, boxShadow: `0 8px 25px ${themeColors.dark}50` }}
            >
              สร้างความทรงจำของคุณเอง
              <HeartIcon size={18} filled color="white" />
            </button>
            {ReplayButton}
            <p className="text-xs mt-1" style={{ color: `${themeColors.dark}99` }}>
              เริ่มต้นฟรี · ดูตัวอย่างก่อนได้
            </p>
          </div>
        </>
      )}
    </div>
  );
}
