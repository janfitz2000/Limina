export interface Product {
  id: string
  title: string
  current_price: number
  price: number
  currency: string
  image_url?: string
}

export interface BuyOrder {
  id: string
  customer_name: string
  customer_email: string
  target_price: number
  current_price: number
  status: string
  created_at: string
  expires_at: string
  products?: Product
}

export interface Stats {
  total: number
  monitoring: number
  fulfilled: number
  pending: number
  cancelled: number
  totalRevenue: number
  avgDiscount: number
  conversionRate: number
}
