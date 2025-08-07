import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types that match our Supabase schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          location: string
          user_type: 'user' | 'provider'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          location: string
          user_type?: 'user' | 'provider'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          location?: string
          user_type?: 'user' | 'provider'
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category: string
          image_url: string | null
          provider_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category: string
          image_url?: string | null
          provider_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          category?: string
          image_url?: string | null
          provider_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      provider_profiles: {
        Row: {
          id: string
          user_id: string
          specialty: string
          rating: number
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialty: string
          rating?: number
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialty?: string
          rating?: number
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      carts: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          service_id: string
          provider_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          service_id: string
          provider_id: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          service_id?: string
          provider_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      service_requests: {
        Row: {
          id: string
          user_id: string
          provider_id: string
          service_id: string
          status: 'pending' | 'accepted' | 'declined' | 'completed'
          request_date: string
          scheduled_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider_id: string
          service_id: string
          status?: 'pending' | 'accepted' | 'declined' | 'completed'
          request_date?: string
          scheduled_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider_id?: string
          service_id?: string
          status?: 'pending' | 'accepted' | 'declined' | 'completed'
          request_date?: string
          scheduled_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 