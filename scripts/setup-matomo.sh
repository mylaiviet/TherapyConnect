#!/bin/bash

# ============================================================================
# Matomo Analytics Setup Script for TherapyConnect
# ============================================================================
# Purpose: Automated setup of self-hosted Matomo analytics
# Execution time: ~2-3 minutes
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "============================================================================"
    echo -e "${GREEN}$1${NC}"
    echo "============================================================================"
    echo ""
}

# Check if Docker is installed
check_docker() {
    print_status "Checking for Docker..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        echo ""
        echo "Please install Docker first:"
        echo "  - Windows/Mac: https://www.docker.com/products/docker-desktop"
        echo "  - Linux: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_status "Checking for Docker Compose..."
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Start Matomo containers
start_matomo() {
    print_header "Starting Matomo Analytics Containers"

    print_status "Pulling latest Matomo images..."
    docker-compose -f docker-compose.matomo.yml pull

    print_status "Starting containers..."
    docker-compose -f docker-compose.matomo.yml up -d

    print_success "Matomo containers started!"
}

# Wait for Matomo to be ready
wait_for_matomo() {
    print_status "Waiting for Matomo to be ready..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:8080/matomo.php > /dev/null 2>&1; then
            print_success "Matomo is ready!"
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    print_warning "Matomo may still be starting up. Check logs with: docker-compose -f docker-compose.matomo.yml logs -f"
}

# Display setup information
display_setup_info() {
    print_header "Matomo Installation Complete!"

    echo "🎉 Matomo is now running!"
    echo ""
    echo "📍 Access Matomo at: ${GREEN}http://localhost:8080${NC}"
    echo ""
    echo "📋 Database Configuration (for installation wizard):"
    echo "   - Database Server: ${GREEN}matomo-db${NC}"
    echo "   - Database Name: ${GREEN}matomo${NC}"
    echo "   - Database Username: ${GREEN}matomo${NC}"
    echo "   - Database Password: ${GREEN}SecurePassword123!${NC}"
    echo ""
    echo "🔐 Create Super Admin Account"
    echo "   - Choose a strong password"
    echo "   - Use your email address"
    echo ""
    echo "🌐 Create Two Websites:"
    echo "   1. ${GREEN}TherapyConnect - Anonymous${NC}"
    echo "      - URL: https://therapyconnect.com"
    echo "      - Site ID should be: ${GREEN}1${NC}"
    echo ""
    echo "   2. ${GREEN}TherapyConnect - Authenticated${NC}"
    echo "      - URL: https://app.therapyconnect.com"
    echo "      - Site ID should be: ${GREEN}2${NC}"
    echo ""
    echo "📖 Next Steps:"
    echo "   1. Open http://localhost:8080 in your browser"
    echo "   2. Complete the installation wizard"
    echo "   3. Configure HIPAA compliance settings (see docs/analytics/QUICK-START.md)"
    echo "   4. Generate API auth token"
    echo "   5. Update your .env file with Matomo configuration"
    echo ""
    echo "📚 Documentation:"
    echo "   - Quick Start: ${BLUE}docs/analytics/QUICK-START.md${NC}"
    echo "   - Full Guide: ${BLUE}docs/analytics/MATOMO-IMPLEMENTATION-GUIDE.md${NC}"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   - View logs: ${BLUE}docker-compose -f docker-compose.matomo.yml logs -f${NC}"
    echo "   - Stop Matomo: ${BLUE}docker-compose -f docker-compose.matomo.yml down${NC}"
    echo "   - Restart Matomo: ${BLUE}docker-compose -f docker-compose.matomo.yml restart${NC}"
    echo ""
}

# Main execution
main() {
    print_header "TherapyConnect - Matomo Analytics Setup"

    # Check prerequisites
    check_docker
    check_docker_compose

    # Start Matomo
    start_matomo

    # Wait for it to be ready
    wait_for_matomo

    # Display setup information
    display_setup_info

    print_success "Setup script complete!"
    echo ""
    echo "🚀 Open your browser to: ${GREEN}http://localhost:8080${NC}"
    echo ""
}

# Run main function
main
