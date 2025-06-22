import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Activate/fulfill a specific discount
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const discountId = (await params).id

    // Get current user and verify merchant ownership
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Authentication required')

    // Verify merchant owns this discount
    const { data: discount, error: discountError } = await supabase
      .from('merchant_discounts')
      .select(`
        *,
        merchants!inner(user_id)
      `)
      .eq('id', discountId)
      .single()

    if (discountError || !discount) throw new Error('Discount not found')
    if (discount.merchants.user_id !== user.id) throw new Error('Unauthorized')

    // Trigger fulfillment check
    const { data: fulfillmentResults, error: fulfillmentError } = await supabase
      .rpc('check_discount_fulfillment', { discount_id: discountId })

    if (fulfillmentError) throw fulfillmentError

    return NextResponse.json({
      success: true,
      fulfillmentResults: fulfillmentResults || []
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Activate discount error:', error)
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}

// Cancel a discount
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const discountId = (await params).id

    // Get current user and verify merchant ownership
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Authentication required')

    // Verify merchant owns this discount
    const { data: discount, error: discountError } = await supabase
      .from('merchant_discounts')
      .select(`
        *,
        merchants!inner(user_id)
      `)
      .eq('id', discountId)
      .single()

    if (discountError || !discount) throw new Error('Discount not found')
    if (discount.merchants.user_id !== user.id) throw new Error('Unauthorized')

    // Cancel the discount
    const { error: updateError } = await supabase
      .from('merchant_discounts')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', discountId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: 'Discount cancelled successfully'
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Cancel discount error:', error)
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}