# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the app using Vite
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the generated build output from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 8080 (Cloud Run uses 8080 by default)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
