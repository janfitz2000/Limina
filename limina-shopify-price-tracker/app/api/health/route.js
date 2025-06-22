import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check for price tracker service
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'limina-price-tracker',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    const healthError = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'limina-price-tracker',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(healthError, { status: 503 });
  }
}

export async function HEAD() {
  // Simple head request for health checks
  return new Response(null, { status: 200 });
}