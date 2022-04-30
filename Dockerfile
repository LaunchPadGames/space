FROM node:16
WORKDIR /asteroids
COPY package*.json ./

RUN npm install -g npm@latest
RUN npm install
COPY . .