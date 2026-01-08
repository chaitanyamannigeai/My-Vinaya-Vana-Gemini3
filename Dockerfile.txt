# 1. Use Node.js 20
FROM node:20-alpine

# 2. Set the working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies with the Fix for ERESOLVE
# This flag is critical to bypass the Vite/Rollup version conflict
RUN npm install --legacy-peer-deps

# 5. Copy the rest of your code
COPY . .

# 6. Build the React Frontend
# This generates the 'dist' folder required by server.js
RUN npm run build

# 7. Set Environment to Production
ENV NODE_ENV=production

# 8. Expose the port
EXPOSE 3000

# 9. Start the server
CMD ["node", "server.js"]