#!/bin/bash

# Test script for local Lambda development
echo "Starting local Lambda development environment"

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    echo "Serverless Framework not found. Installing..."
    npm install -g serverless
fi

# Install dependencies if needed
if [ ! -d "node_modules/@vendia" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run serverless offline
echo "Starting serverless offline..."
echo "Your Lambda function will be available at http://localhost:3001"
echo "Press Ctrl+C to stop the server"
npm run offline
