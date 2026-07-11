'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useToast } from '@/hooks/useToast';
import HeartIcon from './HeartIcon';
import HeartLoader from './HeartLoader';
import { Upload, X, Download, ImageIcon, Coins, RefreshCw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { CARTOON_CREDIT_COST } from '@/lib/constants';
import { CartoonGeneration } from '@/types/cartoon';

const PAGE_SIZE = 9;

interface CartoonCreatorProps {
  userId: string;
}

export default function CartoonCreator({ userId }: CartoonCreatorProps) {
  const { balance, refresh: refreshBalance } = useCreditBalance();
  const { showToast } = useToast();
  const t = useTranslations('credits');
  const format = useFormatter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  // Holds an error CODE (see messages/<locale>/credits.json → "errors"), never prose.
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const [gallery, setGallery] = useState<CartoonGeneration[]>([]);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [galleryPage, setGalleryPage] = useState(0);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Selected image for action modal
  const [selectedGen, setSelectedGen] = useState<CartoonGeneration | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.ceil(galleryTotal / PAGE_SIZE);

  /**
   * Maps an error code to translated copy. Anything we don't recognise (e.g. a raw
   * message from an API route that hasn't been converted to codes yet) falls back to
   * the generic error, so a Thai server string never leaks into an EN/ID screen.
   */
  const errorText = useCallback(
    (code: string | null) => {
      if (!code) return '';
      return t.has(`errors.${code}`)
        ? t(`errors.${code}`, { required: CARTOON_CREDIT_COST, balance })
        : t('errors.GENERIC');
    },
    [t, balance],
  );

  const fetchGallery = useCallback(async (page: number = 0) => {
    setLoadingGallery(true);
    try {
      const offset = page * PAGE_SIZE;
      const response = await fetch(
        `/api/cartoon/history?userId=${userId}&limit=${PAGE_SIZE}&offset=${offset}`
      );
      const data = await response.json();
      setGallery(data.generations || []);
      setGalleryTotal(data.total || 0);
    } catch {
      console.error('Error fetching gallery');
    } finally {
      setLoadingGallery(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGallery(galleryPage);
  }, [fetchGallery, galleryPage]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorCode('NOT_AN_IMAGE');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorCode('FILE_TOO_LARGE');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setErrorCode(null);
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
    setErrorCode(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setGenerating(true);
    setErrorCode(null);
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
        throw new Error(data.error || 'GENERATION_FAILED');
      }

      setResultUrl(data.cartoonUrl);
      refreshBalance();
      setGalleryPage(0);
      fetchGallery(0);
    } catch (err) {
      setErrorCode(err instanceof Error ? err.message : 'GENERIC');
      refreshBalance();
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (gen: CartoonGeneration) => {
    setDeleting(true);
    try {
      const response = await fetch('/api/cartoon/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: gen.id, userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'DELETE_FAILED');
      }

      setSelectedGen(null);
      fetchGallery(galleryPage);
    } catch (err) {
      showToast(errorText(err instanceof Error ? err.message : 'GENERIC'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const insufficientCredits = balance < CARTOON_CREDIT_COST;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="memory-card p-6">
        <h2 className="font-kanit text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <ImageIcon size={20} className="text-[#E63946]" />
          {t('cartoon.uploadTitle')}
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
              {t('cartoon.dropzone')}
            </p>
            <p className="text-sm text-gray-400">{t('cartoon.dropzoneHint')}</p>
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
              {t('cartoon.balanceLabel')} <span className="font-bold text-[#E63946]">{balance}</span>
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {t('cartoon.cost', { cost: CARTOON_CREDIT_COST })}
          </span>
        </div>

        {generating ? (
          <div className="py-8">
            <HeartLoader
              message={t('cartoon.generating')}
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
                ? t('cartoon.insufficient', { cost: CARTOON_CREDIT_COST })
                : t('cartoon.generate', { cost: CARTOON_CREDIT_COST })}
            </span>
          </button>
        )}

        {errorCode && (
          <p className="mt-3 text-sm text-red-500 text-center">{errorText(errorCode)}</p>
        )}
      </div>

      {/* Result Display */}
      {resultUrl && (
        <div className="memory-card p-6">
          <h2 className="font-kanit text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <HeartIcon size={20} filled className="text-[#FF6B9D]" />
            {t('cartoon.resultTitle')}
          </h2>

          <img
            src={resultUrl}
            alt="Cartoon result"
            className="w-full rounded-xl mb-4"
          />

          <a
            href={resultUrl}
            download={`cartoon-${Date.now()}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-kanit font-medium text-[#E63946] bg-white border-2 border-[#FF6B9D] hover:bg-pink-50 transition-all"
          >
            <Download size={16} />
            {t('cartoon.download')}
          </a>
        </div>
      )}

      {/* Gallery */}
      <div className="memory-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-kanit text-lg font-bold text-gray-700 flex items-center gap-2">
            <ImageIcon size={20} className="text-[#E63946]" />
            {t('cartoon.galleryTitle')}
            {galleryTotal > 0 && (
              <span className="text-sm font-normal text-gray-400">({galleryTotal})</span>
            )}
          </h2>
          <button
            onClick={() => fetchGallery(galleryPage)}
            aria-label={t('cartoon.refresh')}
            className="text-gray-400 hover:text-[#E63946] transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {loadingGallery ? (
          <div className="flex justify-center py-8">
            <HeartLoader message={t('cartoon.galleryLoading')} size="sm" />
          </div>
        ) : gallery.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            {t('cartoon.galleryEmpty')}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.map((gen) => (
                <div key={gen.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setSelectedGen(gen)}
                    className="w-full text-left"
                  >
                    <img
                      src={gen.cartoonImageUrl || ''}
                      alt="Cartoon"
                      className="w-full aspect-square object-cover rounded-xl active:scale-95 transition-transform"
                    />
                  </button>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    {format.dateTime(new Date(gen.createdAt), {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setGalleryPage((p) => Math.max(0, p - 1))}
                  disabled={galleryPage === 0}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    galleryPage === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-[#E63946] hover:bg-pink-50'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>

                <span className="text-sm text-gray-500 font-kanit">
                  {galleryPage + 1} / {totalPages}
                </span>

                <button
                  onClick={() => setGalleryPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={galleryPage >= totalPages - 1}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    galleryPage >= totalPages - 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-[#E63946] hover:bg-pink-50'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Action Modal */}
      {selectedGen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={() => !deleting && setSelectedGen(null)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview */}
            <div className="p-4">
              <img
                src={selectedGen.cartoonImageUrl || ''}
                alt="Cartoon"
                className="w-full rounded-xl"
              />
              <p className="text-xs text-gray-400 text-center mt-2">
                {format.dateTime(new Date(selectedGen.createdAt), {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 p-4 space-y-2">
              <a
                href={selectedGen.cartoonImageUrl || ''}
                download={`cartoon-${selectedGen.id}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-kanit font-medium text-white bg-gradient-to-r from-[#FF6B9D] to-[#E63946] shadow-md"
              >
                <Download size={18} />
                {t('cartoon.download')}
              </a>

              <button
                onClick={() => handleDelete(selectedGen)}
                disabled={deleting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-kanit font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <HeartIcon size={16} className="animate-pulse-heart" />
                    {t('cartoon.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    {t('cartoon.delete')}
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedGen(null)}
                disabled={deleting}
                className="w-full py-3 text-center font-kanit text-gray-400 text-sm"
              >
                {t('cartoon.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
