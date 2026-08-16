FROM node:20-alpine AS build
WORKDIR /site
RUN corepack enable
COPY site/package.json site/pnpm-lock.yaml site/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY site/ ./
COPY data/ ../data/
COPY scripts/ ../scripts/
ARG SITE_URL=https://saints.superversive.net
ENV SITE_URL=$SITE_URL
RUN pnpm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/dist /usr/share/nginx/html
EXPOSE 80
