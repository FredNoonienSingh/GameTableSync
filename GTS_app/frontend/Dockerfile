FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY packages/ui/package.json ./packages/ui/
COPY GTS_landingpage/package.json ./GTS_landingpage/
COPY GTS_app/frontend/package.json ./GTS_app/frontend/
COPY GTS_app/frontend/package.json ./GTS_app/frontend/
COPY GTS_app/frontend/package.json ./GTS_app/frontend/
COPY GTS_app/frontend/package.json ./GTS_app/frontend/
RUN npm install --no-audit --no-fund --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/ui ./packages/ui
COPY GTS_app/frontend ./GTS_app/frontend

RUN rm -rf /app/GTS_app/frontend/public && mkdir -p /app/GTS_app/frontend/public

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=https://app.gametablesync.com
ENV NODE_OPTIONS="--max-old-space-size=1536"

RUN npm install @mantine/dates@^7.16.2 --workspace=GTS_app/frontend --legacy-peer-deps
RUN npm --workspace=GTS_app/frontend run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/GTS_app/frontend/public ./GTS_app/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/GTS_app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/GTS_app/frontend/.next/static ./GTS_app/frontend/.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "GTS_app/frontend/server.js"]
