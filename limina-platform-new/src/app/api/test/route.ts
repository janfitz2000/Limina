import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    return NextResponse.json({
      status: 'success',
      message: 'API is working',
      environment: {
        supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
        supabaseKey: supabaseKey ? 'Set' : 'Missing',
        nodeEnv: process.env.NODE_ENV
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
