# Node 20 on Debian slim — gives us apt-get to install other languages
FROM node:20-slim

# Install Python3, OpenJDK (javac + java), g++
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    default-jdk \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Node dependencies first (better layer caching —
# if only source changes, npm install layer is reused)
COPY package*.json ./
RUN npm install --omit=dev

# Copy rest of backend source
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]