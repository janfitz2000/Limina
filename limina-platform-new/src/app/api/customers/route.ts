/**
 * API Route: Customer Lookup
 * GET /api/customers?email=xxx
 *
 * Looks up a customer by email address
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'email parameter is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, email, name, created_at')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error looking up customer:', error);
      return NextResponse.json(
        { error: 'Failed to lookup customer' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: customer || null,
    });
  } catch (error) {
    console.error('Error in customer lookup:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
