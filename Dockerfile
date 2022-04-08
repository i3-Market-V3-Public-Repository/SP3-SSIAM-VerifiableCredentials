FROM node:14 AS builder

WORKDIR /app
COPY ./app /app

RUN npm i && npm run build

FROM node:14
COPY --from=builder /app/dist /app/dist
COPY ./.env.vc ./docker-compose.yaml ./app/package.json ./app/package-lock.json /app/
COPY ./docker/template ./docker/entrypoint ./docker/init-volumes /usr/local/bin/
COPY ./app/misc/credential-registry.json /app/default/misc/
COPY ./app/misc/issuer-registry.json /app/default/misc/
COPY ./app/misc/whitelist.js /app/default/misc/

WORKDIR /app
RUN npm i --only=prod

EXPOSE 4200

CMD ["entrypoint"]
