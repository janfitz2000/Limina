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
          name: string
          email: string
          shopify_domain: string | null
          shopify_access_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          shopify_domain?: string | null
          shopify_access_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          shopify_domain?: string | null
          shopify_access_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          merchant_id: string
          shopify_product_id: string | null
          title: string
          description: string | null
          price: number
          current_price: number
          currency: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          shopify_product_id?: string | null
          title: string
          description?: string | null
          price: number
          current_price: number
          currency?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          shopify_product_id?: string | null
          title?: string
          description?: string | null
          price?: number
          current_price?: number
          currency?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      buy_orders: {
        Row: {
          id: string
          merchant_id: string
          product_id: string
          customer_id: string
          customer_email: string
          customer_name: string | null
          target_price: number
          current_price: number
          currency: string
          status: 'pending' | 'monitoring' | 'fulfilled' | 'cancelled' | 'expired'
          condition_type: 'price' | 'inventory' | 'date'
          condition_value: Json
          expires_at: string
          fulfilled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          product_id: string
          customer_id: string
          customer_email: string
          customer_name?: string | null
          target_price: number
          current_price: number
          currency?: string
          status?: 'pending' | 'monitoring' | 'fulfilled' | 'cancelled' | 'expired'
          condition_type?: 'price' | 'inventory' | 'date'
          condition_value?: Json
          expires_at: string
          fulfilled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          product_id?: string
          customer_id?: string
          customer_email?: string
          customer_name?: string | null
          target_price?: number
          current_price?: number
          currency?: string
          status?: 'pending' | 'monitoring' | 'fulfilled' | 'cancelled' | 'expired'
          condition_type?: 'price' | 'inventory' | 'date'
          condition_value?: Json
          expires_at?: string
          fulfilled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      price_history: {
        Row: {
          id: string
          product_id: string
          price: number
          currency: string
          recorded_at: string
        }
        Insert: {
          id?: string
          product_id: string
          price: number
          currency?: string
          recorded_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          price?: number
          currency?: string
          recorded_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          user_type: 'merchant' | 'customer'
          buy_order_id: string | null
          title: string
          message: string
          type: 'price_alert' | 'order_fulfilled' | 'order_expired' | 'new_order'
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_type: 'merchant' | 'customer'
          buy_order_id?: string | null
          title: string
          message: string
          type: 'price_alert' | 'order_fulfilled' | 'order_expired' | 'new_order'
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_type?: 'merchant' | 'customer'
          buy_order_id?: string | null
          title?: string
          message?: string
          type?: 'price_alert' | 'order_fulfilled' | 'order_expired' | 'new_order'
          read_at?: string | null
          created_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
