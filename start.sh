#!/bin/bash

# OpenBot Startup Script
# Starts the OpenBot server

echo "🚀 Starting OpenBot server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Please run npm install first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Using default configuration."
    echo "ℹ️  Consider copying .env.example to .env and adding your API keys."
fi

# Start the server
echo "🌟 Starting OpenBot server on port 3000..."
node src/index.js

echo "🛑 OpenBot server stopped."