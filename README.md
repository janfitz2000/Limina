# LIMINA

LIMINA is building a conditional buy order checkout service. The goal is to let customers and B2C buyers commit to a purchase that only executes when predefined conditions are met – such as a specific price threshold or inventory availability. This approach helps merchants secure future sales while giving customers confidence that they’ll only pay when their terms are satisfied.

## Planned Tech Stack

- **Next.js** – front end and application framework
- **Supabase** – database and authentication
- **Shopify** – e-commerce integration
- **Stripe** – payment processing
- **Redis** – for caching and real-time messaging

## Project Structure

- **`index.html`** - Beautiful static landing page with full design and animations
- **`limina-platform-new/`** - Modern Next.js application with dashboard and Supabase integration

## Docker-Only Development Setup

**🐳 No Node.js, npm, or local dependencies required! Everything runs in Docker containers.**

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Git

### Quick Start

1. **Clone and start the entire development environment:**
   ```bash
   git clone <repository-url>
   cd Limina
   ./dev.sh
   ```

2. **Access your applications:**
   - **Main Platform**: http://localhost:3000
   - **Price Tracker**: http://localhost:3001
   - **Supabase Studio**: http://localhost:3002
   - **Email Testing**: http://localhost:8025

That's it! The entire Limina ecosystem is now running.

### Development Workflow

#### Running Commands in Containers
Use the `./cli.sh` script to execute commands inside containers:

```bash
# Development commands
./cli.sh platform npm run lint    # Lint main platform
./cli.sh tracker npm test         # Test price tracker
./cli.sh platform npm run build   # Build platform

# Interactive shells
./cli.sh platform bash            # Access platform shell
./cli.sh db                       # PostgreSQL shell
./cli.sh redis                    # Redis CLI

# Development shortcuts
./cli.sh platform install         # Install dependencies
./cli.sh platform lint           # Run linting
./cli.sh tracker test            # Run tests
```

#### Managing Services

```bash
# Start all services
./dev.sh start                    # or just ./dev.sh

# Stop all services
./dev.sh stop

# Restart everything
./dev.sh restart

# View logs
./dev.sh logs                     # All services
./dev.sh logs platform            # Specific service

# Start development tools (PgAdmin, Redis Commander)
./dev.sh tools

# Check service status
./cli.sh status
```

### Service Architecture

The development environment includes:

#### Core Services
- **PostgreSQL Database** (port 5432) - Shared database for all projects
- **Redis Cache** (port 6379) - Session and caching store
- **MailHog** (port 8025) - Email testing interface

#### Supabase Stack
- **Supabase Studio** (port 3002) - Database management UI
- **Supabase API Gateway** (port 8000) - Unified API endpoint
- **Auth, Storage, Realtime** - Full Supabase functionality

#### Applications
- **Main Platform** (port 3000) - Next.js conditional buy order platform
- **Price Tracker** (port 3001) - Shopify price tracking app

#### Development Tools (Optional)
- **PgAdmin** (port 5050) - Advanced database management
- **Redis Commander** (port 8081) - Redis data browser

### Environment Configuration

All environment variables are pre-configured for development. Key endpoints:

- **Database**: `postgres://postgres:limina_dev_password@localhost:5432/limina`
- **Supabase API**: `http://localhost:8000`
- **Redis**: `redis://:limina_redis_password@localhost:6379`

### Database Management

```bash
# Access PostgreSQL directly
./cli.sh db

# View Supabase Studio
open http://localhost:3002

# Run migrations (if needed)
./cli.sh platform npx supabase db reset
```

### Troubleshooting

#### Services won't start
```bash
# Check Docker is running
docker info

# Check service status
./cli.sh status

# View specific service logs
./dev.sh logs <service-name>
```

#### Port conflicts
The setup uses these ports: 3000, 3001, 3002, 5050, 5432, 6379, 8000, 8025, 8081
Make sure they're not in use by other applications.

#### Reset everything
```bash
./dev.sh stop
docker system prune -f
./dev.sh start
```

### Individual Project Development

Each project can also be run independently:

#### Main Platform Only
```bash
cd limina-platform-new
docker-compose -f docker-compose.local.yml up
```

#### Price Tracker Only
```bash
cd limina-shopify-price-tracker
docker-compose up
```

### Production Deployment

For production deployment, each project includes production-ready Dockerfiles and configurations. See individual project READMEs for deployment specifics.

### For the Static HTML (Quick Preview)

Simply open `index.html` in your browser to see the landing page design.
