# 1. Use Node.js 20 (Compatible with your logs)
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package files first to cache dependencies
COPY package*.json ./

# 4. Install all dependencies
RUN npm install

# 5. Copy the rest of your code
COPY . .

# 6. Build the React Frontend
# This creates the 'dist' folder that server.js looks for
RUN npm run build

# 7. Expose the port (Informational)
EXPOSE 3000

# 8. Start the server

CMD ["node", "server.js"]
