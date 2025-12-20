#!/bin/bash

# Limina Platform Health Check Script
# Run this before each development session to ensure everything is working

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_status() {
    echo -e "${BLUE}[HEALTH]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[HEALTH]${NC} ✓ $1"
}

print_warning() {
    echo -e "${YELLOW}[HEALTH]${NC} ⚠ $1"
}

print_error() {
    echo -e "${RED}[HEALTH]${NC} ✗ $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Health check counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Function to increment counters
pass_check() {
    ((CHECKS_PASSED++))
    print_success "$1"
}

fail_check() {
    ((CHECKS_FAILED++))
    print_error "$1"
}

warn_check() {
    ((CHECKS_WARNING++))
    print_warning "$1"
}

# Function to check if Docker is running
check_docker() {
    print_step "Checking Docker..."
    if docker info > /dev/null 2>&1; then
        pass_check "Docker is running"
        return 0
    else
        fail_check "Docker is not running"
        echo "Please start Docker Desktop and run this script again."
        return 1
    fi
}

# Function to check Docker containers
check_containers() {
    print_step "Checking Docker containers..."
    
    local expected_containers=(
        "limina-postgres:Database"
        "limina-redis:Redis Cache"
        "limina-mailhog:Email Testing"
        "limina-supabase-kong:Supabase Gateway"
        "limina-supabase-studio:Supabase Studio"
        "limina-platform:Main Platform"
    )
    
    local all_running=true
    
    for container_info in "${expected_containers[@]}"; do
        IFS=':' read -r container_name description <<< "$container_info"
        if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
            pass_check "$description is running"
        else
            fail_check "$description is not running"
            all_running=false
        fi
    done
    
    if [ "$all_running" = false ]; then
        print_warning "Some containers are not running. Start with: ./dev.sh"
        return 1
    fi
    
    return 0
}

# Function to check API endpoints
check_api_endpoints() {
    print_step "Checking API endpoints..."
    
    # Wait a moment for services to be ready
    sleep 2
    
    # Check main platform health endpoint
    if curl -s -f "http://localhost:3000/api/health" > /dev/null 2>&1; then
        pass_check "Main platform API is responding"
    else
        fail_check "Main platform API is not responding"
        print_warning "Make sure the platform is running: ./cli.sh platform npm run dev"
        return 1
    fi
    
    # Check Supabase Studio
    if curl -s -f "http://localhost:54323" > /dev/null 2>&1; then
        pass_check "Supabase Studio is accessible"
    else
        warn_check "Supabase Studio is not accessible (may be starting up)"
    fi
    
    # Check MailHog
    if curl -s -f "http://localhost:8025" > /dev/null 2>&1; then
        pass_check "MailHog is accessible"
    else
        warn_check "MailHog is not accessible"
    fi
    
    return 0
}

# Function to check database connectivity
check_database() {
    print_step "Checking database connectivity..."
    
    # Test PostgreSQL connection
    if docker exec limina-postgres pg_isready -U postgres > /dev/null 2>&1; then
        pass_check "PostgreSQL is ready"
    else
        fail_check "PostgreSQL is not ready"
        return 1
    fi
    
    # Test Redis connection
    if docker exec limina-redis redis-cli -a limina_redis_password ping | grep -q "PONG" 2>/dev/null; then
        pass_check "Redis is ready"
    else
        fail_check "Redis is not ready"
        return 1
    fi
    
    return 0
}

# Function to check environment variables
check_environment() {
    print_step "Checking environment configuration..."
    
    # Check if .env.local exists (not required but recommended for local dev)
    if [ -f ".env.local" ]; then
        pass_check ".env.local file exists"
    else
        warn_check ".env.local file not found (using fallback configuration)"
    fi
    
    # Check basic environment variables in the container
    if docker exec limina-platform printenv NEXT_PUBLIC_SUPABASE_URL > /dev/null 2>&1; then
        pass_check "Environment variables are configured"
    else
        warn_check "Some environment variables may not be configured"
    fi
    
    return 0
}

# Function to run basic tests
run_basic_tests() {
    print_step "Running basic tests..."
    
    # Check if tests can run
    if docker exec limina-platform npm test -- --passWithNoTests --silent > /dev/null 2>&1; then
        pass_check "Test suite is executable"
    else
        fail_check "Test suite failed"
        print_warning "Run './cli.sh platform test' to see detailed test output"
        return 1
    fi
    
    return 0
}

# Function to check TypeScript compilation
check_typescript() {
    print_step "Checking TypeScript compilation..."
    
    if docker exec limina-platform npm run typecheck > /dev/null 2>&1; then
        pass_check "TypeScript compilation successful"
    else
        fail_check "TypeScript compilation failed"
        print_warning "Run './cli.sh platform typecheck' to see detailed errors"
        return 1
    fi
    
    return 0
}

# Function to check linting
check_linting() {
    print_step "Checking code linting..."
    
    if docker exec limina-platform npm run lint > /dev/null 2>&1; then
        pass_check "Linting passed"
    else
        warn_check "Linting issues found"
        print_warning "Run './cli.sh platform lint' to see detailed output"
    fi
    
    return 0
}

# Function to run specific health API endpoint test
test_health_endpoint() {
    print_step "Testing health endpoint response..."
    
    local health_response
    health_response=$(curl -s "http://localhost:3000/api/health" 2>/dev/null)
    
    if echo "$health_response" | grep -q '"status":"healthy"'; then
        pass_check "Health endpoint returns healthy status"
    else
        fail_check "Health endpoint not returning healthy status"
        return 1
    fi
    
    return 0
}

# Function to show performance metrics
show_performance_metrics() {
    print_step "Gathering performance metrics..."
    
    # Docker container resource usage
    print_status "Container resource usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -n 10
    
    echo ""
}

# Function to show final report
show_final_report() {
    print_header "HEALTH CHECK SUMMARY"
    
    local total_checks=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))
    
    echo -e "${GREEN}✓ Checks Passed: ${CHECKS_PASSED}${NC}"
    echo -e "${RED}✗ Checks Failed: ${CHECKS_FAILED}${NC}"
    echo -e "${YELLOW}⚠ Warnings: ${CHECKS_WARNING}${NC}"
    echo -e "Total Checks: ${total_checks}"
    echo ""
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        if [ $CHECKS_WARNING -eq 0 ]; then
            echo -e "${GREEN}🎉 All systems are healthy! Ready for development.${NC}"
        else
            echo -e "${YELLOW}⚠️  System is mostly healthy with some warnings. Development should work fine.${NC}"
        fi
        echo ""
        echo -e "${BLUE}Quick Start Commands:${NC}"
        echo "  ./cli.sh platform test        # Run tests"
        echo "  ./cli.sh platform lint        # Check code quality"
        echo "  ./cli.sh platform typecheck   # Check types"
        echo "  http://localhost:3000          # Main application"
        echo "  http://localhost:54323         # Supabase Studio"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Critical issues found! Please fix these before development:${NC}"
        echo ""
        if ! docker info > /dev/null 2>&1; then
            echo "  1. Start Docker Desktop"
        fi
        if ! docker ps | grep -q "limina-platform"; then
            echo "  2. Start development environment: ./dev.sh"
        fi
        echo "  3. Check logs: ./cli.sh logs platform"
        echo ""
        return 1
    fi
}

# Main health check function
main() {
    clear
    print_header "LIMINA PLATFORM HEALTH CHECK"
    echo -e "${BLUE}Verifying all systems before development session...${NC}"
    echo ""
    
    # Run all health checks
    check_docker || exit 1
    check_containers || exit 1
    check_database || exit 1
    check_environment
    check_api_endpoints || exit 1
    test_health_endpoint || exit 1
    check_typescript
    check_linting
    run_basic_tests
    
    echo ""
    show_performance_metrics
    show_final_report
}

# Handle script arguments
case "${1:-check}" in
    "check"|"")
        main
        ;;
    "quick")
        print_header "QUICK HEALTH CHECK"
        check_docker && check_containers && check_api_endpoints
        if [ $CHECKS_FAILED -eq 0 ]; then
            print_success "Quick check passed - system is running"
        else
            print_error "Quick check failed - see above"
            exit 1
        fi
        ;;
    "help")
        echo "Limina Platform Health Check"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  check (default)  Full health check"
        echo "  quick           Quick check (containers + API)"
        echo "  help            Show this help message"
        echo ""
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac