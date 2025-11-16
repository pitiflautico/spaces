#!/bin/bash

###############################################################################
# Database Setup Script
# Creates MySQL database and runs Prisma migrations
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "╔════════════════════════════════════════════════════════╗"
echo "║          MARKETING SPACES - DATABASE SETUP             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    log_error "MySQL is not installed or not in PATH"
    log_info "macOS: brew install mysql"
    log_info "Ubuntu: sudo apt-get install mysql-server"
    exit 1
fi

log_info "Checking MySQL connection..."

# Get database credentials from .env.local
if [ -f ".env.local" ]; then
    source .env.local
else
    log_error ".env.local not found!"
    log_info "Please create .env.local with DATABASE_URL"
    exit 1
fi

# Parse DATABASE_URL
# Format: mysql://user:password@host:port/database
DB_USER="root"
DB_PASS="password"
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="marketing_spaces"

# Extract from DATABASE_URL if set
if [ ! -z "$DATABASE_URL" ]; then
    # Simple parsing (works for basic URLs)
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
fi

log_info "Database: $DB_NAME"
log_info "Host: $DB_HOST:$DB_PORT"

# Prompt for MySQL root password
echo ""
read -sp "Enter MySQL root password: " MYSQL_ROOT_PASS
echo ""
echo ""

# Create database if it doesn't exist
log_info "Creating database '$DB_NAME' if it doesn't exist..."

mysql -u root -p"$MYSQL_ROOT_PASS" -h "$DB_HOST" -P "$DB_PORT" <<EOF
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

if [ $? -eq 0 ]; then
    log_success "Database '$DB_NAME' created or already exists"
else
    log_error "Failed to create database"
    exit 1
fi

# Generate Prisma Client
log_info "Generating Prisma Client..."
npx prisma generate

# Run Prisma migrations
log_info "Running database migrations..."
npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    log_success "Database migrations completed successfully"
else
    log_error "Migration failed"
    exit 1
fi

# Optional: Seed database
if [ -f "prisma/seed.ts" ]; then
    log_info "Seeding database..."
    npx prisma db seed
fi

echo ""
log_success "Database setup completed! 🎉"
echo ""
log_info "You can now:"
echo "  - View database: npx prisma studio"
echo "  - Run migrations: npx prisma migrate dev"
echo "  - Reset database: npx prisma migrate reset"
echo ""
