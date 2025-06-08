import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Create a new merchant discount
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      productId,
      discountPrice,
      targetBuyOrderIds,
      targetCustomerEmails,
      maxUses,
      expiryHours
    } = await req.json()

    // Get current user and verify merchant ownership
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Authentication required')

    // Get merchant ID
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (merchantError || !merchant) throw new Error('Merchant not found')

    // Verify merchant owns this product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, current_price')
      .eq('id', productId)
      .eq('merchant_id', merchant.id)
      .single()

    if (productError || !product) throw new Error('Product not found')

    // Validate discount price is less than current price
    if (discountPrice >= product.current_price) {
      throw new Error('Discount price must be less than current price')
    }

    // Calculate expiry date
    let expiresAt = null
    if (expiryHours && expiryHours > 0) {
      const expiry = new Date()
      expiry.setHours(expiry.getHours() + expiryHours)
      expiresAt = expiry.toISOString()
    }

    // Create the discount
    const { data: discount, error: discountError } = await supabase
      .from('merchant_discounts')
      .insert({
        merchant_id: merchant.id,
        product_id: productId,
        discount_price: discountPrice,
        target_buy_order_ids: targetBuyOrderIds || null,
        target_customer_emails: targetCustomerEmails || null,
        max_uses: maxUses || null,
        expires_at: expiresAt
      })
      .select()
      .single()

    if (discountError) throw discountError

    // Immediately check for fulfillment
    const { data: fulfillmentResults, error: fulfillmentError } = await supabase
      .rpc('check_discount_fulfillment', { discount_id: discount.id })

    if (fulfillmentError) {
      console.error('Fulfillment check error:', fulfillmentError)
    }

    return NextResponse.json({
      success: true,
      discount,
      fulfillmentResults: fulfillmentResults || []
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Create discount error:', error)
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}

// Get merchant discounts
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    // Get current user and verify merchant ownership
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Authentication required')

    // Get merchant ID
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (merchantError || !merchant) throw new Error('Merchant not found')

    // Build query
    let query = supabase
      .from('merchant_discounts')
      .select(`
        *,
        products (
          id,
          title,
          current_price,
          currency
        )
      `)
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data: discounts, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      discounts: discounts || []
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Get discounts error:', error)
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}