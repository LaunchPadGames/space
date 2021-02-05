const { 
  createPlayer, 
  createAsteroids, 
  roomTagGenerator,
  roomTagParser
} = require('../util');
const players = {}
let asteroidHash = null
// let asteroidArray = null

module.exports = io => {
  io.on('connection', function (socket) {
    const socketReferer = roomTagParser(socket)
    const allowedPlayersCount = parseInt(socket.handshake.query.allowedPlayersCount)
    var currentPlayersCount = Object.keys(players).length
    console.log('roomTag: ', roomTagGenerator())
    // var room = 'testRoom'
    // socket.join(room)
    // console.log(`Rooms for Socket ID ${socket.id}`, Object.keys(io.sockets.adapter.sids[socket.id]))
    if (currentPlayersCount >= allowedPlayersCount) {
      socket.emit('inProgress');
    } else {
      console.log('a user connected');
      players[socket.id] = createPlayer(socket);
      currentPlayersCount ++
      // send the players object to the new player
      socket.emit('currentPlayers', players);
      // update all other players of the new player
      socket.broadcast.emit('newPlayer', players[socket.id]);
      if(currentPlayersCount === allowedPlayersCount){
        const asteroidData = createAsteroids()
        asteroidHash = asteroidData['asteroidHash']
        io.sockets.emit('createAsteroids', asteroidData['asteroidArray'])
      }
      // console.log('players: ', players)
      // console.log('asteroidHash: ', asteroidHash)
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
  })
};