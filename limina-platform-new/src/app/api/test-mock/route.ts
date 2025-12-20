import { NextRequest, NextResponse } from 'next/server'
import { getMockBuyOrders, getMockCustomerStats, getMockMerchantStats } from '@/lib/database-mock'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'buy-orders'
    const merchantId = searchParams.get('merchantId')
    const customerId = searchParams.get('customerId')

    switch (type) {
      case 'buy-orders':
        const orders = await getMockBuyOrders(merchantId || undefined, customerId || undefined)
        return NextResponse.json({ success: true, data: orders.data })
      
      case 'customer-stats':
        if (!customerId) {
          return NextResponse.json({ error: 'customerId required for stats' }, { status: 400 })
        }
        const customerStats = await getMockCustomerStats(customerId)
        return NextResponse.json({ success: true, data: customerStats.data })
      
      case 'merchant-stats':
        if (!merchantId) {
          return NextResponse.json({ error: 'merchantId required for stats' }, { status: 400 })
        }
        const merchantStats = await getMockMerchantStats(merchantId)
        return NextResponse.json({ success: true, data: merchantStats.data })
      
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Test mock API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}