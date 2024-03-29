const connect_agones = require('./connect_agones')
const path = require('path')
const express = require('express')
const app = express()
// const db = require('./db');
const server = require('http').Server(app)
const io = require('socket.io').listen(server)

connect_agones()
const port = process.env.PORT || 3000

app.use('/', express.static('phaser'));

require('./socket')(io);

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
