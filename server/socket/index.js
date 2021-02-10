const { 
  createPlayer, 
  createAsteroids, 
  roomTagGenerator,
  roomTagParser,
  currentRoom
} = require('../util');
const { Game, Player } = require('../../models')
const players = {}
let asteroidHash = {}
// let asteroidArray = null

module.exports = io => {
  io.on('connection', async function (socket) {
    const roomTag = roomTagParser(socket) || roomTagGenerator()
    const allowedPlayersCount = parseInt(socket.handshake.query.allowedPlayersCount)
    // console.log('roomTag: ', roomTag)
    let games = await Game.findOrCreate({
      where: { roomTag: roomTag}, // we search for this user
      defaults: { roomTag: roomTag, playerLimit: allowedPlayersCount} // if it doesn't exist, we create it with this additional data
    });
    let game = games[0]
    // console.log('Game: ', game)
    if(!players[roomTag]){
      players[roomTag] = {}
    } 
    await Player.create({socketId: socket.id, gameId: game.dataValues.id})
    socket.join(roomTag)

    // console.log('room: ', Object.keys(socket.adapter.rooms)[1])
    let currentPlayersCount = await Player.count({
      where: { gameId: game.dataValues.id }
    })
    const playerLimit = game.dataValues.playerLimit
    // console.log('playerLimit: ', playerLimit)
    // console.log('currentPlayersCount: ', currentPlayersCount)
    if (currentPlayersCount > playerLimit) {
      socket.emit('inProgress');
    } else {
      console.log('a user connected');
      const room = currentRoom(io, socket)
      console.log(`Rooms for Socket ID ${socket.id}`, Object.keys(io.sockets.adapter.sids[socket.id])[1])
      // console.log('room: ', room)
      // console.log('players before: ', players)
      players[room][socket.id] = createPlayer(socket);
      // send the players object to the new player
      console.log('players after: ', players)
      socket.emit('currentPlayers', players[room]);
      // update all other players of the new player
      socket.to(room).broadcast.emit('newPlayer', players[room][socket.id]);
      if(currentPlayersCount === playerLimit){
        const asteroidData = createAsteroids()
        asteroidHash[room] = asteroidData['asteroidHash']
        io.sockets.in(room).emit('createAsteroids', asteroidData['asteroidArray'])
      }
      // console.log('players: ', players)
      // console.log('asteroidHash: ', asteroidHash)
      socket.on('disconnect', function () {
        console.log('user disconnected');
        // remove this player from our players object
        delete players[room][socket.id];
        // emit a message to all players to remove this player
        io.sockets.in(room).emit('disconnect', socket.id);
      });
      socket.on('playerMovement', function(movementData){
        players[room][socket.id].x = movementData.x
        players[room][socket.id].y = movementData.y
        players[room][socket.id].rotation = movementData.rotation
        socket.to(room).broadcast.emit('playerMoved', players[room][socket.id])
      })

      socket.on('laserShot', function(data) {
        if (players[room][socket.id] == null) return;
        let laser = data;
        data.owner_id = socket.id;
        socket.to(room).broadcast.emit('laserUpdate', laser, socket.id)
      })
      socket.on('destroyAsteroid', function(asteroidIndex){
        asteroidHash[room][asteroidIndex] = false
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