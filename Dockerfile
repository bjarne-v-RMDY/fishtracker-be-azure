# Stage 1: Build the Bun application
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package.json and bun.lockb first to leverage Docker cache
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of your application code
COPY . .

# Build the Bun application into a single binary
RUN bun run build

# Stage 2: Create a slim runtime image
FROM oven/bun:latest

WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/dist/api-binary ./api-binary

# Expose the port your API listens on (default Bun port is 3000, but you'll use an environment variable)
EXPOSE 3000

# Set environment variables (these will be overridden by Azure App Service settings)
ENV PORT=3000
ENV MONGODB_URI=your_mongodb_connection_string_here

# Run the compiled binary
CMD ["./api-binary"]