FROM node:22-alpine

WORKDIR /app

# Dependency manifests first, so Docker can cache this layer
COPY package.json package-lock.json ./

# Exact reproducible install from lockfile
RUN npm ci

# Then copy application source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
