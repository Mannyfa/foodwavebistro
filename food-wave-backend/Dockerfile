# Use a lightweight Node.js environment
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies (ignoring the strict Cloudinary version check)
RUN npm install --production --legacy-peer-deps

# Copy the rest of your application code
COPY . .


EXPOSE 5000

# Start the server
CMD ["node", "src/server.js"]