#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   Starting Homestay Backend Server   ${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Check if in correct directory
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: 'backend' directory not found!${NC}"
    echo -e "${YELLOW}Please run this script from the homestay-booking root directory${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    cd backend
    npm install
    cd ..
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: backend/.env file not found!${NC}"
    echo -e "${YELLOW}Please create .env file with required configurations${NC}"
    exit 1
fi

# Check if port 5001 is already in use
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 5001 is already in use!${NC}"
    read -p "Do you want to kill the existing process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Killing process on port 5001...${NC}"
        lsof -ti:5001 | xargs kill -9 2>/dev/null
        sleep 2
    else
        echo -e "${RED}Cannot start backend. Port is occupied.${NC}"
        exit 1
    fi
fi

# Start backend
echo -e "${GREEN}🚀 Starting backend server...${NC}\n"
cd backend
npm run dev
