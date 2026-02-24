ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js and npm
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy package files
COPY rootfs/app/package.json .

# Install dependencies
RUN npm ci --omit=dev

# Copy application
COPY rootfs/app/ .

# Create non-root user
RUN addgroup -g 1000 app && \
    adduser -D -u 1000 -G app app && \
    chown -R app:app /app

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]

