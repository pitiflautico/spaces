#!/bin/bash

###############################################################################
# Marketing Spaces - Installation Script
# Automated setup for development environment
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print header
print_header() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║         MARKETING SPACES - INSTALLATION SCRIPT         ║"
    echo "║                    Version 3.0                         ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node_version() {
    log_info "Checking Node.js version..."

    if ! command_exists node; then
        log_error "Node.js is not installed!"
        log_info "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version must be 18 or higher (current: $(node -v))"
        exit 1
    fi

    log_success "Node.js $(node -v) detected"
}

# Check npm
check_npm() {
    log_info "Checking npm..."

    if ! command_exists npm; then
        log_error "npm is not installed!"
        exit 1
    fi

    log_success "npm $(npm -v) detected"
}

# Install main project dependencies
install_main_dependencies() {
    log_info "Installing main project dependencies..."

    if [ -f "package.json" ]; then
        npm install
        log_success "Main project dependencies installed"
    else
        log_error "package.json not found in current directory"
        exit 1
    fi
}

# Install daemon dependencies
install_daemon_dependencies() {
    log_info "Installing Local Automation Daemon dependencies..."

    if [ -d "local-automation-daemon" ]; then
        cd local-automation-daemon

        if [ -f "package.json" ]; then
            npm install
            log_success "Daemon dependencies installed"
        else
            log_warning "package.json not found in local-automation-daemon"
        fi

        cd ..
    else
        log_warning "local-automation-daemon directory not found. Skipping daemon installation."
    fi
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment files..."

    # Main project .env
    if [ ! -f ".env.local" ]; then
        cat > .env.local << 'EOF'
# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/marketing_spaces"

# API Keys (fill these in)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
TOGETHER_API_KEY=""
REPLICATE_API_KEY=""
STABILITY_AI_KEY=""
RECRAFT_API_KEY=""

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DAEMON_URL="http://localhost:5050"

# Session Secret
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
EOF
        log_success "Created .env.local"
    else
        log_warning ".env.local already exists, skipping"
    fi

    # Daemon .env
    if [ -d "local-automation-daemon" ] && [ ! -f "local-automation-daemon/.env" ]; then
        cd local-automation-daemon

        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "Created daemon .env from .env.example"
        else
            cat > .env << 'EOF'
# Local Automation Daemon Environment Variables
PORT=5050
HOST=127.0.0.1
LOG_LEVEL=info
ALLOWED_ORIGIN=http://localhost:3000
EOF
            log_success "Created daemon .env"
        fi

        cd ..
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."

    # Main project directories
    mkdir -p public/uploads
    mkdir -p public/generated
    mkdir -p logs

    # Daemon directories
    if [ -d "local-automation-daemon" ]; then
        mkdir -p local-automation-daemon/logs
        mkdir -p local-automation-daemon/captures
        mkdir -p local-automation-daemon/uploads
    fi

    log_success "Directories created"
}

# Check for MySQL (optional)
check_mysql() {
    log_info "Checking for MySQL..."

    if command_exists mysql; then
        log_success "MySQL detected: $(mysql --version | head -1)"
        log_info "You can setup the database with: npm run db:setup"
    else
        log_warning "MySQL not found. Install it for persistent storage features."
        log_info "macOS: brew install mysql"
        log_info "Ubuntu: sudo apt-get install mysql-server"
    fi
}

# Check for macOS tools (for daemon)
check_macos_tools() {
    log_info "Checking macOS tools (for Local Automation Daemon)..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists xcrun; then
            log_success "Xcode Command Line Tools detected"
        else
            log_warning "Xcode Command Line Tools not found"
            log_info "Install with: xcode-select --install"
        fi

        if command_exists cliclick; then
            log_success "cliclick detected"
        else
            log_warning "cliclick not found (optional, for automation)"
            log_info "Install with: brew install cliclick"
        fi
    else
        log_warning "Not running on macOS. Local Automation Daemon requires macOS."
    fi
}

# Setup database
setup_database() {
    log_info "Setting up database..."

    if command_exists mysql; then
        read -p "Do you want to setup the MySQL database now? (y/N): " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm run db:setup 2>/dev/null || log_warning "Database setup failed. Run 'npm run db:setup' manually later."
        else
            log_info "Skipping database setup. Run 'npm run db:setup' later."
        fi
    else
        log_info "MySQL not available. Skipping database setup."
    fi
}

# Print next steps
print_next_steps() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║              INSTALLATION COMPLETED! 🎉                ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    log_info "Next steps:"
    echo ""
    echo "  1. Configure your API keys in .env.local"
    echo "  2. Setup the database:"
    echo "     $ npm run db:setup"
    echo ""
    echo "  3. Start the development server:"
    echo "     $ npm run dev"
    echo ""
    echo "  4. (Optional) Start the Local Automation Daemon:"
    echo "     $ cd local-automation-daemon"
    echo "     $ npm start"
    echo ""
    echo "  5. Open http://localhost:3000 in your browser"
    echo ""
    log_success "Happy coding! 🚀"
    echo ""
}

# Main installation flow
main() {
    print_header

    # Pre-flight checks
    check_node_version
    check_npm
    check_mysql
    check_macos_tools

    echo ""
    log_info "Starting installation..."
    echo ""

    # Installation steps
    install_main_dependencies
    install_daemon_dependencies
    setup_environment
    create_directories

    # Optional database setup
    setup_database

    # Finish
    print_next_steps
}

# Run main function
main
