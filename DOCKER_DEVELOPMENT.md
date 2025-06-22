# Docker-Only Development Guide

This guide provides detailed instructions for developing Limina projects using only Docker - no local Node.js installation required.

## Architecture Overview

The Limina development environment consists of:

```
┌─────────────────────────────────────────────────────────────┐
│                    Limina Docker Network                    │
├─────────────────────────────────────────────────────────────┤
│  Applications:                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Main Platform   │  │ Price Tracker   │                  │
│  │ :3000          │  │ :3001          │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  Supabase Stack:                                           │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Studio :3002    │  │ Gateway :8000   │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  Infrastructure:                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ PostgreSQL      │  │ Redis           │  │ MailHog     │ │
│  │ :5432          │  │ :6379          │  │ :8025       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Quick Reference

### Essential Commands

```bash
# Environment Management
./dev.sh                          # Start everything
./dev.sh stop                     # Stop everything  
./dev.sh restart                  # Restart everything
./dev.sh logs [service]           # View logs
./dev.sh tools                    # Start dev tools

# Execute Commands in Containers
./cli.sh platform [command]       # Run in main platform
./cli.sh tracker [command]        # Run in price tracker
./cli.sh db                       # PostgreSQL shell
./cli.sh redis                    # Redis CLI

# Development Shortcuts
./cli.sh platform lint            # Lint code
./cli.sh platform build           # Build application
./cli.sh tracker test             # Run tests
```

### Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Main Platform | http://localhost:3000 | Limina conditional buy orders |
| Price Tracker | http://localhost:3001 | Shopify price tracking app |
| Supabase Studio | http://localhost:3002 | Database management UI |
| Supabase API | http://localhost:8000 | Backend API gateway |
| MailHog | http://localhost:8025 | Email testing interface |
| PgAdmin* | http://localhost:5050 | Advanced DB management |
| Redis Commander* | http://localhost:8081 | Redis data browser |

*Optional development tools (start with `./dev.sh tools`)

## Detailed Workflow

### Initial Setup

1. **Start Development Environment**
   ```bash
   ./dev.sh
   ```
   
   This will:
   - Pull and build all Docker images
   - Start infrastructure services (DB, Redis, Email)
   - Initialize Supabase stack
   - Start both applications
   - Run database migrations

2. **Verify Everything is Running**
   ```bash
   ./cli.sh status
   ```

### Daily Development

#### Code Changes
- Edit files normally in your IDE
- Changes are automatically synced to containers via volumes
- Applications restart automatically when code changes

#### Installing Dependencies
```bash
# Add new npm package to platform
./cli.sh platform npm install package-name --save

# Add dev dependency to tracker
./cli.sh tracker npm install package-name --save-dev

# Install all dependencies after git pull
./cli.sh platform install
```

#### Running Tests
```bash
# Run tests for price tracker
./cli.sh tracker test

# Run tests in watch mode
./cli.sh tracker npm run test:watch

# Run specific test file
./cli.sh tracker npm test -- --testNamePattern="specific test"
```

#### Database Operations
```bash
# Access PostgreSQL directly
./cli.sh db

# Reset Supabase database
./cli.sh platform npx supabase db reset

# Run specific migration
./cli.sh platform npx supabase db push

# Generate TypeScript types
./cli.sh platform npx supabase gen types typescript
```

#### Debugging
```bash
# View real-time logs for all services
./dev.sh logs

# View logs for specific service
./dev.sh logs platform
./dev.sh logs tracker
./dev.sh logs postgres

# Interactive shell in container
./cli.sh platform bash
./cli.sh tracker bash

# Check container resource usage
docker stats
```

### Advanced Operations

#### Environment Variables
Environment variables are pre-configured in `docker-compose.yml`. To override:

1. **Create local override file:**
   ```bash
   cp docker-compose.yml docker-compose.override.yml
   ```

2. **Edit override file** with your changes

3. **Restart services:**
   ```bash
   ./dev.sh restart
   ```

#### Database Management

**Using Supabase Studio (Recommended):**
- Navigate to http://localhost:3002
- Visual interface for tables, queries, and data

**Using PgAdmin (Advanced):**
```bash
./dev.sh tools  # Start PgAdmin
```
- Navigate to http://localhost:5050
- Login: admin@limina.dev / limina_admin_password
- Add server: postgres:5432, postgres/limina_dev_password

**Direct SQL Access:**
```bash
./cli.sh db
# Now you're in PostgreSQL shell
\dt          # List tables
\d merchants # Describe merchants table
SELECT * FROM merchants LIMIT 5;
```

#### Redis Operations
```bash
# Redis CLI
./cli.sh redis

# Or use Redis Commander web interface
./dev.sh tools
# Navigate to http://localhost:8081
```

#### Email Testing
All emails are caught by MailHog:
- Web interface: http://localhost:8025
- SMTP server: localhost:1025
- No emails are actually sent

### Troubleshooting

#### Common Issues

**Port Already in Use:**
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

**Containers Won't Start:**
```bash
# Check Docker daemon
docker info

# Check available resources
docker system df

# Clean up if needed
docker system prune -f
```

**Database Connection Issues:**
```bash
# Check if PostgreSQL is running
./cli.sh db

# Reset database
./dev.sh stop
docker volume rm limina_postgres_data
./dev.sh start
```

**Slow Performance:**
```bash
# Check resource usage
docker stats

# Increase Docker Desktop resources in settings
# Recommended: 4GB RAM, 2 CPUs minimum
```

#### Reset Everything
```bash
# Nuclear option - complete reset
./dev.sh stop
docker system prune -af
docker volume prune -f
./dev.sh start
```

### Production Considerations

#### Building for Production
```bash
# Build production images
./cli.sh platform npm run build
./cli.sh tracker npm run build

# Test production builds locally
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

#### Environment Variables for Production
Key variables to set in production:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Security
NEXTAUTH_SECRET=your_secure_secret
NEXTAUTH_URL=https://your-domain.com
```

### IDE Integration

#### VS Code DevContainer (Optional)
For full containerized development:

1. Install "Dev Containers" extension
2. Add `.devcontainer/devcontainer.json`:
   ```json
   {
     "name": "Limina Development",
     "dockerComposeFile": "../docker-compose.yml",
     "service": "platform",
     "workspaceFolder": "/app",
     "customizations": {
       "vscode": {
         "extensions": [
           "ms-vscode.vscode-typescript-next",
           "bradlc.vscode-tailwindcss",
           "ms-vscode.vscode-eslint"
         ]
       }
     }
   }
   ```
3. "Reopen in Container" command

#### IntelliJ/WebStorm
- Configure Docker integration
- Set up remote interpreters pointing to containers
- Use Docker Compose run configurations

## Performance Tips

1. **Use Docker volumes for node_modules** (already configured)
2. **Limit resource usage** in Docker Desktop settings
3. **Use .dockerignore** to reduce build context (already configured)
4. **Keep containers running** between development sessions
5. **Use docker-compose down** instead of stop to free resources when done

## Contributing

When contributing to the project:

1. **Always test in Docker environment**
2. **Update Docker configs** if adding new dependencies
3. **Document environment variable changes**
4. **Test production builds** before submitting PRs

This Docker-only setup ensures consistent development environments across all team members and matches production deployment closely.