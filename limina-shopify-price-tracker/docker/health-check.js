// Health check endpoint for Docker
export async function GET() {
  try {
    // Basic health check
    return Response.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'limina-price-tracker'
    })
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    )
  }
}