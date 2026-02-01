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
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      nodes: {
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
            foreignKeyName: "nodes_memory_id_fkey"
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
