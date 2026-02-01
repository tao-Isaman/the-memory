export type NodeType = 'password' | 'image' | 'text' | 'text-image' | 'youtube';

export interface BaseNode {
  id: string;
  type: NodeType;
  priority: number;
  title?: string;
  createdAt: string;
}

export interface PasswordNode extends BaseNode {
  type: 'password';
  content: { password: string };
}

export interface ImageNode extends BaseNode {
  type: 'image';
  content: { imageUrl: string; caption?: string };
}

export interface TextNode extends BaseNode {
  type: 'text';
  content: { text: string };
}

export interface TextImageNode extends BaseNode {
  type: 'text-image';
  content: { text: string; imageUrl: string };
}

export interface YouTubeNode extends BaseNode {
  type: 'youtube';
  content: { youtubeUrl: string };
}

export type MemoryNode = PasswordNode | ImageNode | TextNode | TextImageNode | YouTubeNode;

export interface Memory {
  id: string;
  title: string;
  nodes: MemoryNode[];
  createdAt: string;
  updatedAt: string;
}
