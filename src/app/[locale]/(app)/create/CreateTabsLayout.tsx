'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MemoryStory, MemoryTheme, StoryType } from '@/types/memory';
import type { ThemeColors } from '@/lib/themes';
import {
  CREATE_TABS,
  nextTab,
  tabForMissing,
  type CreateTab,
  type MissingItem,
} from '@/lib/create-steps';
import StoryEditor from '@/components/StoryEditor';
import StoryList from '@/components/StoryList';
import StoryViewer from '@/components/StoryViewer';
import ThemeSelector from '@/components/ThemeSelector';
import { Plus, X, Sparkles, ChevronLeft, ChevronRight, Check } from 'lucide-react';

type Slot = { key: string; type: StoryType; required: boolean };

/**
 * Everything the tabbed layout shows or calls. All state lives in the create page; this
 * component only arranges it, so switching tabs can never lose what the user entered and
 * both layouts share the same save, validation and template logic.
 */
export interface CreateTabsLayoutProps {
  isEditMode: boolean;
  title: string;
  onTitleChange: (title: string) => void;
  theme: MemoryTheme;
  onThemeChange: (theme: MemoryTheme) => void;
  shareToUniverse: boolean;
  onToggleShare: () => void;
  stories: MemoryStory[];
  onReorder: (stories: MemoryStory[]) => void;
  onDeleteStory: (id: string) => void;
  onEditStory: (story: MemoryStory) => void;
  /** The story editor: open for a new story (optionally from a template slot) or an edit. */
  editorOpen: boolean;
  editingStory: MemoryStory | null;
  editorInitialType?: StoryType;
  editorKey: string;
  onOpenEditor: (slot: Slot | null) => void;
  onCloseEditor: () => void;
  onSaveStory: (story: MemoryStory) => void;
  templateName: string | null;
  templateSlots: Slot[];
  missing: MissingItem[];
  missingLabel: (item: MissingItem) => string;
  saving: boolean;
  onSave: () => void;
  themeColors: ThemeColors;
  cssVariables: React.CSSProperties;
}

export default function CreateTabsLayout(p: CreateTabsLayoutProps) {
  const t = useTranslations('create');
  const [tab, setTab] = useState<CreateTab>('settings');
  const [previewIndex, setPreviewIndex] = useState(0);
  const { themeColors } = p;

  const following = nextTab(tab);
  const firstMissing = p.missing[0];
  const previewStory = p.stories[Math.min(previewIndex, p.stories.length - 1)];

  const save = () => {
    // Take the user to whatever is missing; the page's own save check shows the message.
    if (firstMissing) setTab(tabForMissing(firstMissing));
    p.onSave();
  };

  const templateCard = p.templateName && (
    <div className="memory-card p-4" data-testid="template-card">
      <p className="font-kanit font-semibold" style={{ color: themeColors.dark }}>
        {t('templates.ui.heading', { name: p.templateName })}
      </p>
      <p className="text-sm text-gray-600 mt-1">{t('templates.ui.intro')}</p>
      {p.templateSlots.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {p.templateSlots.map((slot) => (
            <button
              key={slot.key}
              type="button"
              onClick={() => {
                setTab('stories');
                p.onOpenEditor(slot);
              }}
              className="flex items-center justify-center gap-2 rounded-full border-2 border-dashed py-2.5 px-4 text-sm font-medium"
              style={{ borderColor: themeColors.primary, color: themeColors.dark }}
            >
              <Plus size={16} className="flex-shrink-0" />
              {t(`templates.ui.slots.${slot.key}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div data-testid="create-tabs">
      {/* Tabs (below the sticky app bar) */}
      <div
        className="sticky top-14 z-30 border-b border-black/5 backdrop-blur-sm"
        style={{ backgroundColor: `${themeColors.background}F2` }}
      >
        <div role="tablist" aria-label={p.isEditMode ? t('page.titleEdit') : t('page.titleCreate')} className="mx-auto flex max-w-2xl">
          {CREATE_TABS.map((id, i) => {
            const active = id === tab;
            const done = !p.missing.some((m) => tabForMissing(m) === id) && id !== 'review';
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className="flex flex-1 items-center justify-center gap-1.5 border-b-2 px-1 py-3 text-sm font-medium"
                style={{
                  borderColor: active ? themeColors.dark : 'transparent',
                  color: active ? themeColors.dark : '#6B7280',
                }}
              >
                <span
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: active || done ? themeColors.primary : '#D1D5DB' }}
                >
                  {done && !active ? <Check size={12} /> : i + 1}
                </span>
                <span className="truncate">{t(`tabs.${id}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panels stay mounted; only the active one is visible. */}
      <div className="mx-auto max-w-2xl px-4 pb-32 pt-5">
        <section role="tabpanel" hidden={tab !== 'settings'} className="space-y-5">
          <div>
            <label htmlFor="memory-title" className="block text-sm font-medium text-gray-700 mb-2">
              {t('page.memoryTitleLabel')}
            </label>
            <input
              id="memory-title"
              type="text"
              value={p.title}
              onChange={(e) => p.onTitleChange(e.target.value)}
              placeholder={t('page.memoryTitlePlaceholder')}
              className="input-valentine text-lg font-semibold"
            />
          </div>
          <ThemeSelector selected={p.theme} onChange={p.onThemeChange} />
          <div className="memory-card p-4 flex items-start gap-3">
            <Sparkles size={20} className="mt-0.5 flex-shrink-0" style={{ color: themeColors.primary }} />
            <div className="flex-1 min-w-0">
              <p className="font-kanit font-semibold" style={{ color: themeColors.dark }}>
                {t('universe.title')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{t('universe.description')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={p.shareToUniverse}
              aria-label={t('universe.title')}
              onClick={p.onToggleShare}
              className="relative w-12 h-7 rounded-full transition-colors flex-shrink-0"
              style={{
                background: p.shareToUniverse
                  ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`
                  : '#D1D5DB',
              }}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  p.shareToUniverse ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
          {templateCard}
        </section>

        <section role="tabpanel" hidden={tab !== 'stories'} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-kanit text-lg font-semibold" style={{ color: themeColors.dark }}>
              {t('page.storiesHeading')}
            </h2>
            <span className="text-sm text-gray-500">{t('page.storyCount', { count: p.stories.length })}</span>
          </div>
          <StoryList
            stories={p.stories}
            onReorder={p.onReorder}
            onDelete={p.onDeleteStory}
            onEdit={p.onEditStory}
            themeColors={themeColors}
          />
          {templateCard}
          <button
            type="button"
            onClick={() => p.onOpenEditor(null)}
            className="w-full memory-card p-4 flex items-center justify-center gap-2 border-2 border-dashed font-medium"
            style={{ borderColor: themeColors.accent, color: themeColors.dark }}
          >
            <Plus size={20} />
            {t('page.addStory')}
          </button>
        </section>

        <section role="tabpanel" hidden={tab !== 'review'} className="space-y-4">
          <div className="memory-card p-4">
            <p className="text-xs text-gray-500">{t('page.memoryTitleLabel')}</p>
            <p className="font-kanit text-lg font-semibold break-words" style={{ color: themeColors.dark }}>
              {p.title.trim() || '—'}
            </p>
            <p className="mt-1 text-sm text-gray-600">{t('page.storyCount', { count: p.stories.length })}</p>
          </div>

          {p.missing.length > 0 ? (
            <div className="memory-card p-4" data-testid="missing-list">
              <p className="font-kanit font-semibold text-[#B45309]">{t('tabs.missingHeading')}</p>
              <ul className="mt-2 space-y-2">
                {p.missing.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => setTab(tabForMissing(item))}
                      className="flex w-full items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2 text-left text-sm text-[#92400E]"
                    >
                      <span>{p.missingLabel(item)}</span>
                      <ChevronRight size={16} className="flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{t('tabs.ready')}</p>
          )}

          {previewStory && (
            <div className="memory-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-kanit font-semibold" style={{ color: themeColors.dark }}>
                  {t('tabs.preview')}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <button
                    type="button"
                    aria-label={t('tabs.previewPrev')}
                    disabled={previewIndex <= 0}
                    onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="tabular-nums">
                    {Math.min(previewIndex, p.stories.length - 1) + 1}/{p.stories.length}
                  </span>
                  <button
                    type="button"
                    aria-label={t('tabs.previewNext')}
                    disabled={previewIndex >= p.stories.length - 1}
                    onClick={() => setPreviewIndex((i) => Math.min(p.stories.length - 1, i + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: themeColors.background }}>
                {previewStory.type === 'password' ? (
                  <p className="p-6 text-center text-sm text-gray-600">{t('tabs.previewPin')}</p>
                ) : (
                  <StoryViewer key={previewStory.id} story={previewStory} themeColors={themeColors} isRevealed onReveal={() => {}} />
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Bottom bar: always visible */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 backdrop-blur-sm" data-testid="create-bottom-bar">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => firstMissing && setTab(tabForMissing(firstMissing))}
            disabled={!firstMissing}
            className="min-w-0 flex-1 text-left text-xs leading-snug"
            style={{ color: firstMissing ? '#B45309' : '#047857' }}
          >
            {firstMissing ? (
              <>
                <span className="font-semibold">{t('tabs.missingShort')}</span>{' '}
                <span className="line-clamp-2">{p.missingLabel(firstMissing)}</span>
              </>
            ) : (
              t('tabs.ready')
            )}
          </button>
          {following ? (
            <button
              type="button"
              onClick={() => setTab(following)}
              className="flex-shrink-0 rounded-full px-6 py-3 font-semibold text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)` }}
            >
              {t('tabs.next')}
            </button>
          ) : (
            <button
              type="button"
              onClick={save}
              disabled={p.saving}
              className={`flex-shrink-0 rounded-full px-6 py-3 font-semibold text-white shadow-lg ${p.saving ? 'opacity-70' : ''}`}
              style={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)` }}
            >
              {p.saving ? t('tabs.saving') : p.isEditMode ? t('page.updateMemory') : t('page.saveMemory')}
            </button>
          )}
        </div>
      </div>

      {/* Story editor: one story at a time, full screen */}
      {p.editorOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: themeColors.background, ...p.cssVariables }}
          role="dialog"
          aria-modal="true"
          data-testid="story-sheet"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 px-4 py-3 backdrop-blur-sm" style={{ backgroundColor: `${themeColors.background}F2` }}>
            <p className="font-kanit font-semibold" style={{ color: themeColors.dark }}>
              {p.editingStory ? t('list.editStory') : t('page.addStory')}
            </p>
            <button
              type="button"
              onClick={p.onCloseEditor}
              aria-label={t('tabs.closeEditor')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>
          <div className="mx-auto max-w-2xl p-4 pb-24">
            <StoryEditor
              key={p.editorKey}
              onSave={p.onSaveStory}
              onCancel={p.onCloseEditor}
              editingStory={p.editingStory ?? undefined}
              initialType={p.editorInitialType}
              noCard
              themeColors={themeColors}
            />
          </div>
        </div>
      )}
    </div>
  );
}
