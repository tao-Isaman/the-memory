export interface CartoonGeneration {
  id: string;
  userId: string;
  originalImageUrl: string | null;
  cartoonImageUrl: string | null;
  creditsUsed: number;
  prompt: string | null;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}
