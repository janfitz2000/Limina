#!/bin/bash

# Limina Platform Test Pipeline
# Comprehensive testing script that runs linting, type checking, and tests

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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} ✓ $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} ⚠ $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} ✗ $1"
}

# Pipeline counters
STEPS_PASSED=0
STEPS_FAILED=0
STEPS_WARNING=0

# Function to increment counters
pass_step() {
    ((STEPS_PASSED++))
    print_success "$1"
}

fail_step() {
    ((STEPS_FAILED++))
    print_error "$1"
    return 1
}

warn_step() {
    ((STEPS_WARNING++))
    print_warning "$1"
}

# Function to check if running in Docker
is_docker_env() {
    if [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to run command with proper environment
run_command() {
    local cmd="$1"
    local description="$2"
    
    print_step "$description"
    
    if is_docker_env; then
        # Running inside Docker container
        if eval "$cmd"; then
            pass_step "$description completed"
            return 0
        else
            fail_step "$description failed"
            return 1
        fi
    else
        # Running on host machine, use Docker CLI
        if docker exec limina-platform bash -c "$cmd"; then
            pass_step "$description completed"
            return 0
        else
            fail_step "$description failed"
            return 1
        fi
    fi
}

# Pipeline steps
run_linting() {
    run_command "npm run lint" "Code linting"
}

run_typecheck() {
    run_command "npm run typecheck" "TypeScript type checking"
}

run_tests() {
    local test_type="${1:-unit}"
    case "$test_type" in
        "unit")
            run_command "npm run test -- --passWithNoTests" "Unit tests"
            ;;
        "coverage")
            run_command "npm run test:coverage -- --passWithNoTests" "Tests with coverage"
            ;;
        "watch")
            if is_docker_env; then
                npm run test:watch
            else
                docker exec -it limina-platform npm run test:watch
            fi
            ;;
        *)
            print_error "Unknown test type: $test_type"
            return 1
            ;;
    esac
}

run_build_check() {
    run_command "npm run build" "Build check"
}

run_dependency_check() {
    print_step "Checking dependencies"
    
    if is_docker_env; then
        if npm ls > /dev/null 2>&1; then
            pass_step "Dependencies are properly installed"
        else
            warn_step "Some dependency issues detected"
            npm ls 2>&1 | tail -10
        fi
    else
        if docker exec limina-platform npm ls > /dev/null 2>&1; then
            pass_step "Dependencies are properly installed"
        else
            warn_step "Some dependency issues detected"
            docker exec limina-platform npm ls 2>&1 | tail -10
        fi
    fi
}

# Function to show results summary
show_summary() {
    print_header "TEST PIPELINE SUMMARY"
    
    local total_steps=$((STEPS_PASSED + STEPS_FAILED + STEPS_WARNING))
    
    echo -e "${GREEN}✓ Steps Passed: ${STEPS_PASSED}${NC}"
    echo -e "${RED}✗ Steps Failed: ${STEPS_FAILED}${NC}"
    echo -e "${YELLOW}⚠ Warnings: ${STEPS_WARNING}${NC}"
    echo -e "Total Steps: ${total_steps}"
    echo ""
    
    if [ $STEPS_FAILED -eq 0 ]; then
        if [ $STEPS_WARNING -eq 0 ]; then
            echo -e "${GREEN}🎉 All pipeline steps passed! Code is ready for deployment.${NC}"
        else
            echo -e "${YELLOW}⚠️  Pipeline passed with warnings. Review warnings before deployment.${NC}"
        fi
        return 0
    else
        echo -e "${RED}❌ Pipeline failed! Please fix the issues above before proceeding.${NC}"
        return 1
    fi
}

# Function to run quick checks (for pre-commit)
run_quick_pipeline() {
    print_header "QUICK TEST PIPELINE"
    echo -e "${BLUE}Running fast checks for pre-commit...${NC}"
    echo ""
    
    run_linting || return 1
    run_typecheck || return 1
    
    # Run tests but don't fail if no tests exist
    print_step "Running quick tests"
    if is_docker_env; then
        if npm run test -- --passWithNoTests --silent; then
            pass_step "Quick tests completed"
        else
            warn_step "Some tests failed (continuing anyway for quick check)"
        fi
    else
        if docker exec limina-platform npm run test -- --passWithNoTests --silent; then
            pass_step "Quick tests completed"
        else
            warn_step "Some tests failed (continuing anyway for quick check)"
        fi
    fi
    
    echo ""
    show_summary
}

# Function to run full pipeline
run_full_pipeline() {
    print_header "FULL TEST PIPELINE"
    echo -e "${BLUE}Running comprehensive code quality checks...${NC}"
    echo ""
    
    run_dependency_check
    run_linting || return 1
    run_typecheck || return 1
    run_tests "unit" || return 1
    run_build_check || return 1
    
    echo ""
    show_summary
}

# Function to run CI pipeline
run_ci_pipeline() {
    print_header "CI/CD TEST PIPELINE"
    echo -e "${BLUE}Running CI/CD pipeline checks...${NC}"
    echo ""
    
    run_dependency_check
    run_linting || return 1
    run_typecheck || return 1
    run_tests "coverage" || return 1
    run_build_check || return 1
    
    echo ""
    print_step "Generating test reports"
    if is_docker_env; then
        if [ -d "coverage" ]; then
            echo "Coverage report generated in ./coverage/"
            pass_step "Test reports available"
        else
            warn_step "No coverage report generated"
        fi
    else
        if docker exec limina-platform test -d "coverage"; then
            echo "Coverage report generated in ./coverage/"
            pass_step "Test reports available"
        else
            warn_step "No coverage report generated"
        fi
    fi
    
    echo ""
    show_summary
}

# Function to check environment
check_environment() {
    print_step "Checking environment"
    
    if is_docker_env; then
        print_success "Running inside Docker container"
    else
        print_step "Running on host machine, checking Docker..."
        if ! docker info > /dev/null 2>&1; then
            print_error "Docker is not running"
            return 1
        fi
        
        if ! docker ps --format "table {{.Names}}" | grep -q "limina-platform"; then
            print_error "limina-platform container is not running"
            echo "Start the development environment with: ./dev.sh"
            return 1
        fi
        
        print_success "Docker environment is ready"
    fi
}

# Main function
main() {
    local pipeline_type="${1:-full}"
    
    case "$pipeline_type" in
        "quick"|"pre-commit")
            check_environment || exit 1
            run_quick_pipeline
            ;;
        "full"|"")
            check_environment || exit 1
            run_full_pipeline
            ;;
        "ci"|"ci-cd")
            check_environment || exit 1
            run_ci_pipeline
            ;;
        "watch")
            check_environment || exit 1
            print_header "WATCH MODE"
            echo "Starting tests in watch mode..."
            run_tests "watch"
            ;;
        "help")
            echo "Limina Platform Test Pipeline"
            echo ""
            echo "Usage: $0 [pipeline-type]"
            echo ""
            echo "Pipeline Types:"
            echo "  quick, pre-commit   Fast checks for pre-commit hooks"
            echo "  full (default)      Complete pipeline with all checks"
            echo "  ci, ci-cd          CI/CD pipeline with coverage reports"
            echo "  watch              Run tests in watch mode"
            echo "  help               Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                 # Run full pipeline"
            echo "  $0 quick           # Quick pre-commit checks"
            echo "  $0 ci              # CI/CD pipeline"
            echo "  $0 watch           # Watch mode for development"
            echo ""
            ;;
        *)
            print_error "Unknown pipeline type: $pipeline_type"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"