import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type } = body
    
    // Simple test authentication - always succeeds
    const testUser = {
      id: type === 'merchant' ? '550e8400-e29b-41d4-a716-446655440000' : '550e8400-e29b-41d4-a716-446655440001',
      email: email || (type === 'merchant' ? 'test@testmerchant.com' : 'customer@example.com'),
      name: type === 'merchant' ? 'Test Merchant' : 'Test Customer',
      type: type || 'customer'
    }
    
    return NextResponse.json({
      success: true,
      user: testUser,
      token: 'test-jwt-token',
      message: 'Test login successful'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}