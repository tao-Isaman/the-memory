export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceTHB: number;
  priceSatang: number;
  discountPercent: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserCredits {
  id: string;
  userId: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  createdAt: string;
  updatedAt: string;
}

export type CreditTransactionType = 'purchase' | 'use' | 'refund';

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  packageId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  memoryId: string | null;
  description: string | null;
  createdAt: string;
}
