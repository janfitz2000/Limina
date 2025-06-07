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
      merchants: {
        Row: {
          id: string
          created_at: string
          shopify_domain: string
          shopify_access_token: string
          name: string
          email: string
        }
        Insert: {
          id?: string
          created_at?: string
          shopify_domain: string
          shopify_access_token: string
          name: string
          email: string
        }
        Update: {
          id?: string
          created_at?: string
          shopify_domain?: string
          shopify_access_token?: string
          name?: string
          email?: string
        }
      }
      products: {
        Row: {
          id: string
          created_at: string
          merchant_id: string
          shopify_product_id: string
          title: string
          price: number
          currency: string
        }
        Insert: {
          id?: string
          created_at?: string
          merchant_id: string
          shopify_product_id: string
          title: string
          price: number
          currency: string
        }
        Update: {
          id?: string
          created_at?: string
          merchant_id?: string
          shopify_product_id?: string
          title?: string
          price?: number
          currency?: string
        }
      }
      buy_orders: {
        Row: {
          id: string
          created_at: string
          merchant_id: string
          product_id: string
          customer_email: string
          price: number
          currency: string
          status: 'pending' | 'accepted' | 'fulfilled' | 'cancelled'
          condition_type: 'price' | 'inventory' | 'date'
          condition_value: Json
          expires_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          merchant_id: string
          product_id: string
          customer_email: string
          price: number
          currency: string
          status?: 'pending' | 'accepted' | 'fulfilled' | 'cancelled'
          condition_type: 'price' | 'inventory' | 'date'
          condition_value: Json
          expires_at: string
        }
        Update: {
          id?: string
          created_at?: string
          merchant_id?: string
          product_id?: string
          customer_email?: string
          price?: number
          currency?: string
          status?: 'pending' | 'accepted' | 'fulfilled' | 'cancelled'
          condition_type?: 'price' | 'inventory' | 'date'
          condition_value?: Json
          expires_at?: string
        }
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
  }
} 