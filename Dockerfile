# Use official Node.js runtime as base image (ARM-compatible for Raspberry Pi)
FROM node:18-alpine

# Set working directory in container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application files
COPY . .

# Create tasks.json from example if it doesn't exist
RUN if [ ! -f tasks.json ]; then cp tasks.example.json tasks.json; fi

# Create directory for data persistence
RUN mkdir -p /usr/src/app/data

# Expose port 3000
EXPOSE 3000

# Create non-root user for security
RUN addgroup -g 36953 -S nodejs
RUN adduser -S putzplan -u 36953

# Change ownership of app directory
RUN chown -R putzplan:nodejs /usr/src/app
USER putzplan

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"]
