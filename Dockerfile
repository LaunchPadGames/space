FROM node:16
WORKDIR /asteroids
COPY package*.json ./

RUN npm install
COPY . .