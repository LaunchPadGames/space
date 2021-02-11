const { 
  createPlayer, 
  createAsteroids, 
  roomTagGenerator,
  roomTagParser,
  currentRoom,
  redisSetter,
  redisGetter
} = require('../util');
const { redisClient } = require('../redis')
const { Game, Player } = require('../../models')
const players = {}
let asteroidHash = {}
// let asteroidArray = null

module.exports = io => {
  io.on('connection', async function (socket) {
    redisSetter('a', {'g': 23})
    redisSetter('b', 90)
    console.log('a: ', await redisGetter('a'))
    console.log('b: ', await redisGetter('c'))
    const roomTag = roomTagParser(socket) || roomTagGenerator()
    const allowedPlayersCount = parseInt(socket.handshake.query.allowedPlayersCount)
    let games = await Game.findOrCreate({
      where: { roomTag: roomTag}, // we search for this user
      defaults: { roomTag: roomTag, playerLimit: allowedPlayersCount} // if it doesn't exist, we create it with this additional data
    });
    let game = games[0]
    if(!players[roomTag]){
      players[roomTag] = {}
    } 
    await Player.create({socketId: socket.id, gameId: game.dataValues.id})
    socket.join(roomTag)

    let currentPlayersCount = await Player.count({
      where: { gameId: game.dataValues.id }
    })
    const playerLimit = game.dataValues.playerLimit
    if (currentPlayersCount > playerLimit) {
      socket.emit('inProgress');
    } else {
      console.log('a user connected');
      const room = currentRoom(io, socket)
      players[room][socket.id] = createPlayer(socket);
      // send the players object to the new player
      console.log('players: ', players)
      socket.emit('currentPlayers', players[room]);
      // update all other players of the new player
      socket.to(room).broadcast.emit('newPlayer', players[room][socket.id]);
      if(currentPlayersCount === playerLimit){
        const asteroidData = createAsteroids()
        asteroidHash[room] = asteroidData['asteroidHash']
        io.sockets.in(room).emit('createAsteroids', asteroidData['asteroidArray'])
      }
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