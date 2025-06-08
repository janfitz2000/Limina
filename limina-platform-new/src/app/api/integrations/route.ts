import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Use service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { searchParams } = new URL(req.url)
    const merchantId = searchParams.get('merchantId')
    const platform = searchParams.get('platform')

    if (!merchantId) {
      throw new Error('Merchant ID is required')
    }

    let query = supabase
      .from('integrations')
      .select('*')
      .eq('merchant_id', merchantId)

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: integrations, error } = await query

    if (error) throw error

    // If requesting a specific platform, return single integration
    if (platform) {
      const integration = integrations?.[0] || null
      return NextResponse.json({
        success: true,
        integration
      })
    }

    return NextResponse.json({
      success: true,
      integrations: integrations || []
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Get integrations error:', error)
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}