import { createClient } from '@/lib/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params
    const db = createClient()

    // Fetch merchant data
    const [orders, products, payments, recentActivity] = await Promise.all([
      db.from('buy_orders')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false }),
      
      db.from('products')
        .select('*')
        .eq('merchant_id', merchantId),
        
      db.from('escrow_payments')
        .select('*')
        .eq('merchant_id', merchantId),
        
      db.from('buy_orders')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Calculate analytics
    const analytics = {
      overview: {
        totalOrders: orders.data?.length || 0,
        activeOrders: orders.data?.filter((o: { status: string }) => o.status === 'monitoring').length || 0,
        fulfilledOrders: orders.data?.filter((o: { status: string }) => o.status === 'fulfilled').length || 0,
        totalRevenue: payments.data?.filter((p: { status: string }) => p.status === 'released')
          .reduce((sum: number, p: { merchant_amount: number }) => sum + p.merchant_amount, 0) || 0,
        averageOrderValue: orders.data?.length ? 
          orders.data.reduce((sum: number, o: { target_price: number }) => sum + o.target_price, 0) / orders.data.length : 0,
        conversionRate: orders.data?.length ? 
          (orders.data.filter((o: { status: string }) => o.status === 'fulfilled').length / orders.data.length) * 100 : 0
      },
      demandByPrice: products.data?.map((product: { id: string; title: string; current_price: number }) => {
        const productOrders = orders.data?.filter((o: { product_id: string }) => o.product_id === product.id) || []
        const demandByPricePoint: Record<number, number> = {}
        productOrders.forEach((order: { target_price: number }) => {
          const pricePoint = Math.round(order.target_price / 50) * 50 // Round to nearest £50
          demandByPricePoint[pricePoint] = (demandByPricePoint[pricePoint] || 0) + 1
        })
        return {
          productId: product.id,
          title: product.title,
          currentPrice: product.current_price,
          demandByPrice: Object.entries(demandByPricePoint).map(([price, count]) => ({
            price: parseInt(price),
            orders: count as number,
            revenue: parseInt(price) * (count as number)
          }))
        }
      }),
      recentActivity: recentActivity.data,
      trends: {
        daily: [],
        weekly: [],
        monthly: []
      }
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}