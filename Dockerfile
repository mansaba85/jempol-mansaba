# Stage 1: Build the React Client
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --legacy-peer-deps
COPY client/ ./
RUN npm run build

# Stage 2: Build the Node.js Server
FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --legacy-peer-deps
COPY server/ ./
# Generate Prisma with verbose output to catch errors
RUN npx prisma generate
RUN npm run build

# Stage 3: Production Environment
FROM node:22-alpine
ENV NODE_ENV=production
ENV TZ=Asia/Jakarta

# Install OpenSSL and tzdata
RUN apk add --no-cache openssl tzdata

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

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
