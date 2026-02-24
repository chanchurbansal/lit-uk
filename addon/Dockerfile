ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js and npm
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy package files
COPY rootfs/app/package.json .
COPY rootfs/app/package-lock.json .

# Install dependencies (production only)
RUN npm ci --omit=dev

# Copy application
COPY rootfs/app/ .

# Create non-root user but don't switch to it yet
RUN addgroup -g 1000 app && \
    adduser -D -u 1000 -G app app && \
    chown -R app:app /app

EXPOSE 3000

# Copy the run script
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

# Use s6-overlay init system (don't use USER directive)
ENTRYPOINT ["/init"]
CMD ["/app/run.sh"]

