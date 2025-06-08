import { NextRequest, NextResponse } from 'next/server'
import { getMerchantStats } from '@/lib/database'

// GET /api/merchants/[id]/stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchantId = params.id

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await getMerchantStats(merchantId)
    
    if (error) {
      console.error('Merchant stats error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch merchant statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stats: data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
