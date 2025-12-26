#!/bin/bash

# CineGen - Development Environment Setup Script
# This script sets up and runs the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CineGen Development Environment Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "app_spec.txt" ]; then
    echo -e "${RED}Error: app_spec.txt not found. Please run from the project root directory.${NC}"
    exit 1
fi

# Check Node.js version
echo -e "${YELLOW}Checking Node.js version...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}Node.js version: $(node -v) ✓${NC}"

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL is not installed. Please install PostgreSQL 14+${NC}"
    exit 1
fi
echo -e "${GREEN}PostgreSQL found ✓${NC}"

# Check if npm is available
echo -e "${YELLOW}Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}npm version: $(npm -v) ✓${NC}"

# Create environment files if they don't exist
create_env_files() {
    echo -e "${YELLOW}Setting up environment files...${NC}"

    # Backend .env
    if [ ! -f "backend/.env" ] && [ -d "backend" ]; then
        cat > backend/.env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cinegen?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRY="7d"

# Server
PORT=3001
NODE_ENV=development

# Email (for development - use console transport)
EMAIL_FROM="noreply@cinegen.local"
SMTP_HOST="localhost"
SMTP_PORT=1025

# Encryption key for API keys (32 bytes hex)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Frontend URL for CORS
FRONTEND_URL="http://localhost:3000"
EOF
        echo -e "${GREEN}Created backend/.env${NC}"
    fi

    # Frontend .env
    if [ ! -f "frontend/.env" ] && [ -d "frontend" ]; then
        cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
EOF
        echo -e "${GREEN}Created frontend/.env${NC}"
    fi
}

# Install dependencies
install_dependencies() {
    echo -e "${YELLOW}Installing dependencies...${NC}"

    if [ -d "backend" ]; then
        echo -e "${BLUE}Installing backend dependencies...${NC}"
        cd backend
        npm install
        cd ..
    fi

    if [ -d "frontend" ]; then
        echo -e "${BLUE}Installing frontend dependencies...${NC}"
        cd frontend
        npm install
        cd ..
    fi

    echo -e "${GREEN}Dependencies installed ✓${NC}"
}

# Setup database
setup_database() {
    echo -e "${YELLOW}Setting up database...${NC}"

    # Check if database exists
    if psql -lqt | cut -d \| -f 1 | grep -qw cinegen; then
        echo -e "${GREEN}Database 'cinegen' already exists ✓${NC}"
    else
        echo -e "${BLUE}Creating database 'cinegen'...${NC}"
        createdb cinegen 2>/dev/null || psql -c "CREATE DATABASE cinegen;" 2>/dev/null || true
        echo -e "${GREEN}Database created ✓${NC}"
    fi

    # Run Prisma migrations if backend exists
    if [ -d "backend" ] && [ -f "backend/prisma/schema.prisma" ]; then
        echo -e "${BLUE}Running Prisma migrations...${NC}"
        cd backend
        npx prisma migrate deploy 2>/dev/null || npx prisma db push
        npx prisma generate
        cd ..
        echo -e "${GREEN}Database schema updated ✓${NC}"
    fi
}

# Start development servers
start_servers() {
    echo -e "${YELLOW}Starting development servers...${NC}"

    # Start backend
    if [ -d "backend" ]; then
        echo -e "${BLUE}Starting backend server...${NC}"
        cd backend
        npm run dev &
        BACKEND_PID=$!
        cd ..
        echo -e "${GREEN}Backend starting on http://localhost:3001${NC}"
    fi

    # Start frontend
    if [ -d "frontend" ]; then
        echo -e "${BLUE}Starting frontend server...${NC}"
        cd frontend
        npm start &
        FRONTEND_PID=$!
        cd ..
        echo -e "${GREEN}Frontend starting on http://localhost:3000${NC}"
    fi

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  CineGen is starting up!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
    echo -e "${BLUE}Backend API:${NC} http://localhost:3001/api"
    echo -e "${BLUE}WebSocket:${NC} ws://localhost:3001"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
    echo ""

    # Wait for servers
    wait
}

# Main execution
main() {
    case "${1:-}" in
        "install")
            install_dependencies
            ;;
        "db")
            setup_database
            ;;
        "env")
            create_env_files
            ;;
        "start")
            start_servers
            ;;
        "setup")
            create_env_files
            install_dependencies
            setup_database
            ;;
        *)
            # Full setup and start
            create_env_files
            install_dependencies
            setup_database
            start_servers
            ;;
    esac
}

# Run main with all arguments
main "$@"
