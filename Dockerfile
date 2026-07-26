# Match package.json engines.node
FROM node:24.11.1

WORKDIR /app

# pnpm via Corepack (ships with Node)
RUN corepack enable

# Lockfile first for better layer caching
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]