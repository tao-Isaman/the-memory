'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCode } from 'react-qrcode-logo';
import HeartIcon from './HeartIcon';
import { X, Download, Share2, Copy, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  memoryTitle: string;
  showSuccessMessage?: boolean;
}

export default function ShareModal({ isOpen, onClose, memoryId, memoryTitle, showSuccessMessage = true }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const qrRef = useRef<QRCode>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/memory/${memoryId}`);
    }
  }, [memoryId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: memoryTitle,
          text: `ดูความทรงจำ "${memoryTitle}" ที่ฉันสร้างให้คุณ`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  const downloadQR = () => {
    if (qrRef.current) {
      qrRef.current.download('png', `memory-${memoryId}-qr`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="memory-card p-6 max-w-md w-full animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <HeartIcon size={24} className="text-[#E63946]" filled />
            <h2 className="text-xl font-bold text-[#E63946]">แชร์ความทรงจำ</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="text-center mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <Check size={32} className="mx-auto mb-2 text-green-600" />
            <p className="text-green-700 font-medium">บันทึกความทรงจำสำเร็จ!</p>
            <p className="text-sm text-green-600 mt-1">แชร์ลิงก์นี้ให้คนที่คุณรักได้เลย</p>
          </div>
        )}

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-xl shadow-inner border-2 border-pink-100">
            {shareUrl && (
              <QRCode
                ref={qrRef}
                value={shareUrl}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#000000"
                qrStyle="squares"
                eyeRadius={[
                  { outer: 10, inner: 5 },
                  { outer: 10, inner: 5 },
                  { outer: 10, inner: 5 },
                ]}
                eyeColor="#000000"
                logoWidth={40}
                logoHeight={40}
                removeQrCodeBehindLogo={true}
                logoPadding={5}
                logoPaddingStyle="circle"
              />
            )}
          </div>
        </div>

        {/* URL Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ลิงก์แชร์
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="input-valentine flex-grow text-sm"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-pink-100 text-[#E63946] hover:bg-pink-200'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={downloadQR}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <Download size={18} />
            ดาวน์โหลด QR
          </button>
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleShare}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Share2 size={18} />
              แชร์
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
