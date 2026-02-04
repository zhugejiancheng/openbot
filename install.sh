#!/bin/bash

# OpenBot Installation Script
# Sets up the development environment for OpenBot

echo "🚀 Installing OpenBot dependencies..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt 14 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 14 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm detected."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully."
else
    echo "❌ Failed to install dependencies."
    exit 1
fi

# Check if .env file exists, if not create from example
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from example..."
    cp .env.example .env
    echo "ℹ️  Please edit .env file to add your API keys."
fi

echo "🎯 OpenBot installation complete!"
echo ""
echo "📋 To start the server:"
echo "  1. Edit .env to add your API keys (optional but recommended)"
echo "  2. Run: npm start"
echo ""
echo "🧪 To run in development mode:"
echo "  Run: npm run dev (requires nodemon: npm install -g nodemon)"
echo ""
echo "🧪 To run tests:"
echo "  Run: npm test"