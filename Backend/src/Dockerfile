# Use Node.js LTS version
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create a non-root user
RUN useradd -r -u 1001 -g root velociroute
RUN chown -R velociroute:root /usr/src/app
USER velociroute

# Expose backend port
EXPOSE 4000

# Set Node environment
ENV NODE_ENV=production

# Start the server
CMD ["node", "index.js"]
