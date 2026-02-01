'use client';

import { useState } from 'react';
import { NodeType, MemoryNode } from '@/types/memory';
import { generateId } from '@/lib/storage';
import { uploadImage } from '@/lib/upload';
import { Lock, MessageCircleHeart, Camera, ImagePlus, Music, LucideIcon } from 'lucide-react';

interface NodeEditorProps {
  onAdd: (node: MemoryNode) => void;
  onCancel: () => void;
  initialType?: NodeType;
}

const nodeTypeLabels: Record<NodeType, string> = {
  password: 'รหัส PIN',
  text: 'ข้อความ',
  image: 'รูปภาพ',
  'text-image': 'ข้อความ + รูปภาพ',
  youtube: 'วิดีโอ YouTube',
};

const nodeTypeDescriptions: Record<NodeType, string> = {
  password: 'เพิ่มรหัส PIN 4 หลักเพื่อปกป้องเนื้อหา',
  text: 'เพิ่มข้อความจากใจ',
  image: 'เพิ่มรูปภาพพิเศษ',
  'text-image': 'รวมข้อความกับรูปภาพ',
  youtube: 'เพิ่มเพลงหรือวิดีโอที่มีความหมาย',
};

const nodeTypeIcons: Record<NodeType, LucideIcon> = {
  password: Lock,
  text: MessageCircleHeart,
  image: Camera,
  'text-image': ImagePlus,
  youtube: Music,
};

export default function NodeEditor({ onAdd, onCancel, initialType }: NodeEditorProps) {
  const [type, setType] = useState<NodeType>(initialType || 'text');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [caption, setCaption] = useState('');
  const [password, setPassword] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
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

    const baseNode = {
      id: generateId(),
      priority: 0,
      title: title.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    let node: MemoryNode;
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
        if (password.length !== 4 || !/^\d{4}$/.test(password)) {
          alert('กรุณาใส่รหัส PIN 4 หลัก');
          return;
        }
        node = { ...baseNode, type: 'password', content: { password: password } };
        break;
      case 'text':
        if (!text.trim()) return;
        node = { ...baseNode, type: 'text', content: { text: text.trim() } };
        break;
      case 'image':
        if (!uploadedImageUrl.trim()) return;
        node = {
          ...baseNode,
          type: 'image',
          content: { imageUrl: uploadedImageUrl.trim(), caption: caption.trim() || undefined },
        };
        break;
      case 'text-image':
        if (!text.trim() || !uploadedImageUrl.trim()) return;
        node = {
          ...baseNode,
          type: 'text-image',
          content: { text: text.trim(), imageUrl: uploadedImageUrl.trim() },
        };
        break;
      case 'youtube':
        if (!youtubeUrl.trim()) return;
        node = { ...baseNode, type: 'youtube', content: { youtubeUrl: youtubeUrl.trim() } };
        break;
      default:
        return;
    }

    onAdd(node);
  };

  return (
    <div className="memory-card p-6">
      <h3 className="font-kanit text-xl font-bold text-[#E63946] mb-4">เพิ่มโหนดความทรงจำใหม่</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Node Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ประเภทความทรงจำ
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(nodeTypeLabels) as NodeType[]).map((t) => {
              const IconComponent = nodeTypeIcons[t];
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
                    <span className="font-medium text-sm">{nodeTypeLabels[t]}</span>
                  </div>
                  <span className="block text-xs text-gray-500">
                    {nodeTypeDescriptions[t]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Node Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อโหนด (ไม่จำเป็น)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ตั้งชื่อให้จดจำง่าย เช่น 'วันแรกที่เจอกัน'"
            className="input-valentine"
          />
          <p className="text-xs text-gray-500 mt-1">
            ชื่อนี้จะแสดงแทนประเภทโหนดในรายการ
          </p>
        </div>

        {/* Dynamic Fields based on type */}
        {type === 'password' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รหัส PIN (4 หลัก)
            </label>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={password[index] || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length <= 1) {
                      const newPin = password.split('');
                      newPin[index] = val;
                      setPassword(newPin.join(''));
                      // Auto-focus next input
                      if (val && index < 3) {
                        const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                        nextInput?.focus();
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle backspace to go to previous input
                    if (e.key === 'Backspace' && !password[index] && index > 0) {
                      const prevInput = (e.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
                      prevInput?.focus();
                    }
                  }}
                  className="w-14 h-14 text-center text-2xl font-bold input-valentine"
                  required={index === 0}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              ใส่ตัวเลข 4 หลักเพื่อปกป้องเนื้อหาถัดไป
            </p>
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
              อัพโหลดรูปภาพ
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="input-valentine file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-[#E63946] hover:file:bg-pink-100"
              required={!imageUrl}
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
            {uploading ? 'กำลังอัพโหลด...' : 'เพิ่ม'}
          </button>
        </div>
      </form>
    </div>
  );
}
