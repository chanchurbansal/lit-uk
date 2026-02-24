#!/bin/bash
set -e

export DATABASE_PATH="/config/britizen-quiz/quiz_database.db"
export NODE_ENV="production"

mkdir -p /config/britizen-quiz

cd /app
exec npm start

