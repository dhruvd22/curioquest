# Build static site
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/out ./out
COPY --from=builder /app/serverless.mjs ./serverless.mjs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
RUN npm i -g serve
ENV PORT=3000
EXPOSE 3000
CMD ["serve", "-s", "out", "-l", "0.0.0.0:${PORT}"]
