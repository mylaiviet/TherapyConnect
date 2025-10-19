# Multi-stage Dockerfile for KareMatch
# HIPAA-compliant containerized deployment for AWS ECS Fargate

# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build application
# 1. Vite builds frontend to client/dist
# 2. esbuild bundles backend to dist/index.js
RUN npm run build

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM node:20-alpine

# Install curl for health checks (required by ECS)
RUN apk add --no-cache curl

# Create non-root user for security (HIPAA best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built artifacts from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/client/dist ./client/dist

# Copy runtime files (needed for any dynamic imports or runtime requirements)
COPY --chown=nodejs:nodejs server ./server
COPY --chown=nodejs:nodejs shared ./shared

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Health check for AWS ECS/ALB
# ECS will use this to determine if container is healthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Environment variables (will be overridden by ECS task definition)
ENV NODE_ENV=production
ENV PORT=5000

# Start application
CMD ["node", "dist/index.js"]
