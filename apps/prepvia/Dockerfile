# Use official Node.js image
FROM node:22

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory to backend app
WORKDIR /apps

# Copy backend's package.json and lockfile for dependency installation
COPY apps/prepvia/package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy backend source code (including Prisma & TS)
COPY apps/prepvia .

# Build TypeScript to generate dist/
RUN pnpm run build

# Expose the backend port
EXPOSE 4000

# Run the backend app
CMD ["pnpm", "run", "start"]
