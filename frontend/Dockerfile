# Use Node.js base
FROM node:20-slim

# Set working directory
WORKDIR /app

# 1. Cache Dependencies
# Copy package files first so we don't re-install npm on every code change
COPY package.json package-lock.json ./
RUN npm install

# 2. Copy Source Code
COPY . .

# 3. Expose the configured Vite port
EXPOSE 8080

# 4. Run Vite
# --host is CRITICAL: it allows the container to be accessed from your browser
CMD ["npm", "run", "dev", "--", "--host"]