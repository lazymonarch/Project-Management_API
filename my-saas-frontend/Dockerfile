FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# DO NOT copy source code in dev
# Source is mounted via docker-compose

EXPOSE 3000

ENV NODE_ENV=development

CMD ["npm", "run", "dev"]
