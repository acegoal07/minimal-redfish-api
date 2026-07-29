FROM node:latest

WORKDIR /app

# Copy source
COPY . .

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Switch to the build output
WORKDIR /app/dist

# Install production dependencies only
RUN npm run prod:install

EXPOSE 3000

CMD ["npm", "run", "prod"]