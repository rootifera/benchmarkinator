#!/bin/bash

# Build script for Benchmarkinator Web UI
echo "🚀 Building Benchmarkinator Web UI..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t benchmarkinator-webui:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "📋 Image details:"
    docker images benchmarkinator-webui:latest
    echo ""
    echo "🔧 To run the container:"
    echo "   docker run -p 4000:80 benchmarkinator-webui:latest"
    echo ""
    echo "🌐 The web UI will be available at: http://localhost:4000"
    echo ""
    echo "📚 To use with docker-compose, run from the parent directory:"
    echo "   docker-compose up benchmarkinator-webui"
else
    echo "❌ Docker build failed!"
    exit 1
fi
