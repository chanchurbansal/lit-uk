#!/bin/bash
set -e

export DATABASE_PATH="/config/britizen-quiz/quiz_database.db"
export NODE_ENV="production"

mkdir -p /config/britizen-quiz

cd /app

# Run as non-root user using su-exec (compatible with s6-overlay)
exec su-exec app npm start

