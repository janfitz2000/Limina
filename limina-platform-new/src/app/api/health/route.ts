import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - can be expanded to check database, external services, etc.
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'limina-platform',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      supabaseConfigured: true,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'default-demo'
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    const healthError = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'limina-platform',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(healthError, { status: 503 });
  }
}

export async function HEAD() {
  // Simple head request for health checks
  return new Response(null, { status: 200 });
}