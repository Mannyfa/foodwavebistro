# Use a lightweight Node.js environment
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Start the server (adjust this if your start script in package.json is different)
CMD ["node", "src/server.js"]