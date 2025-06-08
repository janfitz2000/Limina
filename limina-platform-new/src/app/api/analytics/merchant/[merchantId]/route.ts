import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Authentication required')

    // Verify merchant ownership
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', params.merchantId)
      .eq('user_id', user.id)
      .single()
    if (merchantError || !merchant) throw new Error('Unauthorized')

    // Get comprehensive analytics
    const [
      { data: orders },
      { data: products },
      { data: payments },
      { data: recentActivity }
    ] = await Promise.all([
      // Buy orders analytics
      supabase
        .from('buy_orders')
        .select(`
          *,
          products!inner(title, current_price, price)
        `)
        .eq('merchant_id', params.merchantId),
      // Products with demand data
      supabase
        .from('products')
        .select(`
          *,
          buy_orders(count)
        `)
        .eq('merchant_id', params.merchantId),
      // Payment analytics
      supabase
        .from('escrow_payments')
        .select(`
          *,
          buy_orders!inner(merchant_id)
        `)
        .eq('buy_orders.merchant_id', params.merchantId),
      // Recent activity
      supabase
        .from('buy_orders')
        .select(`
          id,
          status,
          target_price,
          created_at,
          fulfilled_at,
          products!inner(title),
          customers!inner(name, email)
        `)
        .eq('merchant_id', params.merchantId)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Calculate analytics
    const analytics = {
      overview: {
        totalOrders: orders?.length || 0,
        activeOrders: orders?.filter((o: any) => o.status === 'monitoring').length || 0,
        fulfilledOrders: orders?.filter((o: any) => o.status === 'fulfilled').length || 0,
        totalRevenue: payments?.filter((p: any) => p.status === 'released')
          .reduce((sum: number, p: any) => sum + p.merchant_amount, 0) || 0,
        averageOrderValue: orders?.length ? 
          orders.reduce((sum: number, o: any) => sum + o.target_price, 0) / orders.length : 0,
        conversionRate: orders?.length ? 
          (orders.filter((o: any) => o.status === 'fulfilled').length / orders.length) * 100 : 0
      },
      demandByPrice: products?.map((product: any) => {
        const productOrders = orders?.filter((o: any) => o.product_id === product.id) || []
        const demandByPricePoint: Record<number, number> = {}
        productOrders.forEach((order: any) => {
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
      recentActivity,
      trends: {
        daily: [],
        weekly: [],
        monthly: []
      }
    }

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Analytics error:', errMsg)
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}
