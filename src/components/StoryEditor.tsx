'use client';

import { useState } from 'react';
import { StoryType, MemoryStory } from '@/types/memory';
import { generateId } from '@/lib/storage';
import { uploadImage } from '@/lib/upload';
import { Lock, MessageCircleHeart, Camera, ImagePlus, Music, LucideIcon } from 'lucide-react';

interface StoryEditorProps {
  onSave: (story: MemoryStory) => void;
  onCancel: () => void;
  editingStory?: MemoryStory;
  initialType?: StoryType;
  noCard?: boolean;
}

export const storyTypeLabels: Record<StoryType, string> = {
  password: 'รหัส PIN',
  text: 'ข้อความ',
  image: 'รูปภาพ',
  'text-image': 'ข้อความ + รูปภาพ',
  youtube: 'วิดีโอ YouTube',
};

const storyTypeDescriptions: Record<StoryType, string> = {
  password: 'เพิ่มรหัส PIN 6 หลักเพื่อปกป้องเนื้อหา',
  text: 'เพิ่มข้อความจากใจ',
  image: 'เพิ่มรูปภาพพิเศษ',
  'text-image': 'รวมข้อความกับรูปภาพ',
  youtube: 'เพิ่มเพลงหรือวิดีโอที่มีความหมาย',
};

export const storyTypeIcons: Record<StoryType, LucideIcon> = {
  password: Lock,
  text: MessageCircleHeart,
  image: Camera,
  'text-image': ImagePlus,
  youtube: Music,
};

export default function StoryEditor({ onSave, onCancel, editingStory, initialType, noCard }: StoryEditorProps) {
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
    return '';
  };

  const getInitialCaption = (): string => {
    if (!editingStory) return '';
    if (editingStory.type === 'image') return editingStory.content.caption || '';
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
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
    if ((type === 'image' || type === 'text-image') && imageFile) {
      try {
        setUploading(true);
        uploadedImageUrl = await uploadImage(imageFile);
      } catch (error) {
        alert('อัพโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    switch (type) {
      case 'password':
        if (password.length !== 6 || !/^\d{6}$/.test(password)) {
          alert('กรุณาใส่รหัส PIN 6 หลัก');
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
      default:
        return;
    }

    onSave(story);
  };

  return (
    <div className={noCard ? '' : 'memory-card p-6'}>
      <h3 className="font-kanit text-xl font-bold text-[#E63946] mb-4">
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
            <div className="p-3 rounded-lg border-2 border-[#FF6B9D] bg-pink-50 inline-flex items-center gap-2">
              {(() => {
                const IconComponent = storyTypeIcons[type];
                return <IconComponent size={18} className="text-[#E63946]" />;
              })()}
              <span className="font-medium text-sm">{storyTypeLabels[type]}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(storyTypeLabels) as StoryType[]).map((t) => {
                const IconComponent = storyTypeIcons[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      type === t
                        ? 'border-[#FF6B9D] bg-pink-50'
                        : 'border-gray-200 hover:border-pink-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent size={18} className={type === t ? 'text-[#E63946]' : 'text-gray-500'} />
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
                  className={`h-12 rounded-lg text-xl font-semibold transition-all
                    ${num === null
                      ? 'invisible'
                      : num === 'del'
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-pink-50 text-[#E63946] hover:bg-pink-100 active:scale-95'
                    }`}
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

        {(type === 'image' || type === 'text-image') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {imageUrl && !imageFile ? 'เปลี่ยนรูปภาพ (ไม่จำเป็น)' : 'อัพโหลดรูปภาพ'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="input-valentine file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-[#E63946] hover:file:bg-pink-100"
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

        {type === 'image' && (
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

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            ยกเลิก
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={uploading}
          >
            {uploading ? 'กำลังอัพโหลด...' : isEditing ? 'บันทึก' : 'เพิ่ม'}
          </button>
        </div>
      </form>
    </div>
  );
}
