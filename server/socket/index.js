const { 
  createPlayer, 
  createAsteroids, 
  roomTagGenerator,
  roomTagParser,
  currentRoom
} = require('../util');
const { Game, Player } = require('../../models')
const players = {}
let asteroidHash = null
// let asteroidArray = null

module.exports = io => {
  io.on('connection', function (socket) {
    let roomTag = roomTagParser(socket)
    const allowedPlayersCount = parseInt(socket.handshake.query.allowedPlayersCount)
    var currentPlayersCount = Object.keys(players).length
    console.log('roomTag: ', roomTag)
    if(roomTag){
      socket.join(roomTag)
      Game.findOne({where: {roomTag: roomTag}}).then((game) => {
        Player.create({socketId: socket.id, gameId: game.id})
      })
    } else {
      roomTag = roomTagGenerator()
      socket.join(roomTag)
      Game.create({roomTag: roomTag, playerLimit: allowedPlayersCount}).then((game) => {
        Player.create({socketId: socket.id, gameId: game.id})
      })
    }
    console.log(`Rooms for Socket ID ${socket.id}`, Object.keys(io.sockets.adapter.sids[socket.id]))
    console.log(': ', Object.keys(socket.adapter.rooms)[1])
    if (currentPlayersCount >= allowedPlayersCount) {
      socket.emit('inProgress');
    } else {
      console.log('a user connected');
      players[socket.id] = createPlayer(socket);
      currentPlayersCount ++
      const room = currentRoom(socket)
      // send the players object to the new player
      console.log('players: ', players)
      socket.emit('currentPlayers', players);
      // update all other players of the new player
      socket.to(room).broadcast.emit('newPlayer', players[socket.id]);
      if(currentPlayersCount === allowedPlayersCount){
        const asteroidData = createAsteroids()
        asteroidHash = asteroidData['asteroidHash']
        console.log('room: ', room)
        io.sockets.in(room).emit('createAsteroids', asteroidData['asteroidArray'])
      }
      // console.log('players: ', players)
      // console.log('asteroidHash: ', asteroidHash)
      socket.on('disconnect', function () {
        console.log('user disconnected');
        // remove this player from our players object
        delete players[socket.id];
        // emit a message to all players to remove this player
        io.sockets.in(room).emit('disconnect', socket.id);
      });
      socket.on('playerMovement', function(movementData){
        players[socket.id].x = movementData.x
        players[socket.id].y = movementData.y
        players[socket.id].rotation = movementData.rotation
        socket.to(room).broadcast.emit('playerMoved', players[socket.id])
      })

      socket.on('laserShot', function(data) {
        if (players[socket.id] == null) return;
        let laser = data;
        data.owner_id = socket.id;
        socket.to(room).broadcast.emit('laserUpdate', laser, socket.id)
      })
      socket.on('destroyAsteroid', function(asteroidIndex){
        asteroidHash[asteroidIndex] = false
        socket.to(room).broadcast.emit('broadcastDestoryAsteroid', asteroidIndex)
      });
      socket.on('disablePlayer', function(socketId){
        socket.to(room).broadcast.emit('disableOtherPlayer', socketId)
      })
      socket.on('enablePlayer', function(socketId){
        socket.to(room).broadcast.emit('enableOtherPlayer', socketId)
      })
    }
  })
};