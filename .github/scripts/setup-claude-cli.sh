#!/bin/bash
# Setup script for Claude CLI in GitHub Actions

set -e

echo "Setting up Claude CLI for GitHub Actions..."

# Install Node.js if not available
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install Claude CLI globally
npm install -g @anthropic/claude-cli

# Verify installation
claude --version

# Configure Claude CLI with API key
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"

echo "Claude CLI setup complete!"