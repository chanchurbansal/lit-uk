#!/bin/bash

# Create data directory if it doesn't exist
mkdir -p ../data

# Set proper permissions for the data directory
chmod 777 ../data

echo "Data directory prepared with proper permissions"
echo "Starting Docker Compose..."

# Run docker compose
docker compose up -d

echo "Quiz application is starting..."
echo "Database will be available at: $(pwd)/../data/quiz_database.db"
echo "Application will be available at: http://localhost:3000"

# Wait a moment and check if the database was created
sleep 3
if [ -f "../data/quiz_database.db" ]; then
    echo "✅ Database file created successfully!"
else
    echo "⚠️  Database file not yet created - check container logs with: docker compose logs"
fi
