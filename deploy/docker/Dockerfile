FROM node:22-alpine AS build

WORKDIR /workspace
ENV ASTRO_TELEMETRY_DISABLED=1
ENV CI=true
RUN corepack enable

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json vitest.config.ts eslint.config.mjs ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/site/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- http://127.0.0.1:8080/-/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
