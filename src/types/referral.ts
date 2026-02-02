export interface UserReferral {
  id: string;
  userId: string;
  referralCode: string;
  referredBy: string | null;
  paidReferralCount: number;
  pendingDiscountClaims: number;
  totalDiscountsClaimed: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralConversion {
  id: string;
  referrerId: string;
  referredId: string;
  memoryId: string;
  convertedAt: string;
  discountClaimed: boolean;
  claimedAt: string | null;
}

export interface ReferralStats {
  totalSignups: number;
  totalPaidConversions: number;
  pendingDiscounts: number;
  claimedDiscounts: number;
}

export interface ReferralStatusResponse {
  hasReferral: boolean;
  referralCode: string | null;
  referralLink: string | null;
  stats: ReferralStats;
}

export interface ReferralSetupResponse {
  success: boolean;
  userReferralCode: string;
  referredBy: string | null;
  error?: string;
}

export interface ReferralValidateResponse {
  valid: boolean;
  error?: string;
}

export type PaymentMethod = 'promptpay' | 'bank_transfer';
export type ClaimStatus = 'pending' | 'completed' | 'rejected';

export interface ReferralClaim {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentInfo: string;
  bankName: string | null;
  accountName: string | null;
  status: ClaimStatus;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface ClaimRequest {
  paymentMethod: PaymentMethod;
  paymentInfo: string;
  bankName?: string;
  accountName?: string;
}

export interface ClaimDiscountResponse {
  success: boolean;
  claim?: ReferralClaim;
  remainingClaims: number;
  error?: string;
}
