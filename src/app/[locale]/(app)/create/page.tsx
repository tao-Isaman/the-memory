'use client';

import { useState, useCallback, Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Memory, MemoryStory, MemoryStatus, MemoryTheme, StoryType } from '@/types/memory';
import { saveMemory, getMemoryById, generateId } from '@/lib/storage';
import { getThemeColors } from '@/lib/themes';
import { getUseCaseBySlug } from '@/data/use-cases';
import { getSeoLandingBySlug } from '@/data/seo-landings';
import { trackEvent } from '@/lib/analytics';
import {
  getMemoryTemplate,
  buildTemplateDraft,
  placeTemplateStory,
  openSlots,
  type SequenceEntry,
  type TemplateCopy,
} from '@/lib/memory-templates';
import { storePendingTemplate } from '@/lib/pending-template';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import StoryEditor from '@/components/StoryEditor';
import StoryList from '@/components/StoryList';
import ShareModal from '@/components/ShareModal';
import ThemeSelector from '@/components/ThemeSelector';
import PaymentButton from '@/components/PaymentButton';
import { Plus, ArrowLeft, X, Sparkles } from 'lucide-react';

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const templateSlug = searchParams.get('template');
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const t = useTranslations('create');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<MemoryTheme>('love');
  const [shareToUniverse, setShareToUniverse] = useState(true);
  const [stories, setStories] = useState<MemoryStory[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingStory, setEditingStory] = useState<MemoryStory | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [savedMemoryId, setSavedMemoryId] = useState<string | null>(null);
  const [savedMemoryStatus, setSavedMemoryStatus] = useState<MemoryStatus>('pending');
  // Starter template (/create?template=<slug>): the template's steps, and the slot whose
  // button opened the editor (only used to pre-select the story type).
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [templateSequence, setTemplateSequence] = useState<SequenceEntry[]>([]);
  const [fillingSlot, setFillingSlot] = useState<{ key: string; type: StoryType } | null>(null);

  // Get theme colors
  const themeColors = getThemeColors(theme);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Keep the chosen template across sign-in; the dashboard hands it back.
      if (templateSlug && getMemoryTemplate(templateSlug)) storePendingTemplate(templateSlug);
      router.push('/login');
    }
  }, [authLoading, user, router, templateSlug]);

  // The form is filled once per page open. Without this guard the effect below re-ran every
  // time the auth session refreshed (new `user` object) and wiped whatever the user had typed.
  const loadedFor = useRef<string | null>(null);

  // Load existing memory for edit mode
  useEffect(() => {
    async function loadMemory() {
      if (editId) {
        const existingMemory = await getMemoryById(editId);
        if (existingMemory) {
          setTitle(existingMemory.title);
          setTheme(existingMemory.theme);
          setShareToUniverse(existingMemory.shareToUniverse);
          setStories(existingMemory.stories);
          setIsEditMode(true);
          setOriginalCreatedAt(existingMemory.createdAt);
          setSavedMemoryStatus(existingMemory.status);
        }
      } else if (getMemoryTemplate(templateSlug)) {
        const template = getMemoryTemplate(templateSlug)!;
        const copy = t.raw(`templates.${template.slug}`) as TemplateCopy & { name: string };
        const draft = buildTemplateDraft(template, copy, generateId, new Date().toISOString());
        setTitle(draft.title);
        setTheme(draft.theme);
        setStories(draft.stories);
        setTemplateSequence(draft.sequence);
        setTemplateName(copy.name);
        trackEvent('start_create', { source: `template_${template.slug}`, theme: draft.theme });
        if (template.slug === 'loykrathong') trackEvent('loy_template_start');
      } else {
        // Check for use case from sessionStorage (set by login page)
        const pendingUseCase = sessionStorage.getItem('pending_usecase');
        if (pendingUseCase) {
          sessionStorage.removeItem('pending_usecase');
          const useCase = getUseCaseBySlug(pendingUseCase) ?? getSeoLandingBySlug(pendingUseCase);
          if (useCase) {
            setTheme(useCase.theme);
            trackEvent('start_create', { use_case: pendingUseCase, theme: useCase.theme });
          }
        } else {
          trackEvent('start_create');
        }
      }
      setInitialLoading(false);
    }

    if (!authLoading && user) {
      const key = `${editId ?? ''}|${templateSlug ?? ''}`;
      if (loadedFor.current === key) return;
      loadedFor.current = key;
      loadMemory();
    }
  }, [editId, templateSlug, authLoading, user, t]);

  const handleSaveStory = useCallback((story: MemoryStory) => {
    if (editingStory) {
      // Update existing story
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? story : s))
      );
    } else {
      // Add new story. With a starter template, a story whose type fills an open template
      // step goes to that step's position; everything else (and no template) is appended.
      setStories((prev) => placeTemplateStory(prev, templateSequence, story));
    }
    setShowEditor(false);
    setEditingStory(null);
    setFillingSlot(null);
  }, [editingStory, templateSequence]);

  const handleEditStory = useCallback((story: MemoryStory) => {
    setEditingStory(story);
    setShowEditor(true);
  }, []);

  const handleReorder = useCallback((newStories: MemoryStory[]) => {
    setStories(newStories);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setStories((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((story, index) => ({ ...story, priority: index }));
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;

    if (!title.trim()) {
      showToast(t('page.errorTitleRequired'), 'error');
      return;
    }

    if (stories.length === 0) {
      showToast(t('page.errorStoryRequired'), 'error');
      return;
    }

    // A template's required step (the couple's own PIN) must be added before saving.
    const missing = openSlots(templateSequence, stories).find((slot) => slot.required);
    if (missing) {
      showToast(t(`templates.ui.required.${missing.key}`), 'error');
      return;
    }

    setSaving(true);

    const memoryId = editId || generateId();
    // Preserve existing status for edits, set pending for new memories
    const currentStatus = isEditMode ? savedMemoryStatus : 'pending';
    const memory: Memory = {
      id: memoryId,
      title: title.trim(),
      theme,
      shareToUniverse,
      stories,
      createdAt: originalCreatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: currentStatus,
    };

    // Persist the creator's language so reaction notifications reach them in it.
    await saveMemory(memory, user.id, locale);
    setSaving(false);
    setSavedMemoryId(memoryId);
    trackEvent('complete_create', { memory_id: memoryId, theme, universe: shareToUniverse });

    // Show payment prompt for new/pending memories, share modal for active ones
    if (currentStatus === 'active') {
      setShowShareModal(true);
    } else {
      setShowPaymentPrompt(true);
    }
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    router.push('/dashboard');
  };

  if (authLoading || initialLoading) {
    return (
      <main className="min-h-screen relative z-10 flex items-center justify-center">
        <HeartLoader message={tc('state.loading')} size="lg" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const templateSlots = openSlots(templateSequence, stories);

  // CSS variables for themed inputs
  const cssVariables = {
    '--theme-primary': themeColors.primary,
    '--theme-dark': themeColors.dark,
    '--theme-accent': themeColors.accent,
    '--theme-background': themeColors.background,
    '--theme-focus-shadow': `${themeColors.primary}33`,
  } as React.CSSProperties;

  return (
    <main
      className="min-h-screen relative z-10 transition-colors duration-300"
      style={{ backgroundColor: themeColors.background, ...cssVariables }}
    >
      {/* Header */}
      <header className="py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="hover:opacity-80 transition-opacity flex items-center gap-2"
            style={{ color: themeColors.dark }}
          >
            <ArrowLeft size={20} />
            <span>{tc('actions.back')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <HeartIcon size={24} className="animate-pulse-heart" color={themeColors.primary} />
            <span
              className="font-kanit text-lg font-semibold"
              style={{ color: themeColors.dark }}
            >
              {isEditMode ? t('page.titleEdit') : t('page.titleCreate')}
            </span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Title Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('page.memoryTitleLabel')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('page.memoryTitlePlaceholder')}
            className="input-valentine text-xl font-semibold"
          />
        </div>

        {/* Theme Selector */}
        <div className="mb-6">
          <ThemeSelector selected={theme} onChange={setTheme} />
        </div>

        {/* Universe Share Toggle */}
        <div className="memory-card p-4 mb-8 flex items-start gap-3">
          <Sparkles size={20} className="mt-0.5 flex-shrink-0" style={{ color: themeColors.primary }} />
          <div className="flex-1 min-w-0">
            <p className="font-kanit font-semibold" style={{ color: themeColors.dark }}>
              {t('universe.title')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('universe.description')}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={shareToUniverse}
            aria-label={t('universe.title')}
            onClick={() => setShareToUniverse((v) => !v)}
            className="relative w-12 h-7 rounded-full transition-colors flex-shrink-0"
            style={{
              background: shareToUniverse
                ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`
                : '#D1D5DB',
            }}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                shareToUniverse ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Story List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-kanit text-lg font-semibold" style={{ color: themeColors.dark }}>
              {t('page.storiesHeading')}
            </h2>
            <span className="text-sm text-gray-500">
              {t('page.storyCount', { count: stories.length })}
            </span>
          </div>
          <StoryList
            stories={stories}
            onReorder={handleReorder}
            onDelete={handleDelete}
            onEdit={handleEditStory}
            themeColors={themeColors}
          />
        </div>

        {/* Starter template: what is pre-filled, and the steps only the user can add */}
        {templateName && !showEditor && (
          <div className="memory-card p-4 mb-6" data-testid="template-card">
            <p className="font-kanit font-semibold" style={{ color: themeColors.dark }}>
              {t('templates.ui.heading', { name: templateName })}
            </p>
            <p className="text-sm text-gray-600 mt-1">{t('templates.ui.intro')}</p>
            {templateSlots.length > 0 && (
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                {templateSlots.map((slot) => (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => {
                      setFillingSlot(slot);
                      setShowEditor(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-full border-2 border-dashed py-2.5 px-4 text-sm font-medium transition-colors"
                    style={{ borderColor: themeColors.primary, color: themeColors.dark }}
                  >
                    <Plus size={16} />
                    {t(`templates.ui.slots.${slot.key}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Story Button / Editor (for new stories) */}
        {showEditor && !editingStory ? (
          <StoryEditor
            key={fillingSlot?.key ?? 'new'}
            initialType={fillingSlot?.type}
            onSave={handleSaveStory}
            onCancel={() => {
              setShowEditor(false);
              setEditingStory(null);
              setFillingSlot(null);
            }}
            themeColors={themeColors}
          />
        ) : (
          <button
            onClick={() => setShowEditor(true)}
            className="w-full memory-card p-6 text-center hover:shadow-lg transition-shadow border-2 border-dashed"
            style={{
              borderColor: themeColors.accent,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = themeColors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = themeColors.accent)}
          >
            <Plus size={32} className="mx-auto mb-2" style={{ color: themeColors.dark }} />
            <span className="font-medium" style={{ color: themeColors.dark }}>{t('page.addStory')}</span>
          </button>
        )}

        {/* Save Button */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="font-semibold py-3 px-6 rounded-full transition-all border-2"
            style={{
              borderColor: themeColors.primary,
              color: themeColors.dark,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {tc('actions.cancel')}
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all min-w-[160px] ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl hover:scale-105'}`}
            style={{
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
              boxShadow: `0 4px 15px ${themeColors.dark}4D`,
            }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <HeartIcon size={16} className="animate-pulse-heart" color="#fff" />
                {tc('state.saving')}
              </span>
            ) : (
              isEditMode ? t('page.updateMemory') : t('page.saveMemory')
            )}
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {savedMemoryId && (
        <ShareModal
          isOpen={showShareModal}
          onClose={handleCloseShareModal}
          memoryId={savedMemoryId}
          memoryTitle={title}
        />
      )}

      {/* Payment Prompt Modal */}
      {showPaymentPrompt && savedMemoryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="memory-card p-8 max-w-md w-full text-center"
            style={{ backgroundColor: themeColors.background, ...cssVariables }}
          >
            <HeartIcon size={48} className="mx-auto mb-4 animate-pulse-heart" color={themeColors.primary} />
            <h2
              className="font-kanit text-2xl font-bold mb-2"
              style={{ color: themeColors.dark }}
            >
              {t('paymentPrompt.title')}
            </h2>
            <p className="text-gray-600 mb-2">
              {t('paymentPrompt.subtitle')}
            </p>
            <p className="text-sm text-gray-500 mb-2">
              {t('paymentPrompt.note')}
            </p>
            <p className="text-sm font-medium text-[#E63946] mb-6">
              {t('paymentPrompt.price')}
            </p>
            <div className="flex flex-col gap-3">
              <PaymentButton
                memoryId={savedMemoryId}
                memoryTitle={title}
                userId={user!.id}
                className="w-full"
              />
              <button
                onClick={() => {
                  setShowPaymentPrompt(false);
                  router.push(`/memory/${savedMemoryId}`);
                }}
                className="w-full font-semibold py-3 px-6 rounded-full transition-all border-2"
                style={{
                  borderColor: themeColors.primary,
                  color: themeColors.dark,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {t('paymentPrompt.preview')}
              </button>
              <button
                onClick={() => {
                  setShowPaymentPrompt(false);
                  router.push('/dashboard');
                }}
                className="text-sm transition-colors"
                style={{ color: themeColors.dark }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {t('paymentPrompt.backToDashboard')}
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              {t('paymentPrompt.footnote')}
            </p>
          </div>
        </div>
      )}

      {/* Edit Story Modal */}
      {editingStory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-xl"
            style={{ backgroundColor: themeColors.background, ...cssVariables }}
          >
            <button
              onClick={() => {
                setEditingStory(null);
                setShowEditor(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
            >
              <X size={18} className="text-gray-600" />
            </button>
            <div className="p-6">
              <StoryEditor
                onSave={handleSaveStory}
                onCancel={() => {
                  setEditingStory(null);
                  setShowEditor(false);
                }}
                editingStory={editingStory}
                noCard
                themeColors={themeColors}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CreatePage() {
  const tc = useTranslations('common');

  return (
    <Suspense fallback={
      <main className="min-h-screen relative z-10 flex items-center justify-center">
        <HeartLoader message={tc('state.loading')} size="lg" />
      </main>
    }>
      <CreatePageContent />
    </Suspense>
  );
}
