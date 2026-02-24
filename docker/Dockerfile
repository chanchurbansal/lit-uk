# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files
COPY ../package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY ../ .

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start the application (run as root to avoid permission issues with bind mounts)
CMD ["npm", "start"]
