'use client';

import { MemoryNode, NodeType } from '@/types/memory';
import HeartIcon from './HeartIcon';
import { Lock, MessageCircleHeart, Camera, ImagePlus, Music, LucideIcon, ChevronUp, ChevronDown, X } from 'lucide-react';

interface NodeListProps {
  nodes: MemoryNode[];
  onReorder: (nodes: MemoryNode[]) => void;
  onDelete: (id: string) => void;
}

const nodeTypeIcons: Record<NodeType, LucideIcon> = {
  password: Lock,
  text: MessageCircleHeart,
  image: Camera,
  'text-image': ImagePlus,
  youtube: Music,
};

const nodeTypeLabels: Record<NodeType, string> = {
  password: 'ใส่รหัสผ่าน',
  text: 'ข้อความ',
  image: 'รูปภาพ',
  'text-image': 'ข้อความ + รูปภาพ',
  youtube: 'วิดีโอ YouTube',
};

function getNodePreview(node: MemoryNode): string {
  switch (node.type) {
    case 'password':
      return '••••••••';
    case 'text':
      return node.content.text.substring(0, 50) + (node.content.text.length > 50 ? '...' : '');
    case 'image':
      return node.content.caption || 'รูปภาพ';
    case 'text-image':
      return node.content.text.substring(0, 50) + (node.content.text.length > 50 ? '...' : '');
    case 'youtube':
      return 'วิดีโอ YouTube';
    default:
      return '';
  }
}

export default function NodeList({ nodes, onReorder, onDelete }: NodeListProps) {
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newNodes = [...nodes];
    [newNodes[index - 1], newNodes[index]] = [newNodes[index], newNodes[index - 1]];
    // Update priorities
    newNodes.forEach((node, i) => {
      node.priority = i;
    });
    onReorder(newNodes);
  };

  const moveDown = (index: number) => {
    if (index === nodes.length - 1) return;
    const newNodes = [...nodes];
    [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
    // Update priorities
    newNodes.forEach((node, i) => {
      node.priority = i;
    });
    onReorder(newNodes);
  };

  if (nodes.length === 0) {
    return (
      <div className="memory-card p-8 text-center">
        <HeartIcon size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-gray-500">ยังไม่มีเรื่องราวความทรงจำ</p>
        <p className="text-sm text-gray-400 mt-1">
          เพิ่มเรื่องราวแรกเพื่อเริ่มสร้างความทรงจำของคุณ!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {nodes.map((node, index) => (
        <div
          key={node.id}
          className="memory-card p-4 flex items-center gap-4"
        >
          {/* Priority Number */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#E63946] text-white flex items-center justify-center font-bold text-sm">
            {index + 1}
          </div>

          {/* Node Icon */}
          <div className="flex-shrink-0">
            {(() => {
              const IconComponent = nodeTypeIcons[node.type];
              return <IconComponent size={24} className="text-[#E63946]" />;
            })()}
          </div>

          {/* Node Info */}
          <div className="flex-grow min-w-0">
            <p className="font-kanit font-medium text-[#E63946] text-sm">
              {node.title || nodeTypeLabels[node.type]}
            </p>
            <p className="text-gray-600 text-sm truncate">
              {node.title ? `${nodeTypeLabels[node.type]} • ${getNodePreview(node)}` : getNodePreview(node)}
            </p>
          </div>

          {/* Reorder Buttons */}
          <div className="flex-shrink-0 flex flex-col gap-1">
            <button
              onClick={() => moveUp(index)}
              disabled={index === 0}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                index === 0
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-pink-100 text-[#E63946] hover:bg-pink-200'
              }`}
              title="เลื่อนขึ้น"
            >
              <ChevronUp size={18} />
            </button>
            <button
              onClick={() => moveDown(index)}
              disabled={index === nodes.length - 1}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                index === nodes.length - 1
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-pink-100 text-[#E63946] hover:bg-pink-200'
              }`}
              title="เลื่อนลง"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(node.id)}
            className="flex-shrink-0 w-8 h-8 rounded bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition-colors"
            title="ลบเรื่องราว"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
