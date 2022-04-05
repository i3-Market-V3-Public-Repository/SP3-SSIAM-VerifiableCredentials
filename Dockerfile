FROM node:14 AS builder

WORKDIR /app
COPY ./app /app

RUN npm i && npm run build

FROM node:14
COPY --from=builder /app/dist /app/dist
COPY ./production.env ./docker-compose.yaml ./app/package.json ./app/database.sqlite ./app/package-lock.json ./app/.npmrc /app/
COPY ./docker/template ./docker/entrypoint ./docker/init-volumes /usr/local/bin/
COPY ./app/misc/whitelist.js /app/misc/
COPY ./app/misc/credential-registry.json /app/misc/
COPY ./app/misc/issuer-registry.json /app/misc/


WORKDIR /app
RUN npm i --only=prod

EXPOSE 4200

CMD ["entrypoint"]
