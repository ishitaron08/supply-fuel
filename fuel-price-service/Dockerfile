# ────────────────────────────────────────────
# Fuel Price Microservice — Dockerfile
# ────────────────────────────────────────────
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

# Expose port
EXPOSE 5000

# Start the service
CMD ["node", "src/index.js"]
