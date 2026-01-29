FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies
RUN yarn install --frozen-lockfile

# Copy server source code and config
# Copy application source code
COPY . .

# Ensure start script is executable
RUN chmod +x start-production.sh

# Build the TypeScript code (if needed) or run directly with tsx/ts-node
# For simplicity in this project which uses tsx:
ENV NODE_ENV=production
ENV PORT=3000

# Build the web assets during image construction
RUN npx expo export --platform web && \
    rm -rf static-build && \
    mv dist static-build

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start command
# We use start-production.sh because it now handles migrations
CMD ["sh", "./start-production.sh"]
