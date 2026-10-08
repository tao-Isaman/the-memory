'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Memory } from '@/types/memory';
import { getMemories, deleteMemory, setMemoryUniverseShare } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import Mascot from '@/components/Mascot';
import ShareModal from '@/components/ShareModal';
import PaymentStatus from '@/components/PaymentStatus';
import PaymentButton from '@/components/PaymentButton';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import { Plus, Share2, Pencil, Trash2, Eye, Users, ImageIcon, Sparkles } from 'lucide-react';
import CartoonCreator from '@/components/CartoonCreator';
import UniverseFeed from '@/components/UniverseFeed';
import { trackEvent } from '@/lib/analytics';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const format = useFormatter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [activeTab, setActiveTab] = useState<'memories' | 'universe' | 'cartoon'>('memories');

  const handleShare = (memory: Memory) => {
    setSelectedMemory(memory);
    setShowShareModal(true);
  };

  const loadMemories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getMemories(user.id);
    setMemories(data);
    setLoading(false);

    // Track returning user session if they have existing memories
    if (data.length > 0) {
      trackEvent('returning_user_session');
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadMemories();
    }
  }, [user, loadMemories]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm(t('confirmDelete'))) {
      await deleteMemory(id, user.id);
      loadMemories();
    }
  };

  // Universe quick toggle — optimistic, reverted if the update fails.
  const handleUniverseToggle = async (memory: Memory) => {
    if (!user) return;
    const next = !memory.shareToUniverse;
    setMemories((prev) =>
      prev.map((m) => (m.id === memory.id ? { ...m, shareToUniverse: next } : m))
    );
    trackEvent('toggle_universe_share', { memory_id: memory.id, universe: next });
    const ok = await setMemoryUniverseShare(memory.id, user.id, next);
    if (!ok) {
      setMemories((prev) =>
        prev.map((m) => (m.id === memory.id ? { ...m, shareToUniverse: !next } : m))
      );
    }
  };

  const formatDate = (dateString: string) =>
    format.dateTime(new Date(dateString), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <HeartLoader message={t('loading.connecting')} size="lg" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen relative z-10">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Profile Completion Banner */}
        {user && <ProfileCompletionBanner userId={user.id} />}

        {/* Push notification opt-in prompt (one-time credit reward) */}
        {user && <PushNotificationPrompt />}

        {/* Tab Bar */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-pink-50 rounded-full p-1">
            <button
              onClick={() => setActiveTab('memories')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-kanit text-sm font-medium transition-all ${
                activeTab === 'memories'
                  ? 'bg-white text-[#E63946] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <HeartIcon size={16} filled={activeTab === 'memories'} />
              {t('tabs.memories')}
            </button>
            <button
              onClick={() => setActiveTab('universe')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-kanit text-sm font-medium transition-all ${
                activeTab === 'universe'
                  ? 'bg-white text-[#E63946] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles size={16} />
              {t('tabs.universe')}
            </button>
            <button
              onClick={() => setActiveTab('cartoon')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-kanit text-sm font-medium transition-all ${
                activeTab === 'cartoon'
                  ? 'bg-white text-[#E63946] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ImageIcon size={16} />
              {t('tabs.cartoon')}
            </button>
          </div>
        </div>

        {activeTab === 'memories' ? (
          <>
            {/* Action Buttons */}
            <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/create" className="btn-primary inline-flex items-center gap-2">
                <Plus size={20} />
                {t('actions.createNew')}
              </Link>
              <Link
                href="/dashboard/referral"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-full text-sm text-[#E63946] hover:from-pink-100 hover:to-red-100 transition-colors"
              >
                <Users size={16} />
                <span>{t('actions.referral')}</span>
              </Link>
            </div>

            {/* Memories List */}
            {loading ? (
              <div className="text-center py-12">
                <HeartLoader message={t('loading.memories')} size="md" />
              </div>
            ) : memories.length === 0 ? (
              <div className="memory-card p-12 text-center">
                <Mascot size={96} emotion="sleepy" animation="idle" className="mx-auto mb-4" />
                <h2 className="font-kanit text-xl font-semibold text-gray-600 mb-2">
                  {t('empty.title')}
                </h2>
                <p className="text-gray-500 mb-6">{t('empty.description')}</p>
                <Link href="/create" className="btn-primary inline-block">
                  {t('empty.cta')}
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {memories.map((memory) => (
                  <div key={memory.id} className="memory-card p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="font-kanit text-xl font-bold text-[#E63946] truncate grow">
                        {memory.title}
                      </h2>
                      <PaymentStatus status={memory.status} size="sm" />
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      {t('card.meta', {
                        count: memory.stories.length,
                        date: formatDate(memory.createdAt),
                      })}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {memory.status === 'active' ? (
                        <>
                          <Link
                            href={`/memory/${memory.id}`}
                            className="btn-primary text-sm py-2 px-3 flex-1 text-center flex items-center justify-center gap-1"
                            title={t('actions.view')}
                          >
                            <span>{t('actions.view')}</span>
                          </Link>
                          <button
                            onClick={() => handleShare(memory)}
                            className="px-3 py-2 text-sm rounded-full bg-pink-100 text-[#E63946] hover:bg-pink-200 transition-colors flex items-center justify-center gap-1"
                            title={t('actions.share')}
                          >
                            <Share2 size={16} />
                            <span className="hidden sm:inline">{t('actions.share')}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/memory/${memory.id}`}
                            className="btn-secondary text-sm py-2 px-3 flex items-center justify-center gap-1"
                            title={t('actions.preview')}
                          >
                            <Eye size={16} />
                            <span className="hidden sm:inline">{t('actions.preview')}</span>
                          </Link>
                          <PaymentButton
                            memoryId={memory.id}
                            memoryTitle={memory.title}
                            userId={user.id}
                            className="flex-1 text-sm py-2"
                          />
                        </>
                      )}
                      <Link
                        href={`/create?edit=${memory.id}`}
                        className="btn-secondary text-sm py-2 px-3 flex items-center justify-center gap-1"
                        title={t('actions.edit')}
                      >
                        <Pencil size={16} />
                        <span className="hidden sm:inline">{t('actions.edit')}</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(memory.id)}
                        className="px-3 py-2 text-sm rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                        title={t('actions.delete')}
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">{t('actions.delete')}</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-pink-50">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Sparkles size={14} className="text-[#E63946]" />
                        {t('card.shareToUniverse')}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={memory.shareToUniverse}
                        aria-label={t('card.shareToUniverse')}
                        onClick={() => handleUniverseToggle(memory)}
                        className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                          memory.shareToUniverse
                            ? 'bg-gradient-to-r from-[#FF6B9D] to-[#E63946]'
                            : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            memory.shareToUniverse ? 'translate-x-4' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'universe' ? (
          <UniverseFeed />
        ) : (
          <CartoonCreator userId={user.id} />
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>
          {t.rich('footer', {
            heart: () => (
              <HeartIcon size={14} className="inline-block align-middle mx-1" />
            ),
          })}
        </p>
      </footer>

      {/* Share Modal */}
      {selectedMemory && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedMemory(null);
          }}
          memoryId={selectedMemory.id}
          memoryTitle={selectedMemory.title}
          showSuccessMessage={false}
        />
      )}

    </main>
  );
}
