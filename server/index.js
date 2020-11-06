const path = require('path')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io').listen(server)
const port = 3000

const players = {}

app.use('/', express.static('phaser'));

io.on('connection', function (socket) {
  console.log('a user connected');
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
  };
  // if(Object.keys(players).length === 2){
  //   socket.emit('setAsteroids', socket.id)
  // }
  console.log('players: ', players)
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);
  socket.on('disconnect', function () {
    console.log('user disconnected');
    // remove this player from our players object
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });
  socket.on('playerMovement', function(movementData){
    players[socket.id].x = movementData.x
    players[socket.id].y = movementData.y
    players[socket.id].rotation = movementData.rotation
    socket.broadcast.emit('playerMoved', players[socket.id])
  })
  // socket.on('updateAsteroidPositions', function(asteroidArray){
  //   socket.broadcast.emit('asteroidPositions', asteroidArray)
  // })
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})