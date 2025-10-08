FROM node:lts-alpine AS deps

COPY package*.json .
RUN apk add --no-cache build-base make autoconf automake libtool libsodium python3
RUN npm ci --omit-dev

FROM node:lts-alpine AS build

COPY package*.json .

FROM node:lts-alpine

COPY . .
WORKDIR /app

ENV TOKEN=${TOKEN}
ENV NODE_ENV=prod

COPY --from=dependencies node_modules/ node_modules/
COPY --from=compilation dist/ dist/

CMD [ "node", "./dist/app.js" ]
