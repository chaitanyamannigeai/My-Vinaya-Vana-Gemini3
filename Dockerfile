# 1. Use Node.js 20
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install ALL dependencies (including devDependencies)
# 'npm ci' is faster and more reliable than 'npm install' for builds
# If no package-lock.json exists, it falls back to npm install
RUN npm install --include=dev

# 5. Copy source code
COPY . .

# 6. Build Frontend
RUN npm install --production=false 

# 7. Prune dev dependencies to keep image small (Optional, but good practice)
# We keep 'dependencies' (express, mysql2) but remove 'devDependencies' (vite, tailwind)
# BUT: simple 'npm install' is safer for now to avoid deleting something needed.
# So we skip the prune step to be safe.

# 8. Expose Port
EXPOSE 3000

# 9. Start Server
CMD ["node", "server.js"]