FROM node:20-slim

# Install git and other dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Set environment variables
ENV NODE_ENV=development

# Set up global npm configuration
RUN npm config set prefix /home/node/.npm-global
ENV PATH=/home/node/.npm-global/bin:$PATH

# Install global dependencies
RUN npm install -g @vue/cli 