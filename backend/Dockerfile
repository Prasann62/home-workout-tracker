# Multi-stage Dockerfile for RepAI Personal Backend

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definition
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src/ ./src

# Build TypeScript to JavaScript in /app/dist
RUN npm run build

# 2. Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/app/data/repai.db
ENV BACKUP_DIR=/app/backups

# Copy built code & package definitions
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Create volume mount directories
RUN mkdir -p /app/data /app/backups

EXPOSE 4000

CMD ["node", "dist/index.js"]
