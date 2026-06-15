# Stage 1: Build the React SPA
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace manifests for npm workspace resolution
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install client dependencies (skip root postinstall which runs prisma generate)
RUN npm ci --workspace=client --ignore-scripts

# Copy source files needed for the build
COPY tsconfig.base.json ./
COPY client/ ./client/

# Build the client
WORKDIR /app/client
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets from builder
COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
