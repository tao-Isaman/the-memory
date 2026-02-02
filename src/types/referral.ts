export interface UserReferral {
  id: string;
  userId: string;
  referralCode: string;
  referredBy: string | null;
  freeMemoryUsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralStatus {
  referralCode: string;
  hasFreeMemory: boolean;
  freeMemoryUsed: boolean;
  referralCount: number;
}

export interface ReferralSetupResponse {
  success: boolean;
  userReferralCode: string;
  hasFreeMemory: boolean;
  referredBy: string | null;
  error?: string;
}

export interface ReferralValidateResponse {
  valid: boolean;
  error?: string;
}

export interface UseFreeMemoryResponse {
  success: boolean;
  memoryId: string;
  status: string;
  error?: string;
}
