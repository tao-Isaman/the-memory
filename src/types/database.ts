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
