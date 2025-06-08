import { NextRequest, NextResponse } from 'next/server'
import { getProducts, createProduct, updateProductPrice } from '@/lib/database'

// GET /api/products?merchantId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await getProducts(merchantId)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    return NextResponse.json({ products: data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['merchant_id', 'title', 'price', 'current_price']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    const productData = {
      merchant_id: body.merchant_id,
      title: body.title,
      description: body.description || '',
      price: parseFloat(body.price),
      current_price: parseFloat(body.current_price),
      currency: body.currency || 'GBP',
      image_url: body.image_url,
      shopify_product_id: body.shopify_product_id
    }

    const { data, error } = await createProduct(productData)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { product: data, message: 'Product created successfully' },
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

// PUT /api/products (for price updates)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.productId || !body.newPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: productId and newPrice' },
        { status: 400 }
      )
    }

    const newPrice = parseFloat(body.newPrice)
    if (isNaN(newPrice) || newPrice <= 0) {
      return NextResponse.json(
        { error: 'Invalid price value' },
        { status: 400 }
      )
    }

    const { data, error } = await updateProductPrice(body.productId, newPrice)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update product price' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { product: data, message: 'Product price updated successfully' }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
