'use client';

import { useState } from 'react';
import { NodeType, MemoryNode } from '@/types/memory';
import { generateId } from '@/lib/storage';

interface NodeEditorProps {
  onAdd: (node: MemoryNode) => void;
  onCancel: () => void;
  initialType?: NodeType;
}

const nodeTypeLabels: Record<NodeType, string> = {
  password: 'Password Gate',
  text: 'Text Message',
  image: 'Image',
  'text-image': 'Text + Image',
  youtube: 'YouTube Video',
};

const nodeTypeDescriptions: Record<NodeType, string> = {
  password: 'Add a password to protect following content',
  text: 'Add a heartfelt message',
  image: 'Add a special photo',
  'text-image': 'Combine text with an image',
  youtube: 'Add a meaningful song or video',
};

export default function NodeEditor({ onAdd, onCancel, initialType }: NodeEditorProps) {
  const [type, setType] = useState<NodeType>(initialType || 'text');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [password, setPassword] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const baseNode = {
      id: generateId(),
      priority: 0,
      createdAt: new Date().toISOString(),
    };

    let node: MemoryNode;

    switch (type) {
      case 'password':
        if (!password.trim()) return;
        node = { ...baseNode, type: 'password', content: { password: password.trim() } };
        break;
      case 'text':
        if (!text.trim()) return;
        node = { ...baseNode, type: 'text', content: { text: text.trim() } };
        break;
      case 'image':
        if (!imageUrl.trim()) return;
        node = {
          ...baseNode,
          type: 'image',
          content: { imageUrl: imageUrl.trim(), caption: caption.trim() || undefined },
        };
        break;
      case 'text-image':
        if (!text.trim() || !imageUrl.trim()) return;
        node = {
          ...baseNode,
          type: 'text-image',
          content: { text: text.trim(), imageUrl: imageUrl.trim() },
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
      <h3 className="text-xl font-bold text-[#E63946] mb-4">Add New Memory Node</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Node Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type of Memory
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(nodeTypeLabels) as NodeType[]).map((t) => (
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
                <span className="block font-medium text-sm">{nodeTypeLabels[t]}</span>
                <span className="block text-xs text-gray-500 mt-1">
                  {nodeTypeDescriptions[t]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Fields based on type */}
        {type === 'password' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a memorable password..."
              className="input-valentine"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will protect all following content until entered correctly
            </p>
          </div>
        )}

        {(type === 'text' || type === 'text-image') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write something from your heart..."
              className="input-valentine min-h-[120px] resize-y"
              required
            />
          </div>
        )}

        {(type === 'image' || type === 'text-image') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="input-valentine"
              required
            />
            {imageUrl && (
              <div className="mt-2 p-2 border rounded-lg bg-gray-50">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-h-40 mx-auto rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {type === 'image' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a sweet caption..."
              className="input-valentine"
            />
          </div>
        )}

        {type === 'youtube' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube URL
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
              Paste a YouTube link to share a meaningful song or video
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Add Node
          </button>
        </div>
      </form>
    </div>
  );
}
