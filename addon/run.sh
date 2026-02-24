#!/bin/bash
set -e

export DATABASE_PATH="/config/britizen-quiz/quiz_database.db"
export NODE_ENV="production"

mkdir -p /config/britizen-quiz
chown -R app:app /config/britizen-quiz

cd /app

# Run npm start directly (s6-overlay handles process management)
exec npm start

