'use client';

import { useState, useEffect, useRef } from 'react';
import { StoryType, MemoryStory } from '@/types/memory';
import { ThemeColors } from '@/lib/themes';
import { generateId } from '@/lib/storage';
import { uploadImage } from '@/lib/upload';
import { useToast } from '@/hooks/useToast';
import { Lock, MessageCircleHeart, Camera, ImagePlus, Music, Sparkles, HelpCircle, LucideIcon } from 'lucide-react';

interface StoryEditorProps {
  onSave: (story: MemoryStory) => void;
  onCancel: () => void;
  editingStory?: MemoryStory;
  initialType?: StoryType;
  noCard?: boolean;
  themeColors?: ThemeColors;
}

// Default theme colors (love theme)
const defaultColors: ThemeColors = {
  primary: '#FF6B9D',
  dark: '#E63946',
  accent: '#FFB6C1',
  background: '#FFF0F5',
};

export const storyTypeLabels: Record<StoryType, string> = {
  password: 'รหัส PIN',
  text: 'ข้อความ',
  image: 'รูปภาพ',
  'text-image': 'ข้อความ + รูปภาพ',
  youtube: 'วิดีโอ YouTube',
  scratch: 'ความลับของเรา',
  question: 'คำถาม',
};

const storyTypeDescriptions: Record<StoryType, string> = {
  password: 'เพิ่มรหัส PIN 6 หลักเพื่อปกป้องเนื้อหา',
  text: 'เพิ่มข้อความจากใจ',
  image: 'เพิ่มรูปภาพพิเศษ',
  'text-image': 'รวมข้อความกับรูปภาพ',
  youtube: 'เพิ่มเพลงหรือวิดีโอที่มีความหมาย',
  scratch: 'ซ่อนรูปภาพไว้ในเมฆให้คนพิเศษขูดเปิดดู',
  question: 'สร้างคำถามให้คนพิเศษตอบ พร้อม 4 ตัวเลือก',
};

export const storyTypeIcons: Record<StoryType, LucideIcon> = {
  password: Lock,
  text: MessageCircleHeart,
  image: Camera,
  'text-image': ImagePlus,
  youtube: Music,
  scratch: Sparkles,
  question: HelpCircle,
};

export default function StoryEditor({
  onSave,
  onCancel,
  editingStory,
  initialType,
  noCard,
  themeColors = defaultColors,
}: StoryEditorProps) {
  const { showToast } = useToast();
  const isEditing = !!editingStory;

  // Initialize state from editing story if provided
  const getInitialType = (): StoryType => {
    if (editingStory) return editingStory.type;
    if (initialType) return initialType;
    return 'text';
  };

  const getInitialText = (): string => {
    if (!editingStory) return '';
    if (editingStory.type === 'text') return editingStory.content.text;
    if (editingStory.type === 'text-image') return editingStory.content.text;
    return '';
  };

  const getInitialImageUrl = (): string => {
    if (!editingStory) return '';
    if (editingStory.type === 'image') return editingStory.content.imageUrl;
    if (editingStory.type === 'text-image') return editingStory.content.imageUrl;
    if (editingStory.type === 'scratch') return editingStory.content.imageUrl;
    return '';
  };

  const getInitialCaption = (): string => {
    if (!editingStory) return '';
    if (editingStory.type === 'image') return editingStory.content.caption || '';
    if (editingStory.type === 'scratch') return editingStory.content.caption || '';
    return '';
  };

  const getInitialPassword = (): string => {
    if (!editingStory) return '';
    if (editingStory.type === 'password') return editingStory.content.password;
    return '';
  };

  const getInitialYoutubeUrl = (): string => {
    if (!editingStory) return '';
    if (editingStory.type === 'youtube') return editingStory.content.youtubeUrl;
    return '';
  };

  const getInitialQuestion = () => {
    if (!editingStory) return { question: '', choices: ['', '', '', ''], correctIndex: 0 };
    if (editingStory.type === 'question') {
      return {
        question: editingStory.content.question,
        choices: editingStory.content.choices,
        correctIndex: editingStory.content.correctIndex,
      };
    }
    return { question: '', choices: ['', '', '', ''], correctIndex: 0 };
  };

  const [type, setType] = useState<StoryType>(getInitialType());
  const [title, setTitle] = useState(editingStory?.title || '');
  const [text, setText] = useState(getInitialText());
  const [imageUrl, setImageUrl] = useState(getInitialImageUrl());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(getInitialImageUrl());
  const [caption, setCaption] = useState(getInitialCaption());
  const [password, setPassword] = useState(getInitialPassword());
  const [youtubeUrl, setYoutubeUrl] = useState(getInitialYoutubeUrl());
  const [uploading, setUploading] = useState(false);
  // Question story state
  const [questionText, setQuestionText] = useState(getInitialQuestion().question);
  const [choices, setChoices] = useState(getInitialQuestion().choices);
  const [correctIndex, setCorrectIndex] = useState(getInitialQuestion().correctIndex);

  // Track Object URL for cleanup to prevent memory leaks
  const objectUrlRef = useRef<string | null>(null);

  // Cleanup Object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cleanup previous Object URL if exists
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      objectUrlRef.current = previewUrl;
      setImagePreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const baseStory = {
      id: editingStory?.id || generateId(),
      priority: editingStory?.priority || 0,
      title: title.trim() || undefined,
      createdAt: editingStory?.createdAt || new Date().toISOString(),
    };

    let story: MemoryStory;
    let uploadedImageUrl = imageUrl;

    // Upload image if there's a file
    if ((type === 'image' || type === 'text-image' || type === 'scratch') && imageFile) {
      try {
        setUploading(true);
        uploadedImageUrl = await uploadImage(imageFile);
      } catch (error) {
        showToast('อัพโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    switch (type) {
      case 'password':
        if (password.length !== 6 || !/^\d{6}$/.test(password)) {
          showToast('กรุณาใส่รหัส PIN 6 หลัก', 'error');
          return;
        }
        story = { ...baseStory, type: 'password', content: { password: password } };
        break;
      case 'text':
        if (!text.trim()) return;
        story = { ...baseStory, type: 'text', content: { text: text.trim() } };
        break;
      case 'image':
        if (!uploadedImageUrl.trim()) return;
        story = {
          ...baseStory,
          type: 'image',
          content: { imageUrl: uploadedImageUrl.trim(), caption: caption.trim() || undefined },
        };
        break;
      case 'text-image':
        if (!text.trim() || !uploadedImageUrl.trim()) return;
        story = {
          ...baseStory,
          type: 'text-image',
          content: { text: text.trim(), imageUrl: uploadedImageUrl.trim() },
        };
        break;
      case 'youtube':
        if (!youtubeUrl.trim()) return;
        story = { ...baseStory, type: 'youtube', content: { youtubeUrl: youtubeUrl.trim() } };
        break;
      case 'scratch':
        if (!uploadedImageUrl.trim()) return;
        story = {
          ...baseStory,
          type: 'scratch',
          content: { imageUrl: uploadedImageUrl.trim(), caption: caption.trim() || undefined },
        };
        break;
      case 'question':
        if (!questionText.trim()) {
          showToast('กรุณาใส่คำถาม', 'error');
          return;
        }
        if (choices.some(c => !c.trim())) {
          showToast('กรุณาใส่ตัวเลือกทั้ง 4 ข้อ', 'error');
          return;
        }
        story = {
          ...baseStory,
          type: 'question',
          content: {
            question: questionText.trim(),
            choices: choices.map(c => c.trim()),
            correctIndex,
          },
        };
        break;
      default:
        return;
    }

    onSave(story);
  };

  // CSS variables for themed inputs
  const cssVariables = {
    '--theme-primary': themeColors.primary,
    '--theme-dark': themeColors.dark,
    '--theme-accent': themeColors.accent,
    '--theme-background': themeColors.background,
    '--theme-focus-shadow': `${themeColors.primary}33`,
  } as React.CSSProperties;

  return (
    <div className={noCard ? '' : 'memory-card p-6'} style={cssVariables}>
      <h3 className="font-kanit text-xl font-bold mb-4" style={{ color: themeColors.dark }}>
        {isEditing ? 'แก้ไขเรื่องราว' : 'เพิ่มเรื่องราวความทรงจำใหม่'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Story Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ประเภทความทรงจำ
          </label>
          {isEditing ? (
            // Show current type only when editing (can't change type)
            <div
              className="p-3 rounded-lg border-2 inline-flex items-center gap-2"
              style={{
                borderColor: themeColors.primary,
                backgroundColor: `${themeColors.accent}33`,
              }}
            >
              {(() => {
                const IconComponent = storyTypeIcons[type];
                return <IconComponent size={18} style={{ color: themeColors.dark }} />;
              })()}
              <span className="font-medium text-sm">{storyTypeLabels[type]}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(storyTypeLabels) as StoryType[]).map((t) => {
                const IconComponent = storyTypeIcons[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="p-3 rounded-lg border-2 text-left transition-all"
                    style={{
                      borderColor: isSelected ? themeColors.primary : '#e5e7eb',
                      backgroundColor: isSelected ? `${themeColors.accent}33` : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent size={18} style={{ color: isSelected ? themeColors.dark : '#6b7280' }} />
                      <span className="font-medium text-sm">{storyTypeLabels[t]}</span>
                    </div>
                    <span className="block text-xs text-gray-500">
                      {storyTypeDescriptions[t]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Story Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อเรื่องราว (ไม่จำเป็น)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ตั้งชื่อให้จดจำง่าย เช่น 'วันแรกที่เจอกัน'"
            className="input-valentine"
          />
          <p className="text-xs text-gray-500 mt-1">
            ชื่อนี้จะแสดงแทนประเภทเรื่องราวในรายการ
          </p>
        </div>

        {/* Dynamic Fields based on type */}
        {type === 'password' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รหัส PIN (6 หลัก)
            </label>
            <div className="flex justify-center gap-2" id="pin-inputs">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="none"
                  maxLength={1}
                  value={password[index] || ''}
                  readOnly
                  onKeyDown={(e) => {
                    // Handle number keys (for desktop keyboard)
                    if (/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                      const newPin = password.split('');
                      newPin[index] = e.key;
                      setPassword(newPin.join(''));
                      // Auto-focus next input
                      if (index < 5) {
                        const nextInput = (e.target as HTMLElement).parentElement?.children[index + 1] as HTMLInputElement;
                        nextInput?.focus();
                      }
                      return;
                    }
                    // Handle backspace to go to previous input
                    if (e.key === 'Backspace') {
                      if (!password[index] && index > 0) {
                        const prevInput = (e.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
                        prevInput?.focus();
                        const newPin = password.split('');
                        newPin[index - 1] = '';
                        setPassword(newPin.join(''));
                      } else {
                        const newPin = password.split('');
                        newPin[index] = '';
                        setPassword(newPin.join(''));
                      }
                    } else if (e.key === 'ArrowLeft' && index > 0) {
                      const prevInput = (e.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
                      prevInput?.focus();
                    } else if (e.key === 'ArrowRight' && index < 5) {
                      const nextInput = (e.target as HTMLElement).parentElement?.children[index + 1] as HTMLInputElement;
                      nextInput?.focus();
                    }
                  }}
                  className="w-11 h-12 text-center text-xl font-bold input-valentine"
                  required={index === 0}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              ใส่ตัวเลข 6 หลักเพื่อปกป้องเนื้อหาถัดไป
            </p>
            {/* Number pad for mobile */}
            <div className="mt-4 grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (num === 'del') {
                      // Find last filled input and clear it
                      const lastFilledIndex = password.split('').findLastIndex(p => p !== '');
                      if (lastFilledIndex >= 0) {
                        const newPin = password.split('');
                        newPin[lastFilledIndex] = '';
                        setPassword(newPin.join(''));
                        // Focus that input
                        const container = document.getElementById('pin-inputs');
                        const input = container?.children[lastFilledIndex] as HTMLInputElement;
                        input?.focus();
                      }
                    } else if (num !== null) {
                      // Find first empty input and fill it
                      const firstEmptyIndex = password.split('').findIndex((p, i) => i < 6 && (p === '' || p === undefined));
                      const targetIndex = firstEmptyIndex === -1 ? (password.length < 6 ? password.length : -1) : firstEmptyIndex;
                      if (targetIndex >= 0 && targetIndex < 6) {
                        const newPin = password.split('');
                        while (newPin.length < 6) newPin.push('');
                        newPin[targetIndex] = num.toString();
                        setPassword(newPin.join(''));
                        // Focus next input
                        const container = document.getElementById('pin-inputs');
                        const nextInput = container?.children[Math.min(targetIndex + 1, 5)] as HTMLInputElement;
                        nextInput?.focus();
                      }
                    }
                  }}
                  className={`h-12 rounded-lg text-xl font-semibold transition-all ${num === null ? 'invisible' : ''}`}
                  style={
                    num === null
                      ? {}
                      : num === 'del'
                        ? { backgroundColor: '#f3f4f6', color: '#4b5563' }
                        : { backgroundColor: `${themeColors.accent}33`, color: themeColors.dark }
                  }
                >
                  {num === 'del' ? '⌫' : num}
                </button>
              ))}
            </div>
          </div>
        )}

        {(type === 'text' || type === 'text-image') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ข้อความของคุณ
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="เขียนอะไรบางอย่างจากใจ..."
              className="input-valentine min-h-[120px] resize-y"
              required
            />
          </div>
        )}

        {(type === 'image' || type === 'text-image' || type === 'scratch') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {imageUrl && !imageFile ? 'เปลี่ยนรูปภาพ (ไม่จำเป็น)' : 'อัพโหลดรูปภาพ'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="input-valentine file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:transition-opacity"
              required={!imageUrl && !imageFile}
            />
            {imagePreview && (
              <div className="mt-2 p-2 border rounded-lg bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="ตัวอย่าง"
                  className="max-h-40 mx-auto rounded"
                />
              </div>
            )}
          </div>
        )}

        {(type === 'image' || type === 'scratch') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              คำบรรยาย (ไม่จำเป็น)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="เพิ่มคำบรรยายน่ารักๆ..."
              className="input-valentine"
            />
          </div>
        )}

        {type === 'youtube' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL YouTube
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="input-valentine"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              วางลิงก์ YouTube เพื่อแชร์เพลงหรือวิดีโอที่มีความหมาย
            </p>
          </div>
        )}

        {type === 'question' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำถาม
              </label>
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="เช่น: เราเจอกันครั้งแรกที่ไหน?"
                className="input-valentine"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ตัวเลือก (4 ข้อ)
              </label>
              <div className="space-y-2">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                      }}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <input
                      type="text"
                      value={choices[index] || ''}
                      onChange={(e) => {
                        const newChoices = [...choices];
                        newChoices[index] = e.target.value;
                        setChoices(newChoices);
                      }}
                      placeholder={`ตัวเลือก ${String.fromCharCode(65 + index)}`}
                      className="input-valentine flex-1"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำตอบที่ถูกต้อง
              </label>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCorrectIndex(index)}
                    className="px-4 py-2 rounded-full font-semibold transition-all"
                    style={{
                      backgroundColor: correctIndex === index ? themeColors.primary : themeColors.background,
                      color: correctIndex === index ? 'white' : themeColors.dark,
                      border: `2px solid ${themeColors.primary}`,
                    }}
                  >
                    {String.fromCharCode(65 + index)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                เลือกตัวเลือกที่เป็นคำตอบที่ถูกต้อง
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 font-semibold py-3 px-6 rounded-full transition-all border-2"
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
            ยกเลิก
          </button>
          <button
            type="submit"
            className="flex-1 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105 disabled:opacity-70"
            style={{
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
              boxShadow: `0 4px 15px ${themeColors.dark}4D`,
            }}
            disabled={uploading}
          >
            {uploading ? 'กำลังอัพโหลด...' : isEditing ? 'บันทึก' : 'เพิ่ม'}
          </button>
        </div>
      </form>
    </div>
  );
}
