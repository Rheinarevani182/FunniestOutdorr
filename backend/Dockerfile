FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY db ./db
COPY src ./src

ENV NODE_ENV=production
ENV PORT=5173

EXPOSE 5173

CMD ["sh", "-c", "npm run db:migrate && npm start"]
