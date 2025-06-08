import { NextRequest, NextResponse } from 'next/server'
import { 
  getBuyOrders, 
  createBuyOrder, 
  getMerchantStats,
  getCustomerStats,
  updateBuyOrderStatus 
} from '@/lib/database'

// GET /api/buy-orders?merchantId=xxx or customerId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const customerId = searchParams.get('customerId')
    const getStats = searchParams.get('stats') === 'true'

    if (!merchantId && !customerId) {
      return NextResponse.json(
        { error: 'Either merchantId or customerId is required' },
        { status: 400 }
      )
    }

    if (getStats) {
      if (merchantId) {
        const { data, error } = await getMerchantStats(merchantId)
        if (error) {
          return NextResponse.json(
            { error: 'Failed to fetch merchant statistics' },
            { status: 500 }
          )
        }
        return NextResponse.json({ stats: data })
      } else if (customerId) {
        const { data, error } = await getCustomerStats(customerId)
        if (error) {
          return NextResponse.json(
            { error: 'Failed to fetch customer statistics' },
            { status: 500 }
          )
        }
        return NextResponse.json({ stats: data })
      }
    } else {
      const { data, error } = await getBuyOrders(merchantId || undefined, customerId || undefined)
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch buy orders' },
          { status: 500 }
        )
      }
      return NextResponse.json({ buy_orders: data })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/buy-orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['merchantId', 'productId', 'customerEmail', 'targetPrice', 'currentPrice', 'expiryDays']
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    const { data, error } = await createBuyOrder({
      merchantId: body.merchantId,
      productId: body.productId,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      targetPrice: parseFloat(body.targetPrice),
      currentPrice: parseFloat(body.currentPrice),
      expiryDays: parseInt(body.expiryDays),
      conditionValue: body.conditionValue || {}
    })
    
    if (error) {
      console.error('Create buy order error:', error)
      return NextResponse.json(
        { error: 'Failed to create buy order', details: (error as Error).message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { buyOrder: data, message: 'Buy order created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/buy-orders
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields: id and status' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'monitoring', 'fulfilled', 'cancelled', 'expired']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      )
    }

    const { data, error } = await updateBuyOrderStatus(body.id, body.status)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update buy order status' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { buyOrder: data, message: 'Buy order status updated successfully' }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
