export interface UserProfile {
  id: string;
  userId: string;
  phone: string | null;
  birthday: string | null;
  gender: 'male' | 'female' | 'other' | null;
  job: string | null;
  relationshipStatus: 'single' | 'dating' | 'married' | 'other' | null;
  occasionType: 'valentine' | 'anniversary' | 'birthday' | 'other' | null;
  profileCreditsClaimed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Gender = 'male' | 'female' | 'other';
export type RelationshipStatus = 'single' | 'dating' | 'married' | 'other';
export type OccasionType = 'valentine' | 'anniversary' | 'birthday' | 'other';
