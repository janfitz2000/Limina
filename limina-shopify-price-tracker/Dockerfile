FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for development)
RUN npm install

# Expose port
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]