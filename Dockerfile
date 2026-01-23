FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies
RUN yarn install --frozen-lockfile --production

# Copy server source code and config
COPY server/ ./server/
COPY config/ ./config/
COPY services/ ./services/
COPY utils/ ./utils/
COPY scripts/ ./scripts/
COPY drizzle.config.ts ./
COPY tsconfig.json ./

# Build the TypeScript code (if needed) or run directly with tsx/ts-node
# For simplicity in this project which uses tsx:
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start command
CMD ["yarn", "tsx", "server/index.ts"]
