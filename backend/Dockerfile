# Use an official Node.js image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for efficient dependency installation
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all backend files into the container
COPY . .

# Expose port 5000 for API and WebSocket communication
EXPOSE 5000

# Start the backend server
CMD ["node", "server.js"]
