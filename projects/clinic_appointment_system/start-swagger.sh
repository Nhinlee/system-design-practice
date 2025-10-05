#!/bin/bash

echo "🚀 Starting Swagger UI for Clinic Appointment System API Documentation"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "📦 Starting Swagger UI container..."
docker-compose up -d swagger-ui

# Wait a moment for the container to start
sleep 2

# Check if container is running
if docker ps | grep -q clinic_swagger_ui; then
    echo ""
    echo "✅ Swagger UI is running!"
    echo ""
    echo "📚 Access your API documentation at:"
    echo "   👉 http://localhost:8080"
    echo ""
    echo "💡 Tips:"
    echo "   - The UI will automatically load your OpenAPI spec"
    echo "   - You can test API endpoints directly from the browser"
    echo "   - Edit docs/apis/openapi.yaml and restart to see changes"
    echo ""
    echo "🛑 To stop Swagger UI:"
    echo "   docker-compose stop swagger-ui"
    echo ""
    
    # Try to open browser (macOS)
    if command -v open &> /dev/null; then
        echo "🌐 Opening browser..."
        sleep 1
        open http://localhost:8080
    fi
else
    echo "❌ Failed to start Swagger UI container"
    echo "Check logs with: docker-compose logs swagger-ui"
    exit 1
fi
