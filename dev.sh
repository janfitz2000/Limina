#!/bin/bash

# Limina Development Environment Startup Script
# This script starts the entire Limina development environment using Docker only

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[LIMINA]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[LIMINA]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[LIMINA]${NC} $1"
}

print_error() {
    echo -e "${RED}[LIMINA]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1 && ! docker compose version > /dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose and try again."
        exit 1
    fi
}

# Function to create required directories
create_directories() {
    print_status "Creating required directories..."
    
    # Create scripts directory if it doesn't exist
    mkdir -p scripts
    
    # Create volumes directories for projects
    mkdir -p limina-platform-new/volumes/kong
    mkdir -p limina-platform-new/volumes/storage
    mkdir -p limina-platform-new/volumes/db
    
    print_success "Directories created successfully"
}

# Function to create database initialization script
create_db_init() {
    if [ ! -f "scripts/init-db.sql" ]; then
        print_status "Creating database initialization script..."
        
        cat > scripts/init-db.sql << 'EOF'
-- Limina Database Initialization Script
-- This script sets up the basic database structure for all Limina projects

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema for Supabase
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS _realtime;

-- Create basic roles for Supabase
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- Basic health check function
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS json AS $$
BEGIN
    RETURN json_build_object(
        'status', 'healthy',
        'timestamp', now(),
        'database', current_database(),
        'version', version()
    );
END;
$$ LANGUAGE plpgsql;
EOF
        
        print_success "Database initialization script created"
    fi
}

# Function to create Kong configuration
create_kong_config() {
    if [ ! -f "limina-platform-new/volumes/kong/kong.yml" ]; then
        print_status "Creating Kong configuration..."
        
        mkdir -p limina-platform-new/volumes/kong
        
        cat > limina-platform-new/volumes/kong/kong.yml << 'EOF'
_format_version: "1.1"

services:
  - name: auth-v1-open
    url: http://supabase-auth:9999/verify
    routes:
      - name: auth-v1-open
        strip_path: true
        paths:
          - /auth/v1/verify
    plugins:
      - name: cors

  - name: auth-v1-open-callback
    url: http://supabase-auth:9999/callback
    routes:
      - name: auth-v1-open-callback
        strip_path: true
        paths:
          - /auth/v1/callback
    plugins:
      - name: cors

  - name: auth-v1-open-authorize
    url: http://supabase-auth:9999/authorize
    routes:
      - name: auth-v1-open-authorize
        strip_path: true
        paths:
          - /auth/v1/authorize
    plugins:
      - name: cors

  - name: auth-v1
    _comment: "GoTrue: /auth/v1/* -> http://supabase-auth:9999/*"
    url: http://supabase-auth:9999/
    routes:
      - name: auth-v1-all
        strip_path: true
        paths:
          - /auth/v1/
    plugins:
      - name: cors

  - name: rest-v1
    _comment: "PostgREST: /rest/v1/* -> http://supabase-rest:3000/*"
    url: http://supabase-rest:3000/
    routes:
      - name: rest-v1-all
        strip_path: true
        paths:
          - /rest/v1/
    plugins:
      - name: cors

  - name: realtime-v1
    _comment: "Realtime: /realtime/v1/* -> ws://supabase-realtime:4000/socket/*"
    url: http://supabase-realtime:4000/socket/
    routes:
      - name: realtime-v1-all
        strip_path: true
        paths:
          - /realtime/v1/
    plugins:
      - name: cors

  - name: storage-v1
    _comment: "Storage: /storage/v1/* -> http://supabase-storage:5000/*"
    url: http://supabase-storage:5000/
    routes:
      - name: storage-v1-all
        strip_path: true
        paths:
          - /storage/v1/
    plugins:
      - name: cors

consumers: []

plugins:
  - name: cors
    config:
      origins:
        - "*"
      methods:
        - GET
        - HEAD
        - PUT
        - PATCH
        - POST
        - DELETE
        - OPTIONS
      headers:
        - Accept
        - Accept-Version
        - Content-Length
        - Content-MD5
        - Content-Type
        - Date
        - X-Auth-Token
        - Authorization
        - X-Forwarded-For
        - X-Forwarded-Proto
        - X-Forwarded-Port
      exposed_headers:
        - X-Auth-Token
      credentials: true
      max_age: 3600
EOF
        
        print_success "Kong configuration created"
    fi
}

# Function to start services
start_services() {
    print_status "Starting Limina development environment..."
    
    # Use docker compose if available, otherwise use docker-compose
    if docker compose version > /dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    # Start infrastructure services first
    print_status "Starting infrastructure services (database, redis, mailhog)..."
    $COMPOSE_CMD up -d postgres redis mailhog
    
    # Wait for infrastructure to be ready
    print_status "Waiting for infrastructure services to be ready..."
    $COMPOSE_CMD exec -T postgres pg_isready -U postgres -d limina || {
        print_warning "Waiting for PostgreSQL to be ready..."
        sleep 10
    }
    
    # Start Supabase services
    print_status "Starting Supabase services..."
    $COMPOSE_CMD up -d supabase-meta supabase-auth supabase-rest supabase-realtime supabase-storage supabase-imgproxy
    
    # Wait a bit for Supabase services to initialize
    print_status "Waiting for Supabase services to initialize..."
    sleep 15
    
    # Start Kong gateway
    print_status "Starting Kong gateway..."
    $COMPOSE_CMD up -d supabase-kong
    
    # Start Supabase Studio
    print_status "Starting Supabase Studio..."
    $COMPOSE_CMD up -d supabase-studio
    
    # Start applications
    print_status "Starting Limina applications..."
    $COMPOSE_CMD up -d platform price-tracker
    
    print_success "All services started successfully!"
}

# Function to show service status and URLs
show_status() {
    print_success "Limina Development Environment is ready!"
    echo ""
    echo -e "${BLUE}📊 Service URLs:${NC}"
    echo -e "  ${GREEN}✓${NC} Main Platform:      http://localhost:3000"
    echo -e "  ${GREEN}✓${NC} Price Tracker:      http://localhost:3001"
    echo -e "  ${GREEN}✓${NC} Supabase Studio:    http://localhost:3002"
    echo -e "  ${GREEN}✓${NC} Supabase API:       http://localhost:8000"
    echo -e "  ${GREEN}✓${NC} MailHog (Email):    http://localhost:8025"
    echo ""
    echo -e "${BLUE}🛠️  Development Tools (optional):${NC}"
    echo -e "  ${YELLOW}○${NC} PgAdmin:            http://localhost:5050 (run: ./dev.sh --tools)"
    echo -e "  ${YELLOW}○${NC} Redis Commander:    http://localhost:8081 (run: ./dev.sh --tools)"
    echo ""
    echo -e "${BLUE}📝 Quick Commands:${NC}"
    echo -e "  ${GREEN}→${NC} ./cli.sh platform npm run lint    # Lint main platform"
    echo -e "  ${GREEN}→${NC} ./cli.sh tracker npm test         # Test price tracker"
    echo -e "  ${GREEN}→${NC} ./cli.sh platform bash            # Access platform shell"
    echo -e "  ${GREEN}→${NC} ./dev.sh stop                     # Stop all services"
    echo -e "  ${GREEN}→${NC} ./dev.sh logs                     # View all logs"
    echo ""
}

# Function to stop services
stop_services() {
    print_status "Stopping Limina development environment..."
    
    if docker compose version > /dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    $COMPOSE_CMD down
    print_success "All services stopped"
}

# Function to show logs
show_logs() {
    if docker compose version > /dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    if [ -z "$2" ]; then
        print_status "Showing logs for all services..."
        $COMPOSE_CMD logs -f
    else
        print_status "Showing logs for $2..."
        $COMPOSE_CMD logs -f "$2"
    fi
}

# Function to start development tools
start_tools() {
    print_status "Starting development tools..."
    
    if docker compose version > /dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    $COMPOSE_CMD --profile tools up -d pgadmin redis-commander
    
    print_success "Development tools started!"
    echo ""
    echo -e "${BLUE}🛠️  Development Tools:${NC}"
    echo -e "  ${GREEN}✓${NC} PgAdmin:            http://localhost:5050"
    echo -e "      ${YELLOW}Login:${NC} admin@limina.dev / limina_admin_password"
    echo -e "  ${GREEN}✓${NC} Redis Commander:    http://localhost:8081"
    echo -e "      ${YELLOW}Login:${NC} admin / limina_redis_admin"
}

# Main script logic
main() {
    echo -e "${BLUE}"
    echo "╭────────────────────────────────────────╮"
    echo "│        Limina Development Environment  │"
    echo "│              Docker-Only Setup         │"
    echo "╰────────────────────────────────────────╯"
    echo -e "${NC}"
    
    case "${1:-start}" in
        "start")
            check_docker
            check_docker_compose
            create_directories
            create_db_init
            create_kong_config
            start_services
            show_status
            ;;
        "stop")
            check_docker
            check_docker_compose
            stop_services
            ;;
        "restart")
            check_docker
            check_docker_compose
            stop_services
            sleep 2
            create_directories
            create_db_init
            create_kong_config
            start_services
            show_status
            ;;
        "logs")
            check_docker
            check_docker_compose
            show_logs "$@"
            ;;
        "--tools"|"tools")
            check_docker
            check_docker_compose
            start_tools
            ;;
        "status")
            show_status
            ;;
        "help"|"--help"|"-h")
            echo -e "${BLUE}Limina Development Environment${NC}"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  start         Start all development services (default)"
            echo "  stop          Stop all services"
            echo "  restart       Restart all services"
            echo "  logs [service] Show logs for all services or specific service"
            echo "  tools         Start development tools (PgAdmin, Redis Commander)"
            echo "  status        Show service URLs and status"
            echo "  help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Start all services"
            echo "  $0 logs platform      # Show platform logs"
            echo "  $0 stop               # Stop all services"
            echo "  $0 tools              # Start development tools"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"