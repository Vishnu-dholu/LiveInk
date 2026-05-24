# Use a newer Node.js image to fix the npm optional dependencies bug
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# We can safely copy both files now!
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend files into the container
COPY . .

# Build the Vite project for production
RUN npm run build

# Expose port 5173 (default Vite port)
EXPOSE 5173

# Start the Vite development server
CMD ["npm", "run", "dev", "--", "--host"]