'use client';

import { MemoryTheme } from '@/types/memory';
import { THEMES, THEME_INFO } from '@/lib/themes';

interface ThemeSelectorProps {
  selected: MemoryTheme;
  onChange: (theme: MemoryTheme) => void;
}

const themeOptions: MemoryTheme[] = ['love', 'friend', 'family'];

export default function ThemeSelector({ selected, onChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        เลือกธีมสี
      </label>
      <div className="grid grid-cols-3 gap-3">
        {themeOptions.map((theme) => {
          const colors = THEMES[theme];
          const info = THEME_INFO[theme];
          const isSelected = selected === theme;

          return (
            <button
              key={theme}
              type="button"
              onClick={() => onChange(theme)}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-gray-800 shadow-md scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{
                backgroundColor: isSelected ? colors.background : '#fff',
              }}
            >
              {/* Color preview circles */}
              <div className="flex justify-center gap-1 mb-2">
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: colors.dark }}
                />
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: colors.accent }}
                />
              </div>

              {/* Theme name */}
              <div className="text-center">
                <span className="text-lg">{info.emoji}</span>
                <p
                  className="text-sm font-medium mt-1"
                  style={{ color: isSelected ? colors.dark : '#374151' }}
                >
                  {info.nameThai}
                </p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.dark }}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
