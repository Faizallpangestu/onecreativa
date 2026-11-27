FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY playwright-pdf-worker.mjs ./

ENV PORT=3100
EXPOSE 3100

CMD ["node", "playwright-pdf-worker.mjs"]

