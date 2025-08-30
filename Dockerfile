# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Install frontend deps
COPY frontend/package*.json ./
RUN npm install --include=dev

# Copy and build frontend
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Setup backend ----
FROM node:20-alpine

WORKDIR /app

# Copy backend package files & install deps
COPY package*.json ./
RUN npm install

# Copy backend source
COPY . .

# Copy built frontend into backend's public folder (adjust if needed)
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 5000
CMD ["node", "server.js"]