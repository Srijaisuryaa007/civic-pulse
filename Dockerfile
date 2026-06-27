# ==========================================
# STAGE 1: Build the React client
# ==========================================
FROM node:18-alpine AS client-builder

WORKDIR /client

# Install client dependencies
COPY client/package.json client/package-lock.json* ./
RUN npm install

# Copy client source code and compile
COPY client/ ./
RUN npm run build

# ==========================================
# STAGE 2: Set up Express backend and serve React static build
# ==========================================
FROM node:18-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN npm install --prefix server --omit=dev

# Copy backend source
COPY server/ ./server/

# Copy React compiled assets from stage 1
COPY --from=client-builder /client/dist ./client/dist

# Expose port (Google Cloud Run assigns PORT dynamically, fallback to 8080)
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["node", "server/server.js"]
