# Build stage
FROM docker.io/library/rust:1.86 AS builder

WORKDIR /app

# Install diesel CLI for migrations
RUN cargo install diesel_cli --no-default-features --features postgres

# Copy Cargo files first for caching
COPY Cargo.toml Cargo.lock ./

# Create dummy src to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy actual source code
COPY src ./src
COPY diesel.toml ./

# Build the actual application
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM docker.io/library/debian:bookworm-slim

WORKDIR /app

# Install required dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from builder
COPY --from=builder /app/target/release/league_of_legends /app/server
COPY --from=builder /usr/local/cargo/bin/diesel /usr/local/bin/diesel

# Copy diesel config
COPY diesel.toml ./

# Copy frontend static files
COPY frontend ./frontend

# Copy statics
COPY statics ./statics

# Expose port
EXPOSE 8000

# Run the server
CMD ["./server"]
