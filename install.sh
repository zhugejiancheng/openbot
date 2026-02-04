#!/bin/bash

# OpenBot Installation Script
# This script installs all necessary dependencies for OpenBot

echo "🚀 Starting OpenBot installation..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v14 or higher) first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$NODE_MAJOR" -lt 14 ]; then
    echo "❌ Node.js version is too low ($NODE_VERSION). Please upgrade to Node.js 14 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm detected"

# Run the interactive installer
echo "🎮 Starting interactive installation wizard..."
node install-wizard.js

if [ $? -ne 0 ]; then
    echo "❌ Installation failed"
    exit 1
fi