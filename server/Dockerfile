# Stage 1: Build the server
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace manifests for npm workspace resolution
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all dependencies (dev deps needed for prisma generate + tsc)
# Skip root postinstall — we run prisma generate manually after copying schema
RUN npm ci --workspace=server --ignore-scripts

# Copy source files
COPY tsconfig.base.json ./
COPY server/ ./server/

# Generate Prisma client (needs schema.prisma)
RUN npx prisma generate --schema=./server/prisma/schema.prisma

# Compile TypeScript
WORKDIR /app/server
RUN npm run build

# Stage 2: Production runtime
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install production dependencies only
RUN npm ci --workspace=server --omit=dev --ignore-scripts

# Copy compiled server output from builder
COPY --from=builder /app/server/dist ./server/dist

# Copy Prisma generated client from builder (platform-specific query engine)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma CLI from builder (needed for migrate deploy in entrypoint)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy Prisma schema and migrations (needed for prisma migrate deploy)
COPY --from=builder /app/server/prisma ./server/prisma

# Copy entrypoint script
COPY server/docker-entrypoint.sh ./server/docker-entrypoint.sh
RUN chmod +x ./server/docker-entrypoint.sh

EXPOSE 5002

ENTRYPOINT ["./server/docker-entrypoint.sh"]
CMD ["node", "server/dist/index.js"]
