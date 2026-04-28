# Stage 1: Build the React Client
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Node.js Server
FROM node:18-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Stage 3: Production Environment
FROM node:18-alpine
ENV NODE_ENV=production

# Install OpenSSL for Prisma Client
RUN apk add --no-cache openssl

# Setup Server Dir
WORKDIR /app/server
COPY --from=server-build /app/server/package*.json ./
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/prisma ./prisma
COPY --from=server-build /app/server/node_modules ./node_modules

# Setup Client Dir
WORKDIR /app/client/dist
COPY --from=client-build /app/client/dist ./

WORKDIR /app/server
EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
