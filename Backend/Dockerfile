# Use Node.js LTS version with Alpine Linux
FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Set working directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node uploads

# Create a non-root user
USER node

# Expose backend port
EXPOSE 4000

# Set Node environment
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
