ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js and npm
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy package files
COPY rootfs/app/package.json .
COPY rootfs/app/package-lock.json .

# Install dependencies
RUN npm ci --omit=dev

# Copy application
COPY rootfs/app/ .

EXPOSE 3000

# Copy the run script
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

# Use s6-overlay init system
ENTRYPOINT ["/init"]
CMD ["/app/run.sh"]

