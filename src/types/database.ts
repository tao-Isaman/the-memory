export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      memories: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          paid_at: string | null
          theme: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          paid_at?: string | null
          theme?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          paid_at?: string | null
          theme?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          id: string
          memory_id: string
          type: string
          priority: number
          title: string | null
          content: Json
          created_at: string
        }
        Insert: {
          id?: string
          memory_id: string
          type: string
          priority: number
          title?: string | null
          content?: Json
          created_at?: string
        }
        Update: {
          id?: string
          memory_id?: string
          type?: string
          priority?: number
          title?: string | null
          content?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_memory_id_fkey"
            columns: ["memory_id"]
            referencedRelation: "memories"
            referencedColumns: ["id"]
          }
        ]
      }
      user_referrals: {
        Row: {
          id: string
          user_id: string
          referral_code: string
          referred_by: string | null
          has_used_referral_discount: boolean
          paid_referral_count: number
          pending_discount_claims: number
          total_discounts_claimed: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          referral_code: string
          referred_by?: string | null
          has_used_referral_discount?: boolean
          paid_referral_count?: number
          pending_discount_claims?: number
          total_discounts_claimed?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          referral_code?: string
          referred_by?: string | null
          has_used_referral_discount?: boolean
          paid_referral_count?: number
          pending_discount_claims?: number
          total_discounts_claimed?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_referrals_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_referrals_referred_by_fkey"
            columns: ["referred_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      referral_conversions: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          memory_id: string
          converted_at: string
          discount_claimed: boolean
          claimed_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          memory_id: string
          converted_at?: string
          discount_claimed?: boolean
          claimed_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          memory_id?: string
          converted_at?: string
          discount_claimed?: boolean
          claimed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_referrer_id_fkey"
            columns: ["referrer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_referred_id_fkey"
            columns: ["referred_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_conversions_memory_id_fkey"
            columns: ["memory_id"]
            referencedRelation: "memories"
            referencedColumns: ["id"]
          }
        ]
      }
      credit_packages: {
        Row: {
          id: string
          name: string
          credits: number
          price_thb: number
          price_satang: number
          discount_percent: number
          is_popular: boolean
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          credits: number
          price_thb: number
          price_satang: number
          discount_percent?: number
          is_popular?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          credits?: number
          price_thb?: number
          price_satang?: number
          discount_percent?: number
          is_popular?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          balance: number
          total_purchased: number
          total_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          total_purchased?: number
          total_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          total_purchased?: number
          total_used?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          balance_after: number
          package_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          memory_id: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          amount: number
          balance_after: number
          package_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          memory_id?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          amount?: number
          balance_after?: number
          package_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          memory_id?: string | null
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_package_id_fkey"
            columns: ["package_id"]
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_memory_id_fkey"
            columns: ["memory_id"]
            referencedRelation: "memories"
            referencedColumns: ["id"]
          }
        ]
      }
      cartoon_generations: {
        Row: {
          id: string
          user_id: string
          original_image_url: string | null
          cartoon_image_url: string | null
          credits_used: number
          prompt: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_image_url?: string | null
          cartoon_image_url?: string | null
          credits_used?: number
          prompt?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_image_url?: string | null
          cartoon_image_url?: string | null
          credits_used?: number
          prompt?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartoon_generations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      referral_claims: {
        Row: {
          id: string
          user_id: string
          user_email: string
          amount: number
          payment_method: string
          payment_info: string
          bank_name: string | null
          account_name: string | null
          status: string
          admin_note: string | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          amount?: number
          payment_method: string
          payment_info: string
          bank_name?: string | null
          account_name?: string | null
          status?: string
          admin_note?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          amount?: number
          payment_method?: string
          payment_info?: string
          bank_name?: string | null
          account_name?: string | null
          status?: string
          admin_note?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_claims_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
