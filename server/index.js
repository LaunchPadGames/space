const path = require('path')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io').listen(server)
const port = 3000

const players = {}
const asteroidHash = {}
const asteroidArray = []

app.use('/', express.static('phaser'));

io.on('connection', function (socket) {
  const allowedPlayersCount = parseInt(socket.handshake.query.allowedPlayersCount)
  var currentPlayersCount = Object.keys(players).length
  console.log('playerCount ==> ', allowedPlayersCount)
  console.log('currentPlayerCount ==> ', currentPlayersCount)
  if (currentPlayersCount >= allowedPlayersCount) {
    socket.emit('inProgress');
  } else {
    console.log('a user connected');
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
    };
    currentPlayersCount ++
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);
    if(currentPlayersCount === allowedPlayersCount){
      for(let i = 0; i < 1; i++){
        asteroidArray.push({
          x: Math.floor(Math.random() * 800),
          y: Math.floor(Math.random() * 600),
          index: i,
          scale: Math.random() * (3 - 0.5) + 0.5,
          xVel: Math.ceil(Math.random() * 50) * (Math.round(Math.random()) ? 1 : -1),
          yVel: Math.ceil(Math.random() * 50) * (Math.round(Math.random()) ? 1 : -1)
        })
        asteroidHash[i] = true
      }
      io.sockets.emit('createAsteroids', asteroidArray)
    }
    console.log('players: ', players)
    console.log('asteroidHash: ', asteroidHash)
    console.log('asteroidArray: ', asteroidArray)
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

    socket.on('laserShot', function(data) {
      if (players[socket.id] == null) return;
      let laser = data;
      data.owner_id = socket.id;
      socket.broadcast.emit('laserUpdate', laser, socket.id)
    })
    socket.on('destroyAsteroid', function(asteroidIndex){
      asteroidHash[asteroidIndex] = false
      socket.broadcast.emit('broadcastDestoryAsteroid', asteroidIndex)
    });
    socket.on('disablePlayer', function(socketId){
      socket.broadcast.emit('disableOtherPlayer', socketId)
    })
    socket.on('enablePlayer', function(socketId){
      socket.broadcast.emit('enableOtherPlayer', socketId)
    })
  }
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
