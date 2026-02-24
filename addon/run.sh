#!/bin/bash
set -e

export DATABASE_PATH="/app/data/quiz_database.db"
export NODE_ENV="production"

# Create data directory for database
mkdir -p /app/data

cd /app

# Run npm start
exec npm start

