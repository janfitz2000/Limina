#!/bin/bash

# Limina CLI - Execute commands in Docker containers
# This script allows you to run commands inside Limina containers without having Node.js installed locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CLI]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[CLI]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[CLI]${NC} $1"
}

print_error() {
    echo -e "${RED}[CLI]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
}

# Function to check if container is running
check_container() {
    local container_name="$1"
    if ! docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        print_error "Container '${container_name}' is not running."
        print_warning "Start the development environment with: ./dev.sh"
        exit 1
    fi
}

# Function to get container name from service alias
get_container_name() {
    case "$1" in
        "platform"|"main"|"app")
            echo "limina-platform"
            ;;
        "tracker"|"price-tracker"|"shopify")
            echo "limina-price-tracker"
            ;;
        "db"|"database"|"postgres")
            echo "limina-postgres"
            ;;
        "redis")
            echo "limina-redis"
            ;;
        "supabase")
            echo "limina-supabase-kong"
            ;;
        "studio")
            echo "limina-supabase-studio"
            ;;
        "mailhog"|"mail")
            echo "limina-mailhog"
            ;;
        *)
            # Try direct container name
            if docker ps --format "table {{.Names}}" | grep -q "^$1$"; then
                echo "$1"
            else
                print_error "Unknown service: $1"
                echo ""
                echo "Available services:"
                echo "  platform, main, app     -> Main Limina Platform"
                echo "  tracker, price-tracker  -> Shopify Price Tracker"
                echo "  db, database, postgres  -> PostgreSQL Database"
                echo "  redis                   -> Redis Cache"
                echo "  supabase                -> Supabase Gateway"
                echo "  studio                  -> Supabase Studio"
                echo "  mailhog, mail           -> MailHog Email Testing"
                echo ""
                echo "Or use the exact container name:"
                docker ps --format "  {{.Names}}"
                exit 1
            fi
            ;;
    esac
}

# Function to execute command in container
execute_command() {
    local service="$1"
    shift
    local container_name
    container_name=$(get_container_name "$service")
    
    check_container "$container_name"
    
    if [ $# -eq 0 ]; then
        # No command provided, start interactive shell
        print_status "Starting interactive shell in $container_name..."
        if [[ "$container_name" == *"postgres"* ]]; then
            docker exec -it "$container_name" psql -U postgres -d limina
        elif [[ "$container_name" == *"redis"* ]]; then
            docker exec -it "$container_name" redis-cli -a limina_redis_password
        else
            docker exec -it "$container_name" /bin/bash
        fi
    else
        # Execute provided command
        print_status "Executing in $container_name: $*"
        docker exec -it "$container_name" "$@"
    fi
}

# Function to show available npm scripts for a service
show_npm_scripts() {
    local service="$1"
    local container_name
    container_name=$(get_container_name "$service")
    
    check_container "$container_name"
    
    print_status "Available npm scripts for $service:"
    if docker exec "$container_name" test -f package.json 2>/dev/null; then
        docker exec "$container_name" npm run 2>/dev/null | grep -A 100 "available via" | tail -n +2 || {
            print_warning "No npm scripts found or npm not available in this container"
        }
    else
        print_warning "No package.json found in this container"
    fi
}

# Function to show logs for a service
show_logs() {
    local service="$1"
    local container_name
    container_name=$(get_container_name "$service")
    
    print_status "Showing logs for $container_name..."
    docker logs -f "$container_name"
}

# Function to show container status
show_status() {
    print_status "Container status:"
    echo ""
    
    # Define expected containers
    local containers=(
        "limina-postgres:Database"
        "limina-redis:Redis Cache"
        "limina-mailhog:Email Testing"
        "limina-supabase-kong:Supabase Gateway"
        "limina-supabase-studio:Supabase Studio"
        "limina-platform:Main Platform"
        "limina-price-tracker:Price Tracker"
    )
    
    for container_info in "${containers[@]}"; do
        IFS=':' read -r container_name description <<< "$container_info"
        if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
            echo -e "  ${GREEN}✓${NC} $description ($container_name)"
        else
            echo -e "  ${RED}✗${NC} $description ($container_name)"
        fi
    done
    
    echo ""
    print_status "Use './dev.sh' to start services that are not running"
}

# Function to run common development commands
run_dev_command() {
    local service="$1"
    local command="$2"
    
    case "$command" in
        "install")
            execute_command "$service" npm install --legacy-peer-deps
            ;;
        "build")
            execute_command "$service" npm run build
            ;;
        "dev")
            print_warning "Development server is already running in the container"
            print_status "Access it at:"
            if [[ "$service" == "platform" ]]; then
                echo "  http://localhost:3000"
            elif [[ "$service" == "tracker" ]]; then
                echo "  http://localhost:3001"
            fi
            ;;
        "lint")
            execute_command "$service" npm run lint
            ;;
        "test")
            execute_command "$service" npm test
            ;;
        "format")
            execute_command "$service" npm run format 2>/dev/null || {
                print_warning "No format script available, trying prettier..."
                execute_command "$service" npx prettier --write . 2>/dev/null || {
                    print_error "No formatting tool available"
                }
            }
            ;;
        *)
            print_error "Unknown development command: $command"
            echo ""
            echo "Available development commands:"
            echo "  install    Install dependencies"
            echo "  build      Build the application"
            echo "  dev        Show development server info"
            echo "  lint       Run linting"
            echo "  test       Run tests"
            echo "  format     Format code"
            exit 1
            ;;
    esac
}

# Main script logic
main() {
    if [ $# -eq 0 ]; then
        echo -e "${BLUE}"
        echo "╭────────────────────────────────────────╮"
        echo "│            Limina CLI Tool             │"
        echo "│        Execute commands in Docker      │"
        echo "╰────────────────────────────────────────╯"
        echo -e "${NC}"
        echo ""
        echo "Usage: $0 <service> [command] [args...]"
        echo ""
        echo "Services:"
        echo "  platform, main, app     Main Limina Platform"
        echo "  tracker, price-tracker  Shopify Price Tracker"
        echo "  db, database, postgres  PostgreSQL Database"
        echo "  redis                   Redis Cache"
        echo ""
        echo "Common Commands:"
        echo "  $0 platform npm run lint           # Lint main platform"
        echo "  $0 tracker npm test                # Test price tracker"
        echo "  $0 platform bash                   # Interactive shell"
        echo "  $0 db                               # PostgreSQL shell"
        echo "  $0 redis                            # Redis CLI"
        echo ""
        echo "Development Shortcuts:"
        echo "  $0 platform install                # Install dependencies"
        echo "  $0 platform build                  # Build application"
        echo "  $0 platform lint                   # Run linting"
        echo "  $0 tracker test                    # Run tests"
        echo ""
        echo "Utility Commands:"
        echo "  $0 status                           # Show container status"
        echo "  $0 logs <service>                   # Show service logs"
        echo "  $0 scripts <service>                # Show available npm scripts"
        echo ""
        exit 0
    fi
    
    check_docker
    
    local service="$1"
    shift
    
    case "$service" in
        "status")
            show_status
            ;;
        "logs")
            if [ $# -eq 0 ]; then
                print_error "Please specify a service for logs"
                echo "Usage: $0 logs <service>"
                exit 1
            fi
            show_logs "$1"
            ;;
        "scripts")
            if [ $# -eq 0 ]; then
                print_error "Please specify a service to show scripts for"
                echo "Usage: $0 scripts <service>"
                exit 1
            fi
            show_npm_scripts "$1"
            ;;
        *)
            # Check if it's a development shortcut command
            if [ $# -eq 1 ] && [[ "$1" =~ ^(install|build|dev|lint|test|format)$ ]]; then
                run_dev_command "$service" "$1"
            else
                # Regular command execution
                execute_command "$service" "$@"
            fi
            ;;
    esac
}

# Run main function with all arguments
main "$@"