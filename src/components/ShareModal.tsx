'use client';

import { useState, useEffect, useRef } from 'react';
import HeartIcon from './HeartIcon';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  memoryTitle: string;
}

export default function ShareModal({ isOpen, onClose, memoryId, memoryTitle }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/memory/${memoryId}`);
    }
  }, [memoryId]);

  // Generate QR code using canvas
  useEffect(() => {
    if (!isOpen || !shareUrl || !qrCanvasRef.current) return;

    const canvas = qrCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple QR code generation using a basic approach
    // For production, you might want to use a library like qrcode
    generateQRCode(ctx, shareUrl, canvas.width);
  }, [isOpen, shareUrl]);

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
    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `memory-${memoryId}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="memory-card p-6 max-w-md w-full animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <HeartIcon size={24} className="text-[#E63946]" filled />
            <h2 className="font-kanit text-xl font-bold text-[#E63946]">แชร์ความทรงจำ</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Success Message */}
        <div className="text-center mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="text-3xl mb-2">&#10003;</div>
          <p className="text-green-700 font-medium">บันทึกความทรงจำสำเร็จ!</p>
          <p className="text-sm text-green-600 mt-1">แชร์ลิงก์นี้ให้คนที่คุณรักได้เลย</p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-xl shadow-inner border-2 border-pink-100">
            <canvas
              ref={qrCanvasRef}
              width={180}
              height={180}
              className="rounded-lg"
            />
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
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-pink-100 text-[#E63946] hover:bg-pink-200'
              }`}
            >
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
            <span>&#8681;</span>
            ดาวน์โหลด QR
          </button>
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleShare}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <span>&#10148;</span>
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

// Simple QR code generator using canvas
function generateQRCode(ctx: CanvasRenderingContext2D, data: string, size: number) {
  // This is a simplified QR-like pattern generator
  // For production, use a proper QR library like 'qrcode'

  const moduleCount = 21; // QR version 1
  const moduleSize = size / moduleCount;

  // Clear canvas with white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // Generate a simple hash-based pattern (visual representation, not actual QR)
  const hash = simpleHash(data);
  const pattern = generatePattern(hash, moduleCount);

  // Draw modules
  ctx.fillStyle = '#E63946'; // Use theme color

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (pattern[row][col]) {
        // Draw rounded square for visual appeal
        const x = col * moduleSize;
        const y = row * moduleSize;
        const radius = moduleSize * 0.15;

        ctx.beginPath();
        ctx.roundRect(x + 0.5, y + 0.5, moduleSize - 1, moduleSize - 1, radius);
        ctx.fill();
      }
    }
  }

  // Draw finder patterns (the 3 corner squares)
  drawFinderPattern(ctx, 0, 0, moduleSize);
  drawFinderPattern(ctx, (moduleCount - 7) * moduleSize, 0, moduleSize);
  drawFinderPattern(ctx, 0, (moduleCount - 7) * moduleSize, moduleSize);

  // Add heart in center
  ctx.fillStyle = '#FF6B9D';
  const heartSize = moduleSize * 3;
  const centerX = size / 2;
  const centerY = size / 2;
  drawHeart(ctx, centerX, centerY, heartSize);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generatePattern(hash: number, size: number): boolean[][] {
  const pattern: boolean[][] = [];
  let seed = hash;

  for (let row = 0; row < size; row++) {
    pattern[row] = [];
    for (let col = 0; col < size; col++) {
      // Skip finder pattern areas
      if (
        (row < 8 && col < 8) ||
        (row < 8 && col >= size - 8) ||
        (row >= size - 8 && col < 8) ||
        (row >= size / 2 - 2 && row <= size / 2 + 2 && col >= size / 2 - 2 && col <= size / 2 + 2)
      ) {
        pattern[row][col] = false;
      } else {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        pattern[row][col] = (seed % 3) !== 0;
      }
    }
  }

  return pattern;
}

function drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) {
  const s = moduleSize;

  // Outer square
  ctx.fillStyle = '#E63946';
  ctx.fillRect(x, y, s * 7, s * 7);

  // White middle
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + s, y + s, s * 5, s * 5);

  // Inner square
  ctx.fillStyle = '#E63946';
  ctx.fillRect(x + s * 2, y + s * 2, s * 3, s * 3);
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.beginPath();

  const topCurveHeight = size * 0.3;

  ctx.moveTo(x, y + topCurveHeight);

  // Left curve
  ctx.bezierCurveTo(
    x, y,
    x - size / 2, y,
    x - size / 2, y + topCurveHeight
  );

  // Left bottom curve
  ctx.bezierCurveTo(
    x - size / 2, y + (size + topCurveHeight) / 2,
    x, y + (size + topCurveHeight) / 2,
    x, y + size
  );

  // Right bottom curve
  ctx.bezierCurveTo(
    x, y + (size + topCurveHeight) / 2,
    x + size / 2, y + (size + topCurveHeight) / 2,
    x + size / 2, y + topCurveHeight
  );

  // Right curve
  ctx.bezierCurveTo(
    x + size / 2, y,
    x, y,
    x, y + topCurveHeight
  );

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
