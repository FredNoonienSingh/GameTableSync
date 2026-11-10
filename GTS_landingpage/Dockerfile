FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY packages/ui/package.json ./packages/ui/
COPY GTS_landingpage/package.json ./GTS_landingpage/
COPY GTS_app/frontend/package.json ./GTS_app/frontend/
RUN npm install --no-audit --no-fund && npm install nodemailer @types/nodemailer --no-save

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/ui ./packages/ui
COPY GTS_landingpage ./GTS_landingpage

RUN rm -rf /app/GTS_landingpage/public && mkdir -p /app/GTS_landingpage/public

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1536"

RUN npm --workspace=GTS_landingpage run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/GTS_landingpage/public ./GTS_landingpage/public
COPY --from=builder --chown=nextjs:nodejs /app/GTS_landingpage/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/GTS_landingpage/.next/static ./GTS_landingpage/.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "GTS_landingpage/server.js"]
