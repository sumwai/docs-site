# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
ARG NPM_REGISTRY
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund ${NPM_REGISTRY:+--registry=$NPM_REGISTRY}

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 内容与站点分仓时，构建前把内容拉进 content/docs；未指定来源时用自带的 content.example/docs。
# 仓库公开且无 token 时限流也会拦，正式构建建议总是带上 secret。
ARG DOCS_CONTENT_REPO
ARG DOCS_CONTENT_REF=main
ARG DOCS_CONTENT_SUBDIR=content/docs
# 品牌参数在构建时写进页面文案，空值退回 site.config.ts 的默认值。
ARG DOCS_SITE_NAME
ARG DOCS_SITE_TAGLINE
ARG DOCS_SITE_DESCRIPTION
ARG DOCS_SITE_LOCALE
ENV DOCS_SITE_NAME=${DOCS_SITE_NAME} \
    DOCS_SITE_TAGLINE=${DOCS_SITE_TAGLINE} \
    DOCS_SITE_DESCRIPTION=${DOCS_SITE_DESCRIPTION} \
    DOCS_SITE_LOCALE=${DOCS_SITE_LOCALE}
RUN --mount=type=secret,id=github_token,env=GITHUB_TOKEN,required=false \
    DOCS_CONTENT_REPO="$DOCS_CONTENT_REPO" \
    DOCS_CONTENT_REF="$DOCS_CONTENT_REF" \
    DOCS_CONTENT_SUBDIR="$DOCS_CONTENT_SUBDIR" \
    node scripts/fetch-content.mjs \
    && npm run build \
    && npm prune --omit=dev

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DOCS_DIST_DIR=.next-build
COPY --from=build /app/package.json /app/next.config.mjs ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next-build ./.next-build
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD wget -qO- http://127.0.0.1:3000/docs >/dev/null || exit 1
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
