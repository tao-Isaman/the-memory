'use client';

// Universe — an Instagram-like public feed of stories from shared memories.
// Order is a seeded random shuffle (one seed per visit), fetched 10 at a time and
// lazy-loaded with an IntersectionObserver sentinel. Reactions are optimistic.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { UniverseStory, UniverseStoryType } from '@/types/universe';
import {
  getUniverseFeed,
  toggleUniverseReaction,
  newFeedSeed,
  UNIVERSE_PAGE_SIZE,
} from '@/lib/universe';
import { REACTION_EMOJIS } from '@/lib/reactions';
import { getThemeColors } from '@/lib/themes';
import { trackEvent } from '@/lib/analytics';
import HeartLoader from './HeartLoader';
import ScratchCard from './ScratchCard';
import SlideshowViewer from './SlideshowViewer';
import { Sparkles, ImageIcon, Quote, ImagePlus, Sparkle, Images } from 'lucide-react';

/** Story type → its chip icon + the message key holding the localized label. */
const TYPE_CHIP: Record<UniverseStoryType, { labelKey: string; Icon: typeof ImageIcon }> = {
  image: { labelKey: 'types.image', Icon: ImageIcon },
  text: { labelKey: 'types.text', Icon: Quote },
  'text-image': { labelKey: 'types.textImage', Icon: ImagePlus },
  scratch: { labelKey: 'types.scratch', Icon: Sparkle },
  slideshow: { labelKey: 'types.slideshow', Icon: Images },
};

/** Apply an emoji toggle to a story locally (same emoji → off, different → switch). */
function applyToggle(s: UniverseStory, emoji: string): UniverseStory {
  const counts = { ...s.reactionCounts };
  const dec = (e: string) => {
    const next = (counts[e] || 0) - 1;
    if (next > 0) counts[e] = next;
    else delete counts[e];
  };
  const inc = (e: string) => {
    counts[e] = (counts[e] || 0) + 1;
  };
  if (s.myEmoji === emoji) {
    dec(emoji);
    return { ...s, reactionCounts: counts, myEmoji: null };
  }
  if (s.myEmoji) dec(s.myEmoji);
  inc(emoji);
  return { ...s, reactionCounts: counts, myEmoji: emoji };
}

const TEXT_CLAMP_THRESHOLD = 180;

function StoryText({ text, dark }: { text: string; dark: string }) {
  const t = useTranslations('dashboard.universe');
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > TEXT_CLAMP_THRESHOLD;
  return (
    <div>
      <p
        className={`text-lg leading-relaxed whitespace-pre-wrap ${!expanded && isLong ? 'line-clamp-6' : ''}`}
        style={{ color: dark }}
      >
        {text}
      </p>
      {isLong && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {t('readMore')}
        </button>
      )}
    </div>
  );
}

function StoryCard({
  story,
  onReact,
}: {
  story: UniverseStory;
  onReact: (emoji: string) => void;
}) {
  const t = useTranslations('dashboard.universe');
  const format = useFormatter();
  const colors = getThemeColors(story.theme);
  const chip = TYPE_CHIP[story.type];
  const initial = (story.ownerName || '').charAt(0).toUpperCase() || '?';

  return (
    <article className="memory-card overflow-hidden">
      {/* Header: avatar + name + time + story type chip */}
      <div className="flex items-center gap-3 px-4 py-3">
        {story.ownerAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.ownerAvatar}
            alt={story.ownerName}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0"
            style={{ borderColor: colors.accent }}
          />
        ) : (
          <span
            className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.dark} 100%)` }}
          >
            {initial}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-kanit text-sm font-semibold text-gray-800 truncate">
            {story.ownerName}
          </p>
          <p className="text-[11px] text-gray-400 truncate">
            {format.relativeTime(new Date(story.createdAt))} ·{' '}
            {t('fromMemory', { title: story.memoryTitle })}
          </p>
        </div>
        <span
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium flex-shrink-0 border"
          style={{ backgroundColor: colors.background, color: colors.dark, borderColor: colors.accent }}
        >
          <chip.Icon size={11} />
          {t(chip.labelKey)}
        </span>
      </div>

      {/* Content */}
      {(story.type === 'image' || story.type === 'text-image') && story.content.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.content.imageUrl}
          alt={story.title || story.memoryTitle}
          loading="lazy"
          className="w-full max-h-[480px] object-cover"
          style={{ backgroundColor: colors.background }}
        />
      )}
      {story.type === 'image' && story.content.caption && (
        <p className="px-4 pt-3 text-sm text-gray-700 whitespace-pre-wrap">{story.content.caption}</p>
      )}
      {story.type === 'text-image' && story.content.text && (
        <div className="px-4 pt-3">
          <StoryText text={story.content.text} dark={colors.dark} />
        </div>
      )}
      {story.type === 'text' && story.content.text && (
        <div
          className="px-6 py-8 text-center"
          style={{ background: `linear-gradient(135deg, ${colors.background} 0%, #FFFFFF 100%)` }}
        >
          <Quote size={18} className="mx-auto mb-3 opacity-40" style={{ color: colors.primary }} />
          <StoryText text={story.content.text} dark={colors.dark} />
        </div>
      )}

      {/* Secret image: stays scratchable in the feed — revealing it up front would throw
          away the whole point of the story type. */}
      {story.type === 'scratch' && story.content.imageUrl && (
        <div className="px-4 pt-3">
          <ScratchCard imageUrl={story.content.imageUrl} themeColors={colors} />
          {story.content.caption && (
            <p className="pt-3 text-sm text-gray-700 whitespace-pre-wrap">
              {story.content.caption}
            </p>
          )}
        </div>
      )}

      {/* อัลบั้ม: revealed on arrival — a feed has no reveal gate to pass. */}
      {story.type === 'slideshow' && !!story.content.imageUrls?.length && (
        <div className="px-4 pt-3">
          <SlideshowViewer
            imageUrls={story.content.imageUrls}
            themeColors={colors}
            initialRevealed
            caption={story.content.caption}
          />
        </div>
      )}

      {/* Reaction bar */}
      <div className="px-3 py-2.5 mt-2 flex items-center gap-1 flex-wrap border-t border-pink-50">
        {REACTION_EMOJIS.map((emoji) => {
          const count = story.reactionCounts[emoji] || 0;
          const active = story.myEmoji === emoji;
          return (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              aria-pressed={active}
              aria-label={t('reaction', { emoji })}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-base transition-transform hover:scale-110 border"
              style={
                active
                  ? { backgroundColor: colors.background, borderColor: colors.primary }
                  : { borderColor: 'transparent' }
              }
            >
              <span>{emoji}</span>
              {count > 0 && (
                <span
                  className="text-xs font-medium"
                  style={{ color: active ? colors.dark : '#9CA3AF' }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </article>
  );
}

export default function UniverseFeed() {
  const t = useTranslations('dashboard.universe');
  const [items, setItems] = useState<UniverseStory[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const seedRef = useRef(newFeedSeed());
  // Offset counts FETCHED rows (pre-dedupe) so RPC paging stays aligned with the seed order.
  const offsetRef = useRef(0);
  const seenRef = useRef(new Set<string>());
  const busyRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const isFirst = offsetRef.current === 0;
    if (!isFirst) setLoadingMore(true);

    const page = await getUniverseFeed(seedRef.current, offsetRef.current);
    offsetRef.current += page.length;
    if (page.length < UNIVERSE_PAGE_SIZE) setHasMore(false);

    const fresh = page.filter((s) => !seenRef.current.has(s.storyId));
    fresh.forEach((s) => seenRef.current.add(s.storyId));
    if (fresh.length > 0) setItems((prev) => [...prev, ...fresh]);

    if (isFirst) setInitialLoading(false);
    else setLoadingMore(false);
    busyRef.current = false;
  }, []);

  useEffect(() => {
    loadMore();
    trackEvent('view_universe_feed');
  }, [loadMore]);

  // Lazy-load the next page when the sentinel under the feed approaches the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || initialLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '600px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, initialLoading, loadMore]);

  const handleReact = async (story: UniverseStory, emoji: string) => {
    const before = story;
    setItems((prev) => prev.map((s) => (s.storyId === story.storyId ? applyToggle(s, emoji) : s)));
    trackEvent('universe_reaction', { memory_id: story.memoryId, emoji });
    const res = await toggleUniverseReaction(story.storyId, emoji);
    if (!res.ok) {
      // Revert the optimistic update.
      setItems((prev) => prev.map((s) => (s.storyId === before.storyId ? before : s)));
    }
  };

  if (initialLoading) {
    return (
      <div className="text-center py-12">
        <HeartLoader message={t('loading')} size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <p className="text-center text-xs text-gray-400 mb-5">{t('intro')}</p>

      {items.length === 0 ? (
        <div className="memory-card p-12 text-center">
          <Sparkles size={48} className="mx-auto mb-4 text-pink-300" />
          <h2 className="font-kanit text-xl font-semibold text-gray-600 mb-2">
            {t('emptyTitle')}
          </h2>
          <p className="text-gray-500 text-sm">{t('emptyDescription')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((story) => (
            <StoryCard
              key={story.storyId}
              story={story}
              onReact={(emoji) => handleReact(story, emoji)}
            />
          ))}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="h-1" />}
      {loadingMore && (
        <div className="py-6 text-center">
          <HeartLoader message={t('loadingMore')} size="sm" />
        </div>
      )}
      {!hasMore && items.length > 0 && (
        <p className="text-center text-sm text-gray-400 py-8">{t('endOfFeed')}</p>
      )}
    </div>
  );
}
