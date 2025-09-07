FROM node:20-alpine AS base
WORKDIR /app
COPY out ./out
RUN npm i -g serve
ENV PORT=3000
EXPOSE 3000
CMD ["serve", "-s", "out", "-l", "0.0.0.0:${PORT}"]
