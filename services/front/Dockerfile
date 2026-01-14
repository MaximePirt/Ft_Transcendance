# Create a dockerfile for the frontend service
FROM node:18-alpine

# Set the working directory
WORKDIR /app
# Copy the package.json and package-lock.json files
COPY package*.json ./
# Install the dependencies
RUN npm install
# Copy the rest of the application code
COPY . .
# Build the application
RUN npm run build
# Expose port 3000
EXPOSE 3000
# Start the application
CMD ["npm", "start"]