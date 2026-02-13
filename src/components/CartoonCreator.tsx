'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import HeartIcon from './HeartIcon';
import HeartLoader from './HeartLoader';
import { Upload, X, Download, ImageIcon, Coins, RefreshCw } from 'lucide-react';
import { CARTOON_CREDIT_COST } from '@/lib/constants';
import { CartoonGeneration } from '@/types/cartoon';

interface CartoonCreatorProps {
  userId: string;
}

export default function CartoonCreator({ userId }: CartoonCreatorProps) {
  const { balance, refresh: refreshBalance } = useCreditBalance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [gallery, setGallery] = useState<CartoonGeneration[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const fetchGallery = useCallback(async () => {
    setLoadingGallery(true);
    try {
      const response = await fetch(`/api/cartoon/history?userId=${userId}`);
      const data = await response.json();
      setGallery(data.generations || []);
    } catch {
      console.error('Error fetching gallery');
    } finally {
      setLoadingGallery(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('ไฟล์ใหญ่เกินไป (สูงสุด 10MB)');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResultUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setGenerating(true);
    setError(null);
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('image', selectedFile);

      const response = await fetch('/api/cartoon/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'สร้างรูปการ์ตูนไม่สำเร็จ');
      }

      setResultUrl(data.cartoonUrl);
      refreshBalance();
      fetchGallery();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      refreshBalance();
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const insufficientCredits = balance < CARTOON_CREDIT_COST;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="memory-card p-6">
        <h2 className="font-kanit text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <ImageIcon size={20} className="text-[#E63946]" />
          อัปโหลดรูปภาพ
        </h2>

        {!previewUrl ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-pink-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#E63946] hover:bg-pink-50/30 transition-all"
          >
            <Upload size={40} className="mx-auto text-pink-300 mb-3" />
            <p className="font-kanit text-gray-600 mb-1">
              ลากรูปมาวางหรือคลิกเพื่อเลือก
            </p>
            <p className="text-sm text-gray-400">รองรับ JPG, PNG, WebP (สูงสุด 10MB)</p>
          </div>
        ) : (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-80 object-contain rounded-xl"
            />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />
      </div>

      {/* Generate Button */}
      <div className="memory-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-[#E63946]" />
            <span className="text-sm text-gray-500">
              เครดิตคงเหลือ: <span className="font-bold text-[#E63946]">{balance}</span>
            </span>
          </div>
          <span className="text-xs text-gray-400">
            ใช้ {CARTOON_CREDIT_COST} เครดิต/ครั้ง
          </span>
        </div>

        {generating ? (
          <div className="py-8">
            <HeartLoader
              message="กำลังสร้างรูปการ์ตูน... (อาจใช้เวลา 30-60 วินาที)"
              size="md"
            />
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!selectedFile || insufficientCredits}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-kanit font-medium transition-all ${
              !selectedFile || insufficientCredits
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'text-white bg-gradient-to-r from-[#FF6B9D] to-[#E63946] shadow-md hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            <HeartIcon size={16} filled />
            <span>
              {insufficientCredits
                ? `เครดิตไม่พอ (ต้องการ ${CARTOON_CREDIT_COST})`
                : `สร้างรูปการ์ตูน (ใช้ ${CARTOON_CREDIT_COST} เครดิต)`}
            </span>
          </button>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
        )}
      </div>

      {/* Result Display */}
      {resultUrl && (
        <div className="memory-card p-6">
          <h2 className="font-kanit text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <HeartIcon size={20} filled className="text-[#FF6B9D]" />
            ผลลัพธ์
          </h2>

          <img
            src={resultUrl}
            alt="Cartoon result"
            className="w-full rounded-xl mb-4"
          />

          <button
            onClick={() =>
              handleDownload(resultUrl, `cartoon-${Date.now()}.png`)
            }
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-kanit font-medium text-[#E63946] bg-white border-2 border-[#FF6B9D] hover:bg-pink-50 transition-all"
          >
            <Download size={16} />
            ดาวน์โหลดรูป
          </button>
        </div>
      )}

      {/* Gallery */}
      <div className="memory-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-kanit text-lg font-bold text-gray-700 flex items-center gap-2">
            <ImageIcon size={20} className="text-[#E63946]" />
            รูปการ์ตูนของคุณ
          </h2>
          <button
            onClick={fetchGallery}
            className="text-gray-400 hover:text-[#E63946] transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {loadingGallery ? (
          <div className="flex justify-center py-8">
            <HeartLoader message="กำลังโหลด..." size="sm" />
          </div>
        ) : gallery.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            ยังไม่มีรูปการ์ตูน — สร้างรูปแรกของคุณเลย!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.map((gen) => (
              <div key={gen.id} className="relative group">
                <img
                  src={gen.cartoonImageUrl || ''}
                  alt="Cartoon"
                  className="w-full aspect-square object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-all flex items-center justify-center">
                  <button
                    onClick={() =>
                      handleDownload(
                        gen.cartoonImageUrl || '',
                        `cartoon-${gen.id}.png`
                      )
                    }
                    className="opacity-0 group-hover:opacity-100 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md transition-all"
                  >
                    <Download size={16} className="text-gray-700" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {new Date(gen.createdAt).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
