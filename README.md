# Limita Utilities

This project contains helper functions for caching product data and scheduling
conditional order checks using Redis.

## Redis Configuration

Set the following environment variables to configure the Redis connection:

- `REDIS_HOST` - Redis server hostname (default `127.0.0.1`)
- `REDIS_PORT` - Redis server port (default `6379`)
- `REDIS_PASSWORD` - Optional password for authenticated Redis instances

These values are read by the modules in `utils/redisClient.js` when creating the
Redis connection with [ioredis](https://github.com/luin/ioredis).
