import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-fixed'

export async function GET() {
  try {
    // Test basic Supabase connection
    const { data, error } = await supabase
      .from('merchants') // This might not exist but that's ok
      .select('*')
      .limit(1)

    return NextResponse.json({
      status: 'success',
      supabaseConfigured: true,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      supabaseConfigured: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}