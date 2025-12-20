import { GET } from '../route'
import { createNextApiTestRequest } from '@/lib/test-utils'

describe('/api/health', () => {
  describe('GET /api/health', () => {
    it('should return health status successfully', async () => {
      const request = createNextApiTestRequest('GET')
      const response = await GET(request)
      const result = await response.json()
      
      expect(response.status).toBe(200)
      expect(result.status).toBe('healthy')
      expect(result.timestamp).toBeDefined()
      expect(result.service).toBe('limina-platform')
      expect(result.supabaseConfigured).toBe(true)
      expect(result.uptime).toBeDefined()
      expect(result.memory).toBeDefined()
    })
    
    it('should return current timestamp', async () => {
      const beforeTime = Date.now()
      const request = createNextApiTestRequest('GET')
      const response = await GET(request)
      const result = await response.json()
      const afterTime = Date.now()
      const resultTime = new Date(result.timestamp).getTime()
      
      expect(resultTime).toBeGreaterThanOrEqual(beforeTime)
      expect(resultTime).toBeLessThanOrEqual(afterTime)
      expect(typeof result.timestamp).toBe('string')
    })
    
    it('should return environment information', async () => {
      const request = createNextApiTestRequest('GET')
      const response = await GET(request)
      const result = await response.json()
      
      expect(result.environment).toBeDefined()
      expect(result.version).toBeDefined()
      expect(result.supabaseUrl).toBeDefined()
    })
    
    it('should return system metrics', async () => {
      const request = createNextApiTestRequest('GET')
      const response = await GET(request)
      const result = await response.json()
      
      expect(typeof result.uptime).toBe('number')
      expect(result.memory).toHaveProperty('rss')
      expect(result.memory).toHaveProperty('heapUsed')
      expect(result.memory).toHaveProperty('heapTotal')
    })
  })
})